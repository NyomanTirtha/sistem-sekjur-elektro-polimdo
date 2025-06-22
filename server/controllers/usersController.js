const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Mengambil semua users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        // password tidak disertakan untuk keamanan
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
    
    // Validasi role
    const validRoles = ['ADMIN', 'KAPRODI', 'DOSEN', 'MAHASISWA'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    const users = await prisma.user.findMany({
      where: { role: role.toUpperCase() },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        // password tidak disertakan untuk keamanan
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

// Menambahkan user baru
const createUser = async (req, res) => {
  try {
    const { username, nama, password, role } = req.body;
    
    // Validasi input
    if (!username || !nama || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validasi role
    const validRoles = ['ADMIN', 'KAPRODI', 'DOSEN', 'MAHASISWA'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    // Cek apakah username sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Buat user baru
    const user = await prisma.user.create({
      data: {
        username,
        nama,
        password: hashedPassword,
        role: role.toUpperCase()
      },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        // password tidak dikembalikan
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

// Memperbarui user berdasarkan ID
const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { nama, password, role } = req.body;
    
    // Cek apakah user ada
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validasi input
    if (!nama || !role) {
      return res.status(400).json({ error: 'Nama and role are required' });
    }
    
    // Validasi role
    const validRoles = ['ADMIN', 'KAPRODI', 'DOSEN', 'MAHASISWA'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    // Siapkan data untuk update
    const updateData = {
      nama,
      role: role.toUpperCase()
    };
    
    // Hash password baru jika diberikan
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        // password tidak dikembalikan
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