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
      preferredKelas,
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
    // Cari kaprodi berdasarkan programStudiId yang sama dengan dosen.prodiId
    const kaprodi = await prisma.user.findFirst({
      where: {
        role: "KAPRODI",
        programStudiId: dosen.prodiId,
      },
      select: {
        username: true,
        nama: true,
        programStudiId: true,
      },
    });

    if (!kaprodi) {
      console.error("Kaprodi tidak ditemukan untuk prodi:", {
        dosenNip: dosenNip,
        dosenProdiId: dosen.prodiId,
        dosenProdiNama: dosen.prodi?.nama,
      });
      return res.status(400).json({
        success: false,
        message: `Kaprodi tidak ditemukan untuk program studi ${dosen.prodi?.nama || dosen.prodiId}. Pastikan ada kaprodi yang terdaftar untuk program studi ini.`,
      });
    }

    console.log("Kaprodi ditemukan:", {
      kaprodiUsername: kaprodi.username,
      kaprodiNama: kaprodi.nama,
      prodiId: kaprodi.programStudiId,
    });

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

    // Normalize kelas to uppercase if provided
    const kelasNormalized = preferredKelas
      ? preferredKelas.trim().toUpperCase()
      : null;

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
        preferredKelas: kelasNormalized,
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
        dosen: {
          select: { nip: true, nama: true },
        },
      },
    });

    console.log("Request berhasil dibuat:", {
      requestId: newRequest.id,
      dosenId: newRequest.dosenId,
      kaprodiId: newRequest.kaprodiId,
      mataKuliah: newRequest.mataKuliah?.nama,
    });

    res.status(201).json({
      success: true,
      message: `Request berhasil disubmit ke kaprodi ${kaprodi.nama}`,
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
          select: { nama: true, prodiId: true },
        },
        mataKuliah: {
          select: { nama: true, id: true, programStudiId: true },
        },
        preferredRuangan: {
          select: { id: true, nama: true, kapasitas: true },
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

    // Get kaprodi's prodi
    const kaprodi = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true },
    });

    if (!kaprodi || !kaprodi.programStudiId) {
      return res.status(400).json({
        success: false,
        message: "Kaprodi tidak terkait dengan program studi",
      });
    }

    // Cari periode aktif jika tidak diberikan
    let periodId = req.body.timetablePeriodId;
    if (!periodId) {
      const activePeriod = await prisma.timetablePeriod.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });

      if (!activePeriod) {
        return res.status(400).json({
          success: false,
          message:
            "Tidak ada periode aktif. Silakan pilih periode atau buat periode baru",
        });
      }
      periodId = activePeriod.id;
    }

    // Cari atau buat jadwal prodi
    let prodiSchedule = await prisma.prodiSchedule.findFirst({
      where: {
        timetablePeriodId: parseInt(periodId),
        prodiId: kaprodi.programStudiId,
        kaprodiId: kaprodiUsername,
      },
    });

    if (!prodiSchedule) {
      // Buat jadwal prodi baru jika belum ada
      prodiSchedule = await prisma.prodiSchedule.create({
        data: {
          timetablePeriodId: parseInt(periodId),
          prodiId: kaprodi.programStudiId,
          kaprodiId: kaprodiUsername,
          status: "DRAFT",
        },
      });
    }

    // Validasi: Pastikan ruangan sudah dipilih
    if (!request.preferredRuanganId) {
      return res.status(400).json({
        success: false,
        message:
          "Request harus memiliki ruangan yang dipilih untuk dapat di-approve",
      });
    }

    // Helper function untuk cek overlap waktu
    const isTimeOverlapping = (start1, end1, start2, end2) => {
      const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };
      const start1Min = timeToMinutes(start1);
      const end1Min = timeToMinutes(end1);
      const start2Min = timeToMinutes(start2);
      const end2Min = timeToMinutes(end2);
      return start1Min < end2Min && end1Min > start2Min;
    };

    // Cek konflik jadwal sebelum menambahkan
    const existingItems = await prisma.scheduleItem.findMany({
      where: {
        prodiScheduleId: prodiSchedule.id,
        hari: request.preferredHari,
      },
      include: {
        mataKuliah: { select: { nama: true } },
        dosen: { select: { nama: true } },
        ruangan: { select: { nama: true } },
      },
    });

    // Cek konflik dengan item yang sudah ada
    let conflictingItem = null;
    for (const item of existingItems) {
      const hasTimeConflict = isTimeOverlapping(
        request.preferredJamMulai,
        request.preferredJamSelesai,
        item.jamMulai,
        item.jamSelesai,
      );

      if (hasTimeConflict) {
        // Cek konflik dosen
        if (item.dosenId === request.dosenId) {
          conflictingItem = {
            ...item,
            conflictType: "dosen",
          };
          break;
        }
        // Cek konflik ruangan
        if (item.ruanganId === request.preferredRuanganId) {
          conflictingItem = {
            ...item,
            conflictType: "ruangan",
          };
          break;
        }
      }
    }

    if (conflictingItem) {
      const conflictMessage =
        conflictingItem.conflictType === "dosen"
          ? `Dosen ${conflictingItem.dosen.nama} sudah memiliki jadwal untuk mata kuliah ${conflictingItem.mataKuliah.nama} pada waktu yang sama`
          : `Ruangan ${conflictingItem.ruangan.nama} sudah digunakan untuk mata kuliah ${conflictingItem.mataKuliah.nama} pada waktu yang sama`;

      return res.status(400).json({
        success: false,
        message: `Konflik jadwal terdeteksi. ${conflictMessage}`,
      });
    }

    // Mulai transaksi untuk update request dan create scheduleItem
    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.dosenScheduleRequest.update({
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

      // Tambahkan scheduleItem ke jadwal prodi
      const newScheduleItem = await tx.scheduleItem.create({
        data: {
          prodiScheduleId: prodiSchedule.id,
          mataKuliahId: request.mataKuliahId,
          dosenId: request.dosenId,
          hari: request.preferredHari,
          jamMulai: request.preferredJamMulai,
          jamSelesai: request.preferredJamSelesai,
          ruanganId: request.preferredRuanganId,
          kelas: request.preferredKelas || null, // Gunakan kelas dari request dosen
          kapasitasMahasiswa: request.preferredRuangan?.kapasitas || null,
        },
        include: {
          mataKuliah: {
            select: { id: true, nama: true, sks: true },
          },
          dosen: {
            select: { nip: true, nama: true },
          },
          ruangan: {
            select: { id: true, nama: true, kapasitas: true },
          },
        },
      });

      return { updatedRequest, newScheduleItem };
    });

    res.json({
      success: true,
      message: `Request dari ${result.updatedRequest.dosen.nama} untuk mata kuliah ${result.updatedRequest.mataKuliah.nama} berhasil diapprove dan ditambahkan ke jadwal`,
      data: {
        request: result.updatedRequest,
        scheduleItem: result.newScheduleItem,
      },
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
