const { PrismaClient } = require('@prisma/client');
// Import helper functions dari auth.js
const { createProdiFilter } = require('../routes/auth');

const prisma = new PrismaClient();

// ✅ UPDATED: Mengambil semua program studi dengan filtering berdasarkan akses user
const getAllProdi = async (req, res) => {
  try {
    // Gunakan filter berdasarkan context user
    const filter = createProdiFilter(req.userContext);
    
    if (filter === null) {
      return res.status(403).json({ 
        success: false,
        error: 'Tidak memiliki akses untuk melihat data program studi' 
      });
    }

    const prodi = await prisma.programStudi.findMany({
      where: filter,
      include: {
        jurusan: true, // ✅ ADDED: Include relasi jurusan
        dosen: true,
        mahasiswa: true,
        _count: {
          select: {
            dosen: true,
            mahasiswa: true,
            mataKuliah: true
          }
        }
      },
      orderBy: {
        nama: 'asc'
      }
    });

    res.json({
      success: true,
      data: prodi,
      userInfo: {
        role: req.user?.role,
        jurusan: req.user?.jurusan?.nama,
        canAccessAll: req.userContext?.canAccessAll,
        totalData: prodi.length
      }
    });
  } catch (error) {
    console.error('Error getting all prodi:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ✅ UPDATED: Mengambil program studi berdasarkan ID dengan access control
const getProdiById = async (req, res) => {
  try {
    const prodiId = parseInt(req.params.id);
    
    // Cek akses user terlebih dahulu
    const filter = createProdiFilter(req.userContext);
    
    if (filter === null) {
      return res.status(403).json({ 
        success: false,
        error: 'Tidak memiliki akses untuk melihat data program studi' 
      });
    }

    // Gabungkan filter dengan ID yang diminta
    const prodi = await prisma.programStudi.findFirst({
      where: {
        id: prodiId,
        ...filter // ✅ ADDED: Tambahkan filter akses
      },
      include: {
        jurusan: true, // ✅ ADDED: Include relasi jurusan
        dosen: {
          orderBy: { nama: 'asc' }
        },
        mahasiswa: {
          orderBy: { nama: 'asc' }
        },
        mataKuliah: {
          orderBy: [
            { semester: 'asc' },
            { nama: 'asc' }
          ]
        },
        _count: {
          select: {
            dosen: true,
            mahasiswa: true,
            mataKuliah: true
          }
        }
      }
    });

    if (!prodi) {
      return res.status(404).json({ 
        success: false,
        error: 'Program Studi tidak ditemukan atau tidak memiliki akses' 
      });
    }

    res.json({
      success: true,
      data: prodi,
      userInfo: {
        role: req.user?.role,
        jurusan: req.user?.jurusan?.nama
      }
    });
  } catch (error) {
    console.error('Error getting prodi by ID:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ✅ UPDATED: Menambahkan program studi baru dengan validasi akses
const createProdi = async (req, res) => {
  try {
    const { nama, ketuaProdi, jurusanId } = req.body;
    
    // Validasi input yang diperlukan
    if (!nama || !ketuaProdi) {
      return res.status(400).json({ 
        success: false,
        error: 'Nama dan Ketua Program Studi wajib diisi' 
      });
    }

    // ✅ ADDED: Validasi jurusanId diperlukan dengan schema baru
    if (!jurusanId) {
      return res.status(400).json({ 
        success: false,
        error: 'Jurusan ID wajib diisi' 
      });
    }

    // ✅ ADDED: Cek akses user - sekjur hanya bisa buat prodi di jurusannya
    if (req.userContext.jurusanId && req.userContext.jurusanId !== jurusanId) {
      return res.status(403).json({ 
        success: false,
        error: 'Tidak memiliki akses untuk membuat program studi di jurusan ini' 
      });
    }

    // ✅ ADDED: Validasi jurusan exists
    const jurusan = await prisma.jurusan.findUnique({
      where: { id: jurusanId }
    });

    if (!jurusan) {
      return res.status(400).json({ 
        success: false,
        error: 'Jurusan tidak ditemukan' 
      });
    }

    const prodi = await prisma.programStudi.create({
      data: {
        nama,
        ketuaProdi,
        jurusanId // ✅ ADDED: Tambahkan jurusanId
      },
      include: {
        jurusan: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Program Studi berhasil dibuat',
      data: prodi
    });
  } catch (error) {
    console.error('Error creating prodi:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false,
        error: 'Nama Program Studi sudah ada, gunakan nama yang berbeda' 
      });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        success: false,
        error: 'Jurusan ID tidak valid' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ✅ UPDATED: Memperbarui program studi dengan validasi akses
const updateProdi = async (req, res) => {
  try {
    const prodiId = parseInt(req.params.id);
    const { nama, ketuaProdi, jurusanId } = req.body;
    
    // Validasi input yang diperlukan
    if (!nama || !ketuaProdi) {
      return res.status(400).json({ 
        success: false,
        error: 'Nama dan Ketua Program Studi wajib diisi' 
      });
    }

    // ✅ ADDED: Cek akses user terlebih dahulu
    const filter = createProdiFilter(req.userContext);
    
    if (filter === null) {
      return res.status(403).json({ 
        success: false,
        error: 'Tidak memiliki akses untuk mengubah data program studi' 
      });
    }

    // ✅ ADDED: Cek apakah prodi yang akan diupdate dapat diakses user
    const existingProdi = await prisma.programStudi.findFirst({
      where: {
        id: prodiId,
        ...filter
      }
    });

    if (!existingProdi) {
      return res.status(404).json({ 
        success: false,
        error: 'Program Studi tidak ditemukan atau tidak memiliki akses' 
      });
    }

    // ✅ ADDED: Jika jurusanId diubah, validasi akses
    if (jurusanId && jurusanId !== existingProdi.jurusanId) {
      if (req.userContext.jurusanId && req.userContext.jurusanId !== jurusanId) {
        return res.status(403).json({ 
          success: false,
          error: 'Tidak memiliki akses untuk memindahkan program studi ke jurusan lain' 
        });
      }

      // Validasi jurusan exists
      const jurusan = await prisma.jurusan.findUnique({
        where: { id: jurusanId }
      });

      if (!jurusan) {
        return res.status(400).json({ 
          success: false,
          error: 'Jurusan tidak ditemukan' 
        });
      }
    }

    const updateData = {
      nama,
      ketuaProdi
    };

    // ✅ ADDED: Hanya tambahkan jurusanId jika disediakan
    if (jurusanId) {
      updateData.jurusanId = jurusanId;
    }

    const prodi = await prisma.programStudi.update({
      where: { id: prodiId },
      data: updateData,
      include: {
        jurusan: true
      }
    });

    res.json({
      success: true,
      message: 'Program Studi berhasil diperbarui',
      data: prodi
    });
  } catch (error) {
    console.error('Error updating prodi:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'Program Studi tidak ditemukan' 
      });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false,
        error: 'Nama Program Studi sudah ada, gunakan nama yang berbeda' 
      });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        success: false,
        error: 'Jurusan ID tidak valid' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ✅ UPDATED: Menghapus program studi dengan validasi akses
const deleteProdi = async (req, res) => {
  try {
    const prodiId = parseInt(req.params.id);
    
    // ✅ ADDED: Cek akses user terlebih dahulu
    const filter = createProdiFilter(req.userContext);
    
    if (filter === null) {
      return res.status(403).json({ 
        success: false,
        error: 'Tidak memiliki akses untuk menghapus data program studi' 
      });
    }

    // ✅ ADDED: Cek apakah prodi yang akan dihapus dapat diakses user
    const existingProdi = await prisma.programStudi.findFirst({
      where: {
        id: prodiId,
        ...filter
      },
      include: {
        _count: {
          select: {
            dosen: true,
            mahasiswa: true,
            mataKuliah: true
          }
        }
      }
    });

    if (!existingProdi) {
      return res.status(404).json({ 
        success: false,
        error: 'Program Studi tidak ditemukan atau tidak memiliki akses' 
      });
    }

    // ✅ ADDED: Cek apakah masih ada data terkait
    const { _count } = existingProdi;
    if (_count.dosen > 0 || _count.mahasiswa > 0 || _count.mataKuliah > 0) {
      return res.status(400).json({ 
        success: false,
        error: `Tidak dapat menghapus Program Studi karena masih memiliki ${_count.dosen} dosen, ${_count.mahasiswa} mahasiswa, dan ${_count.mataKuliah} mata kuliah`
      });
    }

    await prisma.programStudi.delete({
      where: { id: prodiId }
    });

    res.json({ 
      success: true,
      message: 'Program Studi berhasil dihapus' 
    });
  } catch (error) {
    console.error('Error deleting prodi:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'Program Studi tidak ditemukan' 
      });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        success: false,
        error: 'Tidak dapat menghapus Program Studi karena masih memiliki data terkait' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ✅ NEW: Get program studi berdasarkan jurusan (helper function)
const getProdiByJurusan = async (req, res) => {
  try {
    const jurusanId = parseInt(req.params.jurusanId);
    
    // Validasi akses ke jurusan
    if (req.userContext.jurusanId && req.userContext.jurusanId !== jurusanId) {
      return res.status(403).json({ 
        success: false,
        error: 'Tidak memiliki akses untuk melihat program studi jurusan ini' 
      });
    }

    const prodi = await prisma.programStudi.findMany({
      where: { jurusanId: jurusanId },
      include: {
        jurusan: true,
        _count: {
          select: {
            dosen: true,
            mahasiswa: true,
            mataKuliah: true
          }
        }
      },
      orderBy: {
        nama: 'asc'
      }
    });

    res.json({
      success: true,
      data: prodi,
      userInfo: {
        role: req.user?.role,
        jurusan: req.user?.jurusan?.nama
      }
    });
  } catch (error) {
    console.error('Error getting prodi by jurusan:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = {
  getAllProdi,
  getProdiById,
  createProdi,
  updateProdi,
  deleteProdi,
  getProdiByJurusan // ✅ NEW: Export function baru
};