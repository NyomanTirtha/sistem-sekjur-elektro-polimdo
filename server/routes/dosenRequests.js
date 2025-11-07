const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// =====================================================
// DOSEN SCHEDULE REQUESTS ROUTES
// =====================================================

// GET /api/dosen-requests/my-requests - List requests dari dosen yang login
router.get("/my-requests", async (req, res) => {
  try {
    const dosenNip = req.user.username; // Assuming dosen login with NIP

    // Verify user is actually a dosen
    const dosen = await prisma.dosen.findUnique({
      where: { nip: dosenNip },
      include: {
        prodi: {
          select: { id: true, nama: true },
        },
      },
    });

    if (!dosen) {
      return res.status(403).json({
        success: false,
        message: "Hanya dosen yang dapat mengakses endpoint ini",
      });
    }

    const requests = await prisma.dosenScheduleRequest.findMany({
      where: {
        dosenId: dosenNip,
      },
      include: {
        mataKuliah: {
          select: { id: true, nama: true, sks: true, semester: true },
        },
        preferredRuangan: {
          select: { id: true, nama: true, kapasitas: true, lokasi: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching dosen requests:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar request",
      error: error.message,
    });
  }
});

// POST /api/dosen-requests - Submit request baru dari dosen
router.post("/", async (req, res) => {
  try {
    const {
      mataKuliahId,
      preferredHari,
      preferredJamMulai,
      preferredJamSelesai,
      preferredRuanganId,
      alasanRequest,
    } = req.body;
    const dosenNip = req.user.username;

    // Validate required fields
    if (
      !mataKuliahId ||
      !preferredHari ||
      !preferredJamMulai ||
      !preferredJamSelesai ||
      !alasanRequest
    ) {
      return res.status(400).json({
        success: false,
        message: "Mata kuliah, hari, jam, dan alasan request harus diisi",
      });
    }

    // Validate enum values
    if (
      !["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"].includes(
        preferredHari,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Hari tidak valid",
      });
    }

    // Verify user is a dosen and get their prodi
    const dosen = await prisma.dosen.findUnique({
      where: { nip: dosenNip },
      include: {
        prodi: true,
      },
    });

    if (!dosen) {
      return res.status(403).json({
        success: false,
        message: "Hanya dosen yang dapat membuat request",
      });
    }

    // Verify mata kuliah exists and belongs to dosen's prodi
    const mataKuliah = await prisma.mataKuliah.findFirst({
      where: {
        id: parseInt(mataKuliahId),
        programStudiId: dosen.prodiId,
      },
    });

    if (!mataKuliah) {
      return res.status(400).json({
        success: false,
        message:
          "Mata kuliah tidak ditemukan atau tidak termasuk dalam prodi Anda",
      });
    }

    // Verify preferred ruangan exists and is active (if provided)
    if (preferredRuanganId) {
      const ruangan = await prisma.ruangan.findFirst({
        where: {
          id: parseInt(preferredRuanganId),
          isActive: true,
        },
      });

      if (!ruangan) {
        return res.status(400).json({
          success: false,
          message: "Ruangan pilihan tidak ditemukan atau tidak aktif",
        });
      }
    }

    // Get kaprodi for this prodi
    const kaprodi = await prisma.user.findFirst({
      where: {
        role: "KAPRODI",
        programStudiId: dosen.prodiId,
      },
    });

    if (!kaprodi) {
      return res.status(400).json({
        success: false,
        message: "Kaprodi tidak ditemukan untuk prodi ini",
      });
    }

    // Check if there's already a pending request for the same mata kuliah
    const existingRequest = await prisma.dosenScheduleRequest.findFirst({
      where: {
        dosenId: dosenNip,
        mataKuliahId: parseInt(mataKuliahId),
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Anda sudah memiliki request pending untuk mata kuliah ini",
      });
    }

    const newRequest = await prisma.dosenScheduleRequest.create({
      data: {
        dosenId: dosenNip,
        kaprodiId: kaprodi.username,
        mataKuliahId: parseInt(mataKuliahId),
        preferredHari,
        preferredJamMulai,
        preferredJamSelesai,
        preferredRuanganId: preferredRuanganId
          ? parseInt(preferredRuanganId)
          : null,
        alasanRequest,
        status: "PENDING",
      },
      include: {
        mataKuliah: {
          select: { id: true, nama: true, sks: true },
        },
        preferredRuangan: {
          select: { id: true, nama: true, kapasitas: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Request berhasil disubmit ke kaprodi",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error creating dosen request:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat request",
      error: error.message,
    });
  }
});

// PUT /api/dosen-requests/:id - Update request (hanya jika status PENDING)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      preferredHari,
      preferredJamMulai,
      preferredJamSelesai,
      preferredRuanganId,
      alasanRequest,
    } = req.body;
    const dosenNip = req.user.username;

    // Check if request exists and belongs to dosen
    const existingRequest = await prisma.dosenScheduleRequest.findFirst({
      where: {
        id: parseInt(id),
        dosenId: dosenNip,
      },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Request tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Check if request is still pending
    if (existingRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Hanya request dengan status PENDING yang bisa diedit",
      });
    }

    // Validate hari if provided
    if (
      preferredHari &&
      !["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"].includes(
        preferredHari,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Hari tidak valid",
      });
    }

    // Verify preferred ruangan if provided
    if (preferredRuanganId) {
      const ruangan = await prisma.ruangan.findFirst({
        where: {
          id: parseInt(preferredRuanganId),
          isActive: true,
        },
      });

      if (!ruangan) {
        return res.status(400).json({
          success: false,
          message: "Ruangan pilihan tidak ditemukan atau tidak aktif",
        });
      }
    }

    // Build update data
    const updateData = {};
    if (preferredHari !== undefined) updateData.preferredHari = preferredHari;
    if (preferredJamMulai !== undefined)
      updateData.preferredJamMulai = preferredJamMulai;
    if (preferredJamSelesai !== undefined)
      updateData.preferredJamSelesai = preferredJamSelesai;
    if (preferredRuanganId !== undefined)
      updateData.preferredRuanganId = preferredRuanganId
        ? parseInt(preferredRuanganId)
        : null;
    if (alasanRequest !== undefined) updateData.alasanRequest = alasanRequest;

    const updatedRequest = await prisma.dosenScheduleRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        mataKuliah: {
          select: { id: true, nama: true, sks: true },
        },
        preferredRuangan: {
          select: { id: true, nama: true, kapasitas: true },
        },
      },
    });

    res.json({
      success: true,
      message: "Request berhasil diupdate",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating dosen request:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengupdate request",
      error: error.message,
    });
  }
});

// DELETE /api/dosen-requests/:id - Hapus request (hanya jika status PENDING)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dosenNip = req.user.username;

    // Check if request exists and belongs to dosen
    const existingRequest = await prisma.dosenScheduleRequest.findFirst({
      where: {
        id: parseInt(id),
        dosenId: dosenNip,
      },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Request tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Check if request is still pending
    if (existingRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Hanya request dengan status PENDING yang bisa dihapus",
      });
    }

    await prisma.dosenScheduleRequest.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Request berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting dosen request:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus request",
      error: error.message,
    });
  }
});

// GET /api/dosen-requests/for-my-prodi - List requests untuk prodi kaprodi yang login
router.get("/for-my-prodi", async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const kaprodiUsername = req.user.username;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get kaprodi's prodi
    const user = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true, role: true },
    });

    if (!user || user.role !== "KAPRODI" || !user.programStudiId) {
      return res.status(403).json({
        success: false,
        message: "Hanya kaprodi yang dapat mengakses endpoint ini",
      });
    }

    // Build where clause
    const whereClause = {
      kaprodiId: kaprodiUsername,
    };

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      whereClause.status = status;
    }

    const [requests, totalCount] = await Promise.all([
      prisma.dosenScheduleRequest.findMany({
        where: whereClause,
        include: {
          dosen: {
            select: { nip: true, nama: true },
          },
          mataKuliah: {
            select: { id: true, nama: true, sks: true, semester: true },
          },
          preferredRuangan: {
            select: { id: true, nama: true, kapasitas: true, lokasi: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip: offset,
        take: parseInt(limit),
      }),
      prisma.dosenScheduleRequest.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching prodi requests:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar request prodi",
      error: error.message,
    });
  }
});

// POST /api/dosen-requests/:id/approve - Approve request oleh kaprodi
router.post("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const kaprodiUsername = req.user.username;

    // Check if request exists and belongs to kaprodi's prodi
    const request = await prisma.dosenScheduleRequest.findFirst({
      where: {
        id: parseInt(id),
        kaprodiId: kaprodiUsername,
      },
      include: {
        dosen: {
          select: { nama: true },
        },
        mataKuliah: {
          select: { nama: true },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Check if request is still pending
    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Hanya request dengan status PENDING yang bisa diproses",
      });
    }

    const updatedRequest = await prisma.dosenScheduleRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: "APPROVED",
        kaprodiNotes: notes || null,
        processedAt: new Date(),
      },
      include: {
        dosen: {
          select: { nip: true, nama: true },
        },
        mataKuliah: {
          select: { id: true, nama: true, sks: true },
        },
      },
    });

    res.json({
      success: true,
      message: `Request dari ${request.dosen.nama} untuk mata kuliah ${request.mataKuliah.nama} berhasil diapprove`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error approving dosen request:", error);
    res.status(500).json({
      success: false,
      message: "Gagal meng-approve request",
      error: error.message,
    });
  }
});

// POST /api/dosen-requests/:id/reject - Reject request oleh kaprodi
router.post("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const kaprodiUsername = req.user.username;

    if (!notes || notes.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Alasan penolakan harus diisi",
      });
    }

    // Check if request exists and belongs to kaprodi's prodi
    const request = await prisma.dosenScheduleRequest.findFirst({
      where: {
        id: parseInt(id),
        kaprodiId: kaprodiUsername,
      },
      include: {
        dosen: {
          select: { nama: true },
        },
        mataKuliah: {
          select: { nama: true },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Check if request is still pending
    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Hanya request dengan status PENDING yang bisa diproses",
      });
    }

    const updatedRequest = await prisma.dosenScheduleRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: "REJECTED",
        kaprodiNotes: notes.trim(),
        processedAt: new Date(),
      },
      include: {
        dosen: {
          select: { nip: true, nama: true },
        },
        mataKuliah: {
          select: { id: true, nama: true, sks: true },
        },
      },
    });

    res.json({
      success: true,
      message: `Request dari ${request.dosen.nama} untuk mata kuliah ${request.mataKuliah.nama} berhasil ditolak`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error rejecting dosen request:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menolak request",
      error: error.message,
    });
  }
});

// GET /api/dosen-requests/:id - Get detail request
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user.username;
    const userRole = req.user.role;

    let whereClause = { id: parseInt(id) };

    // Access control
    if (userRole === "DOSEN") {
      whereClause.dosenId = username;
    } else if (userRole === "KAPRODI") {
      whereClause.kaprodiId = username;
    }
    // SEKJUR can access all

    const request = await prisma.dosenScheduleRequest.findFirst({
      where: whereClause,
      include: {
        dosen: {
          select: { nip: true, nama: true },
          include: {
            prodi: {
              select: { id: true, nama: true },
            },
          },
        },
        mataKuliah: {
          select: { id: true, nama: true, sks: true, semester: true },
        },
        preferredRuangan: {
          select: { id: true, nama: true, kapasitas: true, lokasi: true },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Error fetching request detail:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail request",
      error: error.message,
    });
  }
});

module.exports = router;
