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
    const { tahunAjaran } = req.query;
    if (!tahunAjaran) {
      return res.status(400).json({ success: false, message: 'tahunAjaran wajib diisi' });
    }

    // MK di prodi dosen dan belum diassign ACTIVE pada tahun ajaran tsb
    // Semester mengikuti semester kurikulum MK (mataKuliah.semester)
    const available = await prisma.mataKuliah.findMany({
      where: {
        programStudiId: req.user.prodiId || undefined,
        penugasanMengajar: {
          none: {
            tahunAjaran,
            status: 'ACTIVE'
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
    const { mataKuliahId, tahunAjaran } = req.body;
    if (!mataKuliahId || !tahunAjaran) {
      return res.status(400).json({ success: false, message: 'mataKuliahId dan tahunAjaran wajib diisi' });
    }

    // Cek MK dalam prodi dosen
    const mk = await prisma.mataKuliah.findUnique({ where: { id: Number(mataKuliahId) } });
    if (!mk) return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    if (req.user.role === 'DOSEN' && req.user.prodiId && mk.programStudiId !== req.user.prodiId) {
      return res.status(403).json({ success: false, message: 'Tidak berhak mengambil MK di prodi lain' });
    }

    // Semester otomatis mengikuti semester kurikulum MK
    const semester = mk.semester;

    // Cek apakah sudah ada assignment ACTIVE untuk MK ini di tahun ajaran ini
    const existingActive = await prisma.penugasanMengajar.findFirst({
      where: {
        mataKuliahId: Number(mataKuliahId),
        tahunAjaran,
        status: 'ACTIVE'
      }
    });

    if (existingActive) {
      return res.status(409).json({ success: false, message: 'Mata kuliah sudah diambil dosen lain di tahun ajaran ini' });
    }

    // Jika DOSEN request, status = PENDING_APPROVAL
    // Jika KAPRODI assign langsung, status = ACTIVE
    const isDosen = req.user.role === 'DOSEN';
    const dosenId = req.user.nip || req.user.username;

    const assignmentData = {
      mataKuliahId: Number(mataKuliahId),
      dosenId,
      tahunAjaran,
      semester: semester, // Menggunakan semester kurikulum dari MK
      status: isDosen ? 'PENDING_APPROVAL' : 'ACTIVE',
      assignedBy: isDosen ? 'DOSEN' : 'KAPRODI',
      assignedById: dosenId,
      ...(isDosen && { requestedBy: dosenId }),
      ...(!isDosen && { approvedBy: dosenId, approvedAt: new Date() })
    };

    // Insert assignment
    try {
      const created = await prisma.penugasanMengajar.create({
        data: assignmentData,
        include: { 
          mataKuliah: { include: { programStudi: true } },
          dosen: true
        }
      });
      return res.status(201).json({ success: true, data: created });
    } catch (e) {
      if (e.code === 'P2002') {
        // Cek apakah sudah ada pending request
        const existingPending = await prisma.penugasanMengajar.findFirst({
          where: {
            mataKuliahId: Number(mataKuliahId),
            tahunAjaran,
            status: 'PENDING_APPROVAL',
            dosenId
          }
        });
        if (existingPending) {
          return res.status(409).json({ success: false, message: 'Anda sudah mengajukan mata kuliah ini, menunggu persetujuan' });
        }
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
    const { tahunAjaran, status } = req.query;
    const where = { dosenId: req.user.nip || req.user.username };
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;
    if (status) where.status = status;

    const items = await prisma.penugasanMengajar.findMany({
      where,
      include: { 
        mataKuliah: { include: { programStudi: true } },
        dosen: true
      },
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
    
    // Update status ke CANCELLED instead of delete
    await prisma.penugasanMengajar.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' }
    });
    return res.json({ success: true, message: 'Assignment dibatalkan' });
  } catch (error) {
    console.error('unassign error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal membatalkan assignment' });
  }
};

module.exports = { listAvailableByDosen, assign, myAssignments, unassign };


