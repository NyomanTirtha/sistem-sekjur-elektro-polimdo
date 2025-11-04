const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ensureDosenRole = (user) => {
  if (!user || (user.role !== 'DOSEN' && user.role !== 'KAPRODI')) {
    const err = new Error('Hanya dosen/kaprodi yang dapat mengakses');
    err.status = 403;
    throw err;
  }
};

const listAvailableByDosen = async (req, res) => {
  try {
    ensureDosenRole(req.user);
    const { tahunAjaran, semester } = req.query;
    if (!tahunAjaran || !semester) {
      return res.status(400).json({ success: false, message: 'tahunAjaran dan semester wajib diisi' });
    }

    // MK di prodi dosen dan belum diassign pada periode tsb
    const available = await prisma.mataKuliah.findMany({
      where: {
        programStudiId: req.user.prodiId || undefined,
        penugasanMengajar: {
          none: {
            tahunAjaran,
            semester: parseInt(semester)
          }
        }
      },
      include: { programStudi: true },
      orderBy: [{ semester: 'asc' }, { nama: 'asc' }]
    });

    return res.json({ success: true, data: available });
  } catch (error) {
    console.error('listAvailable error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal mengambil data' });
  }
};

const assign = async (req, res) => {
  try {
    ensureDosenRole(req.user);
    const { mataKuliahId, tahunAjaran, semester } = req.body;
    if (!mataKuliahId || !tahunAjaran || !semester) {
      return res.status(400).json({ success: false, message: 'mataKuliahId, tahunAjaran, semester wajib diisi' });
    }

    // Cek MK dalam prodi dosen
    const mk = await prisma.mataKuliah.findUnique({ where: { id: Number(mataKuliahId) } });
    if (!mk) return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    if (req.user.role === 'DOSEN' && req.user.prodiId && mk.programStudiId !== req.user.prodiId) {
      return res.status(403).json({ success: false, message: 'Tidak berhak mengambil MK di prodi lain' });
    }

    // Insert assignment
    try {
      const created = await prisma.penugasanMengajar.create({
        data: {
          mataKuliahId: Number(mataKuliahId),
          dosenId: req.user.nip || req.user.username, // username dosen = NIP
          tahunAjaran,
          semester: parseInt(semester)
        },
        include: { mataKuliah: { include: { programStudi: true } } }
      });
      return res.status(201).json({ success: true, data: created });
    } catch (e) {
      if (e.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Mata kuliah sudah diambil dosen lain' });
      }
      throw e;
    }
  } catch (error) {
    console.error('assign error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal mengambil mata kuliah' });
  }
};

const myAssignments = async (req, res) => {
  try {
    ensureDosenRole(req.user);
    const { tahunAjaran, semester } = req.query;
    const where = { dosenId: req.user.nip || req.user.username };
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;
    if (semester) where.semester = parseInt(semester);

    const items = await prisma.penugasanMengajar.findMany({
      where,
      include: { mataKuliah: { include: { programStudi: true } } },
      orderBy: [{ tahunAjaran: 'desc' }, { semester: 'desc' }]
    });
    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('myAssignments error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal mengambil assignment' });
  }
};

const unassign = async (req, res) => {
  try {
    ensureDosenRole(req.user);
    const { id } = req.params;
    const existing = await prisma.penugasanMengajar.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Assignment tidak ditemukan' });
    // hanya pemilik atau kaprodi
    if (req.user.role !== 'KAPRODI' && existing.dosenId !== (req.user.nip || req.user.username)) {
      return res.status(403).json({ success: false, message: 'Tidak berhak membatalkan assignment ini' });
    }
    await prisma.penugasanMengajar.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'Assignment dibatalkan' });
  } catch (error) {
    console.error('unassign error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal membatalkan assignment' });
  }
};

module.exports = { listAvailableByDosen, assign, myAssignments, unassign };


