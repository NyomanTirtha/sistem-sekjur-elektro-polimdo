const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * ========================================
 * SCHEDULE VALIDATOR SERVICE
 * ========================================
 * Service untuk validasi jadwal lengkap:
 * - Konflik Dosen (dosen mengajar 2 kelas bersamaan)
 * - Konflik Ruangan (ruangan dipakai 2 kelas bersamaan)
 * - Konflik Mahasiswa (mahasiswa ambil 2 kelas bersamaan)
 * - Validasi Kapasitas Ruangan
 * - Validasi Beban Dosen (SKS maksimal)
 * - Validasi Time Overlap
 */

class ScheduleValidator {
  constructor() {
    this.JAM_KULIAH = {
      mulai: "07:00",
      selesai: "17:00",
    };

    this.JAM_ISTIRAHAT = {
      mulai: "12:00",
      selesai: "13:00",
    };

    this.DURASI_MIN_KULIAH = 50; // minimal 50 menit
    this.MAX_SKS_DOSEN = 16; // maksimal 16 SKS per semester untuk dosen
  }

  /**
   * ========================================
   * MAIN VALIDATION FUNCTION
   * ========================================
   * Validasi semua aspek jadwal sekaligus
   */
  async validateScheduleItem(scheduleItemData, excludeItemId = null) {
    const errors = [];
    const warnings = [];

    try {
      // 1. Validasi Format Waktu
      const timeValidation = this.validateTimeFormat(
        scheduleItemData.jamMulai,
        scheduleItemData.jamSelesai,
      );
      if (!timeValidation.valid) {
        errors.push(...timeValidation.errors);
      }

      // 2. Validasi Durasi
      const durationValidation = this.validateDuration(
        scheduleItemData.jamMulai,
        scheduleItemData.jamSelesai,
      );
      if (!durationValidation.valid) {
        errors.push(...durationValidation.errors);
      }

      // 3. Validasi Jam Kerja
      const workHourValidation = this.validateWorkHours(
        scheduleItemData.jamMulai,
        scheduleItemData.jamSelesai,
      );
      if (!workHourValidation.valid) {
        warnings.push(...workHourValidation.warnings);
      }

      // Jika ada error format/durasi, tidak perlu lanjut cek database
      if (errors.length > 0) {
        return { valid: false, errors, warnings };
      }

      // 4. Cek Konflik Dosen
      const dosenConflict = await this.checkDosenConflict(
        scheduleItemData.dosenId,
        scheduleItemData.hari,
        scheduleItemData.jamMulai,
        scheduleItemData.jamSelesai,
        scheduleItemData.prodiScheduleId,
        excludeItemId,
      );
      if (dosenConflict.hasConflict) {
        errors.push({
          type: "DOSEN_CONFLICT",
          message: dosenConflict.message,
          details: dosenConflict.conflicts,
        });
      }

      // 5. Cek Konflik Ruangan
      const ruanganConflict = await this.checkRuanganConflict(
        scheduleItemData.ruanganId,
        scheduleItemData.hari,
        scheduleItemData.jamMulai,
        scheduleItemData.jamSelesai,
        scheduleItemData.prodiScheduleId,
        excludeItemId,
      );
      if (ruanganConflict.hasConflict) {
        errors.push({
          type: "RUANGAN_CONFLICT",
          message: ruanganConflict.message,
          details: ruanganConflict.conflicts,
        });
      }

      // 6. Cek Kapasitas Ruangan
      if (scheduleItemData.kapasitasMahasiswa) {
        const capacityCheck = await this.checkRoomCapacity(
          scheduleItemData.ruanganId,
          scheduleItemData.kapasitasMahasiswa,
        );
        if (!capacityCheck.valid) {
          errors.push({
            type: "KAPASITAS_EXCEEDED",
            message: capacityCheck.message,
            details: capacityCheck.details,
          });
        }
      }

      // 7. Cek Beban Dosen (SKS)
      if (scheduleItemData.mataKuliahId) {
        const workloadCheck = await this.checkDosenWorkload(
          scheduleItemData.dosenId,
          scheduleItemData.mataKuliahId,
          scheduleItemData.prodiScheduleId,
          excludeItemId,
        );
        if (!workloadCheck.valid) {
          if (workloadCheck.severity === "error") {
            errors.push({
              type: "DOSEN_OVERLOAD",
              message: workloadCheck.message,
              details: workloadCheck.details,
            });
          } else {
            warnings.push({
              type: "DOSEN_WORKLOAD_WARNING",
              message: workloadCheck.message,
              details: workloadCheck.details,
            });
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error("Error in validateScheduleItem:", error);
      return {
        valid: false,
        errors: [
          {
            type: "VALIDATION_ERROR",
            message: "Terjadi kesalahan saat validasi jadwal",
            details: error.message,
          },
        ],
        warnings,
      };
    }
  }

  /**
   * ========================================
   * CHECK DOSEN CONFLICT
   * ========================================
   * Cek apakah dosen sudah mengajar di kelas lain pada waktu yang sama
   */
  async checkDosenConflict(
    dosenId,
    hari,
    jamMulai,
    jamSelesai,
    prodiScheduleId,
    excludeItemId = null,
  ) {
    try {
      const whereClause = {
        dosenId: dosenId,
        hari: hari,
        prodiSchedule: {
          status: {
            in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED"],
          },
        },
        OR: [
          // Overlap: existing start time is between new time range
          {
            AND: [
              { jamMulai: { lte: jamMulai } },
              { jamSelesai: { gt: jamMulai } },
            ],
          },
          // Overlap: existing end time is between new time range
          {
            AND: [
              { jamMulai: { lt: jamSelesai } },
              { jamSelesai: { gte: jamSelesai } },
            ],
          },
          // Overlap: new time range completely contains existing time range
          {
            AND: [
              { jamMulai: { gte: jamMulai } },
              { jamSelesai: { lte: jamSelesai } },
            ],
          },
        ],
      };

      // Exclude item yang sedang di-edit
      if (excludeItemId) {
        whereClause.id = { not: parseInt(excludeItemId) };
      }

      const conflicts = await prisma.scheduleItem.findMany({
        where: whereClause,
        include: {
          mataKuliah: { select: { nama: true, sks: true } },
          dosen: { select: { nama: true } },
          ruangan: { select: { nama: true } },
          prodiSchedule: {
            include: {
              prodi: { select: { nama: true } },
            },
          },
        },
      });

      if (conflicts.length > 0) {
        return {
          hasConflict: true,
          message: `Dosen ${conflicts[0].dosen.nama} sudah mengajar pada ${hari} jam ${jamMulai}-${jamSelesai}`,
          conflicts: conflicts.map((c) => ({
            id: c.id,
            mataKuliah: c.mataKuliah.nama,
            prodi: c.prodiSchedule.prodi.nama,
            kelas: c.kelas,
            ruangan: c.ruangan.nama,
            waktu: `${c.hari} ${c.jamMulai}-${c.jamSelesai}`,
          })),
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error("Error in checkDosenConflict:", error);
      throw error;
    }
  }

  /**
   * ========================================
   * CHECK RUANGAN CONFLICT
   * ========================================
   * Cek apakah ruangan sudah dipakai kelas lain pada waktu yang sama
   */
  async checkRuanganConflict(
    ruanganId,
    hari,
    jamMulai,
    jamSelesai,
    prodiScheduleId,
    excludeItemId = null,
  ) {
    try {
      const whereClause = {
        ruanganId: ruanganId,
        hari: hari,
        prodiSchedule: {
          status: {
            in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED"],
          },
        },
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
      };

      if (excludeItemId) {
        whereClause.id = { not: parseInt(excludeItemId) };
      }

      const conflicts = await prisma.scheduleItem.findMany({
        where: whereClause,
        include: {
          mataKuliah: { select: { nama: true } },
          dosen: { select: { nama: true } },
          ruangan: { select: { nama: true, kapasitas: true } },
          prodiSchedule: {
            include: {
              prodi: { select: { nama: true } },
            },
          },
        },
      });

      if (conflicts.length > 0) {
        return {
          hasConflict: true,
          message: `Ruangan ${conflicts[0].ruangan.nama} sudah dipakai pada ${hari} jam ${jamMulai}-${jamSelesai}`,
          conflicts: conflicts.map((c) => ({
            id: c.id,
            mataKuliah: c.mataKuliah.nama,
            dosen: c.dosen.nama,
            prodi: c.prodiSchedule.prodi.nama,
            kelas: c.kelas,
            waktu: `${c.hari} ${c.jamMulai}-${c.jamSelesai}`,
          })),
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error("Error in checkRuanganConflict:", error);
      throw error;
    }
  }

  /**
   * ========================================
   * CHECK MAHASISWA CONFLICT
   * ========================================
   * Cek apakah mahasiswa yang sama terdaftar di 2 kelas yang waktunya bentrok
   */
  async checkMahasiswaConflict(
    prodiScheduleId,
    hari,
    jamMulai,
    jamSelesai,
    excludeItemId = null,
  ) {
    try {
      // Ambil semua mahasiswa yang enrolled di kelas ini
      const enrollments = await prisma.enrollment.findMany({
        where: {
          prodiScheduleId: prodiScheduleId,
          status: "ACTIVE",
        },
        select: {
          mahasiswaId: true,
        },
      });

      if (enrollments.length === 0) {
        return { hasConflict: false };
      }

      const mahasiswaIds = enrollments.map((e) => e.mahasiswaId);
      const conflicts = [];

      // Untuk setiap mahasiswa, cek apakah mereka punya kelas lain di waktu yang sama
      for (const mahasiswaId of mahasiswaIds) {
        const otherEnrollments = await prisma.enrollment.findMany({
          where: {
            mahasiswaId: mahasiswaId,
            status: "ACTIVE",
            NOT: {
              prodiScheduleId: prodiScheduleId,
            },
          },
          include: {
            prodiSchedule: {
              include: {
                scheduleItems: {
                  where: {
                    hari: hari,
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
                  include: {
                    mataKuliah: { select: { nama: true } },
                  },
                },
              },
            },
            mahasiswa: {
              select: { nim: true, nama: true },
            },
          },
        });

        // Filter yang punya schedule items bentrok
        const conflictedEnrollments = otherEnrollments.filter(
          (e) => e.prodiSchedule.scheduleItems.length > 0,
        );

        if (conflictedEnrollments.length > 0) {
          conflictedEnrollments.forEach((enrollment) => {
            enrollment.prodiSchedule.scheduleItems.forEach((item) => {
              conflicts.push({
                mahasiswa: {
                  nim: enrollment.mahasiswa.nim,
                  nama: enrollment.mahasiswa.nama,
                },
                conflictingClass: {
                  kelas: enrollment.prodiSchedule.kelas,
                  mataKuliah: item.mataKuliah.nama,
                  waktu: `${item.hari} ${item.jamMulai}-${item.jamSelesai}`,
                },
              });
            });
          });
        }
      }

      if (conflicts.length > 0) {
        return {
          hasConflict: true,
          message: `Ada ${conflicts.length} mahasiswa yang memiliki jadwal bentrok`,
          conflicts: conflicts,
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error("Error in checkMahasiswaConflict:", error);
      throw error;
    }
  }

  /**
   * ========================================
   * CHECK ROOM CAPACITY
   * ========================================
   * Cek apakah kapasitas ruangan mencukupi untuk jumlah mahasiswa
   */
  async checkRoomCapacity(ruanganId, kapasitasMahasiswa) {
    try {
      const ruangan = await prisma.ruangan.findUnique({
        where: { id: ruanganId },
        select: { nama: true, kapasitas: true },
      });

      if (!ruangan) {
        return {
          valid: false,
          message: "Ruangan tidak ditemukan",
          details: null,
        };
      }

      if (kapasitasMahasiswa > ruangan.kapasitas) {
        return {
          valid: false,
          message: `Kapasitas ruangan ${ruangan.nama} (${ruangan.kapasitas}) tidak mencukupi untuk ${kapasitasMahasiswa} mahasiswa`,
          details: {
            ruangan: ruangan.nama,
            kapasitasRuangan: ruangan.kapasitas,
            jumlahMahasiswa: kapasitasMahasiswa,
            kelebihan: kapasitasMahasiswa - ruangan.kapasitas,
          },
        };
      }

      return { valid: true };
    } catch (error) {
      console.error("Error in checkRoomCapacity:", error);
      throw error;
    }
  }

  /**
   * ========================================
   * CHECK DOSEN WORKLOAD
   * ========================================
   * Cek apakah beban mengajar dosen tidak melebihi batas maksimal SKS
   */
  async checkDosenWorkload(
    dosenId,
    newMataKuliahId,
    prodiScheduleId,
    excludeItemId = null,
  ) {
    try {
      // Get dosen info
      const dosen = await prisma.dosen.findUnique({
        where: { nip: dosenId },
        select: {
          nama: true,
          maxSKSPerSemester: true,
        },
      });

      if (!dosen) {
        return { valid: false, message: "Dosen tidak ditemukan" };
      }

      const maxSKS = dosen.maxSKSPerSemester || this.MAX_SKS_DOSEN;

      // Get current schedule's period info
      const prodiSchedule = await prisma.prodiSchedule.findUnique({
        where: { id: prodiScheduleId },
        include: {
          timetablePeriod: {
            select: {
              tahunAkademik: true,
              semester: true,
            },
          },
        },
      });

      if (!prodiSchedule) {
        return { valid: false, message: "Jadwal prodi tidak ditemukan" };
      }

      const { tahunAkademik, semester } = prodiSchedule.timetablePeriod;

      // Get all schedule items for this dosen in same period
      const existingItems = await prisma.scheduleItem.findMany({
        where: {
          dosenId: dosenId,
          prodiSchedule: {
            timetablePeriod: {
              tahunAkademik: tahunAkademik,
              semester: semester,
            },
          },
          ...(excludeItemId && { id: { not: parseInt(excludeItemId) } }),
        },
        include: {
          mataKuliah: {
            select: { nama: true, sks: true },
          },
        },
      });

      // Calculate current total SKS
      const currentTotalSKS = existingItems.reduce((sum, item) => {
        return sum + (item.mataKuliah.sks || 0);
      }, 0);

      // Get SKS of new mata kuliah
      const newMataKuliah = await prisma.mataKuliah.findUnique({
        where: { id: newMataKuliahId },
        select: { nama: true, sks: true },
      });

      if (!newMataKuliah) {
        return { valid: false, message: "Mata kuliah tidak ditemukan" };
      }

      const newTotalSKS = currentTotalSKS + newMataKuliah.sks;

      // Check if exceeds limit
      if (newTotalSKS > maxSKS) {
        return {
          valid: false,
          severity: "error",
          message: `Beban mengajar ${dosen.nama} melebihi batas maksimal ${maxSKS} SKS`,
          details: {
            dosen: dosen.nama,
            currentSKS: currentTotalSKS,
            newMataKuliahSKS: newMataKuliah.sks,
            totalSKS: newTotalSKS,
            maxSKS: maxSKS,
            exceeded: newTotalSKS - maxSKS,
            existingCourses: existingItems.map((item) => ({
              nama: item.mataKuliah.nama,
              sks: item.mataKuliah.sks,
            })),
          },
        };
      }

      // Warning if close to limit (80% or more)
      const threshold = maxSKS * 0.8;
      if (newTotalSKS >= threshold) {
        return {
          valid: true,
          severity: "warning",
          message: `Beban mengajar ${dosen.nama} mendekati batas maksimal (${newTotalSKS}/${maxSKS} SKS)`,
          details: {
            dosen: dosen.nama,
            currentSKS: currentTotalSKS,
            newMataKuliahSKS: newMataKuliah.sks,
            totalSKS: newTotalSKS,
            maxSKS: maxSKS,
            percentage: Math.round((newTotalSKS / maxSKS) * 100),
          },
        };
      }

      return { valid: true };
    } catch (error) {
      console.error("Error in checkDosenWorkload:", error);
      throw error;
    }
  }

  /**
   * ========================================
   * VALIDATE TIME FORMAT
   * ========================================
   * Validasi format waktu HH:MM
   */
  validateTimeFormat(jamMulai, jamSelesai) {
    const errors = [];
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

    if (!timeRegex.test(jamMulai)) {
      errors.push({
        type: "INVALID_TIME_FORMAT",
        message: `Format jam mulai tidak valid: ${jamMulai}. Gunakan format HH:MM`,
      });
    }

    if (!timeRegex.test(jamSelesai)) {
      errors.push({
        type: "INVALID_TIME_FORMAT",
        message: `Format jam selesai tidak valid: ${jamSelesai}. Gunakan format HH:MM`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * ========================================
   * VALIDATE DURATION
   * ========================================
   * Validasi durasi minimal dan jam selesai harus lebih besar dari jam mulai
   */
  validateDuration(jamMulai, jamSelesai) {
    const errors = [];

    try {
      const start = new Date(`2024-01-01 ${jamMulai}`);
      const end = new Date(`2024-01-01 ${jamSelesai}`);

      if (end <= start) {
        errors.push({
          type: "INVALID_TIME_RANGE",
          message: "Jam selesai harus lebih besar dari jam mulai",
        });
        return { valid: false, errors };
      }

      const durationMinutes = (end - start) / (1000 * 60);

      if (durationMinutes < this.DURASI_MIN_KULIAH) {
        errors.push({
          type: "DURATION_TOO_SHORT",
          message: `Durasi kuliah minimal ${this.DURASI_MIN_KULIAH} menit. Durasi saat ini: ${durationMinutes} menit`,
        });
      }

      return {
        valid: errors.length === 0,
        errors,
        duration: durationMinutes,
      };
    } catch (error) {
      errors.push({
        type: "VALIDATION_ERROR",
        message: "Error saat validasi durasi: " + error.message,
      });
      return { valid: false, errors };
    }
  }

  /**
   * ========================================
   * VALIDATE WORK HOURS
   * ========================================
   * Validasi apakah jadwal berada dalam jam kerja
   */
  validateWorkHours(jamMulai, jamSelesai) {
    const warnings = [];

    try {
      const start = new Date(`2024-01-01 ${jamMulai}`);
      const end = new Date(`2024-01-01 ${jamSelesai}`);
      const workStart = new Date(`2024-01-01 ${this.JAM_KULIAH.mulai}`);
      const workEnd = new Date(`2024-01-01 ${this.JAM_KULIAH.selesai}`);

      if (start < workStart || end > workEnd) {
        warnings.push({
          type: "OUTSIDE_WORK_HOURS",
          message: `Jadwal berada di luar jam kuliah normal (${this.JAM_KULIAH.mulai}-${this.JAM_KULIAH.selesai})`,
        });
      }

      // Check overlap with break time
      const breakStart = new Date(`2024-01-01 ${this.JAM_ISTIRAHAT.mulai}`);
      const breakEnd = new Date(`2024-01-01 ${this.JAM_ISTIRAHAT.selesai}`);

      if (start < breakEnd && end > breakStart) {
        warnings.push({
          type: "OVERLAP_WITH_BREAK",
          message: `Jadwal overlap dengan jam istirahat (${this.JAM_ISTIRAHAT.mulai}-${this.JAM_ISTIRAHAT.selesai})`,
        });
      }

      return {
        valid: warnings.length === 0,
        warnings,
      };
    } catch (error) {
      warnings.push({
        type: "VALIDATION_ERROR",
        message: "Error saat validasi jam kerja: " + error.message,
      });
      return { valid: false, warnings };
    }
  }

  /**
   * ========================================
   * VALIDATE COMPLETE SCHEDULE
   * ========================================
   * Validasi keseluruhan jadwal prodi
   */
  async validateCompleteSchedule(prodiScheduleId) {
    try {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        summary: {
          totalItems: 0,
          dosenConflicts: 0,
          ruanganConflicts: 0,
          mahasiswaConflicts: 0,
          capacityIssues: 0,
          workloadIssues: 0,
        },
      };

      // Get all schedule items
      const scheduleItems = await prisma.scheduleItem.findMany({
        where: { prodiScheduleId: prodiScheduleId },
        include: {
          mataKuliah: true,
          dosen: true,
          ruangan: true,
        },
      });

      result.summary.totalItems = scheduleItems.length;

      // Validate each item
      for (const item of scheduleItems) {
        const validation = await this.validateScheduleItem(
          {
            dosenId: item.dosenId,
            ruanganId: item.ruanganId,
            mataKuliahId: item.mataKuliahId,
            hari: item.hari,
            jamMulai: item.jamMulai,
            jamSelesai: item.jamSelesai,
            prodiScheduleId: item.prodiScheduleId,
            kapasitasMahasiswa: item.kapasitasMahasiswa,
          },
          item.id,
        );

        if (!validation.valid) {
          result.valid = false;

          validation.errors.forEach((error) => {
            error.scheduleItemId = item.id;
            error.mataKuliah = item.mataKuliah.nama;
            error.dosen = item.dosen.nama;
            error.waktu = `${item.hari} ${item.jamMulai}-${item.jamSelesai}`;

            result.errors.push(error);

            // Count by type
            if (error.type === "DOSEN_CONFLICT")
              result.summary.dosenConflicts++;
            if (error.type === "RUANGAN_CONFLICT")
              result.summary.ruanganConflicts++;
            if (error.type === "MAHASISWA_CONFLICT")
              result.summary.mahasiswaConflicts++;
            if (error.type === "KAPASITAS_EXCEEDED")
              result.summary.capacityIssues++;
            if (error.type === "DOSEN_OVERLOAD")
              result.summary.workloadIssues++;
          });
        }

        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => {
            warning.scheduleItemId = item.id;
            warning.mataKuliah = item.mataKuliah.nama;
            warning.waktu = `${item.hari} ${item.jamMulai}-${item.jamSelesai}`;
            result.warnings.push(warning);
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Error in validateCompleteSchedule:", error);
      throw error;
    }
  }

  /**
   * ========================================
   * LOG CONFLICT
   * ========================================
   * Catat konflik ke database untuk tracking
   */
  async logConflict(conflictData) {
    try {
      return await prisma.scheduleConflictLog.create({
        data: {
          conflictType: conflictData.type,
          description: conflictData.message,
          scheduleItemId1: conflictData.scheduleItemId1 || null,
          scheduleItemId2: conflictData.scheduleItemId2 || null,
          severity: conflictData.severity || "HIGH",
          notes: JSON.stringify(conflictData.details || {}),
        },
      });
    } catch (error) {
      console.error("Error logging conflict:", error);
      // Don't throw error, just log it
      return null;
    }
  }

  /**
   * ========================================
   * CALCULATE DOSEN WORKLOAD
   * ========================================
   * Hitung total beban mengajar dosen untuk periode tertentu
   */
  async calculateDosenWorkload(dosenId, tahunAkademik, semester) {
    try {
      const scheduleItems = await prisma.scheduleItem.findMany({
        where: {
          dosenId: dosenId,
          prodiSchedule: {
            timetablePeriod: {
              tahunAkademik: tahunAkademik,
              semester: semester,
            },
            status: {
              in: ["APPROVED", "PUBLISHED"],
            },
          },
        },
        include: {
          mataKuliah: {
            select: { nama: true, sks: true },
          },
        },
      });

      const totalSKS = scheduleItems.reduce((sum, item) => {
        return sum + (item.mataKuliah.sks || 0);
      }, 0);

      const totalMataKuliah = new Set(
        scheduleItems.map((item) => item.mataKuliahId),
      ).size;

      const totalJamMengajar = scheduleItems.reduce((sum, item) => {
        const start = new Date(`2024-01-01 ${item.jamMulai}`);
        const end = new Date(`2024-01-01 ${item.jamSelesai}`);
        const minutes = (end - start) / (1000 * 60);
        return sum + minutes;
      }, 0);

      const dosen = await prisma.dosen.findUnique({
        where: { nip: dosenId },
        select: { maxSKSPerSemester: true },
      });

      const maxSKS = dosen?.maxSKSPerSemester || this.MAX_SKS_DOSEN;
      const isOverloaded = totalSKS > maxSKS;

      return {
        dosenId,
        tahunAkademik,
        semester,
        totalSKS,
        totalMataKuliah,
        totalJamMengajar,
        maxSKSAllowed: maxSKS,
        isOverloaded,
        courses: scheduleItems.map((item) => ({
          mataKuliah: item.mataKuliah.nama,
          sks: item.mataKuliah.sks,
          waktu: `${item.hari} ${item.jamMulai}-${item.jamSelesai}`,
        })),
      };
    } catch (error) {
      console.error("Error in calculateDosenWorkload:", error);
      throw error;
    }
  }

  /**
   * ========================================
   * GET AVAILABLE ROOMS
   * ========================================
   * Dapatkan daftar ruangan yang tersedia pada waktu tertentu
   */
  async getAvailableRooms(
    hari,
    jamMulai,
    jamSelesai,
    minCapacity = 0,
    excludeItemId = null,
  ) {
    try {
      // Get all active rooms
      const allRooms = await prisma.ruangan.findMany({
        where: {
          isActive: true,
          kapasitas: { gte: minCapacity },
        },
        orderBy: { kapasitas: "asc" },
      });

      // Get occupied rooms at this time
      const occupiedRooms = await prisma.scheduleItem.findMany({
        where: {
          hari: hari,
          prodiSchedule: {
            status: {
              in: [
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "APPROVED",
                "PUBLISHED",
              ],
            },
          },
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
          ...(excludeItemId && { id: { not: parseInt(excludeItemId) } }),
        },
        select: { ruanganId: true },
      });

      const occupiedRoomIds = new Set(
        occupiedRooms.map((item) => item.ruanganId),
      );

      // Filter available rooms
      const availableRooms = allRooms
        .filter((room) => !occupiedRoomIds.has(room.id))
        .map((room) => ({
          id: room.id,
          nama: room.nama,
          kapasitas: room.kapasitas,
          lokasi: room.lokasi,
          fasilitas: room.fasilitas,
        }));

      return {
        total: availableRooms.length,
        rooms: availableRooms,
      };
    } catch (error) {
      console.error("Error in getAvailableRooms:", error);
      throw error;
    }
  }

  /**
   * ========================================
   * GET AVAILABLE TIME SLOTS
   * ========================================
   * Dapatkan slot waktu yang tersedia untuk dosen di hari tertentu
   */
  async getAvailableTimeSlots(dosenId, hari) {
    try {
      // Standard time slots (in minutes from 07:00)
      const TIME_SLOTS = [
        { start: "07:00", end: "08:40" },
        { start: "08:40", end: "10:20" },
        { start: "10:20", end: "12:00" },
        { start: "13:00", end: "14:40" },
        { start: "14:40", end: "16:20" },
        { start: "16:20", end: "18:00" },
      ];

      // Get dosen's existing schedule for this day
      const existingSchedule = await prisma.scheduleItem.findMany({
        where: {
          dosenId: dosenId,
          hari: hari,
          prodiSchedule: {
            status: {
              in: [
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "APPROVED",
                "PUBLISHED",
              ],
            },
          },
        },
        select: {
          jamMulai: true,
          jamSelesai: true,
          mataKuliah: { select: { nama: true } },
        },
      });

      // Check which slots are available
      const availableSlots = TIME_SLOTS.filter((slot) => {
        return !existingSchedule.some((schedule) => {
          return this.checkTimeOverlap(
            slot.start,
            slot.end,
            schedule.jamMulai,
            schedule.jamSelesai,
          );
        });
      });

      return {
        hari: hari,
        totalSlots: TIME_SLOTS.length,
        availableSlots: availableSlots.length,
        slots: availableSlots,
        occupiedBy: existingSchedule.map((s) => ({
          waktu: `${s.jamMulai}-${s.jamSelesai}`,
          mataKuliah: s.mataKuliah.nama,
        })),
      };
    } catch (error) {
      console.error("Error in getAvailableTimeSlots:", error);
      throw error;
    }
  }

  /**
   * ========================================
   * CHECK TIME OVERLAP HELPER
   * ========================================
   */
  checkTimeOverlap(start1, end1, start2, end2) {
    try {
      const s1 = new Date(`2024-01-01 ${start1}`);
      const e1 = new Date(`2024-01-01 ${end1}`);
      const s2 = new Date(`2024-01-01 ${start2}`);
      const e2 = new Date(`2024-01-01 ${end2}`);

      return s1 < e2 && s2 < e1;
    } catch (error) {
      return false;
    }
  }

  /**
   * ========================================
   * GENERATE CONFLICT REPORT
   * ========================================
   * Generate laporan lengkap konflik untuk periode tertentu
   */
  async generateConflictReport(periodId) {
    try {
      const period = await prisma.timetablePeriod.findUnique({
        where: { id: periodId },
        select: {
          tahunAkademik: true,
          semester: true,
          status: true,
        },
      });

      if (!period) {
        throw new Error("Period not found");
      }

      const schedules = await prisma.prodiSchedule.findMany({
        where: {
          timetablePeriodId: periodId,
          status: {
            in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED"],
          },
        },
        include: {
          prodi: { select: { nama: true } },
          scheduleItems: {
            include: {
              mataKuliah: { select: { nama: true, sks: true } },
              dosen: { select: { nama: true, nip: true } },
              ruangan: { select: { nama: true, kapasitas: true } },
            },
          },
        },
      });

      const report = {
        period: {
          tahunAkademik: period.tahunAkademik,
          semester: period.semester,
          status: period.status,
        },
        summary: {
          totalSchedules: schedules.length,
          totalItems: 0,
          totalConflicts: 0,
          conflictsByType: {
            DOSEN_CONFLICT: 0,
            RUANGAN_CONFLICT: 0,
            MAHASISWA_CONFLICT: 0,
            KAPASITAS_EXCEEDED: 0,
            DOSEN_OVERLOAD: 0,
          },
        },
        scheduleReports: [],
      };

      for (const schedule of schedules) {
        report.summary.totalItems += schedule.scheduleItems.length;

        const validation = await this.validateCompleteSchedule(schedule.id);

        const scheduleReport = {
          scheduleId: schedule.id,
          prodi: schedule.prodi.nama,
          kelas: schedule.kelas,
          status: schedule.status,
          totalItems: schedule.scheduleItems.length,
          hasConflicts: !validation.valid,
          conflicts: validation.errors,
          warnings: validation.warnings,
          summary: validation.summary,
        };

        report.scheduleReports.push(scheduleReport);

        // Aggregate conflicts
        report.summary.totalConflicts += validation.errors.length;
        validation.errors.forEach((error) => {
          if (report.summary.conflictsByType[error.type] !== undefined) {
            report.summary.conflictsByType[error.type]++;
          }
        });
      }

      return report;
    } catch (error) {
      console.error("Error in generateConflictReport:", error);
      throw error;
    }
  }
}

module.exports = new ScheduleValidator();
