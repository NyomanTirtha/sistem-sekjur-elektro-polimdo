const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// =====================================================
// TIMETABLE PERIODS MANAGEMENT
// =====================================================

// GET /api/timetable/periods - List semua periode timetable
router.get('/periods', async (req, res) => {
  try {
    // Jika user adalah SEKJUR dan memiliki jurusanId, ambil daftar username sekjur dari jurusan yang sama
    let sekjurUsernamesFromJurusan = [];
    if (req.userContext && req.userContext.jurusanId) {
      const sekjurUsers = await prisma.user.findMany({
        where: {
          role: 'SEKJUR',
          jurusanId: req.userContext.jurusanId
        },
        select: { username: true }
      });
      sekjurUsernamesFromJurusan = sekjurUsers.map(u => u.username);
    }

    // Build where clause untuk filter berdasarkan jurusan sekjur
    let whereClause = {};
    
    // ? FILTER BERDASARKAN JURUSAN SEKJUR
    // Jika user adalah SEKJUR, filter periode yang:
    // 1. Dibuat oleh sekjur dari jurusan yang sama, ATAU
    // 2. Memiliki prodiSchedules dari jurusan tersebut
    if (req.userContext && req.userContext.jurusanId && sekjurUsernamesFromJurusan.length > 0) {
      whereClause.OR = [
        // Periode yang dibuat oleh sekjur dari jurusan yang sama
        {
          createdBySekjur: { in: sekjurUsernamesFromJurusan }
        },
        // Periode yang memiliki prodiSchedules dari jurusan sekjur
        {
          prodiSchedules: {
            some: {
              prodi: {
                jurusanId: req.userContext.jurusanId
              }
            }
          }
        }
      ];
    }

    const periods = await prisma.timetablePeriod.findMany({
      where: whereClause,
      include: {
        prodiSchedules: {
          include: {
            prodi: {
              select: { id: true, nama: true, jurusanId: true }
            }
          }
        }
      },
      orderBy: [
        { tahunAkademik: 'desc' },
        { semester: 'desc' }
      ]
    });

    // Filter prodiSchedules berdasarkan jurusan jika user adalah SEKJUR
    // dan hitung statistik hanya dari prodi yang sesuai jurusan
    const periodsWithStats = periods.map(period => {
      let filteredProdiSchedules = period.prodiSchedules;
      
      // Filter prodiSchedules berdasarkan jurusan jika user adalah SEKJUR
      if (req.userContext && req.userContext.jurusanId) {
        filteredProdiSchedules = period.prodiSchedules.filter(
          ps => ps.prodi.jurusanId === req.userContext.jurusanId
        );
      }
      
      return {
        ...period,
        prodiSchedules: filteredProdiSchedules,
        stats: {
          totalProdi: filteredProdiSchedules.length,
          completedSchedules: filteredProdiSchedules.filter(ps => ps.status === 'APPROVED').length,
          pendingSchedules: filteredProdiSchedules.filter(ps => ps.status === 'SUBMITTED').length,
          draftSchedules: filteredProdiSchedules.filter(ps => ps.status === 'DRAFT').length
        }
      };
    });

    res.json({
      success: true,
      data: periodsWithStats
    });
  } catch (error) {
    console.error('Error fetching timetable periods:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data periode timetable',
      error: error.message
    });
  }
});

// POST /api/timetable/periods - Buat periode timetable baru (SEKJUR only)
router.post('/periods', async (req, res) => {
  try {
    const { semester, tahunAkademik } = req.body;
    const sekjurUsername = req.user.username;

    // Validate required fields
    if (!semester || !tahunAkademik) {
      return res.status(400).json({
        success: false,
        message: 'Semester dan tahun akademik harus diisi'
      });
    }

    // Validate semester enum
    if (!['GANJIL', 'GENAP', 'ANTARA'].includes(semester)) {
      return res.status(400).json({
        success: false,
        message: 'Semester harus GANJIL, GENAP, atau ANTARA'
      });
    }

    // Check if period already exists
    const existingPeriod = await prisma.timetablePeriod.findFirst({
      where: {
        semester,
        tahunAkademik
      }
    });

    if (existingPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Periode timetable untuk semester dan tahun akademik ini sudah ada'
      });
    }

    const newPeriod = await prisma.timetablePeriod.create({
      data: {
        semester,
        tahunAkademik,
        createdBySekjur: sekjurUsername,
        status: 'DRAFT'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Periode timetable berhasil dibuat',
      data: newPeriod
    });
  } catch (error) {
    console.error('Error creating timetable period:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat periode timetable',
      error: error.message
    });
  }
});

// Helper function untuk validasi akses periode berdasarkan jurusan
async function validatePeriodAccess(periodId, userContext) {
  if (!userContext || !userContext.jurusanId) {
    return { hasAccess: true }; // Admin atau role lain yang tidak terbatas
  }

  const period = await prisma.timetablePeriod.findUnique({
    where: { id: parseInt(periodId) },
    include: {
      prodiSchedules: {
        include: {
          prodi: {
            select: { jurusanId: true }
          }
        }
      }
    }
  });

  if (!period) {
    return { hasAccess: false, error: 'Periode tidak ditemukan' };
  }

  // Cek apakah periode dibuat oleh sekjur dari jurusan yang sama
  let isFromSameJurusan = false;
  if (period.createdBySekjur) {
    const creatorUser = await prisma.user.findUnique({
      where: { username: period.createdBySekjur },
      select: { jurusanId: true, role: true }
    });
    if (creatorUser && creatorUser.role === 'SEKJUR' && creatorUser.jurusanId === userContext.jurusanId) {
      isFromSameJurusan = true;
    }
  }

  // Cek apakah periode memiliki prodiSchedules dari jurusan sekjur
  const hasProdiFromJurusan = period.prodiSchedules.some(
    ps => ps.prodi.jurusanId === userContext.jurusanId
  );

  if (!isFromSameJurusan && !hasProdiFromJurusan) {
    return { hasAccess: false, error: 'Anda tidak memiliki akses untuk periode dari jurusan lain' };
  }

  return { hasAccess: true };
}

// PUT /api/timetable/periods/:id - Update periode timetable (SEKJUR only)
router.put('/periods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status enum
    if (status && !['DRAFT', 'ACTIVE', 'CLOSED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus DRAFT, ACTIVE, atau CLOSED'
      });
    }

    // ? VALIDASI: Sekjur hanya bisa update periode dari jurusannya
    const accessValidation = await validatePeriodAccess(id, req.userContext);
    if (!accessValidation.hasAccess) {
      return res.status(403).json({
        success: false,
        message: accessValidation.error
      });
    }

    // Check if period exists
    const existingPeriod = await prisma.timetablePeriod.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Periode timetable tidak ditemukan'
      });
    }

    const updatedPeriod = await prisma.timetablePeriod.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Periode timetable berhasil diupdate',
      data: updatedPeriod
    });
  } catch (error) {
    console.error('Error updating timetable period:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate periode timetable',
      error: error.message
    });
  }
});

// DELETE /api/timetable/periods/:id - Hapus periode timetable (SEKJUR only)
router.delete('/periods/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ? VALIDASI: Sekjur hanya bisa delete periode dari jurusannya
    const accessValidation = await validatePeriodAccess(id, req.userContext);
    if (!accessValidation.hasAccess) {
      return res.status(403).json({
        success: false,
        message: accessValidation.error
      });
    }

    // Check if period exists
    const existingPeriod = await prisma.timetablePeriod.findUnique({
      where: { id: parseInt(id) },
      include: {
        prodiSchedules: {
          include: {
            prodi: {
              select: { jurusanId: true }
            }
          }
        }
      }
    });

    if (!existingPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Periode timetable tidak ditemukan'
      });
    }

    // Filter prodiSchedules berdasarkan jurusan jika user adalah SEKJUR
    let relevantSchedules = existingPeriod.prodiSchedules;
    if (req.userContext && req.userContext.jurusanId) {
      relevantSchedules = existingPeriod.prodiSchedules.filter(
        ps => ps.prodi.jurusanId === req.userContext.jurusanId
      );
    }

    // Check if there are any schedules associated from sekjur's jurusan
    // Hanya bisa delete jika tidak ada jadwal dari jurusan sekjur
    // (Validasi akses sudah memastikan bahwa sekjur hanya bisa akses periode dari jurusannya)
    if (relevantSchedules.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus periode yang sudah memiliki jadwal dari jurusan Anda'
      });
    }

    await prisma.timetablePeriod.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Periode timetable berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting timetable period:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus periode timetable',
      error: error.message
    });
  }
});

// GET /api/timetable/periods/:id - Get detail periode timetable
router.get('/periods/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const period = await prisma.timetablePeriod.findUnique({
      where: { id: parseInt(id) },
      include: {
        prodiSchedules: {
          include: {
            prodi: {
              select: { id: true, nama: true, jurusanId: true }
            },
            scheduleItems: {
              include: {
                mataKuliah: {
                  select: { id: true, nama: true, sks: true }
                },
                dosen: {
                  select: { nip: true, nama: true }
                },
                ruangan: {
                  select: { id: true, nama: true, kapasitas: true }
                }
              }
            }
          }
        }
      }
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Periode timetable tidak ditemukan'
      });
    }

    // ? VALIDASI: Sekjur hanya bisa akses periode dari jurusannya
    if (req.userContext && req.userContext.jurusanId) {
      // Cek apakah periode dibuat oleh sekjur dari jurusan yang sama
      let isFromSameJurusan = false;
      if (period.createdBySekjur) {
        const creatorUser = await prisma.user.findUnique({
          where: { username: period.createdBySekjur },
          select: { jurusanId: true, role: true }
        });
        if (creatorUser && creatorUser.role === 'SEKJUR' && creatorUser.jurusanId === req.userContext.jurusanId) {
          isFromSameJurusan = true;
        }
      }
      
      // Cek apakah periode memiliki prodiSchedules dari jurusan sekjur
      const hasProdiFromJurusan = period.prodiSchedules.some(
        ps => ps.prodi.jurusanId === req.userContext.jurusanId
      );

      if (!isFromSameJurusan && !hasProdiFromJurusan) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses untuk melihat periode dari jurusan lain'
        });
      }

      // Filter prodiSchedules hanya yang dari jurusan sekjur
      period.prodiSchedules = period.prodiSchedules.filter(
        ps => ps.prodi.jurusanId === req.userContext.jurusanId
      );
    }

    res.json({
      success: true,
      data: period
    });
  } catch (error) {
    console.error('Error fetching timetable period detail:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail periode timetable',
      error: error.message
    });
  }
});

// POST /api/timetable/periods/:id/publish - Publish semua jadwal yang approved (SEKJUR only)
router.post('/periods/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    // ? VALIDASI: Sekjur hanya bisa publish periode dari jurusannya
    const accessValidation = await validatePeriodAccess(id, req.userContext);
    if (!accessValidation.hasAccess) {
      return res.status(403).json({
        success: false,
        message: accessValidation.error
      });
    }

    // Check if period exists
    const period = await prisma.timetablePeriod.findUnique({
      where: { id: parseInt(id) },
      include: {
        prodiSchedules: {
          include: {
            prodi: {
              select: { jurusanId: true }
            }
          }
        }
      }
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Periode timetable tidak ditemukan'
      });
    }

    // Filter prodiSchedules berdasarkan jurusan jika user adalah SEKJUR
    let relevantSchedules = period.prodiSchedules;
    if (req.userContext && req.userContext.jurusanId) {
      relevantSchedules = period.prodiSchedules.filter(
        ps => ps.prodi.jurusanId === req.userContext.jurusanId
      );
    }

    // Check if all prodi schedules are approved (hanya dari jurusan sekjur)
    const unapprovedSchedules = relevantSchedules.filter(ps => ps.status !== 'APPROVED');
    if (unapprovedSchedules.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Masih ada jadwal prodi yang belum di-approve',
        data: {
          unapprovedCount: unapprovedSchedules.length,
          unapprovedProdi: unapprovedSchedules.map(ps => ps.prodiId)
        }
      });
    }

    // Update all approved schedules to published (hanya dari jurusan sekjur)
    const scheduleIdsToPublish = relevantSchedules.map(ps => ps.id);
    if (scheduleIdsToPublish.length > 0) {
      await prisma.prodiSchedule.updateMany({
        where: {
          id: { in: scheduleIdsToPublish },
          status: 'APPROVED'
        },
        data: {
          status: 'PUBLISHED'
        }
      });
    }

    res.json({
      success: true,
      message: 'Semua jadwal berhasil dipublish',
      data: {
        publishedSchedules: relevantSchedules.length
      }
    });
  } catch (error) {
    console.error('Error publishing schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mempublish jadwal',
      error: error.message
    });
  }
});

module.exports = router;
