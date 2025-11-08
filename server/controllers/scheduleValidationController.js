const scheduleValidator = require('../services/scheduleValidator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * ========================================
 * SCHEDULE VALIDATION CONTROLLER
 * ========================================
 * Controller untuk menangani semua validasi jadwal
 */

// Async handler wrapper untuk mengurangi duplikasi try-catch
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(error => {
    console.error(`Error in ${fn.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  });
};

// Helper untuk response sukses
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

// Helper untuk response error
const sendError = (res, message, statusCode = 400, error = null) => {
  const response = { success: false, message };
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

/**
 * Validasi single schedule item sebelum dibuat/diupdate
 * POST /api/schedule-validation/validate-item
 */
exports.validateScheduleItem = asyncHandler(async (req, res) => {
  const {
    dosenId, ruanganId, mataKuliahId, hari, jamMulai, jamSelesai,
    prodiScheduleId, kapasitasMahasiswa, excludeItemId
  } = req.body;

  // Validasi input required
  if (!dosenId || !ruanganId || !mataKuliahId || !hari || !jamMulai || !jamSelesai || !prodiScheduleId) {
    return sendError(res, 'Data tidak lengkap. Semua field wajib diisi');
  }

  const validation = await scheduleValidator.validateScheduleItem({
    dosenId, ruanganId, mataKuliahId, hari, jamMulai, jamSelesai,
    prodiScheduleId, kapasitasMahasiswa
  }, excludeItemId);

  // Log conflicts to database
  if (!validation.valid) {
    await Promise.all(validation.errors.map(error =>
      scheduleValidator.logConflict({
        type: error.type,
        message: error.message,
        details: error.details,
        severity: 'HIGH'
      })
    ));
  }

  return res.status(validation.valid ? 200 : 400).json({
    success: validation.valid,
    message: validation.valid ? 'Jadwal valid, tidak ada konflik' : 'Jadwal memiliki konflik atau masalah',
    data: { valid: validation.valid, errors: validation.errors, warnings: validation.warnings }
  });
});

/**
 * Validasi keseluruhan jadwal prodi
 * GET /api/schedule-validation/validate-schedule/:scheduleId
 */
exports.validateCompleteSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  if (!scheduleId) return sendError(res, 'Schedule ID diperlukan');

  const schedule = await prisma.prodiSchedule.findUnique({
    where: { id: parseInt(scheduleId) },
    include: {
      prodi: { select: { nama: true } },
      timetablePeriod: { select: { tahunAkademik: true, semester: true } }
    }
  });

  if (!schedule) return sendError(res, 'Jadwal tidak ditemukan', 404);

  const validation = await scheduleValidator.validateCompleteSchedule(parseInt(scheduleId));

  return sendSuccess(res,
    validation.valid ? 'Semua jadwal valid' : `Ditemukan ${validation.errors.length} konflik`,
    {
      schedule: {
        id: schedule.id,
        prodi: schedule.prodi.nama,
        kelas: schedule.kelas,
        periode: `${schedule.timetablePeriod.semester} ${schedule.timetablePeriod.tahunAkademik}`
      },
      validation
    }
  );
});

/**
 * Cek konflik dosen
 * POST /api/schedule-validation/check-dosen-conflict
 */
exports.checkDosenConflict = asyncHandler(async (req, res) => {
  const { dosenId, hari, jamMulai, jamSelesai, prodiScheduleId, excludeItemId } = req.body;

  if (!dosenId || !hari || !jamMulai || !jamSelesai || !prodiScheduleId) {
    return sendError(res, 'Data tidak lengkap');
  }

  const result = await scheduleValidator.checkDosenConflict(
    dosenId, hari, jamMulai, jamSelesai, prodiScheduleId, excludeItemId
  );

  return sendSuccess(res, 'Data berhasil diambil', result);
});

/**
 * Cek konflik ruangan
 * POST /api/schedule-validation/check-ruangan-conflict
 */
exports.checkRuanganConflict = asyncHandler(async (req, res) => {
  const { ruanganId, hari, jamMulai, jamSelesai, prodiScheduleId, excludeItemId } = req.body;

  if (!ruanganId || !hari || !jamMulai || !jamSelesai || !prodiScheduleId) {
    return sendError(res, 'Data tidak lengkap');
  }

  const result = await scheduleValidator.checkRuanganConflict(
    ruanganId, hari, jamMulai, jamSelesai, prodiScheduleId, excludeItemId
  );

  return sendSuccess(res, 'Data berhasil diambil', result);
});

/**
 * Cek konflik mahasiswa
 * POST /api/schedule-validation/check-mahasiswa-conflict
 */
exports.checkMahasiswaConflict = asyncHandler(async (req, res) => {
  const { prodiScheduleId, hari, jamMulai, jamSelesai, excludeItemId } = req.body;

  if (!prodiScheduleId || !hari || !jamMulai || !jamSelesai) {
    return sendError(res, 'Data tidak lengkap');
  }

  const result = await scheduleValidator.checkMahasiswaConflict(
    prodiScheduleId, hari, jamMulai, jamSelesai, excludeItemId
  );

  return sendSuccess(res, 'Data berhasil diambil', result);
});

/**
 * Cek beban kerja dosen
 * GET /api/schedule-validation/dosen-workload/:dosenId/:tahunAkademik/:semester
 */
exports.getDosenWorkload = asyncHandler(async (req, res) => {
  const { dosenId, tahunAkademik, semester } = req.params;

  if (!dosenId || !tahunAkademik || !semester) {
    return sendError(res, 'Data tidak lengkap');
  }

  const workload = await scheduleValidator.calculateDosenWorkload(dosenId, tahunAkademik, semester);
  return sendSuccess(res, 'Beban kerja berhasil dihitung', workload);
});

/**
 * Dapatkan ruangan yang tersedia
 * POST /api/schedule-validation/available-rooms
 */
exports.getAvailableRooms = asyncHandler(async (req, res) => {
  const { hari, jamMulai, jamSelesai, minCapacity, excludeItemId } = req.body;

  if (!hari || !jamMulai || !jamSelesai) {
    return sendError(res, 'Hari, jam mulai, dan jam selesai harus diisi');
  }

  const result = await scheduleValidator.getAvailableRooms(
    hari, jamMulai, jamSelesai, minCapacity || 0, excludeItemId
  );

  return sendSuccess(res, `Ditemukan ${result.total} ruangan tersedia`, result);
});

/**
 * Dapatkan slot waktu yang tersedia untuk dosen
 * GET /api/schedule-validation/available-slots/:dosenId/:hari
 */
exports.getAvailableTimeSlots = asyncHandler(async (req, res) => {
  const { dosenId, hari } = req.params;

  if (!dosenId || !hari) {
    return sendError(res, 'Dosen ID dan hari harus diisi');
  }

  const result = await scheduleValidator.getAvailableTimeSlots(dosenId, hari);
  return sendSuccess(res, 'Slot waktu berhasil diambil', result);
});

/**
 * Generate laporan konflik untuk periode tertentu
 * GET /api/schedule-validation/conflict-report/:periodId
 */
exports.generateConflictReport = asyncHandler(async (req, res) => {
  const { periodId } = req.params;
  if (!periodId) return sendError(res, 'Period ID diperlukan');

  const report = await scheduleValidator.generateConflictReport(parseInt(periodId));
  return sendSuccess(res, 'Laporan konflik berhasil dibuat', report);
});

/**
 * Dapatkan semua log konflik
 * GET /api/schedule-validation/conflict-logs
 */
exports.getConflictLogs = asyncHandler(async (req, res) => {
  const { conflictType, severity, resolved, limit = 50, offset = 0 } = req.query;

  const whereClause = {};
  if (conflictType) whereClause.conflictType = conflictType;
  if (severity) whereClause.severity = severity;
  if (resolved === 'true') whereClause.resolvedAt = { not: null };
  else if (resolved === 'false') whereClause.resolvedAt = null;

  const [logs, total] = await Promise.all([
    prisma.scheduleConflictLog.findMany({
      where: whereClause,
      orderBy: { detectedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.scheduleConflictLog.count({ where: whereClause })
  ]);

  return sendSuccess(res, 'Log konflik berhasil diambil', {
    logs,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: total > (parseInt(offset) + parseInt(limit))
    }
  });
});

/**
 * Resolve/tandai konflik sudah diselesaikan
 * PUT /api/schedule-validation/resolve-conflict/:conflictId
 */
exports.resolveConflict = asyncHandler(async (req, res) => {
  const { conflictId } = req.params;
  const { resolvedBy, notes } = req.body;

  if (!conflictId) return sendError(res, 'Conflict ID diperlukan');

  const updatedLog = await prisma.scheduleConflictLog.update({
    where: { id: parseInt(conflictId) },
    data: {
      resolvedAt: new Date(),
      resolvedBy: resolvedBy || 'system',
      notes: notes || null
    }
  });

  return sendSuccess(res, 'Konflik berhasil ditandai sebagai resolved', updatedLog);
});

/**
 * Dapatkan statistik konflik
 * GET /api/schedule-validation/conflict-stats
 */
exports.getConflictStatistics = asyncHandler(async (req, res) => {
  const whereClause = {};

  const [totalConflicts, unresolvedConflicts, conflictsByType, conflictsBySeverity, recentConflicts] = await Promise.all([
    prisma.scheduleConflictLog.count({ where: whereClause }),
    prisma.scheduleConflictLog.count({ where: { ...whereClause, resolvedAt: null } }),
    prisma.scheduleConflictLog.groupBy({ by: ['conflictType'], _count: true, where: whereClause }),
    prisma.scheduleConflictLog.groupBy({ by: ['severity'], _count: true, where: whereClause }),
    prisma.scheduleConflictLog.findMany({
      where: { ...whereClause, resolvedAt: null },
      orderBy: { detectedAt: 'desc' },
      take: 10,
      select: { id: true, conflictType: true, description: true, severity: true, detectedAt: true }
    })
  ]);

  const stats = {
    total: totalConflicts,
    unresolved: unresolvedConflicts,
    resolved: totalConflicts - unresolvedConflicts,
    byType: conflictsByType.reduce((acc, item) => { acc[item.conflictType] = item._count; return acc; }, {}),
    bySeverity: conflictsBySeverity.reduce((acc, item) => { acc[item.severity] = item._count; return acc; }, {}),
    recent: recentConflicts
  };

  return sendSuccess(res, 'Statistik konflik berhasil diambil', stats);
});

/**
 * Batch validation - validasi multiple schedule items sekaligus
 * POST /api/schedule-validation/batch-validate
 */
exports.batchValidateItems = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return sendError(res, 'Array items diperlukan');
  }

  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const item of items) {
    const validation = await scheduleValidator.validateScheduleItem(item, item.excludeItemId);

    results.push({
      item: {
        dosenId: item.dosenId,
        mataKuliahId: item.mataKuliahId,
        hari: item.hari,
        jamMulai: item.jamMulai,
        jamSelesai: item.jamSelesai
      },
      validation: validation
    });

    totalErrors += validation.errors.length;
    totalWarnings += validation.warnings.length;
  }

  const allValid = results.every(r => r.validation.valid);

  return sendSuccess(res,
    allValid ? 'Semua item valid' : `Ditemukan ${totalErrors} error dan ${totalWarnings} warning`,
    {
      allValid: allValid,
      totalItems: items.length,
      totalErrors: totalErrors,
      totalWarnings: totalWarnings,
      results: results
    }
  );
});

/**
 * Dapatkan jadwal mengajar dosen (untuk view dosen sendiri)
 * GET /api/schedule-validation/my-teaching-schedule
 */
exports.getMyTeachingSchedule = async (req, res) => {
  try {
    const { username, role } = req.user;

    // Hanya dosen yang bisa akses
    if (role !== 'DOSEN') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya dosen yang bisa melihat jadwal mengajar.'
      });
    }

    // Username dosen adalah NIP
    const dosenNip = username;

    // Get dosen info
    const dosen = await prisma.dosen.findUnique({
      where: { nip: dosenNip },
      select: {
        nip: true,
        nama: true,
        prodiId: true,
        maxSKSPerSemester: true,
        prodi: {
          select: { nama: true }
        }
      }
    });

    if (!dosen) {
      return res.status(404).json({
        success: false,
        message: 'Data dosen tidak ditemukan'
      });
    }

    // Get all schedule items untuk dosen ini
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        dosenId: dosenNip,
        prodiSchedule: {
          status: {
            in: ['APPROVED', 'PUBLISHED']
          }
        }
      },
      include: {
        mataKuliah: {
          select: {
            id: true,
            nama: true,
            sks: true,
            semester: true
          }
        },
        ruangan: {
          select: {
            id: true,
            nama: true,
            kapasitas: true,
            lokasi: true,
            fasilitas: true
          }
        },
        prodiSchedule: {
          select: {
            id: true,
            kelas: true,
            status: true,
            timetablePeriod: {
              select: {
                id: true,
                semester: true,
                tahunAkademik: true,
                status: true
              }
            },
            prodi: {
              select: {
                id: true,
                nama: true
              }
            }
          }
        }
      },
      orderBy: [
        { prodiSchedule: { timetablePeriod: { tahunAkademik: 'desc' } } },
        { hari: 'asc' },
        { jamMulai: 'asc' }
      ]
    });

    // Group by periode
    const scheduleByPeriod = {};
    const scheduleByDay = {
      SENIN: [],
      SELASA: [],
      RABU: [],
      KAMIS: [],
      JUMAT: [],
      SABTU: []
    };

    scheduleItems.forEach(item => {
      const period = item.prodiSchedule.timetablePeriod;
      const periodKey = `${period.semester} ${period.tahunAkademik}`;

      if (!scheduleByPeriod[periodKey]) {
        scheduleByPeriod[periodKey] = {
          periodId: period.id,
          semester: period.semester,
          tahunAkademik: period.tahunAkademik,
          status: period.status,
          totalSKS: 0,
          totalJamMengajar: 0,
          totalMataKuliah: new Set(),
          schedules: []
        };
      }

      // Hitung durasi
      const start = new Date(`2024-01-01 ${item.jamMulai}`);
      const end = new Date(`2024-01-01 ${item.jamSelesai}`);
      const durasiMenit = (end - start) / (1000 * 60);

      const scheduleDetail = {
        id: item.id,
        hari: item.hari,
        jamMulai: item.jamMulai,
        jamSelesai: item.jamSelesai,
        durasi: durasiMenit,
        mataKuliah: {
          id: item.mataKuliah.id,
          nama: item.mataKuliah.nama,
          sks: item.mataKuliah.sks,
          semester: item.mataKuliah.semester
        },
        ruangan: {
          id: item.ruangan.id,
          nama: item.ruangan.nama,
          kapasitas: item.ruangan.kapasitas,
          lokasi: item.ruangan.lokasi,
          fasilitas: item.ruangan.fasilitas
        },
        kelas: item.prodiSchedule.kelas,
        prodi: item.prodiSchedule.prodi.nama,
        kapasitasMahasiswa: item.kapasitasMahasiswa
      };

      scheduleByPeriod[periodKey].schedules.push(scheduleDetail);
      scheduleByPeriod[periodKey].totalSKS += item.mataKuliah.sks;
      scheduleByPeriod[periodKey].totalJamMengajar += durasiMenit;
      scheduleByPeriod[periodKey].totalMataKuliah.add(item.mataKuliahId);

      // Group by day untuk view kalender
      if (scheduleByDay[item.hari]) {
        scheduleByDay[item.hari].push(scheduleDetail);
      }
    });

    // Convert Set to count
    Object.keys(scheduleByPeriod).forEach(key => {
      scheduleByPeriod[key].totalMataKuliah = scheduleByPeriod[key].totalMataKuliah.size;
    });

    // Summary
    const summary = {
      totalScheduleItems: scheduleItems.length,
      totalPeriods: Object.keys(scheduleByPeriod).length,
      currentPeriod: Object.keys(scheduleByPeriod)[0] || null,
      maxSKSPerSemester: dosen.maxSKSPerSemester
    };

    return res.json({
      success: true,
      message: 'Jadwal mengajar berhasil diambil',
      data: {
        dosen: {
          nip: dosen.nip,
          nama: dosen.nama,
          prodi: dosen.prodi.nama,
          maxSKS: dosen.maxSKSPerSemester
        },
        summary: summary,
        scheduleByPeriod: scheduleByPeriod,
        scheduleByDay: scheduleByDay
      }
    });

  } catch (error) {
    console.error('Error in getMyTeachingSchedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil jadwal mengajar',
      error: error.message
    });
  }
};

/**
 * Export jadwal mengajar dosen ke format yang mudah dibaca
 * GET /api/schedule-validation/my-teaching-schedule/export
 */
exports.exportMyTeachingSchedule = async (req, res) => {
  try {
    const { username, role } = req.user;
    const { format = 'json', periodId } = req.query;

    if (role !== 'DOSEN') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }

    const dosenNip = username;

    const dosen = await prisma.dosen.findUnique({
      where: { nip: dosenNip },
      select: { nip: true, nama: true, prodi: { select: { nama: true } } }
    });

    const whereClause = {
      dosenId: dosenNip,
      prodiSchedule: {
        status: { in: ['APPROVED', 'PUBLISHED'] }
      }
    };

    if (periodId) {
      whereClause.prodiSchedule.timetablePeriodId = parseInt(periodId);
    }

    const scheduleItems = await prisma.scheduleItem.findMany({
      where: whereClause,
      include: {
        mataKuliah: { select: { nama: true, sks: true } },
        ruangan: { select: { nama: true, lokasi: true } },
        prodiSchedule: {
          select: {
            kelas: true,
            timetablePeriod: {
              select: { semester: true, tahunAkademik: true }
            },
            prodi: { select: { nama: true } }
          }
        }
      },
      orderBy: [
        { hari: 'asc' },
        { jamMulai: 'asc' }
      ]
    });

    // Format untuk print/export
    const exportData = {
      dosen: {
        nip: dosen.nip,
        nama: dosen.nama,
        prodi: dosen.prodi.nama
      },
      generatedAt: new Date().toISOString(),
      totalJadwal: scheduleItems.length,
      jadwal: scheduleItems.map(item => ({
        periode: `${item.prodiSchedule.timetablePeriod.semester} ${item.prodiSchedule.timetablePeriod.tahunAkademik}`,
        hari: item.hari,
        waktu: `${item.jamMulai} - ${item.jamSelesai}`,
        mataKuliah: item.mataKuliah.nama,
        sks: item.mataKuliah.sks,
        kelas: item.prodiSchedule.kelas,
        prodi: item.prodiSchedule.prodi.nama,
        ruangan: item.ruangan.nama,
        lokasi: item.ruangan.lokasi
      }))
    };

    return res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Error in exportMyTeachingSchedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat export jadwal',
      error: error.message
    });
  }
};
