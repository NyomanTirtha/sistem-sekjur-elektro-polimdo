// controllers/mataKuliahController.js

const { PrismaClient } = require('@prisma/client');
const { createMataKuliahFilter } = require('../routes/auth');
const prisma = new PrismaClient();

const getAllMataKuliah = async (req, res) => {
  try {
    const filter = createMataKuliahFilter(req.userContext || {});
    const where = filter || {};
    
    const mataKuliah = await prisma.mataKuliah.findMany({
      where,
      include: {
        programStudi: {
          select: {
            id: true,
            nama: true
          }
        }
      },
      orderBy: {
        nama: 'asc'
      }
    });
    res.json(mataKuliah);
  } catch (error) {
    console.error('Error getting all mata kuliah:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mengambil mata kuliah berdasarkan ID
const getMataKuliahById = async (req, res) => {
  try {
    const mataKuliahId = parseInt(req.params.id);
    
    console.log('Getting mata kuliah with ID:', mataKuliahId); // Debug log
    
    const mataKuliah = await prisma.mataKuliah.findUnique({
      where: { 
        id: mataKuliahId 
      }
    });
    
    if (!mataKuliah) {
      return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
    }
    
    console.log('Found mata kuliah:', mataKuliah); // Debug log
    res.json(mataKuliah);
  } catch (error) {
    console.error('Error getting mata kuliah by ID:', error);
    res.status(500).json({ error: error.message });
  }
};

// Menambahkan mata kuliah baru
const createMataKuliah = async (req, res) => {
  try {
    const { nama, sks } = req.body;
    
    console.log('Received data:', { nama, sks }); // Debug log
    
    // Validasi input
    if (!nama || !sks) {
      return res.status(400).json({ error: 'Nama mata kuliah dan SKS harus diisi' });
    }
    
    if (parseInt(sks) <= 0 || parseInt(sks) > 6) {
      return res.status(400).json({ error: 'SKS harus antara 1-6' });
    }
    
    // Cek apakah mata kuliah dengan nama yang sama sudah ada
    const existingMataKuliah = await prisma.mataKuliah.findFirst({
      where: {
        nama: {
          equals: nama,
          mode: 'insensitive' // Case insensitive
        }
      }
    });
    
    if (existingMataKuliah) {
      return res.status(400).json({ error: 'Mata kuliah dengan nama tersebut sudah ada' });
    }
    
    const mataKuliah = await prisma.mataKuliah.create({
      data: {
        nama: nama.trim(),
        sks: parseInt(sks)
      }
    });
    
    console.log('Created mata kuliah:', mataKuliah); // Debug log
    res.status(201).json(mataKuliah);
  } catch (error) {
    console.error('Error creating mata kuliah:', error);
    res.status(500).json({ error: error.message });
  }
};

// Memperbarui mata kuliah berdasarkan ID
const updateMataKuliah = async (req, res) => {
  try {
    const mataKuliahId = parseInt(req.params.id);
    const { nama, sks } = req.body;
    
    console.log('Updating mata kuliah:', { id: mataKuliahId, nama, sks }); // Debug log
    
    // Validasi input
    if (!nama || !sks) {
      return res.status(400).json({ error: 'Nama mata kuliah dan SKS harus diisi' });
    }
    
    if (parseInt(sks) <= 0 || parseInt(sks) > 6) {
      return res.status(400).json({ error: 'SKS harus antara 1-6' });
    }
    
    // Cek apakah mata kuliah ada
    const existingMataKuliah = await prisma.mataKuliah.findUnique({
      where: { id: mataKuliahId }
    });
    
    if (!existingMataKuliah) {
      return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
    }
    
    // Cek apakah nama mata kuliah sudah digunakan oleh mata kuliah lain
    const duplicateMataKuliah = await prisma.mataKuliah.findFirst({
      where: {
        nama: {
          equals: nama,
          mode: 'insensitive'
        },
        id: {
          not: mataKuliahId
        }
      }
    });
    
    if (duplicateMataKuliah) {
      return res.status(400).json({ error: 'Mata kuliah dengan nama tersebut sudah ada' });
    }
    
    const mataKuliah = await prisma.mataKuliah.update({
      where: { id: mataKuliahId },
      data: {
        nama: nama.trim(),
        sks: parseInt(sks)
      }
    });
    
    console.log('Updated mata kuliah:', mataKuliah); // Debug log
    res.json(mataKuliah);
  } catch (error) {
    console.error('Error updating mata kuliah:', error);
    res.status(500).json({ error: error.message });
  }
};

// Menghapus mata kuliah berdasarkan ID
const deleteMataKuliah = async (req, res) => {
  try {
    const mataKuliahId = parseInt(req.params.id);
    
    console.log('Deleting mata kuliah with ID:', mataKuliahId); // Debug log
    
    // Cek apakah mata kuliah ada
    const existingMataKuliah = await prisma.mataKuliah.findUnique({
      where: { id: mataKuliahId }
    });
    
    if (!existingMataKuliah) {
      return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
    }
    
    // Cek apakah mata kuliah sedang digunakan dalam pengajuan SA
    const usedInPengajuan = await prisma.pengajuanSADetail.findFirst({
      where: {
        mataKuliahId: mataKuliahId
      }
    });
    
    if (usedInPengajuan) {
      return res.status(400).json({ 
        error: 'Mata kuliah tidak dapat dihapus karena sedang digunakan dalam pengajuan SA' 
      });
    }
    
    await prisma.mataKuliah.delete({
      where: { id: mataKuliahId }
    });
    
    console.log('Deleted mata kuliah with ID:', mataKuliahId); // Debug log
    res.json({ message: 'Mata kuliah berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting mata kuliah:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllMataKuliah,
  getMataKuliahById,
  createMataKuliah,
  updateMataKuliah,
  deleteMataKuliah
};