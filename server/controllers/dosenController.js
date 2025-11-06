const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createDosenFilter } = require('../routes/auth');

//PERFORMANCE: Mengambil semua dosen - Optimized query
const getAllDosen = async (req, res) => {
  try {
    const whereClause = {
      isKaprodi: false
    };

    // Filter untuk KAPRODI berdasarkan programStudiId
    if (req.user && req.user.programStudiId) {
      whereClause.prodiId = req.user.programStudiId;
    }

    // Filter untuk SEKJUR berdasarkan jurusanId
    const dosenFilter = createDosenFilter(req.userContext || {});
    if (dosenFilter) {
      whereClause.prodi = dosenFilter.prodi;
    }

    const dosen = await prisma.dosen.findMany({
      where: whereClause,
      select: {
        nip: true,
        nama: true,
        prodiId: true,
        noTelp: true,
        alamat: true,
        isKaprodi: true,
        prodi: {
          select: {
            id: true,
            nama: true,
            jurusanId: true
          }
        }
      },
      orderBy: {
        nama: 'asc'
      }
    });
    res.json(dosen);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('Error fetching dosen:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mengambil dosen berdasarkan NIP (bukan ID)
const getDosenById = async (req, res) => {
  try {
    const dosen = await prisma.dosen.findUnique({
      where: { nip: req.params.nip }, // Menggunakan NIP sebagai primary key
      include: {
        prodi: true
      }
    });
    if (!dosen) {
      return res.status(404).json({ error: 'Dosen not found' });
    }
    res.json(dosen);
  } catch (error) {
    console.error('Error fetching dosen by NIP:', error);
    res.status(500).json({ error: error.message });
  }
};

// Menambahkan dosen baru
const createDosen = async (req, res) => {
  try {
    const { nama, nip, prodiId, noTelp, alamat } = req.body;

    // Validasi input yang diperlukan
    if (!nama || !nip || !prodiId) {
      return res.status(400).json({
        error: 'Nama, NIP, dan Program Studi wajib diisi'
      });
    }

    const dosen = await prisma.dosen.create({
      data: {
        nama,
        nip,
        prodiId: parseInt(prodiId),
        noTelp: noTelp || null,
        alamat: alamat || null
      },
      include: {
        prodi: true
      }
    });
    res.status(201).json(dosen);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'NIP sudah terdaftar, gunakan NIP yang berbeda'
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update dosen
const updateDosen = async (req, res) => {
  try {
    const { nip } = req.params;
    const { nama, noTelp, alamat } = req.body;

    // Validasi input
    if (!nama) {
      return res.status(400).json({ message: 'Nama wajib diisi' });
    }

    // Cek apakah dosen exists
    const existingDosen = await prisma.dosen.findUnique({
      where: { nip }
    });

    if (!existingDosen) {
      return res.status(404).json({ message: 'Dosen tidak ditemukan' });
    }

    // Update data di tabel users
    await prisma.user.update({
      where: { username: nip },
      data: { nama }
    });

    // Update data di tabel dosen
    const updatedDosen = await prisma.dosen.update({
      where: { nip },
      data: {
        nama,
        noTelp: noTelp || existingDosen.noTelp,
        alamat: alamat || existingDosen.alamat
      },
      include: {
        prodi: true
      }
    });

    res.json({
      success: true,
      data: updatedDosen
    });
  } catch (error) {
    console.error('Error updating dosen:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui data dosen' });
  }
};

// Menghapus dosen berdasarkan NIP
const deleteDosen = async (req, res) => {
  try {
    await prisma.dosen.delete({
      where: { nip: req.params.nip } // Menggunakan NIP sebagai identifier
    });
    res.json({ message: 'Dosen deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Dosen tidak ditemukan' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Tidak dapat menghapus dosen karena masih memiliki data terkait'
      });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllDosen,
  getDosenById,
  createDosen,
  updateDosen,
  deleteDosen
};