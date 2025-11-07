const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// =====================================================
// RUANGAN MANAGEMENT ROUTES
// =====================================================

// GET /api/ruangan - List semua ruangan
router.get('/', async (req, res) => {
  try {
    const { isActive, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {};

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    if (search) {
      whereClause.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { lokasi: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [ruangan, totalCount] = await Promise.all([
      prisma.ruangan.findMany({
        where: whereClause,
        orderBy: [
          { nama: 'asc' }
        ],
        skip: offset,
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              scheduleItems: {
                where: {
                  prodiSchedule: {
                    status: 'PUBLISHED'
                  }
                }
              }
            }
          }
        }
      }),
      prisma.ruangan.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: ruangan,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching ruangan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data ruangan',
      error: error.message
    });
  }
});

// GET /api/ruangan/:id - Get detail ruangan
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ruangan = await prisma.ruangan.findUnique({
      where: { id: parseInt(id) },
      include: {
        scheduleItems: {
          where: {
            prodiSchedule: {
              status: 'PUBLISHED'
            }
          },
          include: {
            mataKuliah: {
              select: { id: true, nama: true, sks: true }
            },
            dosen: {
              select: { nip: true, nama: true }
            },
            prodiSchedule: {
              select: {
                prodi: {
                  select: { id: true, nama: true }
                },
                timetablePeriod: {
                  select: { semester: true, tahunAkademik: true }
                }
              }
            }
          },
          orderBy: [
            { hari: 'asc' },
            { jamMulai: 'asc' }
          ]
        },
        _count: {
          select: {
            scheduleItems: true,
            dosenRequests: true
          }
        }
      }
    });

    if (!ruangan) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: ruangan
    });
  } catch (error) {
    console.error('Error fetching ruangan detail:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail ruangan',
      error: error.message
    });
  }
});

// POST /api/ruangan - Buat ruangan baru (SEKJUR only)
router.post('/', async (req, res) => {
  try {
    const { nama, kapasitas, fasilitas, lokasi } = req.body;

    // Validate required fields
    if (!nama || !kapasitas) {
      return res.status(400).json({
        success: false,
        message: 'Nama ruangan dan kapasitas harus diisi'
      });
    }

    // Validate kapasitas is positive number
    if (parseInt(kapasitas) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Kapasitas ruangan harus lebih dari 0'
      });
    }

    // Check if ruangan name already exists
    const existingRuangan = await prisma.ruangan.findFirst({
      where: {
        nama: nama.trim(),
        isActive: true
      }
    });

    if (existingRuangan) {
      return res.status(400).json({
        success: false,
        message: 'Nama ruangan sudah ada'
      });
    }

    const newRuangan = await prisma.ruangan.create({
      data: {
        nama: nama.trim(),
        kapasitas: parseInt(kapasitas),
        fasilitas: fasilitas?.trim() || null,
        lokasi: lokasi?.trim() || null,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Ruangan berhasil dibuat',
      data: newRuangan
    });
  } catch (error) {
    console.error('Error creating ruangan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat ruangan',
      error: error.message
    });
  }
});

// PUT /api/ruangan/:id - Update ruangan (SEKJUR only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, kapasitas, fasilitas, lokasi, isActive } = req.body;

    // Check if ruangan exists
    const existingRuangan = await prisma.ruangan.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRuangan) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan'
      });
    }

    // Validate kapasitas if provided
    if (kapasitas !== undefined && parseInt(kapasitas) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Kapasitas ruangan harus lebih dari 0'
      });
    }

    // Check if nama ruangan already exists (exclude current ruangan)
    if (nama && nama.trim() !== existingRuangan.nama) {
      const duplicateRuangan = await prisma.ruangan.findFirst({
        where: {
          nama: nama.trim(),
          isActive: true,
          id: { not: parseInt(id) }
        }
      });

      if (duplicateRuangan) {
        return res.status(400).json({
          success: false,
          message: 'Nama ruangan sudah ada'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (nama !== undefined) updateData.nama = nama.trim();
    if (kapasitas !== undefined) updateData.kapasitas = parseInt(kapasitas);
    if (fasilitas !== undefined) updateData.fasilitas = fasilitas?.trim() || null;
    if (lokasi !== undefined) updateData.lokasi = lokasi?.trim() || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedRuangan = await prisma.ruangan.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Ruangan berhasil diupdate',
      data: updatedRuangan
    });
  } catch (error) {
    console.error('Error updating ruangan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate ruangan',
      error: error.message
    });
  }
});

// DELETE /api/ruangan/:id - Soft delete ruangan (SEKJUR only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ruangan exists
    const existingRuangan = await prisma.ruangan.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            scheduleItems: {
              where: {
                prodiSchedule: {
                  status: { in: ['PUBLISHED', 'APPROVED'] }
                }
              }
            }
          }
        }
      }
    });

    if (!existingRuangan) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan'
      });
    }

    // Check if ruangan is being used in active schedules
    if (existingRuangan._count.scheduleItems > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus ruangan yang sedang digunakan dalam jadwal aktif'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.ruangan.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Ruangan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting ruangan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus ruangan',
      error: error.message
    });
  }
});

// GET /api/ruangan/availability/check - Check ketersediaan ruangan
router.get('/availability/check', async (req, res) => {
  try {
    const { hari, jamMulai, jamSelesai, ruanganId, excludeScheduleId } = req.query;

    if (!hari || !jamMulai || !jamSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Hari, jam mulai, dan jam selesai harus diisi'
      });
    }

    // Build where clause for conflict checking
    const conflictWhere = {
      hari,
      prodiSchedule: {
        status: { in: ['PUBLISHED', 'APPROVED'] }
      },
      OR: [
        // New schedule starts within existing schedule
        {
          AND: [
            { jamMulai: { lte: jamMulai } },
            { jamSelesai: { gt: jamMulai } }
          ]
        },
        // New schedule ends within existing schedule
        {
          AND: [
            { jamMulai: { lt: jamSelesai } },
            { jamSelesai: { gte: jamSelesai } }
          ]
        },
        // New schedule completely contains existing schedule
        {
          AND: [
            { jamMulai: { gte: jamMulai } },
            { jamSelesai: { lte: jamSelesai } }
          ]
        }
      ]
    };

    if (ruanganId) {
      conflictWhere.ruanganId = parseInt(ruanganId);
    }

    if (excludeScheduleId) {
      conflictWhere.prodiScheduleId = { not: parseInt(excludeScheduleId) };
    }

    const conflicts = await prisma.scheduleItem.findMany({
      where: conflictWhere,
      include: {
        ruangan: {
          select: { id: true, nama: true }
        },
        mataKuliah: {
          select: { id: true, nama: true }
        },
        dosen: {
          select: { nip: true, nama: true }
        },
        prodiSchedule: {
          select: {
            prodi: {
              select: { id: true, nama: true }
            }
          }
        }
      }
    });

    // If checking specific ruangan
    if (ruanganId) {
      const isAvailable = conflicts.length === 0;
      return res.json({
        success: true,
        data: {
          isAvailable,
          conflicts: conflicts
        }
      });
    }

    // If checking all ruangan, return availability for each
    const allRuangan = await prisma.ruangan.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' }
    });

    const availability = allRuangan.map(ruangan => {
      const ruanganConflicts = conflicts.filter(c => c.ruanganId === ruangan.id);
      return {
        ruangan,
        isAvailable: ruanganConflicts.length === 0,
        conflicts: ruanganConflicts
      };
    });

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error checking ruangan availability:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memeriksa ketersediaan ruangan',
      error: error.message
    });
  }
});

// GET /api/ruangan/utilization/stats - Get statistik utilisasi ruangan
router.get('/utilization/stats', async (req, res) => {
  try {
    const { periodId } = req.query;

    const whereClause = {
      prodiSchedule: {
        status: 'PUBLISHED'
      }
    };

    if (periodId) {
      whereClause.prodiSchedule.timetablePeriodId = parseInt(periodId);
    }

    const utilization = await prisma.ruangan.findMany({
      where: { isActive: true },
      include: {
        scheduleItems: {
          where: whereClause,
          select: {
            hari: true,
            jamMulai: true,
            jamSelesai: true,
            kapasitasMahasiswa: true
          }
        }
      },
      orderBy: { nama: 'asc' }
    });

    const stats = utilization.map(ruangan => {
      const totalSlots = ruangan.scheduleItems.length;
      const totalHours = ruangan.scheduleItems.reduce((sum, item) => {
        const start = new Date(`2024-01-01 ${item.jamMulai}`);
        const end = new Date(`2024-01-01 ${item.jamSelesai}`);
        return sum + (end - start) / (1000 * 60 * 60); // Convert to hours
      }, 0);

      const avgCapacityUsage = totalSlots > 0 ?
        ruangan.scheduleItems.reduce((sum, item) => sum + (item.kapasitasMahasiswa || 0), 0) / totalSlots : 0;

      const capacityUtilization = ruangan.kapasitas > 0 ? (avgCapacityUsage / ruangan.kapasitas) * 100 : 0;

      return {
        ruangan: {
          id: ruangan.id,
          nama: ruangan.nama,
          kapasitas: ruangan.kapasitas,
          lokasi: ruangan.lokasi
        },
        stats: {
          totalSlots,
          totalHours: Math.round(totalHours * 100) / 100,
          avgCapacityUsage: Math.round(avgCapacityUsage),
          capacityUtilization: Math.round(capacityUtilization * 100) / 100
        }
      };
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching ruangan utilization stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik utilisasi ruangan',
      error: error.message
    });
  }
});

module.exports = router;
