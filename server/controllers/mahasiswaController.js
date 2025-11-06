const { PrismaClient } = require('@prisma/client');
const { createMahasiswaFilter } = require('../routes/auth');
const prisma = new PrismaClient();

const getAllMahasiswa = async (req, res) => {
  try {
    const filter = createMahasiswaFilter(req.userContext || {});
    const where = filter || {};
    
    const mahasiswa = await prisma.mahasiswa.findMany({
      where,
      select: {
        nim: true,
        nama: true,
        programStudiId: true,
        angkatan: true,
        semester: true,
        noTelp: true,
        alamat: true,
        programStudi: {
          select: {
            id: true,
            nama: true,
            jurusanId: true
          }
        }
      },
      orderBy: {
        nim: 'desc'
      }
    });
    res.json(mahasiswa);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('Error fetching mahasiswa:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mengambil mahasiswa berdasarkan NIM (bukan ID)
const getMahasiswaById = async (req, res) => {
  try {
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { nim: req.params.nim }, // Menggunakan NIM sebagai primary key
      include: {
        programStudi: true,
        pengajuanSA: true
      }
    });
    if (!mahasiswa) {
      return res.status(404).json({ error: 'Mahasiswa not found' });
    }
    res.json(mahasiswa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Menambahkan mahasiswa baru
const createMahasiswa = async (req, res) => {
  try {
    const { nama, nim, programStudiId, angkatan, semester, noTelp, alamat } = req.body;
    
    // ✅ TAMBAH DEBUG LOG
    console.log('Creating mahasiswa with data:', req.body);
    console.log('Semester received:', semester, 'Type:', typeof semester);
    
    // Validasi input yang diperlukan
    if (!nama || !nim || !programStudiId || !angkatan || !semester) {
      return res.status(400).json({ 
        error: 'Nama, NIM, Program Studi, Angkatan, dan Semester wajib diisi' 
      });
    }

    // ✅ VALIDASI SEMESTER
    const semesterInt = parseInt(semester);
    if (isNaN(semesterInt) || semesterInt < 1 || semesterInt > 14) {
      return res.status(400).json({ 
        error: 'Semester harus berupa angka antara 1-14' 
      });
    }
    
    const mahasiswa = await prisma.mahasiswa.create({
      data: {
        nim,
        nama,
        programStudiId: parseInt(programStudiId),
        angkatan,
        semester: semesterInt, // ✅ GUNAKAN YANG SUDAH DIVALIDASI
        noTelp: noTelp || '',
        alamat: alamat || ''
      },
      include: {
        programStudi: true
      }
    });
    
    // ✅ LOG HASIL
    console.log('Created mahasiswa successfully:', {
      nim: mahasiswa.nim,
      nama: mahasiswa.nama,
      semester: mahasiswa.semester,
      semesterType: typeof mahasiswa.semester
    });
    
    res.status(201).json(mahasiswa);
  } catch (error) {
    console.error('Error creating mahasiswa:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'NIM sudah terdaftar, gunakan NIM yang berbeda' 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// ✅ UPDATE MAHASISWA - FIXED UNTUK HANDLE SEMUA FIELD
const updateMahasiswa = async (req, res) => {
  try {
    const { nim } = req.params;
    const { nama, programStudiId, angkatan, semester, noTelp, alamat } = req.body;

    // ✅ TAMBAH DEBUG LOG
    console.log('Updating mahasiswa:', nim);
    console.log('Update data received:', req.body);
    console.log('Semester received:', semester, 'Type:', typeof semester);

    // Validasi input
    if (!nama) {
      return res.status(400).json({ error: 'Nama wajib diisi' });
    }

    // Cek apakah mahasiswa exists
    const existingMahasiswa = await prisma.mahasiswa.findUnique({
      where: { nim }
    });

    if (!existingMahasiswa) {
      return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });
    }

    // ✅ PREPARE UPDATE DATA DENGAN SEMUA FIELD
    const updateData = {
      nama,
      noTelp: noTelp || existingMahasiswa.noTelp,
      alamat: alamat || existingMahasiswa.alamat
    };

    // ✅ UPDATE PROGRAM STUDI ID JIKA ADA
    if (programStudiId !== undefined && programStudiId !== null && programStudiId !== '') {
      const prodiInt = parseInt(programStudiId);
      if (!isNaN(prodiInt)) {
        updateData.programStudiId = prodiInt;
        console.log('Updating programStudiId to:', prodiInt);
      }
    }

    // ✅ UPDATE ANGKATAN JIKA ADA
    if (angkatan !== undefined && angkatan !== null && angkatan !== '') {
      updateData.angkatan = angkatan;
      console.log('Updating angkatan to:', angkatan);
    }

    // ✅ UPDATE SEMESTER JIKA ADA
    if (semester !== undefined && semester !== null && semester !== '') {
      const semesterInt = parseInt(semester);
      console.log('Semester after parseInt:', semesterInt);
      
      if (isNaN(semesterInt)) {
        return res.status(400).json({ 
          error: 'Semester harus berupa angka' 
        });
      }
      
      if (semesterInt < 1 || semesterInt > 14) {
        return res.status(400).json({ 
          error: 'Semester harus antara 1-14' 
        });
      }
      
      updateData.semester = semesterInt;
      console.log('Updating semester to:', semesterInt);
    }

    console.log('Final update data:', updateData);

    // ✅ UPDATE DATA DI TABEL USERS (JIKA ADA)
    try {
      await prisma.user.updateMany({
        where: { username: nim },
        data: { nama }
      });
      console.log('Updated user table for:', nim);
    } catch (userError) {
      console.log('User update skipped (user might not exist):', userError.message);
    }

    // ✅ UPDATE DATA DI TABEL MAHASISWA
    const updatedMahasiswa = await prisma.mahasiswa.update({
      where: { nim },
      data: updateData,
      include: {
        programStudi: true
      }
    });

    // ✅ LOG HASIL UPDATE
    console.log('Updated mahasiswa successfully:', {
      nim: updatedMahasiswa.nim,
      nama: updatedMahasiswa.nama,
      semester: updatedMahasiswa.semester,
      semesterType: typeof updatedMahasiswa.semester,
      programStudiId: updatedMahasiswa.programStudiId,
      angkatan: updatedMahasiswa.angkatan
    });

    res.json({
      success: true,
      data: updatedMahasiswa
    });
  } catch (error) {
    console.error('Error updating mahasiswa:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data mahasiswa' });
  }
};

// Menghapus mahasiswa berdasarkan NIM
const deleteMahasiswa = async (req, res) => {
  try {
    const nim = req.params.nim;
    
    console.log('Deleting mahasiswa:', nim);
    
    // Cek apakah mahasiswa ada
    const existingMahasiswa = await prisma.mahasiswa.findUnique({
      where: { nim },
      include: {
        pengajuanSA: true
      }
    });
    
    if (!existingMahasiswa) {
      return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });
    }
    
    // Cek apakah mahasiswa memiliki pengajuan SA
    if (existingMahasiswa.pengajuanSA && existingMahasiswa.pengajuanSA.length > 0) {
      return res.status(400).json({ 
        error: 'Tidak dapat menghapus mahasiswa karena masih memiliki pengajuan SA' 
      });
    }
    
    await prisma.mahasiswa.delete({
      where: { nim }
    });
    
    console.log('Deleted mahasiswa:', nim);
    res.json({ message: 'Mahasiswa berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting mahasiswa:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Tidak dapat menghapus mahasiswa karena masih memiliki data terkait' 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllMahasiswa,
  getMahasiswaById,
  createMahasiswa,
  updateMahasiswa,
  deleteMahasiswa
};