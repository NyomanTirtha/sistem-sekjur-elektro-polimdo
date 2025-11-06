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

      // Filter user:
      // - SEKJUR: jurusanId yang sama
      // - KAPRODI: programStudiId di jurusan mereka
      // - DOSEN: username (NIP) ada di dosenInJurusan
      // - MAHASISWA: username (NIM) ada di mahasiswaInJurusan
      whereClause = {
        OR: [
          { role: 'SEKJUR', jurusanId: req.user.jurusanId },
          { role: 'KAPRODI', programStudiId: { in: prodiIds } },
          { role: 'DOSEN', username: { in: dosenNips } },
          { role: 'MAHASISWA', username: { in: mahasiswaNims } }
        ]
      };
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
    
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { nama, password, role, jurusanId, programStudiId } = req.body;
    
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!nama || !role) {
      return res.status(400).json({ error: 'Nama and role are required' });
    }
    
    const validRoles = ['SEKJUR', 'KAPRODI', 'DOSEN', 'MAHASISWA'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    const updateData = {
      nama,
      role: role.toUpperCase()
    };
    
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    if (role.toUpperCase() === 'SEKJUR' && jurusanId !== undefined) {
      updateData.jurusanId = jurusanId ? parseInt(jurusanId) : null;
      updateData.programStudiId = null;
    }
    
    if (role.toUpperCase() === 'KAPRODI' && programStudiId !== undefined) {
      updateData.programStudiId = programStudiId ? parseInt(programStudiId) : null;
      updateData.jurusanId = null;
    }
    
    const user = await prisma.user.update({
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
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
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