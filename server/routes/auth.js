// routes/auth.js - COMPLETE FIXED VERSION with debug logging
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// JWT Secret (sebaiknya disimpan di environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token autentikasi diperlukan'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid atau kadaluarsa'
    });
  }
};

// Login endpoint - COMPLETE FIXED with debug logging
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    console.log('🔑 Login attempt:', { 
      username, 
      role,
      passwordLength: password?.length,
      passwordFirstChars: password?.substring(0, 3) + '***'
    });

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }

    // Cari user berdasarkan username
    const user = await prisma.user.findFirst({
      where: { 
        username: username
      }
    });

    console.log('👤 User found:', user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      passwordStartsWithHash: user.password?.startsWith('$2'),
      passwordHash: user.password?.substring(0, 10) + '...'
    } : 'Not found');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    // Verifikasi password
    let isPasswordValid = false;
    
    if (user.password.startsWith('$2')) {
      console.log('🔒 Comparing hashed password');
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('🔒 Password comparison result:', isPasswordValid);
    } else {
      console.log('⚠️ WARNING: Password stored as plain text!');
      isPasswordValid = password === user.password;
      
      if (isPasswordValid) {
        console.log('🔄 Hashing plain text password');
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log('✅ Password hashed and updated');
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    // Verifikasi role jika diberikan
    if (role && user.role !== role.toUpperCase()) {
      return res.status(401).json({
        success: false,
        message: 'Role tidak sesuai'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // ✅ FIXED: Prepare response data with proper include relations
    let userData = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role
    };

    // ✅ FIXED: Fetch additional data with include relations and debug logging
    if (user.role === 'MAHASISWA') {
      console.log('🎓 Searching for mahasiswa data:', {
        searchNim: user.username,
        userRole: user.role
      });
      
      const mahasiswa = await prisma.mahasiswa.findUnique({
        where: { nim: user.username },
        include: {
          programStudi: true
        }
      });
      
      console.log('🎓 Mahasiswa query result:', {
        found: !!mahasiswa,
        nim: mahasiswa?.nim,
        nama: mahasiswa?.nama,
        angkatan: mahasiswa?.angkatan,
        semester: mahasiswa?.semester,
        noTelp: mahasiswa?.noTelp,
        alamat: mahasiswa?.alamat,
        programStudiId: mahasiswa?.programStudiId,
        hasProgramStudi: !!mahasiswa?.programStudi,
        programStudiData: mahasiswa?.programStudi
      });
      
      if (mahasiswa) {
        userData = {
          ...userData,
          nim: mahasiswa.nim,
          nama: mahasiswa.nama, // Override dengan nama dari mahasiswa
          programStudiId: mahasiswa.programStudiId,
          programStudi: mahasiswa.programStudi,
          angkatan: mahasiswa.angkatan,
          semester: mahasiswa.semester,
          noTelp: mahasiswa.noTelp,
          alamat: mahasiswa.alamat // ✅ FIXED: Tambahkan alamat
        };
        
        console.log('📊 Final userData for mahasiswa:', {
          username: userData.username,
          role: userData.role,
          hasProgramStudi: !!userData.programStudi,
          programStudiNama: userData.programStudi?.nama,
          hasAlamat: !!userData.alamat,
          hasNoTelp: !!userData.noTelp
        });
      } else {
        console.log('❌ No mahasiswa data found for NIM:', user.username);
      }
      
    } else if (user.role === 'DOSEN' || user.role === 'KAPRODI') {
      console.log('🔍 Searching for dosen data:', {
        searchNip: user.username,
        userRole: user.role
      });
      
      const dosen = await prisma.dosen.findUnique({
        where: { nip: user.username },
        include: {
          prodi: true
        }
      });
      
      console.log('👨‍🏫 Dosen query result:', {
        found: !!dosen,
        nip: dosen?.nip,
        nama: dosen?.nama,
        prodiId: dosen?.prodiId,
        isKaprodi: dosen?.isKaprodi,
        noTelp: dosen?.noTelp,
        alamat: dosen?.alamat,
        hasProdi: !!dosen?.prodi,
        prodiData: dosen?.prodi
      });
      
      if (dosen) {
        userData = {
          ...userData,
          nip: dosen.nip,
          nama: dosen.nama, // Override dengan nama dari dosen
          prodiId: dosen.prodiId,
          prodi: dosen.prodi, // ✅ FIXED: This should have data now
          isKaprodi: dosen.isKaprodi,
          noTelp: dosen.noTelp,
          alamat: dosen.alamat // ✅ FIXED: Tambahkan alamat
        };
        
        console.log('📊 Final userData for dosen:', {
          username: userData.username,
          role: userData.role,
          hasProdi: !!userData.prodi,
          prodiNama: userData.prodi?.nama,
          hasAlamat: !!userData.alamat,
          hasNoTelp: !!userData.noTelp,
          isKaprodi: userData.isKaprodi
        });
      } else {
        console.log('❌ No dosen data found for NIP:', user.username);
        
        // Debug: Cek apakah data dosen ada dengan query manual
        console.log('🔍 Debug: Checking if dosen exists in database...');
        const allDosen = await prisma.dosen.findMany({
          select: { nip: true, nama: true },
          take: 5
        });
        console.log('📋 Sample dosen in database:', allDosen);
        
        // Cek apakah ada dosen dengan NIP yang mirip
        const similarDosen = await prisma.dosen.findMany({
          where: {
            nip: {
              contains: user.username.substring(0, 5) // Cek 5 digit pertama
            }
          },
          select: { nip: true, nama: true }
        });
        console.log('🔍 Similar NIP found:', similarDosen);
      }
    }
    // ✅ ADMIN tidak perlu data tambahan

    console.log('✅ Login successful:', {
      username: user.username,
      role: user.role,
      tokenLength: token.length,
      hasRelationData: !!(userData.programStudi || userData.prodi),
      finalUserDataKeys: Object.keys(userData)
    });

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: userData
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message
    });
  }
});

// Test endpoint untuk cek user di database
router.get('/test-users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        password: true // Hanya untuk debugging - HAPUS di production
      }
    });

    const userInfo = users.map(user => ({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      passwordHash: user.password.substring(0, 10) + '...', 
      isHashed: user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
    }));

    res.json({
      success: true,
      users: userInfo
    });
  } catch (error) {
    console.error('Test users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users: ' + error.message
    });
  }
});

// Debug endpoint untuk cek data mahasiswa dan dosen
router.get('/debug-data', async (req, res) => {
  try {
    const mahasiswaCount = await prisma.mahasiswa.count();
    const dosenCount = await prisma.dosen.count();
    
    const sampleMahasiswa = await prisma.mahasiswa.findMany({
      take: 3,
      include: {
        programStudi: true
      }
    });
    
    const sampleDosen = await prisma.dosen.findMany({
      take: 3,
      include: {
        prodi: true
      }
    });

    res.json({
      success: true,
      data: {
        counts: {
          mahasiswa: mahasiswaCount,
          dosen: dosenCount
        },
        sampleMahasiswa,
        sampleDosen
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error: ' + error.message
    });
  }
});

// Register endpoint - SIMPLIFIED
router.post('/register', async (req, res) => {
  try {
    const { username, nama, password, role } = req.body;

    if (!username || !nama || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    // Cek username sudah ada
    const existingUser = await prisma.user.findFirst({
      where: { username: username }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        username,
        nama,
        password: hashedPassword,
        role: role.toUpperCase()
      }
    });

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: {
        id: newUser.id,
        username: newUser.username,
        nama: newUser.nama,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message
    });
  }
});

// ✅ COMPLETE FIXED: Get current user info with proper structure and debug logging
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    console.log('🔍 /me endpoint called for user:', {
      id: user.id,
      username: user.username,
      role: user.role
    });

    // ✅ FIXED: Prepare response with same structure as login
    let userData = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role
    };

    // ✅ FIXED: Fetch related data with proper include and structure
    try {
      if (user.role === 'MAHASISWA') {
        console.log('🎓 /me endpoint - Searching for mahasiswa data:', {
          searchNim: user.username,
          userRole: user.role
        });
        
        const mahasiswaData = await prisma.mahasiswa.findUnique({
          where: { nim: user.username },
          include: {
            programStudi: true
          }
        });

        console.log('🎓 /me endpoint - Mahasiswa query result:', {
          found: !!mahasiswaData,
          nim: mahasiswaData?.nim,
          nama: mahasiswaData?.nama,
          angkatan: mahasiswaData?.angkatan,
          semester: mahasiswaData?.semester,
          noTelp: mahasiswaData?.noTelp,
          alamat: mahasiswaData?.alamat,
          programStudiId: mahasiswaData?.programStudiId,
          hasProgramStudi: !!mahasiswaData?.programStudi,
          programStudiData: mahasiswaData?.programStudi
        });

        if (mahasiswaData) {
          userData = {
            ...userData,
            nim: mahasiswaData.nim,
            nama: mahasiswaData.nama, // Override dengan nama dari mahasiswa
            programStudiId: mahasiswaData.programStudiId,
            programStudi: mahasiswaData.programStudi, // ✅ This matches frontend expectation
            angkatan: mahasiswaData.angkatan,
            semester: mahasiswaData.semester,
            noTelp: mahasiswaData.noTelp,
            alamat: mahasiswaData.alamat // ✅ FIXED: Tambahkan alamat
          };
          
          console.log('📊 /me endpoint - Final userData for mahasiswa:', {
            username: userData.username,
            role: userData.role,
            hasProgramStudi: !!userData.programStudi,
            programStudiNama: userData.programStudi?.nama,
            hasAlamat: !!userData.alamat,
            hasNoTelp: !!userData.noTelp
          });
        } else {
          console.log('❌ /me endpoint - No mahasiswa data found for NIM:', user.username);
        }
        
      } else if (user.role === 'DOSEN' || user.role === 'KAPRODI') {
        console.log('🔍 /me endpoint - Searching for dosen data:', {
          searchNip: user.username,
          userRole: user.role
        });
        
        const dosenData = await prisma.dosen.findUnique({
          where: { nip: user.username },
          include: {
            prodi: true
          }
        });

        console.log('👨‍🏫 /me endpoint - Dosen query result:', {
          found: !!dosenData,
          nip: dosenData?.nip,
          nama: dosenData?.nama,
          prodiId: dosenData?.prodiId,
          isKaprodi: dosenData?.isKaprodi,
          noTelp: dosenData?.noTelp,
          alamat: dosenData?.alamat,
          hasProdi: !!dosenData?.prodi,
          prodiData: dosenData?.prodi
        });

        if (dosenData) {
          userData = {
            ...userData,
            nip: dosenData.nip,
            nama: dosenData.nama, // Override dengan nama dari dosen
            prodiId: dosenData.prodiId,
            prodi: dosenData.prodi, // ✅ This matches frontend expectation
            isKaprodi: dosenData.isKaprodi,
            noTelp: dosenData.noTelp,
            alamat: dosenData.alamat // ✅ FIXED: Tambahkan alamat
          };
          
          console.log('📊 /me endpoint - Final userData for dosen:', {
            username: userData.username,
            role: userData.role,
            hasProdi: !!userData.prodi,
            prodiNama: userData.prodi?.nama,
            hasAlamat: !!userData.alamat,
            hasNoTelp: !!userData.noTelp,
            isKaprodi: userData.isKaprodi
          });
        } else {
          console.log('❌ /me endpoint - No dosen data found for NIP:', user.username);
          
          // Debug untuk /me endpoint juga
          console.log('🔍 /me Debug: Checking if dosen exists in database...');
          const allDosen = await prisma.dosen.findMany({
            select: { nip: true, nama: true },
            take: 5
          });
          console.log('📋 /me Sample dosen in database:', allDosen);
        }
      }
      // ✅ ADMIN tidak perlu data tambahan
    } catch (relationError) {
      console.log('❌ /me endpoint - Could not fetch related data:', relationError.message);
      console.error('Full relation error:', relationError);
    }

    console.log('✅ /me endpoint response:', {
      username: userData.username,
      role: userData.role,
      hasRelationData: !!(userData.programStudi || userData.prodi),
      programStudi: userData.programStudi?.nama,
      prodi: userData.prodi?.nama,
      finalUserDataKeys: Object.keys(userData)
    });

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('❌ /me endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message
    });
  }
});

// Hash existing passwords utility
router.post('/hash-passwords', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        password: {
          not: {
            startsWith: '$2'
          }
        }
      }
    });

    console.log(`Found ${users.length} users with plain text passwords`);

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log(`Hashed password for user: ${user.username}`);
    }

    res.json({
      success: true,
      message: `Successfully hashed passwords for ${users.length} users`
    });

  } catch (error) {
    console.error('Hash passwords error:', error);
    res.status(500).json({
      success: false,
      message: 'Error hashing passwords: ' + error.message
    });
  }
});

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working',
    timestamp: new Date().toISOString()
  });
});

// Change password endpoint
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, userId, userType } = req.body;

    console.log('🔍 Change Password Request:', {
      userId,
      userType,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      tokenUser: req.user,
      currentPasswordLength: currentPassword?.length,
      currentPasswordFirstChars: currentPassword?.substring(0, 3) + '***'
    });

    // Validate input
    if (!currentPassword || !newPassword || !userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    // Ensure userId is a string
    const userIdStr = String(userId);

    console.log('🔍 Searching for user:', {
      userId: userIdStr,
      userType: userType,
      tokenUsername: req.user?.username
    });

    // Find user in users table first - be more lenient with role check
    const user = await prisma.user.findFirst({
      where: { 
        username: userIdStr
      }
    });

    console.log('👤 User found:', user ? {
      id: user.id,
      username: user.username,
      hasPassword: !!user.password,
      name: user.nama,
      role: user.role,
      passwordStartsWithHash: user.password?.startsWith('$2'),
      passwordLength: user.password?.length,
      passwordHash: user.password?.substring(0, 10) + '...'
    } : 'Not found');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // If user has no password, set it to the current password
    if (!user.password) {
      console.log('⚠️ User has no password, setting initial password');
      const hashedPassword = await bcrypt.hash(currentPassword, 10);
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        
        // Now hash and set the new password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHashedPassword }
        });

        console.log('✅ Initial password set and updated successfully for user:', user.username);

        res.json({
          success: true,
          message: 'Password berhasil diubah'
        });
        return;
      } catch (updateError) {
        console.error('❌ Error setting initial password:', updateError);
        res.status(500).json({
          success: false,
          message: 'Gagal mengatur password awal: ' + updateError.message
        });
        return;
      }
    }

    // Verify current password
    let isPasswordValid = false;
    try {
      console.log('🔒 Attempting password comparison');
      console.log('🔒 Password details:', {
        currentPasswordLength: currentPassword.length,
        storedPasswordLength: user.password.length,
        storedPasswordStartsWithHash: user.password.startsWith('$2'),
        storedPasswordHash: user.password.substring(0, 10) + '...',
        bcryptVersion: bcrypt.getRounds(user.password)
      });
      
      // If password is not hashed, hash it first
      if (!user.password.startsWith('$2')) {
        console.log('⚠️ Password not hashed, hashing it now');
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log('✅ Password hashed and updated');
        user.password = hashedPassword;
      }
      
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      console.log('🔒 Password verification result:', isPasswordValid);
    } catch (error) {
      console.error('🔒 Password comparison error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memverifikasi password'
      });
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password saat ini tidak sesuai'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in users table
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      console.log('✅ Password updated successfully for user:', user.username);

      res.json({
        success: true,
        message: 'Password berhasil diubah'
      });
    } catch (updateError) {
      console.error('❌ Error updating password:', updateError);
      res.status(500).json({
        success: false,
        message: 'Gagal mengubah password: ' + updateError.message
      });
    }

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message
    });
  }
});

module.exports = { router, authenticateToken };