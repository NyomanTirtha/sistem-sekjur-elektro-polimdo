const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all preferences for the logged-in dosen
const getMyPreferences = async (req, res) => {
  try {
    const dosenNip = req.user.username; // NIP dari token

    const preferences = await prisma.dosenPreference.findMany({
      where: {
        dosenNip: dosenNip
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data preferensi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all preferences (for admin/kaprodi)
const getAllPreferences = async (req, res) => {
  try {
    const preferences = await prisma.dosenPreference.findMany({
      include: {
        dosen: {
          select: {
            nip: true,
            nama: true,
            prodi: {
              select: {
                nama: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching all preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data preferensi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get preference by ID
const getPreferenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const dosenNip = req.user.username;

    const preference = await prisma.dosenPreference.findFirst({
      where: {
        id: parseInt(id),
        dosenNip: dosenNip // Ensure dosen can only access their own preference
      }
    });

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: 'Preferensi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: preference
    });
  } catch (error) {
    console.error('Error fetching preference:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data preferensi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new preference
const createPreference = async (req, res) => {
  try {
    const dosenNip = req.user.username;
    const {
      preferredDays,
      avoidedDays,
      preferredTimeSlot,
      maxDaysPerWeek,
      unavailableSlots,
      priority,
      notes
    } = req.body;

    // Validation
    if (!preferredTimeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Preferensi waktu mengajar wajib diisi'
      });
    }

    // Check if dosen exists
    const dosen = await prisma.dosen.findUnique({
      where: { nip: dosenNip }
    });

    if (!dosen) {
      return res.status(404).json({
        success: false,
        message: 'Data dosen tidak ditemukan'
      });
    }

    const preference = await prisma.dosenPreference.create({
      data: {
        dosenNip: dosenNip,
        preferredDays: preferredDays ? (Array.isArray(preferredDays) ? preferredDays.join(',') : preferredDays) : null,
        avoidedDays: avoidedDays ? (Array.isArray(avoidedDays) ? avoidedDays.join(',') : avoidedDays) : null,
        preferredTimeSlot: preferredTimeSlot || 'BOTH',
        maxDaysPerWeek: maxDaysPerWeek ? parseInt(maxDaysPerWeek) : 5,
        unavailableSlots: unavailableSlots ? JSON.stringify(unavailableSlots) : null,
        priority: priority || 'NORMAL',
        notes: notes || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Preferensi berhasil ditambahkan',
      data: preference
    });
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan preferensi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update preference
const updatePreference = async (req, res) => {
  try {
    const { id } = req.params;
    const dosenNip = req.user.username;
    const {
      preferredDays,
      avoidedDays,
      preferredTimeSlot,
      maxDaysPerWeek,
      unavailableSlots,
      priority,
      notes
    } = req.body;

    // Check if preference exists and belongs to the dosen
    const existingPreference = await prisma.dosenPreference.findFirst({
      where: {
        id: parseInt(id),
        dosenNip: dosenNip
      }
    });

    if (!existingPreference) {
      return res.status(404).json({
        success: false,
        message: 'Preferensi tidak ditemukan'
      });
    }

    const updatedPreference = await prisma.dosenPreference.update({
      where: {
        id: parseInt(id)
      },
      data: {
        preferredDays: preferredDays ? (Array.isArray(preferredDays) ? preferredDays.join(',') : preferredDays) : null,
        avoidedDays: avoidedDays ? (Array.isArray(avoidedDays) ? avoidedDays.join(',') : avoidedDays) : null,
        preferredTimeSlot: preferredTimeSlot || 'BOTH',
        maxDaysPerWeek: maxDaysPerWeek ? parseInt(maxDaysPerWeek) : 5,
        unavailableSlots: unavailableSlots ? JSON.stringify(unavailableSlots) : null,
        priority: priority || 'NORMAL',
        notes: notes || null,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Preferensi berhasil diperbarui',
      data: updatedPreference
    });
  } catch (error) {
    console.error('Error updating preference:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui preferensi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete preference
const deletePreference = async (req, res) => {
  try {
    const { id } = req.params;
    const dosenNip = req.user.username;

    // Check if preference exists and belongs to the dosen
    const existingPreference = await prisma.dosenPreference.findFirst({
      where: {
        id: parseInt(id),
        dosenNip: dosenNip
      }
    });

    if (!existingPreference) {
      return res.status(404).json({
        success: false,
        message: 'Preferensi tidak ditemukan'
      });
    }

    await prisma.dosenPreference.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.json({
      success: true,
      message: 'Preferensi berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting preference:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus preferensi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getMyPreferences,
  getAllPreferences,
  getPreferenceById,
  createPreference,
  updatePreference,
  deletePreference
};
