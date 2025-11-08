const express = require('express');
const router = express.Router();
const scheduleValidationController = require('../controllers/scheduleValidationController');
const { authenticateToken } = require('./auth');

/**
 * ========================================
 * SCHEDULE VALIDATION ROUTES
 * ========================================
 * Routes untuk validasi jadwal perkuliahan
 * Semua routes memerlukan autentikasi
 */

// ========================================
// VALIDATION ENDPOINTS
// ========================================

/**
 * POST /api/schedule-validation/validate-item
 * Validasi single schedule item sebelum create/update
 * Body: {
 *   dosenId, ruanganId, mataKuliahId, hari,
 *   jamMulai, jamSelesai, prodiScheduleId,
 *   kapasitasMahasiswa?, excludeItemId?
 * }
 */
router.post(
  '/validate-item',
  authenticateToken,
  scheduleValidationController.validateScheduleItem
);

/**
 * GET /api/schedule-validation/validate-schedule/:scheduleId
 * Validasi keseluruhan jadwal prodi
 */
router.get(
  '/validate-schedule/:scheduleId',
  authenticateToken,
  scheduleValidationController.validateCompleteSchedule
);

/**
 * POST /api/schedule-validation/batch-validate
 * Validasi multiple items sekaligus
 * Body: { items: [...] }
 */
router.post(
  '/batch-validate',
  authenticateToken,
  scheduleValidationController.batchValidateItems
);

// ========================================
// CONFLICT CHECK ENDPOINTS
// ========================================

/**
 * POST /api/schedule-validation/check-dosen-conflict
 * Cek konflik dosen pada waktu tertentu
 */
router.post(
  '/check-dosen-conflict',
  authenticateToken,
  scheduleValidationController.checkDosenConflict
);

/**
 * POST /api/schedule-validation/check-ruangan-conflict
 * Cek konflik ruangan pada waktu tertentu
 */
router.post(
  '/check-ruangan-conflict',
  authenticateToken,
  scheduleValidationController.checkRuanganConflict
);

/**
 * POST /api/schedule-validation/check-mahasiswa-conflict
 * Cek konflik mahasiswa pada waktu tertentu
 */
router.post(
  '/check-mahasiswa-conflict',
  authenticateToken,
  scheduleValidationController.checkMahasiswaConflict
);

// ========================================
// WORKLOAD & AVAILABILITY ENDPOINTS
// ========================================

/**
 * GET /api/schedule-validation/dosen-workload/:dosenId/:tahunAkademik/:semester
 * Dapatkan beban kerja dosen untuk periode tertentu
 */
router.get(
  '/dosen-workload/:dosenId/:tahunAkademik/:semester',
  authenticateToken,
  scheduleValidationController.getDosenWorkload
);

/**
 * POST /api/schedule-validation/available-rooms
 * Dapatkan ruangan yang tersedia pada waktu tertentu
 * Body: { hari, jamMulai, jamSelesai, minCapacity?, excludeItemId? }
 */
router.post(
  '/available-rooms',
  authenticateToken,
  scheduleValidationController.getAvailableRooms
);

/**
 * GET /api/schedule-validation/available-slots/:dosenId/:hari
 * Dapatkan slot waktu yang tersedia untuk dosen
 */
router.get(
  '/available-slots/:dosenId/:hari',
  authenticateToken,
  scheduleValidationController.getAvailableTimeSlots
);

// ========================================
// CONFLICT REPORTING & LOGGING
// ========================================

/**
 * GET /api/schedule-validation/conflict-report/:periodId
 * Generate laporan konflik untuk periode tertentu
 */
router.get(
  '/conflict-report/:periodId',
  authenticateToken,
  scheduleValidationController.generateConflictReport
);

/**
 * GET /api/schedule-validation/conflict-logs
 * Dapatkan semua log konflik
 * Query params: conflictType?, severity?, resolved?, limit?, offset?
 */
router.get(
  '/conflict-logs',
  authenticateToken,
  scheduleValidationController.getConflictLogs
);

/**
 * GET /api/schedule-validation/conflict-stats
 * Dapatkan statistik konflik
 * Query params: periodId?
 */
router.get(
  '/conflict-stats',
  authenticateToken,
  scheduleValidationController.getConflictStatistics
);

/**
 * PUT /api/schedule-validation/resolve-conflict/:conflictId
 * Tandai konflik sebagai resolved
 * Body: { resolvedBy?, notes? }
 */
router.put(
  '/resolve-conflict/:conflictId',
  authenticateToken,
  scheduleValidationController.resolveConflict
);

// ========================================
// DOSEN TEACHING SCHEDULE ENDPOINTS
// ========================================

/**
 * GET /api/schedule-validation/my-teaching-schedule
 * Dapatkan jadwal mengajar dosen yang sedang login
 * Response: jadwal per periode dan per hari
 */
router.get(
  '/my-teaching-schedule',
  authenticateToken,
  scheduleValidationController.getMyTeachingSchedule
);

/**
 * GET /api/schedule-validation/my-teaching-schedule/export
 * Export jadwal mengajar dosen ke format yang mudah dibaca
 * Query params: format?, periodId?
 */
router.get(
  '/my-teaching-schedule/export',
  authenticateToken,
  scheduleValidationController.exportMyTeachingSchedule
);

module.exports = router;
