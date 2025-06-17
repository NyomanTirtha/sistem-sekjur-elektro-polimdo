const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mengambil semua program studi
const getAllProdi = async (req, res) => {
  try {
    const prodi = await prisma.programStudi.findMany({
      include: {
        dosen: true,
        mahasiswa: true
      }
    });
    res.json(prodi);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mengambil program studi berdasarkan ID
const getProdiById = async (req, res) => {
  try {
    const prodi = await prisma.programStudi.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        dosen: true,
        mahasiswa: true
      }
    });
    if (!prodi) {
      return res.status(404).json({ error: 'Program Studi not found' });
    }
    res.json(prodi);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Menambahkan program studi baru
const createProdi = async (req, res) => {
  try {
    const { nama, ketuaProdi } = req.body;
    
    // Validasi input yang diperlukan
    if (!nama || !ketuaProdi) {
      return res.status(400).json({ 
        error: 'Nama dan Ketua Program Studi wajib diisi' 
      });
    }

    const prodi = await prisma.programStudi.create({
      data: {
        nama,
        ketuaProdi
      }
    });
    res.status(201).json(prodi);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Nama Program Studi sudah ada, gunakan nama yang berbeda' 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Memperbarui program studi berdasarkan ID
const updateProdi = async (req, res) => {
  try {
    const { nama, ketuaProdi } = req.body;
    
    // Validasi input yang diperlukan
    if (!nama || !ketuaProdi) {
      return res.status(400).json({ 
        error: 'Nama dan Ketua Program Studi wajib diisi' 
      });
    }

    const prodi = await prisma.programStudi.update({
      where: { id: parseInt(req.params.id) },
      data: {
        nama,
        ketuaProdi
      }
    });
    res.json(prodi);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Program Studi tidak ditemukan' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Nama Program Studi sudah ada, gunakan nama yang berbeda' 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Menghapus program studi berdasarkan ID
const deleteProdi = async (req, res) => {
  try {
    await prisma.programStudi.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Program Studi deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Program Studi tidak ditemukan' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Tidak dapat menghapus Program Studi karena masih memiliki data terkait (dosen/mahasiswa)' 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProdi,
  getProdiById,
  createProdi,
  updateProdi,
  deleteProdi
};