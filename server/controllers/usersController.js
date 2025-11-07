const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Mengambil semua users
const getAllUsers = async (req, res) => {
  try {
    let whereClause = {};

    // Filter untuk SEKJUR: hanya melihat user dari jurusan mereka
    if (req.user && req.user.role === 'SEKJUR' && req.user.jurusanId) {
      // Ambil program studi di jurusan mereka
      const programStudiInJurusan = await prisma.programStudi.findMany({
        where: { jurusanId: req.user.jurusanId },
        select: { id: true }
      });
      const prodiIds = programStudiInJurusan.map(p => p.id);

      // Filter DOSEN berdasarkan prodiId
      const dosenInJurusan = await prisma.dosen.findMany({
        where: { prodiId: { in: prodiIds } },
        select: { nip: true }
      });
      const dosenNips = dosenInJurusan.map(d => d.nip);

      // Filter MAHASISWA berdasarkan programStudiId
      const mahasiswaInJurusan = await prisma.mahasiswa.findMany({
        where: { programStudiId: { in: prodiIds } },
        select: { nim: true }
      });
      const mahasiswaNims = mahasiswaInJurusan.map(m => m.nim);

      // Build OR conditions - SEDERHANA DAN LANGSUNG
      // Strategi: Tampilkan user jika:
      // 1. SEKJUR dengan jurusanId yang sama
      // 2. KAPRODI/DOSEN/MAHASISWA dengan programStudiId di jurusan (PRIORITAS - lebih reliable)
      // 3. DOSEN/MAHASISWA dengan username di tabel terkait (FALLBACK)
      
      const orConditions = [];
      
      // 1. SEKJUR dari jurusan yang sama
      orConditions.push({ role: 'SEKJUR', jurusanId: req.user.jurusanId });
      
      // 2. Semua role dengan programStudiId di jurusan (PRIORITAS - handle perubahan role)
      if (prodiIds.length > 0) {
        orConditions.push({ 
          role: { in: ['KAPRODI', 'DOSEN', 'MAHASISWA'] },
          programStudiId: { in: prodiIds }
        });
      }
      
      // 3. DOSEN dengan username di tabel dosen (FALLBACK untuk user lama)
      if (dosenNips.length > 0) {
        orConditions.push({ 
          role: 'DOSEN',
          username: { in: dosenNips }
        });
      }
      
      // 4. MAHASISWA dengan username di tabel mahasiswa (FALLBACK untuk user lama)
      if (mahasiswaNims.length > 0) {
        orConditions.push({ 
          role: 'MAHASISWA',
          username: { in: mahasiswaNims }
        });
      }

      whereClause = { OR: orConditions };
      
      // Debug logging
      console.log('Filter for SEKJUR:', {
        jurusanId: req.user.jurusanId,
        prodiIds: prodiIds,
        dosenNips: dosenNips.length,
        mahasiswaNims: mahasiswaNims.length,
        orConditionsCount: orConditions.length
      });
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        jurusanId: true,
        programStudiId: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    // Debug: Log semua user yang ditemukan dengan detail
    console.log(`Found ${users.length} users for SEKJUR ${req.user.jurusanId}`);
    users.forEach(user => {
      console.log(`  - User: ${user.username} (${user.nama}), Role: ${user.role}, programStudiId: ${user.programStudiId}, jurusanId: ${user.jurusanId}`);
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mengambil user berdasarkan ID
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        // password tidak disertakan untuk keamanan
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mengambil users berdasarkan role
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const validRoles = ['SEKJUR', 'KAPRODI', 'DOSEN', 'MAHASISWA'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    let whereClause = { role: role.toUpperCase() };

    // Filter untuk SEKJUR: hanya melihat user dari jurusan mereka
    if (req.user && req.user.role === 'SEKJUR' && req.user.jurusanId) {
      const programStudiInJurusan = await prisma.programStudi.findMany({
        where: { jurusanId: req.user.jurusanId },
        select: { id: true }
      });
      const prodiIds = programStudiInJurusan.map(p => p.id);

      if (role.toUpperCase() === 'SEKJUR') {
        whereClause.jurusanId = req.user.jurusanId;
      } else if (role.toUpperCase() === 'KAPRODI') {
        whereClause.programStudiId = { in: prodiIds };
      } else if (role.toUpperCase() === 'DOSEN') {
        // Filter DOSEN berdasarkan prodiId
        const dosenInJurusan = await prisma.dosen.findMany({
          where: { prodiId: { in: prodiIds } },
          select: { nip: true }
        });
        const dosenNips = dosenInJurusan.map(d => d.nip);
        whereClause.username = { in: dosenNips };
      } else if (role.toUpperCase() === 'MAHASISWA') {
        // Filter MAHASISWA berdasarkan programStudiId
        const mahasiswaInJurusan = await prisma.mahasiswa.findMany({
          where: { programStudiId: { in: prodiIds } },
          select: { nim: true }
        });
        const mahasiswaNims = mahasiswaInJurusan.map(m => m.nim);
        whereClause.username = { in: mahasiswaNims };
      }
    }
    
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        jurusanId: true,
        programStudiId: true
      },
      orderBy: {
        nama: 'asc'
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, nama, password, role, jurusanId, programStudiId } = req.body;
    
    if (!username || !nama || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const validRoles = ['SEKJUR', 'KAPRODI', 'DOSEN', 'MAHASISWA'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      username,
      nama,
      password: hashedPassword,
      role: role.toUpperCase()
    };
    
    if (role.toUpperCase() === 'SEKJUR' && jurusanId) {
      userData.jurusanId = parseInt(jurusanId);
    }
    
    if (role.toUpperCase() === 'KAPRODI' && programStudiId) {
      userData.programStudiId = parseInt(programStudiId);
    }
    
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        jurusanId: true,
        programStudiId: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false,
        error: 'Username already exists' 
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        success: false,
        error: 'Foreign key constraint violation. Pastikan jurusanId atau programStudiId valid.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message || 'Terjadi kesalahan saat membuat user' 
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Validasi userId
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID' 
      });
    }
    
    const { nama, password, role, jurusanId, programStudiId } = req.body;
    
    // Cek apakah user ada SEBELUM melakukan update
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        jurusanId: true,
        programStudiId: true
      }
    });
    
    if (!existingUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    // Validasi input
    if (!nama || !nama.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Nama wajib diisi' 
      });
    }
    
    if (!role) {
      return res.status(400).json({ 
        success: false,
        error: 'Role wajib dipilih' 
      });
    }
    
    const validRoles = ['SEKJUR', 'KAPRODI', 'DOSEN', 'MAHASISWA'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid role specified' 
      });
    }
    
    // Build update data
    const updateData = {
      nama: nama.trim(),
      role: role.toUpperCase()
    };
    
    // Update password hanya jika diberikan
    if (password && password.trim() !== '') {
      if (password.length < 3) {
        return res.status(400).json({ 
          success: false,
          error: 'Password minimal 3 karakter' 
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const oldRole = existingUser.role.toUpperCase();
    const newRole = role.toUpperCase();
    const username = existingUser.username;
    
    // Validasi: Role MAHASISWA tidak dapat diubah
    if (oldRole === 'MAHASISWA' && oldRole !== newRole) {
      return res.status(400).json({ 
        success: false,
        error: 'Role Mahasiswa tidak dapat diubah untuk menjaga integritas data akademik. Silakan hubungi administrator jika diperlukan perubahan.' 
      });
    }
    
    // Simpan programStudiId dari mahasiswa SEBELUM menghapus (jika diperlukan untuk DOSEN)
    let savedProgramStudiId = null;
    if (oldRole === 'MAHASISWA' && newRole === 'DOSEN') {
      try {
        const mahasiswaData = await prisma.mahasiswa.findUnique({
          where: { nim: username },
          select: { programStudiId: true }
        });
        if (mahasiswaData) {
          savedProgramStudiId = mahasiswaData.programStudiId;
          console.log(`Saved programStudiId ${savedProgramStudiId} from mahasiswa before deletion`);
        }
      } catch (error) {
        console.log('Could not fetch mahasiswa data before deletion:', error.message);
      }
    }
    
    // Handle perubahan role - perlu update data di tabel terkait
    if (oldRole !== newRole) {
      console.log(`Role change detected: ${oldRole} -> ${newRole} for user ${username}`);
      
      // Jika berubah dari MAHASISWA ke role lain, hapus dari tabel mahasiswa
      if (oldRole === 'MAHASISWA') {
        try {
          // Cek apakah ada data mahasiswa
          const existingMahasiswa = await prisma.mahasiswa.findUnique({
            where: { nim: username }
          });
          
          if (existingMahasiswa) {
            // Cek apakah ada pengajuan SA yang masih aktif
            const pengajuanSA = await prisma.pengajuanSA.findMany({
              where: { mahasiswaId: username },
              select: { id: true, status: true }
            });
            
            if (pengajuanSA.length > 0) {
              console.log(`⚠️ Warning: User ${username} has ${pengajuanSA.length} pengajuan SA. Will delete mahasiswa data anyway.`);
            }
            
            // Hapus data mahasiswa dengan cascade (pengajuanSA akan terhapus otomatis jika onDelete: Cascade)
            await prisma.mahasiswa.delete({
              where: { nim: username }
            });
            console.log(`✅ Successfully deleted mahasiswa data for ${username}`);
          } else {
            console.log(`ℹ️ No mahasiswa data found for ${username}, skipping deletion`);
          }
        } catch (error) {
          console.error(`❌ Error deleting mahasiswa data for ${username}:`, error);
          // Jika error karena foreign key constraint, coba hapus dengan force
          if (error.code === 'P2003') {
            console.log(`⚠️ Foreign key constraint detected. Trying to handle related data...`);
            // Lanjutkan saja, mungkin ada data terkait yang perlu dihandle manual
          }
          // Jangan return error, lanjutkan proses karena mungkin data sudah tidak ada
        }
      }
      
      // Jika berubah dari DOSEN ke role lain, hapus dari tabel dosen
      if (oldRole === 'DOSEN') {
        try {
          // Cek apakah ada data dosen
          const existingDosen = await prisma.dosen.findUnique({
            where: { nip: username }
          });
          
          if (existingDosen) {
            // Hapus data dosen
            await prisma.dosen.delete({
              where: { nip: username }
            });
            console.log(`Successfully deleted dosen data for ${username}`);
          } else {
            console.log(`No dosen data found for ${username}, skipping deletion`);
          }
        } catch (error) {
          console.error(`Error deleting dosen data for ${username}:`, error);
          // Jangan return error, lanjutkan proses karena mungkin data sudah tidak ada
        }
      }
      
      // Jika berubah ke MAHASISWA, perlu buat data di tabel mahasiswa
      if (newRole === 'MAHASISWA') {
        if (!programStudiId) {
          return res.status(400).json({ 
            success: false,
            error: 'Program Studi wajib dipilih untuk role Mahasiswa' 
          });
        }
        
        // Cek apakah sudah ada di tabel mahasiswa
        const existingMahasiswa = await prisma.mahasiswa.findUnique({
          where: { nim: username }
        });
        
        if (!existingMahasiswa) {
          // Buat data mahasiswa baru
          try {
            await prisma.mahasiswa.create({
              data: {
                nim: username,
                nama: nama.trim(),
                programStudiId: parseInt(programStudiId),
                angkatan: null,
                semester: null,
                noTelp: null,
                alamat: null
              }
            });
          } catch (error) {
            console.error('Error creating mahasiswa:', error);
            return res.status(500).json({ 
              success: false,
              error: 'Gagal membuat data mahasiswa: ' + error.message 
            });
          }
        }
        updateData.programStudiId = parseInt(programStudiId);
        updateData.jurusanId = null;
      }
      
      // Jika berubah ke DOSEN, perlu buat data di tabel dosen
      if (newRole === 'DOSEN') {
        // Untuk DOSEN, kita perlu prodiId, tapi karena tidak ada di form, kita coba ambil dari programStudiId jika ada
        let prodiIdForDosen = null;
        
        if (programStudiId) {
          prodiIdForDosen = parseInt(programStudiId);
        } else if (existingUser.programStudiId) {
          prodiIdForDosen = existingUser.programStudiId;
        } else if (savedProgramStudiId) {
          // Gunakan programStudiId yang disimpan sebelum menghapus mahasiswa
          prodiIdForDosen = savedProgramStudiId;
          console.log(`Using saved programStudiId: ${prodiIdForDosen}`);
        }
        
        if (!prodiIdForDosen) {
          return res.status(400).json({ 
            success: false,
            error: 'Program Studi wajib dipilih untuk role Dosen. Silakan pilih Program Studi terlebih dahulu atau pastikan user sebelumnya memiliki Program Studi.' 
          });
        }
        
        // Validasi prodiId exists
        const prodiExists = await prisma.programStudi.findUnique({
          where: { id: prodiIdForDosen }
        });
        
        if (!prodiExists) {
          return res.status(400).json({ 
            success: false,
            error: 'Program Studi yang dipilih tidak ditemukan' 
          });
        }
        
        // Cek apakah sudah ada di tabel dosen
        const existingDosen = await prisma.dosen.findUnique({
          where: { nip: username }
        });
        
        if (!existingDosen) {
          // Buat data dosen baru
          try {
            await prisma.dosen.create({
              data: {
                nip: username,
                nama: nama.trim(),
                prodiId: prodiIdForDosen,
                noTelp: null,
                alamat: null,
                isKaprodi: false
              }
            });
            console.log(`Successfully created dosen data for ${username} with prodiId ${prodiIdForDosen}`);
          } catch (error) {
            console.error('Error creating dosen:', error);
            return res.status(500).json({ 
              success: false,
              error: 'Gagal membuat data dosen: ' + error.message 
            });
          }
        } else {
          // Update existing dosen data
          try {
            await prisma.dosen.update({
              where: { nip: username },
              data: {
                nama: nama.trim(),
                prodiId: prodiIdForDosen
              }
            });
            console.log(`Successfully updated dosen data for ${username}`);
          } catch (error) {
            console.error('Error updating dosen:', error);
            return res.status(500).json({ 
              success: false,
              error: 'Gagal mengupdate data dosen: ' + error.message 
            });
          }
        }
        // Simpan programStudiId untuk keperluan filtering (meskipun DOSEN tidak langsung punya programStudiId)
        // Ini membantu filter di getAllUsers menemukan user yang baru diubah role-nya
        updateData.programStudiId = prodiIdForDosen;
        updateData.jurusanId = null;
        console.log(`✅ Set programStudiId to ${prodiIdForDosen} for DOSEN user ${username} (will be saved in users table)`);
      }
      
      // Handle jurusanId dan programStudiId berdasarkan role (hanya untuk role yang belum di-handle di atas)
      if (newRole === 'SEKJUR') {
        if (jurusanId !== undefined && jurusanId !== null && jurusanId !== '') {
          updateData.jurusanId = parseInt(jurusanId);
          updateData.programStudiId = null;
        }
      } else if (newRole === 'KAPRODI') {
        if (programStudiId !== undefined && programStudiId !== null && programStudiId !== '') {
          updateData.programStudiId = parseInt(programStudiId);
          updateData.jurusanId = null;
        }
      }
      // DOSEN dan MAHASISWA sudah di-handle di atas, jangan timpa lagi
    } else {
      // Role tidak berubah, hanya update jurusanId/programStudiId jika perlu
      if (newRole === 'SEKJUR') {
        if (jurusanId !== undefined && jurusanId !== null && jurusanId !== '') {
          updateData.jurusanId = parseInt(jurusanId);
          updateData.programStudiId = null;
        }
      } else if (newRole === 'KAPRODI') {
        if (programStudiId !== undefined && programStudiId !== null && programStudiId !== '') {
          updateData.programStudiId = parseInt(programStudiId);
          updateData.jurusanId = null;
        }
      } else if (newRole === 'DOSEN') {
        // Untuk DOSEN, jangan hapus programStudiId (diperlukan untuk filtering)
        // Hanya update jika programStudiId diberikan
        if (programStudiId !== undefined && programStudiId !== null && programStudiId !== '') {
          updateData.programStudiId = parseInt(programStudiId);
          console.log(`Updating programStudiId to ${updateData.programStudiId} for existing DOSEN`);
        } else {
          // Jangan hapus programStudiId yang sudah ada - penting untuk filtering!
          // Hanya hapus jika memang tidak ada (biarkan undefined agar tidak diupdate)
          console.log(`Keeping existing programStudiId for DOSEN (if exists)`);
        }
        updateData.jurusanId = null;
      } else if (newRole === 'MAHASISWA') {
        // Untuk MAHASISWA, update programStudiId jika diberikan
        if (programStudiId !== undefined && programStudiId !== null && programStudiId !== '') {
          updateData.programStudiId = parseInt(programStudiId);
        }
        updateData.jurusanId = null;
      }
    }
    
    // Log update data sebelum update
    console.log(`📝 Updating user ${username} (ID: ${userId}):`, {
      oldRole: oldRole,
      newRole: newRole,
      updateData: {
        nama: updateData.nama,
        role: updateData.role,
        jurusanId: updateData.jurusanId,
        programStudiId: updateData.programStudiId,
        hasPassword: !!updateData.password
      }
    });
    
    // Update user dengan transaction untuk memastikan data konsisten
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        jurusanId: true,
        programStudiId: true
      }
    });
    
    console.log(`✅ User updated successfully:`, {
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      programStudiId: updatedUser.programStudiId,
      jurusanId: updatedUser.jurusanId
    });
    
    // Return response dengan format yang konsisten
    res.json({
      success: true,
      data: updatedUser,
      message: 'User berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false,
        error: 'Username sudah digunakan' 
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        success: false,
        error: 'Foreign key constraint violation. Pastikan jurusanId atau programStudiId valid.' 
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'User tidak ditemukan' 
      });
    }
    
    // Generic error
    res.status(500).json({ 
      success: false,
      error: error.message || 'Terjadi kesalahan saat mengupdate user' 
    });
  }
};

// Menghapus user berdasarkan ID
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Ambil informasi user dari req.user (dari middleware auth)
    const currentUserId = req.user.id;
    
    // Cek apakah user mencoba menghapus dirinya sendiri
    if (userId === currentUserId) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }
    
    // Cek apakah user ada
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Hapus user
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(409).json({ 
        error: 'Cannot delete user. User has related data that must be removed first.' 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser
};