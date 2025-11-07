const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// =====================================================
// PRODI SCHEDULES MANAGEMENT ROUTES (KAPRODI)
// =====================================================

// GET /api/prodi-schedules/my-prodi - List jadwal untuk prodi kaprodi yang login
router.get("/my-prodi", async (req, res) => {
  try {
    const kaprodiUsername = req.user.username;

    // Get user's prodi
    const user = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true },
    });

    if (!user || !user.programStudiId) {
      return res.status(400).json({
        success: false,
        message: "User tidak terkait dengan program studi",
      });
    }

    const schedules = await prisma.prodiSchedule.findMany({
      where: {
        prodiId: user.programStudiId,
      },
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
              select: { id: true, nama: true, sks: true, semester: true },
            },
            dosen: {
              select: { nip: true, nama: true },
            },
            ruangan: {
              select: { id: true, nama: true, kapasitas: true, lokasi: true },
            },
          },
          orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
        },
        _count: {
          select: { scheduleItems: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error("Error fetching prodi schedules:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil jadwal prodi",
      error: error.message,
    });
  }
});

// POST /api/prodi-schedules - Buat jadwal baru untuk prodi (KAPRODI only)
router.post("/", async (req, res) => {
  try {
    const { timetablePeriodId } = req.body;
    const kaprodiUsername = req.user.username;

    if (!timetablePeriodId) {
      return res.status(400).json({
        success: false,
        message: "Periode timetable harus dipilih",
      });
    }

    // Get user's prodi
    const user = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true },
    });

    if (!user || !user.programStudiId) {
      return res.status(400).json({
        success: false,
        message: "User tidak terkait dengan program studi",
      });
    }

    // Check if timetable period exists and is active
    const period = await prisma.timetablePeriod.findUnique({
      where: { id: parseInt(timetablePeriodId) },
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: "Periode timetable tidak ditemukan",
      });
    }

    if (period.status === "CLOSED") {
      return res.status(400).json({
        success: false,
        message: "Periode timetable sudah ditutup",
      });
    }

    // Check if schedule already exists for this prodi and period
    const existingSchedule = await prisma.prodiSchedule.findFirst({
      where: {
        timetablePeriodId: parseInt(timetablePeriodId),
        prodiId: user.programStudiId,
      },
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: "Jadwal untuk periode ini sudah ada",
      });
    }

    const newSchedule = await prisma.prodiSchedule.create({
      data: {
        timetablePeriodId: parseInt(timetablePeriodId),
        prodiId: user.programStudiId,
        kaprodiId: kaprodiUsername,
        status: "DRAFT",
      },
      include: {
        timetablePeriod: {
          select: { semester: true, tahunAkademik: true },
        },
        prodi: {
          select: { nama: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Jadwal prodi berhasil dibuat",
      data: newSchedule,
    });
  } catch (error) {
    console.error("Error creating prodi schedule:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat jadwal prodi",
      error: error.message,
    });
  }
});

// GET /api/prodi-schedules/:id - Get detail jadwal prodi
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const kaprodiUsername = req.user.username;

    let whereClause = { id: parseInt(id) };

    // If KAPRODI, only allow access to their own prodi's schedule
    if (userRole === "KAPRODI") {
      const user = await prisma.user.findUnique({
        where: { username: kaprodiUsername },
        select: { programStudiId: true },
      });

      if (user && user.programStudiId) {
        whereClause.prodiId = user.programStudiId;
      }
    }

    const schedule = await prisma.prodiSchedule.findFirst({
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
              select: { id: true, nama: true, sks: true, semester: true },
            },
            dosen: {
              select: { nip: true, nama: true },
            },
            ruangan: {
              select: { id: true, nama: true, kapasitas: true, lokasi: true },
            },
          },
          orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
        },
        revisions: {
          include: {
            createdBySekjur: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { scheduleItems: true },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Jadwal prodi tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("Error fetching prodi schedule detail:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail jadwal prodi",
      error: error.message,
    });
  }
});

// POST /api/prodi-schedules/:id/submit - Submit jadwal ke sekjur untuk approval
router.post("/:id/submit", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const kaprodiUsername = req.user.username;

    // Get user's prodi
    const user = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true },
    });

    // Check if schedule exists and belongs to kaprodi's prodi
    const schedule = await prisma.prodiSchedule.findFirst({
      where: {
        id: parseInt(id),
        prodiId: user.programStudiId,
        kaprodiId: kaprodiUsername,
      },
      include: {
        scheduleItems: true,
        prodi: {
          select: { nama: true },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Check if schedule is in DRAFT status
    if (schedule.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Hanya jadwal dengan status DRAFT yang bisa disubmit",
      });
    }

    // Validate schedule has items
    if (schedule.scheduleItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Jadwal kosong. Tambahkan mata kuliah terlebih dahulu",
      });
    }

    // Check for internal conflicts within the schedule
    const conflicts = await checkInternalConflicts(parseInt(id));
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Terdapat konflik dalam jadwal",
        data: { conflicts },
      });
    }

    const updatedSchedule = await prisma.prodiSchedule.update({
      where: { id: parseInt(id) },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      include: {
        timetablePeriod: {
          select: { semester: true, tahunAkademik: true },
        },
        prodi: {
          select: { nama: true },
        },
      },
    });

    res.json({
      success: true,
      message: "Jadwal berhasil disubmit ke sekjur untuk review",
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error submitting prodi schedule:", error);
    res.status(500).json({
      success: false,
      message: "Gagal submit jadwal",
      error: error.message,
    });
  }
});

// PUT /api/prodi-schedules/:id - Update jadwal (KAPRODI only, DRAFT status only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const kaprodiUsername = req.user.username;

    // Get user's prodi
    const user = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true },
    });

    // Check if schedule exists and belongs to kaprodi's prodi
    const schedule = await prisma.prodiSchedule.findFirst({
      where: {
        id: parseInt(id),
        prodiId: user.programStudiId,
        kaprodiId: kaprodiUsername,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Check if schedule is editable
    if (!["DRAFT", "REJECTED"].includes(schedule.status)) {
      return res.status(400).json({
        success: false,
        message: "Jadwal hanya bisa diedit ketika status DRAFT atau REJECTED",
      });
    }

    // Update status to DRAFT if it was REJECTED
    const updateData = {};
    if (schedule.status === "REJECTED") {
      updateData.status = "DRAFT";
      updateData.sekjurNotes = null;
    }

    const updatedSchedule = await prisma.prodiSchedule.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        timetablePeriod: {
          select: { semester: true, tahunAkademik: true },
        },
        prodi: {
          select: { nama: true },
        },
      },
    });

    res.json({
      success: true,
      message: "Jadwal berhasil diupdate",
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error updating prodi schedule:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengupdate jadwal",
      error: error.message,
    });
  }
});

// DELETE /api/prodi-schedules/:id - Delete/Cancel jadwal (KAPRODI only)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const kaprodiUsername = req.user.username;

    // Get user's prodi
    const user = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true },
    });

    // Check if schedule exists and belongs to kaprodi's prodi
    const schedule = await prisma.prodiSchedule.findFirst({
      where: {
        id: parseInt(id),
        prodiId: user.programStudiId,
        kaprodiId: kaprodiUsername,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Handle different statuses
    if (schedule.status === "SUBMITTED" || schedule.status === "UNDER_REVIEW") {
      // Cancel submission - convert back to DRAFT
      const updatedSchedule = await prisma.prodiSchedule.update({
        where: { id: parseInt(id) },
        data: {
          status: "DRAFT",
          submittedAt: null,
          sekjurNotes: null,
        },
      });

      return res.json({
        success: true,
        message:
          "Pengajuan jadwal berhasil dibatalkan dan dikembalikan ke status DRAFT",
        data: updatedSchedule,
      });
    } else {
      // Delete schedule completely (all statuses: DRAFT, REJECTED, APPROVED, PUBLISHED)
      await prisma.prodiSchedule.delete({
        where: { id: parseInt(id) },
      });

      return res.json({
        success: true,
        message: "Jadwal berhasil dihapus",
      });
    }
  } catch (error) {
    console.error("Error deleting prodi schedule:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus jadwal",
      error: error.message,
    });
  }
});

// =====================================================
// SCHEDULE ITEMS MANAGEMENT
// =====================================================

// GET /api/prodi-schedules/:id/items - List schedule items
router.get("/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const username = req.user.username;

    let whereClause = { prodiScheduleId: parseInt(id) };

    // Access control for KAPRODI
    if (userRole === "KAPRODI") {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { programStudiId: true },
      });

      // Verify schedule belongs to kaprodi's prodi
      const schedule = await prisma.prodiSchedule.findFirst({
        where: {
          id: parseInt(id),
          prodiId: user.programStudiId,
        },
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Jadwal tidak ditemukan",
        });
      }
    }

    const scheduleItems = await prisma.scheduleItem.findMany({
      where: whereClause,
      include: {
        mataKuliah: {
          select: { id: true, nama: true, sks: true, semester: true },
        },
        dosen: {
          select: { nip: true, nama: true },
        },
        ruangan: {
          select: { id: true, nama: true, kapasitas: true, lokasi: true },
        },
      },
      orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
    });

    res.json({
      success: true,
      data: scheduleItems,
    });
  } catch (error) {
    console.error("Error fetching schedule items:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil item jadwal",
      error: error.message,
    });
  }
});

// POST /api/prodi-schedules/:id/items - Add schedule item (KAPRODI only)
router.post("/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mataKuliahId,
      dosenId,
      hari,
      jamMulai,
      jamSelesai,
      ruanganId,
      kelas,
      kapasitasMahasiswa,
    } = req.body;
    const kaprodiUsername = req.user.username;

    // Validate required fields
    if (
      !mataKuliahId ||
      !dosenId ||
      !hari ||
      !jamMulai ||
      !jamSelesai ||
      !ruanganId
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib harus diisi",
      });
    }

    // Get user's prodi and verify schedule access
    const user = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true },
    });

    const schedule = await prisma.prodiSchedule.findFirst({
      where: {
        id: parseInt(id),
        prodiId: user.programStudiId,
        kaprodiId: kaprodiUsername,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan atau tidak memiliki akses",
      });
    }

    // Check if schedule is editable
    if (!["DRAFT", "REJECTED"].includes(schedule.status)) {
      return res.status(400).json({
        success: false,
        message: "Jadwal hanya bisa diedit ketika status DRAFT atau REJECTED",
      });
    }

    // Validate mata kuliah belongs to the prodi
    const mataKuliah = await prisma.mataKuliah.findFirst({
      where: {
        id: parseInt(mataKuliahId),
        programStudiId: user.programStudiId,
      },
    });

    if (!mataKuliah) {
      return res.status(400).json({
        success: false,
        message:
          "Mata kuliah tidak ditemukan atau tidak termasuk dalam prodi ini",
      });
    }

    // Validate dosen belongs to the prodi
    const dosen = await prisma.dosen.findFirst({
      where: {
        nip: dosenId,
        prodiId: user.programStudiId,
      },
    });

    if (!dosen) {
      return res.status(400).json({
        success: false,
        message: "Dosen tidak ditemukan atau tidak termasuk dalam prodi ini",
      });
    }

    // Validate ruangan exists and active
    const ruangan = await prisma.ruangan.findFirst({
      where: {
        id: parseInt(ruanganId),
        isActive: true,
      },
    });

    if (!ruangan) {
      return res.status(400).json({
        success: false,
        message: "Ruangan tidak ditemukan atau tidak aktif",
      });
    }

    // Check for conflicts within this schedule
    const internalConflicts = await prisma.scheduleItem.findMany({
      where: {
        prodiScheduleId: parseInt(id),
        hari,
        OR: [
          // Dosen conflict
          {
            dosenId,
            OR: [
              {
                AND: [
                  { jamMulai: { lte: jamMulai } },
                  { jamSelesai: { gt: jamMulai } },
                ],
              },
              {
                AND: [
                  { jamMulai: { lt: jamSelesai } },
                  { jamSelesai: { gte: jamSelesai } },
                ],
              },
              {
                AND: [
                  { jamMulai: { gte: jamMulai } },
                  { jamSelesai: { lte: jamSelesai } },
                ],
              },
            ],
          },
          // Ruangan conflict
          {
            ruanganId: parseInt(ruanganId),
            OR: [
              {
                AND: [
                  { jamMulai: { lte: jamMulai } },
                  { jamSelesai: { gt: jamMulai } },
                ],
              },
              {
                AND: [
                  { jamMulai: { lt: jamSelesai } },
                  { jamSelesai: { gte: jamSelesai } },
                ],
              },
              {
                AND: [
                  { jamMulai: { gte: jamMulai } },
                  { jamSelesai: { lte: jamSelesai } },
                ],
              },
            ],
          },
        ],
      },
    });

    if (internalConflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Terdapat konflik waktu dengan jadwal yang sudah ada",
        data: { conflicts: internalConflicts },
      });
    }

    const newScheduleItem = await prisma.scheduleItem.create({
      data: {
        prodiScheduleId: parseInt(id),
        mataKuliahId: parseInt(mataKuliahId),
        dosenId,
        hari,
        jamMulai,
        jamSelesai,
        ruanganId: parseInt(ruanganId),
        kelas: kelas || null,
        kapasitasMahasiswa: kapasitasMahasiswa
          ? parseInt(kapasitasMahasiswa)
          : null,
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

    res.status(201).json({
      success: true,
      message: "Item jadwal berhasil ditambahkan",
      data: newScheduleItem,
    });
  } catch (error) {
    console.error("Error creating schedule item:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan item jadwal",
      error: error.message,
    });
  }
});

// PUT /api/prodi-schedules/items/:itemId - Update schedule item (KAPRODI only)
router.put("/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      mataKuliahId,
      dosenId,
      hari,
      jamMulai,
      jamSelesai,
      ruanganId,
      kelas,
      kapasitasMahasiswa,
    } = req.body;
    const kaprodiUsername = req.user.username;

    // Get user's prodi
    const user = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true },
    });

    // Check if schedule item exists and verify access
    const scheduleItem = await prisma.scheduleItem.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        prodiSchedule: {
          select: {
            id: true,
            status: true,
            prodiId: true,
            kaprodiId: true,
          },
        },
      },
    });

    if (!scheduleItem) {
      return res.status(404).json({
        success: false,
        message: "Item jadwal tidak ditemukan",
      });
    }

    // Verify access
    if (
      scheduleItem.prodiSchedule.prodiId !== user.programStudiId ||
      scheduleItem.prodiSchedule.kaprodiId !== kaprodiUsername
    ) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk mengedit item jadwal ini",
      });
    }

    // Check if schedule is editable
    if (!["DRAFT", "REJECTED"].includes(scheduleItem.prodiSchedule.status)) {
      return res.status(400).json({
        success: false,
        message: "Jadwal hanya bisa diedit ketika status DRAFT atau REJECTED",
      });
    }

    // Build update data
    const updateData = {};
    if (mataKuliahId !== undefined)
      updateData.mataKuliahId = parseInt(mataKuliahId);
    if (dosenId !== undefined) updateData.dosenId = dosenId;
    if (hari !== undefined) updateData.hari = hari;
    if (jamMulai !== undefined) updateData.jamMulai = jamMulai;
    if (jamSelesai !== undefined) updateData.jamSelesai = jamSelesai;
    if (ruanganId !== undefined) updateData.ruanganId = parseInt(ruanganId);
    if (kelas !== undefined) updateData.kelas = kelas || null;
    if (kapasitasMahasiswa !== undefined)
      updateData.kapasitasMahasiswa = kapasitasMahasiswa
        ? parseInt(kapasitasMahasiswa)
        : null;

    // Check conflicts if time/dosen/ruangan is being updated
    if (
      hari !== undefined ||
      jamMulai !== undefined ||
      jamSelesai !== undefined ||
      dosenId !== undefined ||
      ruanganId !== undefined
    ) {
      const checkHari = hari || scheduleItem.hari;
      const checkJamMulai = jamMulai || scheduleItem.jamMulai;
      const checkJamSelesai = jamSelesai || scheduleItem.jamSelesai;
      const checkDosenId = dosenId || scheduleItem.dosenId;
      const checkRuanganId = ruanganId
        ? parseInt(ruanganId)
        : scheduleItem.ruanganId;

      const conflicts = await prisma.scheduleItem.findMany({
        where: {
          prodiScheduleId: scheduleItem.prodiSchedule.id,
          id: { not: parseInt(itemId) },
          hari: checkHari,
          OR: [
            // Dosen conflict
            {
              dosenId: checkDosenId,
              OR: [
                {
                  AND: [
                    { jamMulai: { lte: checkJamMulai } },
                    { jamSelesai: { gt: checkJamMulai } },
                  ],
                },
                {
                  AND: [
                    { jamMulai: { lt: checkJamSelesai } },
                    { jamSelesai: { gte: checkJamSelesai } },
                  ],
                },
                {
                  AND: [
                    { jamMulai: { gte: checkJamMulai } },
                    { jamSelesai: { lte: checkJamSelesai } },
                  ],
                },
              ],
            },
            // Ruangan conflict
            {
              ruanganId: checkRuanganId,
              OR: [
                {
                  AND: [
                    { jamMulai: { lte: checkJamMulai } },
                    { jamSelesai: { gt: checkJamMulai } },
                  ],
                },
                {
                  AND: [
                    { jamMulai: { lt: checkJamSelesai } },
                    { jamSelesai: { gte: checkJamSelesai } },
                  ],
                },
                {
                  AND: [
                    { jamMulai: { gte: checkJamMulai } },
                    { jamSelesai: { lte: checkJamSelesai } },
                  ],
                },
              ],
            },
          ],
        },
      });

      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Terdapat konflik waktu dengan jadwal yang sudah ada",
          data: { conflicts },
        });
      }
    }

    const updatedScheduleItem = await prisma.scheduleItem.update({
      where: { id: parseInt(itemId) },
      data: updateData,
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

    res.json({
      success: true,
      message: "Item jadwal berhasil diupdate",
      data: updatedScheduleItem,
    });
  } catch (error) {
    console.error("Error updating schedule item:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengupdate item jadwal",
      error: error.message,
    });
  }
});

// DELETE /api/prodi-schedules/items/:itemId - Delete schedule item (KAPRODI only)
router.delete("/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const kaprodiUsername = req.user.username;

    // Get user's prodi
    const user = await prisma.user.findUnique({
      where: { username: kaprodiUsername },
      select: { programStudiId: true },
    });

    // Check if schedule item exists and verify access
    const scheduleItem = await prisma.scheduleItem.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        prodiSchedule: {
          select: {
            status: true,
            prodiId: true,
            kaprodiId: true,
          },
        },
      },
    });

    if (!scheduleItem) {
      return res.status(404).json({
        success: false,
        message: "Item jadwal tidak ditemukan",
      });
    }

    // Verify access
    if (
      scheduleItem.prodiSchedule.prodiId !== user.programStudiId ||
      scheduleItem.prodiSchedule.kaprodiId !== kaprodiUsername
    ) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk menghapus item jadwal ini",
      });
    }

    // Check if schedule is editable
    if (!["DRAFT", "REJECTED"].includes(scheduleItem.prodiSchedule.status)) {
      return res.status(400).json({
        success: false,
        message: "Jadwal hanya bisa diedit ketika status DRAFT atau REJECTED",
      });
    }

    await prisma.scheduleItem.delete({
      where: { id: parseInt(itemId) },
    });

    res.json({
      success: true,
      message: "Item jadwal berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting schedule item:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus item jadwal",
      error: error.message,
    });
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Function to check internal conflicts within a schedule
async function checkInternalConflicts(scheduleId) {
  const scheduleItems = await prisma.scheduleItem.findMany({
    where: { prodiScheduleId: scheduleId },
    include: {
      mataKuliah: { select: { nama: true } },
      dosen: { select: { nama: true } },
      ruangan: { select: { nama: true } },
    },
  });

  const conflicts = [];

  for (let i = 0; i < scheduleItems.length; i++) {
    for (let j = i + 1; j < scheduleItems.length; j++) {
      const item1 = scheduleItems[i];
      const item2 = scheduleItems[j];

      if (item1.hari === item2.hari) {
        const timeOverlap = checkTimeOverlap(
          item1.jamMulai,
          item1.jamSelesai,
          item2.jamMulai,
          item2.jamSelesai,
        );

        if (timeOverlap) {
          if (item1.dosenId === item2.dosenId) {
            conflicts.push({
              type: "DOSEN_CONFLICT",
              message: `Dosen ${item1.dosen.nama} mengajar di 2 tempat pada waktu bersamaan`,
              items: [
                {
                  id: item1.id,
                  mataKuliah: item1.mataKuliah.nama,
                  time: `${item1.jamMulai}-${item1.jamSelesai}`,
                },
                {
                  id: item2.id,
                  mataKuliah: item2.mataKuliah.nama,
                  time: `${item2.jamMulai}-${item2.jamSelesai}`,
                },
              ],
            });
          }

          if (item1.ruanganId === item2.ruanganId) {
            conflicts.push({
              type: "RUANGAN_CONFLICT",
              message: `Ruangan ${item1.ruangan.nama} digunakan 2 kelas pada waktu bersamaan`,
              items: [
                {
                  id: item1.id,
                  mataKuliah: item1.mataKuliah.nama,
                  time: `${item1.jamMulai}-${item1.jamSelesai}`,
                },
                {
                  id: item2.id,
                  mataKuliah: item2.mataKuliah.nama,
                  time: `${item2.jamMulai}-${item2.jamSelesai}`,
                },
              ],
            });
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
