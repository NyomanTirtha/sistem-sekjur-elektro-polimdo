// controllers/mataKuliahController.js

const { PrismaClient } = require("@prisma/client");
const { createMataKuliahFilter } = require("../routes/auth");
const prisma = new PrismaClient();

const getAllMataKuliah = async (req, res) => {
  try {
    const filter = createMataKuliahFilter(req.userContext);

    if (filter === null) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk melihat data mata kuliah",
      });
    }

    const mataKuliah = await prisma.mataKuliah.findMany({
      where: filter,
      include: {
        programStudi: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
      orderBy: [{ semester: "asc" }, { nama: "asc" }],
    });

    res.json({
      success: true,
      data: mataKuliah,
    });
  } catch (error) {
    console.error("Error getting all mata kuliah:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data mata kuliah",
      error: error.message,
    });
  }
};

// Mengambil mata kuliah berdasarkan ID
const getMataKuliahById = async (req, res) => {
  try {
    const mataKuliahId = parseInt(req.params.id);
    const filter = createMataKuliahFilter(req.userContext);

    if (filter === null) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk melihat data mata kuliah",
      });
    }

    console.log("Getting mata kuliah with ID:", mataKuliahId); // Debug log

    const mataKuliah = await prisma.mataKuliah.findFirst({
      where: {
        id: mataKuliahId,
        ...filter,
      },
      include: {
        programStudi: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    if (!mataKuliah) {
      return res.status(404).json({
        success: false,
        message: "Mata kuliah tidak ditemukan",
      });
    }

    console.log("Found mata kuliah:", mataKuliah); // Debug log
    res.json({
      success: true,
      data: mataKuliah,
    });
  } catch (error) {
    console.error("Error getting mata kuliah by ID:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data mata kuliah",
      error: error.message,
    });
  }
};

// Menambahkan mata kuliah baru
const createMataKuliah = async (req, res) => {
  try {
    const { nama, sks, semester, programStudiId } = req.body;

    console.log("Received data:", { nama, sks, semester, programStudiId }); // Debug log

    // Validasi input
    if (!nama || !sks || !semester || !programStudiId) {
      return res.status(400).json({
        success: false,
        message:
          "Nama mata kuliah, SKS, semester, dan program studi harus diisi",
      });
    }

    if (parseInt(sks) <= 0 || parseInt(sks) > 6) {
      return res.status(400).json({
        success: false,
        message: "SKS harus antara 1-6",
      });
    }

    if (parseInt(semester) < 1 || parseInt(semester) > 8) {
      return res.status(400).json({
        success: false,
        message: "Semester harus antara 1-8",
      });
    }

    // Validasi akses prodi
    const filter = createMataKuliahFilter(req.userContext);
    if (filter === null) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk menambah mata kuliah",
      });
    }

    // Cek akses ke program studi
    const programStudi = await prisma.programStudi.findFirst({
      where: {
        id: parseInt(programStudiId),
        ...(req.userContext.jurusanId
          ? { jurusanId: req.userContext.jurusanId }
          : {}),
        ...(req.userContext.programStudiIds &&
        req.userContext.programStudiIds.length > 0
          ? { id: { in: req.userContext.programStudiIds } }
          : {}),
      },
    });

    if (!programStudi) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses ke program studi ini",
      });
    }

    // Cek apakah mata kuliah dengan nama yang sama sudah ada di prodi yang sama
    const existingMataKuliah = await prisma.mataKuliah.findFirst({
      where: {
        nama: {
          equals: nama,
          mode: "insensitive",
        },
        programStudiId: parseInt(programStudiId),
      },
    });

    if (existingMataKuliah) {
      return res.status(400).json({
        success: false,
        message:
          "Mata kuliah dengan nama tersebut sudah ada di program studi ini",
      });
    }

    const mataKuliah = await prisma.mataKuliah.create({
      data: {
        nama: nama.trim(),
        sks: parseInt(sks),
        semester: parseInt(semester),
        programStudiId: parseInt(programStudiId),
      },
      include: {
        programStudi: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    console.log("Created mata kuliah:", mataKuliah); // Debug log
    res.status(201).json({
      success: true,
      message: "Mata kuliah berhasil ditambahkan",
      data: mataKuliah,
    });
  } catch (error) {
    console.error("Error creating mata kuliah:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan mata kuliah",
      error: error.message,
    });
  }
};

// Memperbarui mata kuliah berdasarkan ID
const updateMataKuliah = async (req, res) => {
  try {
    const mataKuliahId = parseInt(req.params.id);
    const { nama, sks, semester, programStudiId } = req.body;

    console.log("Updating mata kuliah:", {
      id: mataKuliahId,
      nama,
      sks,
      semester,
      programStudiId,
    }); // Debug log

    // Validasi akses
    const filter = createMataKuliahFilter(req.userContext);
    if (filter === null) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk mengubah mata kuliah",
      });
    }

    // Validasi input
    if (!nama || !sks || !semester || !programStudiId) {
      return res.status(400).json({
        success: false,
        message:
          "Nama mata kuliah, SKS, semester, dan program studi harus diisi",
      });
    }

    if (parseInt(sks) <= 0 || parseInt(sks) > 6) {
      return res.status(400).json({
        success: false,
        message: "SKS harus antara 1-6",
      });
    }

    if (parseInt(semester) < 1 || parseInt(semester) > 8) {
      return res.status(400).json({
        success: false,
        message: "Semester harus antara 1-8",
      });
    }

    // Cek apakah mata kuliah ada dan user memiliki akses
    const existingMataKuliah = await prisma.mataKuliah.findFirst({
      where: {
        id: mataKuliahId,
        ...filter,
      },
    });

    if (!existingMataKuliah) {
      return res.status(404).json({
        success: false,
        message: "Mata kuliah tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Cek akses ke program studi baru
    const programStudi = await prisma.programStudi.findFirst({
      where: {
        id: parseInt(programStudiId),
        ...(req.userContext.jurusanId
          ? { jurusanId: req.userContext.jurusanId }
          : {}),
        ...(req.userContext.programStudiIds &&
        req.userContext.programStudiIds.length > 0
          ? { id: { in: req.userContext.programStudiIds } }
          : {}),
      },
    });

    if (!programStudi) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses ke program studi ini",
      });
    }

    // Cek apakah nama mata kuliah sudah digunakan oleh mata kuliah lain di prodi yang sama
    const duplicateMataKuliah = await prisma.mataKuliah.findFirst({
      where: {
        nama: {
          equals: nama,
          mode: "insensitive",
        },
        programStudiId: parseInt(programStudiId),
        id: {
          not: mataKuliahId,
        },
      },
    });

    if (duplicateMataKuliah) {
      return res.status(400).json({
        success: false,
        message:
          "Mata kuliah dengan nama tersebut sudah ada di program studi ini",
      });
    }

    const mataKuliah = await prisma.mataKuliah.update({
      where: { id: mataKuliahId },
      data: {
        nama: nama.trim(),
        sks: parseInt(sks),
        semester: parseInt(semester),
        programStudiId: parseInt(programStudiId),
      },
      include: {
        programStudi: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    console.log("Updated mata kuliah:", mataKuliah); // Debug log
    res.json({
      success: true,
      message: "Mata kuliah berhasil diperbarui",
      data: mataKuliah,
    });
  } catch (error) {
    console.error("Error updating mata kuliah:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui mata kuliah",
      error: error.message,
    });
  }
};

// Menghapus mata kuliah berdasarkan ID
const deleteMataKuliah = async (req, res) => {
  try {
    const mataKuliahId = parseInt(req.params.id);

    console.log("Deleting mata kuliah with ID:", mataKuliahId); // Debug log

    // Validasi akses
    const filter = createMataKuliahFilter(req.userContext);
    if (filter === null) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk menghapus mata kuliah",
      });
    }

    // Cek apakah mata kuliah ada dan user memiliki akses
    const existingMataKuliah = await prisma.mataKuliah.findFirst({
      where: {
        id: mataKuliahId,
        ...filter,
      },
    });

    if (!existingMataKuliah) {
      return res.status(404).json({
        success: false,
        message: "Mata kuliah tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Cek apakah mata kuliah sedang digunakan dalam pengajuan SA
    const usedInPengajuan = await prisma.pengajuanSADetail.findFirst({
      where: {
        mataKuliahId: mataKuliahId,
      },
    });

    if (usedInPengajuan) {
      return res.status(400).json({
        success: false,
        message:
          "Mata kuliah tidak dapat dihapus karena sedang digunakan dalam pengajuan SA",
      });
    }

    // Cek apakah mata kuliah sedang digunakan dalam jadwal
    const usedInSchedule = await prisma.scheduleItem.findFirst({
      where: {
        mataKuliahId: mataKuliahId,
      },
    });

    if (usedInSchedule) {
      return res.status(400).json({
        success: false,
        message:
          "Mata kuliah tidak dapat dihapus karena sedang digunakan dalam jadwal",
      });
    }

    // Cek apakah mata kuliah sedang digunakan dalam request dosen
    const usedInRequest = await prisma.dosenScheduleRequest.findFirst({
      where: {
        mataKuliahId: mataKuliahId,
      },
    });

    if (usedInRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Mata kuliah tidak dapat dihapus karena ada request dari dosen",
      });
    }

    await prisma.mataKuliah.delete({
      where: { id: mataKuliahId },
    });

    console.log("Deleted mata kuliah with ID:", mataKuliahId); // Debug log
    res.json({
      success: true,
      message: "Mata kuliah berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting mata kuliah:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus mata kuliah",
      error: error.message,
    });
  }
};

module.exports = {
  getAllMataKuliah,
  getMataKuliahById,
  createMataKuliah,
  updateMataKuliah,
  deleteMataKuliah,
};
