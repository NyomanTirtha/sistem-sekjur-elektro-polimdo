const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// =====================================================
// SEKJUR SCHEDULE MANAGEMENT ROUTES
// =====================================================

// GET /api/sekjur-schedules/all-prodi - List semua jadwal dari semua prodi
router.get("/all-prodi", async (req, res) => {
  try {
    const { periodId, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {};

    // ✅ FILTER BERDASARKAN JURUSAN SEKJUR
    console.log("🔍 [DEBUG] Sekjur Schedules - User Context:", {
      username: req.user?.username,
      role: req.user?.role,
      jurusanId: req.userContext?.jurusanId,
      jurusanName: req.user?.jurusan?.nama,
      canAccessAll: req.userContext?.canAccessAll,
    });

    if (req.userContext && req.userContext.jurusanId) {
      whereClause.prodi = {
        jurusanId: req.userContext.jurusanId,
      };
      console.log(
        "✅ [DEBUG] Filter applied - jurusanId:",
        req.userContext.jurusanId,
      );
    } else {
      console.log("⚠️ [DEBUG] No jurusan filter applied!");
    }

    if (periodId) {
      whereClause.timetablePeriodId = parseInt(periodId);
    }

    if (
      status &&
      [
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "PUBLISHED",
      ].includes(status)
    ) {
      whereClause.status = status;
    }

    console.log(
      "🔍 [DEBUG] Where clause:",
      JSON.stringify(whereClause, null, 2),
    );

    const [schedules, totalCount] = await Promise.all([
      prisma.prodiSchedule.findMany({
        where: whereClause,
        include: {
          timetablePeriod: {
            select: {
              id: true,
              semester: true,
              tahunAkademik: true,
              status: true,
            },
          },
          prodi: {
            select: { id: true, nama: true },
          },
          scheduleItems: {
            include: {
              mataKuliah: {
                select: { id: true, nama: true, sks: true },
              },
              dosen: {
                select: { nip: true, nama: true },
              },
              ruangan: {
                select: { id: true, nama: true },
              },
            },
          },
          _count: {
            select: { scheduleItems: true },
          },
        },
        orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
        skip: offset,
        take: parseInt(limit),
      }),
      prisma.prodiSchedule.count({ where: whereClause }),
    ]);

    console.log("📊 [DEBUG] Results:", {
      totalSchedules: schedules.length,
      schedulesByProdi: schedules.map((s) => ({
        id: s.id,
        prodi: s.prodi?.nama,
        jurusanId: s.prodi?.jurusanId,
      })),
    });

    res.json({
      success: true,
      data: schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching all prodi schedules:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil jadwal semua prodi",
      error: error.message,
    });
  }
});

// GET /api/sekjur-schedules/dashboard-stats - Dashboard statistik untuk sekjur
// GET /api/sekjur-schedules/stats - Dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const { periodId } = req.query;

    let whereClause = {};

    // ✅ FILTER BERDASARKAN JURUSAN SEKJUR
    if (req.userContext && req.userContext.jurusanId) {
      whereClause.prodi = {
        jurusanId: req.userContext.jurusanId,
      };
    }

    if (periodId) {
      whereClause.timetablePeriodId = parseInt(periodId);
    }

    const [
      totalSchedules,
      draftSchedules,
      submittedSchedules,
      approvedSchedules,
      publishedSchedules,
      rejectedSchedules,
      totalProdi,
      conflicts,
    ] = await Promise.all([
      prisma.prodiSchedule.count({ where: whereClause }),
      prisma.prodiSchedule.count({
        where: { ...whereClause, status: "DRAFT" },
      }),
      prisma.prodiSchedule.count({
        where: { ...whereClause, status: "SUBMITTED" },
      }),
      prisma.prodiSchedule.count({
        where: { ...whereClause, status: "APPROVED" },
      }),
      prisma.prodiSchedule.count({
        where: { ...whereClause, status: "PUBLISHED" },
      }),
      prisma.prodiSchedule.count({
        where: { ...whereClause, status: "REJECTED" },
      }),
      prisma.programStudi.count(),
      checkGlobalConflicts(
        periodId ? parseInt(periodId) : null,
        req.userContext?.jurusanId || null,
      ),
    ]);

    const completionRate =
      totalProdi > 0 ? Math.round((totalSchedules / totalProdi) * 100) : 0;
    const approvalRate =
      totalSchedules > 0
        ? Math.round((approvedSchedules / totalSchedules) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalProdi,
          totalSchedules,
          completionRate,
          approvalRate,
        },
        statusCounts: {
          draft: draftSchedules,
          submitted: submittedSchedules,
          approved: approvedSchedules,
          published: publishedSchedules,
          rejected: rejectedSchedules,
        },
        conflicts: {
          total: conflicts.length,
          ruanganConflicts: conflicts.filter(
            (c) => c.type === "RUANGAN_CONFLICT",
          ).length,
          dosenConflicts: conflicts.filter((c) => c.type === "DOSEN_CONFLICT")
            .length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik dashboard",
      error: error.message,
    });
  }
});

// POST /api/sekjur-schedules/:id/review - Mulai review jadwal prodi
router.post("/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const sekjurUsername = req.user.username;

    // Get the schedule
    const schedule = await prisma.prodiSchedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        prodi: {
          select: { nama: true, jurusanId: true },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan",
      });
    }

    // ✅ VALIDASI: Sekjur hanya bisa review jadwal dari jurusannya
    if (
      req.userContext &&
      req.userContext.jurusanId &&
      schedule.prodi.jurusanId !== req.userContext.jurusanId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Anda tidak memiliki akses untuk mereview jadwal dari jurusan lain",
      });
    }

    if (schedule.status !== "SUBMITTED") {
      return res.status(400).json({
        success: false,
        message: "Hanya jadwal dengan status SUBMITTED yang bisa direview",
      });
    }

    const updatedSchedule = await prisma.prodiSchedule.update({
      where: { id: parseInt(id) },
      data: {
        status: "UNDER_REVIEW",
      },
      include: {
        prodi: {
          select: { nama: true },
        },
        timetablePeriod: {
          select: { semester: true, tahunAkademik: true },
        },
      },
    });

    res.json({
      success: true,
      message: `Jadwal prodi ${schedule.prodi.nama} sedang direview`,
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error starting schedule review:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memulai review jadwal",
      error: error.message,
    });
  }
});

// POST /api/sekjur-schedules/:id/approve - Approve jadwal prodi
router.post("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const sekjurUsername = req.user.username;

    // Check if schedule exists and is under review
    // Validate schedule
    const schedule = await prisma.prodiSchedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        prodi: {
          select: { nama: true, jurusanId: true },
        },
        scheduleItems: true,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan",
      });
    }

    // ✅ VALIDASI: Sekjur hanya bisa approve jadwal dari jurusannya
    if (
      req.userContext &&
      req.userContext.jurusanId &&
      schedule.prodi.jurusanId !== req.userContext.jurusanId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Anda tidak memiliki akses untuk meng-approve jadwal dari jurusan lain",
      });
    }

    if (!["SUBMITTED", "UNDER_REVIEW"].includes(schedule.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Hanya jadwal dengan status SUBMITTED atau UNDER_REVIEW yang bisa di-approve",
      });
    }

    // Check for conflicts
    const conflicts = await checkScheduleConflicts(parseInt(id));
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak dapat approve jadwal yang memiliki konflik",
        data: { conflicts },
      });
    }

    const updatedSchedule = await prisma.prodiSchedule.update({
      where: { id: parseInt(id) },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        sekjurNotes: notes || null,
      },
      include: {
        prodi: {
          select: { nama: true },
        },
        timetablePeriod: {
          select: { semester: true, tahunAkademik: true },
        },
      },
    });

    res.json({
      success: true,
      message: `Jadwal prodi ${schedule.prodi.nama} berhasil di-approve`,
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error approving schedule:", error);
    res.status(500).json({
      success: false,
      message: "Gagal meng-approve jadwal",
      error: error.message,
    });
  }
});

// POST /api/sekjur-schedules/:id/reject - Reject jadwal prodi
router.post("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const sekjurUsername = req.user.username;

    if (!notes || notes.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Alasan penolakan harus diisi",
      });
    }

    // Check if schedule exists and is under review
    // Get the schedule
    const schedule = await prisma.prodiSchedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        prodi: {
          select: { nama: true, jurusanId: true },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan",
      });
    }

    // ✅ VALIDASI: Sekjur hanya bisa reject jadwal dari jurusannya
    if (
      req.userContext &&
      req.userContext.jurusanId &&
      schedule.prodi.jurusanId !== req.userContext.jurusanId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Anda tidak memiliki akses untuk menolak jadwal dari jurusan lain",
      });
    }

    if (!["SUBMITTED", "UNDER_REVIEW"].includes(schedule.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Hanya jadwal dengan status SUBMITTED atau UNDER_REVIEW yang bisa ditolak",
      });
    }

    const updatedSchedule = await prisma.prodiSchedule.update({
      where: { id: parseInt(id) },
      data: {
        status: "REJECTED",
        sekjurNotes: notes.trim(),
      },
      include: {
        prodi: {
          select: { nama: true },
        },
        timetablePeriod: {
          select: { semester: true, tahunAkademik: true },
        },
      },
    });

    // Create revision record
    await prisma.scheduleRevision.create({
      data: {
        prodiScheduleId: parseInt(id),
        revisionNotes: notes.trim(),
        createdBySekjur: sekjurUsername,
      },
    });

    res.json({
      success: true,
      message: `Jadwal prodi ${schedule.prodi.nama} ditolak dan dikembalikan untuk revisi`,
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error rejecting schedule:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menolak jadwal",
      error: error.message,
    });
  }
});

// GET /api/sekjur-schedules/conflicts - Get semua konflik jadwal
router.get("/conflicts", async (req, res) => {
  try {
    const { periodId } = req.query;

    const conflicts = await checkGlobalConflicts(
      periodId ? parseInt(periodId) : null,
      req.userContext?.jurusanId || null,
    );

    res.json({
      success: true,
      data: {
        totalConflicts: conflicts.length,
        conflicts: conflicts,
      },
    });
  } catch (error) {
    console.error("Error fetching conflicts:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar konflik",
      error: error.message,
    });
  }
});

// GET /api/sekjur-schedules/unified-view - Lihat jadwal semua prodi dalam satu view
router.get("/unified-view", async (req, res) => {
  try {
    const { periodId, hari, ruanganId } = req.query;

    if (!periodId) {
      return res.status(400).json({
        success: false,
        message: "Period ID harus disediakan",
      });
    }

    // Build where clause
    // Build where clause untuk schedule items
    let whereClause = {
      prodiSchedule: {
        timetablePeriodId: parseInt(periodId),
        status: { in: ["APPROVED", "PUBLISHED"] },
      },
    };

    // ✅ FILTER BERDASARKAN JURUSAN SEKJUR
    if (req.userContext && req.userContext.jurusanId) {
      whereClause.prodiSchedule.prodi = {
        jurusanId: req.userContext.jurusanId,
      };
    }

    if (hari) {
      whereClause.hari = hari;
    }

    if (ruanganId) {
      whereClause.ruanganId = parseInt(ruanganId);
    }

    const scheduleItems = await prisma.scheduleItem.findMany({
      where: whereClause,
      include: {
        mataKuliah: {
          select: { id: true, nama: true, sks: true },
        },
        dosen: {
          select: { nip: true, nama: true },
        },
        ruangan: {
          select: { id: true, nama: true, lokasi: true },
        },
        prodiSchedule: {
          select: {
            id: true,
            status: true,
            prodi: {
              select: { id: true, nama: true },
            },
          },
        },
      },
      orderBy: [{ hari: "asc" }, { jamMulai: "asc" }, { ruanganId: "asc" }],
    });

    // Group by day and time slot for easier visualization
    const groupedSchedule = {};
    scheduleItems.forEach((item) => {
      const day = item.hari;
      const timeSlot = `${item.jamMulai}-${item.jamSelesai}`;

      if (!groupedSchedule[day]) {
        groupedSchedule[day] = {};
      }

      if (!groupedSchedule[day][timeSlot]) {
        groupedSchedule[day][timeSlot] = [];
      }

      groupedSchedule[day][timeSlot].push({
        id: item.id,
        mataKuliah: item.mataKuliah,
        dosen: item.dosen,
        ruangan: item.ruangan,
        prodi: item.prodiSchedule.prodi,
        kelas: item.kelas,
        kapasitasMahasiswa: item.kapasitasMahasiswa,
      });
    });

    res.json({
      success: true,
      data: {
        totalItems: scheduleItems.length,
        groupedSchedule,
        rawItems: scheduleItems,
      },
    });
  } catch (error) {
    console.error("Error fetching unified view:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil tampilan terpadu jadwal",
      error: error.message,
    });
  }
});

// POST /api/sekjur-schedules/bulk-approve - Bulk approve multiple schedules
router.post("/bulk-approve", async (req, res) => {
  try {
    const { scheduleIds, notes } = req.body;
    const sekjurUsername = req.user.username;

    if (
      !scheduleIds ||
      !Array.isArray(scheduleIds) ||
      scheduleIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Daftar ID jadwal harus disediakan",
      });
    }

    // ✅ BUILD WHERE CLAUSE DENGAN VALIDASI JURUSAN
    const whereClause = {
      id: { in: scheduleIds.map((id) => parseInt(id)) },
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    };

    // ✅ VALIDASI: Sekjur hanya bisa approve jadwal dari jurusannya
    if (req.userContext && req.userContext.jurusanId) {
      whereClause.prodi = {
        jurusanId: req.userContext.jurusanId,
      };
    }

    // Validate all schedules exist and are approvable
    const schedules = await prisma.prodiSchedule.findMany({
      where: whereClause,
      include: {
        prodi: {
          select: { nama: true, jurusanId: true },
        },
      },
    });

    if (schedules.length !== scheduleIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "Beberapa jadwal tidak ditemukan, tidak dapat di-approve, atau bukan dari jurusan Anda",
      });
    }

    // Check for conflicts in all schedules
    const allConflicts = [];
    for (const schedule of schedules) {
      const conflicts = await checkScheduleConflicts(schedule.id);
      if (conflicts.length > 0) {
        allConflicts.push({
          scheduleId: schedule.id,
          prodiNama: schedule.prodi.nama,
          conflicts,
        });
      }
    }

    if (allConflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Beberapa jadwal memiliki konflik dan tidak dapat di-approve",
        data: { conflictedSchedules: allConflicts },
      });
    }

    // Approve all schedules
    const approvedSchedules = await prisma.prodiSchedule.updateMany({
      where: {
        id: { in: scheduleIds.map((id) => parseInt(id)) },
      },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        sekjurNotes: notes || null,
      },
    });

    res.json({
      success: true,
      message: `${approvedSchedules.count} jadwal berhasil di-approve`,
      data: {
        approvedCount: approvedSchedules.count,
        schedules: schedules.map((s) => ({
          id: s.id,
          prodiNama: s.prodi.nama,
        })),
      },
    });
  } catch (error) {
    console.error("Error bulk approving schedules:", error);
    res.status(500).json({
      success: false,
      message: "Gagal meng-approve jadwal secara bulk",
      error: error.message,
    });
  }
});

// GET /api/sekjur-schedules/export/:periodId - Export jadwal untuk periode tertentu
// GET /api/sekjur-schedules/export/:periodId - Export jadwal yang sudah approved/published
router.get("/export/:periodId", async (req, res) => {
  try {
    const { periodId } = req.params;

    // ✅ BUILD WHERE CLAUSE DENGAN FILTER JURUSAN
    const prodiScheduleWhere = {
      status: "PUBLISHED",
    };

    if (req.userContext && req.userContext.jurusanId) {
      prodiScheduleWhere.prodi = {
        jurusanId: req.userContext.jurusanId,
      };
    }

    const period = await prisma.timetablePeriod.findUnique({
      where: { id: parseInt(periodId) },
      include: {
        prodiSchedules: {
          where: prodiScheduleWhere,
          include: {
            prodi: {
              select: { id: true, nama: true },
            },
            scheduleItems: {
              include: {
                mataKuliah: {
                  select: { id: true, nama: true, sks: true, semester: true },
                },
                dosen: {
                  select: { nip: true, nama: true },
                },
                ruangan: {
                  select: {
                    id: true,
                    nama: true,
                    lokasi: true,
                    kapasitas: true,
                  },
                },
              },
              orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
            },
          },
        },
      },
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: "Periode timetable tidak ditemukan",
      });
    }

    const exportData = {
      period: {
        id: period.id,
        semester: period.semester,
        tahunAkademik: period.tahunAkademik,
        status: period.status,
      },
      schedules: period.prodiSchedules.map((schedule) => ({
        prodi: schedule.prodi,
        scheduleItems: schedule.scheduleItems,
      })),
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.username,
    };

    if (format === "json") {
      res.json({
        success: true,
        data: exportData,
      });
    } else {
      // Future: implement other export formats (CSV, Excel, etc.)
      res.status(400).json({
        success: false,
        message: "Format export tidak didukung. Gunakan: json",
      });
    }
  } catch (error) {
    console.error("Error exporting schedules:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengexport jadwal",
      error: error.message,
    });
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Function to check conflicts for specific schedule
async function checkScheduleConflicts(scheduleId) {
  const scheduleItems = await prisma.scheduleItem.findMany({
    where: { prodiScheduleId: scheduleId },
    include: {
      prodiSchedule: {
        include: {
          prodi: { select: { nama: true } },
        },
      },
    },
  });

  const conflicts = [];

  for (const item of scheduleItems) {
    // Check for cross-prodi conflicts
    const crossProdiConflicts = await prisma.scheduleItem.findMany({
      where: {
        prodiSchedule: {
          status: { in: ["APPROVED", "PUBLISHED"] },
          id: { not: scheduleId },
        },
        hari: item.hari,
        OR: [
          // Dosen conflict
          {
            dosenId: item.dosenId,
            OR: [
              {
                AND: [
                  { jamMulai: { lte: item.jamMulai } },
                  { jamSelesai: { gt: item.jamMulai } },
                ],
              },
              {
                AND: [
                  { jamMulai: { lt: item.jamSelesai } },
                  { jamSelesai: { gte: item.jamSelesai } },
                ],
              },
              {
                AND: [
                  { jamMulai: { gte: item.jamMulai } },
                  { jamSelesai: { lte: item.jamSelesai } },
                ],
              },
            ],
          },
          // Ruangan conflict
          {
            ruanganId: item.ruanganId,
            OR: [
              {
                AND: [
                  { jamMulai: { lte: item.jamMulai } },
                  { jamSelesai: { gt: item.jamMulai } },
                ],
              },
              {
                AND: [
                  { jamMulai: { lt: item.jamSelesai } },
                  { jamSelesai: { gte: item.jamSelesai } },
                ],
              },
              {
                AND: [
                  { jamMulai: { gte: item.jamMulai } },
                  { jamSelesai: { lte: item.jamSelesai } },
                ],
              },
            ],
          },
        ],
      },
      include: {
        mataKuliah: { select: { nama: true } },
        dosen: { select: { nama: true } },
        ruangan: { select: { nama: true } },
        prodiSchedule: {
          include: {
            prodi: { select: { nama: true } },
          },
        },
      },
    });

    crossProdiConflicts.forEach((conflict) => {
      let conflictType = "";
      let message = "";

      if (conflict.dosenId === item.dosenId) {
        conflictType = "DOSEN_CONFLICT";
        message = `Dosen ${conflict.dosen.nama} mengajar di 2 prodi pada waktu bersamaan`;
      } else if (conflict.ruanganId === item.ruanganId) {
        conflictType = "RUANGAN_CONFLICT";
        message = `Ruangan ${conflict.ruangan.nama} digunakan 2 prodi pada waktu bersamaan`;
      }

      conflicts.push({
        type: conflictType,
        message,
        schedule1: {
          prodi: item.prodiSchedule.prodi.nama,
          hari: item.hari,
          time: `${item.jamMulai}-${item.jamSelesai}`,
          mataKuliah: item.mataKuliah?.nama,
          dosen: item.dosen?.nama,
          ruangan: item.ruangan?.nama,
        },
        schedule2: {
          prodi: conflict.prodiSchedule.prodi.nama,
          hari: conflict.hari,
          time: `${conflict.jamMulai}-${conflict.jamSelesai}`,
          mataKuliah: conflict.mataKuliah.nama,
          dosen: conflict.dosen.nama,
          ruangan: conflict.ruangan.nama,
        },
      });
    });
  }

  return conflicts;
}

// Function to check global conflicts across all schedules
// Helper function untuk check konflik global
async function checkGlobalConflicts(periodId = null, jurusanId = null) {
  let whereClause = {
    prodiSchedule: {
      status: { in: ["APPROVED", "PUBLISHED"] },
    },
  };

  if (periodId) {
    whereClause.prodiSchedule.timetablePeriodId = periodId;
  }

  // ✅ FILTER BERDASARKAN JURUSAN JIKA ADA
  if (jurusanId) {
    whereClause.prodiSchedule.prodi = {
      jurusanId: jurusanId,
    };
  }

  const allScheduleItems = await prisma.scheduleItem.findMany({
    where: whereClause,
    include: {
      mataKuliah: { select: { nama: true } },
      dosen: { select: { nama: true } },
      ruangan: { select: { nama: true } },
      prodiSchedule: {
        include: {
          prodi: { select: { nama: true } },
        },
      },
    },
  });

  const conflicts = [];
  const processed = new Set();

  for (let i = 0; i < allScheduleItems.length; i++) {
    for (let j = i + 1; j < allScheduleItems.length; j++) {
      const item1 = allScheduleItems[i];
      const item2 = allScheduleItems[j];

      const conflictKey = `${Math.min(item1.id, item2.id)}-${Math.max(item1.id, item2.id)}`;
      if (processed.has(conflictKey)) continue;

      if (item1.hari === item2.hari) {
        const timeOverlap = checkTimeOverlap(
          item1.jamMulai,
          item1.jamSelesai,
          item2.jamMulai,
          item2.jamSelesai,
        );

        if (timeOverlap) {
          let conflictType = "";
          let message = "";

          if (item1.dosenId === item2.dosenId) {
            conflictType = "DOSEN_CONFLICT";
            message = `Dosen ${item1.dosen.nama} mengajar di 2 tempat pada waktu bersamaan`;
          } else if (item1.ruanganId === item2.ruanganId) {
            conflictType = "RUANGAN_CONFLICT";
            message = `Ruangan ${item1.ruangan.nama} digunakan 2 kelas pada waktu bersamaan`;
          }

          if (conflictType) {
            conflicts.push({
              type: conflictType,
              message,
              schedule1: {
                id: item1.id,
                prodi: item1.prodiSchedule.prodi.nama,
                hari: item1.hari,
                time: `${item1.jamMulai}-${item1.jamSelesai}`,
                mataKuliah: item1.mataKuliah.nama,
                dosen: item1.dosen.nama,
                ruangan: item1.ruangan.nama,
              },
              schedule2: {
                id: item2.id,
                prodi: item2.prodiSchedule.prodi.nama,
                hari: item2.hari,
                time: `${item2.jamMulai}-${item2.jamSelesai}`,
                mataKuliah: item2.mataKuliah.nama,
                dosen: item2.dosen.nama,
                ruangan: item2.ruangan.nama,
              },
            });

            processed.add(conflictKey);
          }
        }
      }
    }
  }

  return conflicts;
}

// Function to check if two time ranges overlap
function checkTimeOverlap(start1, end1, start2, end2) {
  const s1 = new Date(`2024-01-01 ${start1}`);
  const e1 = new Date(`2024-01-01 ${end1}`);
  const s2 = new Date(`2024-01-01 ${start2}`);
  const e2 = new Date(`2024-01-01 ${end2}`);

  return s1 < e2 && s2 < e1;
}

module.exports = router;
