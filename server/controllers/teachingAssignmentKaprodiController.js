const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ensureKaprodiRole = (user) => {
  if (!user || user.role !== 'KAPRODI') {
    const err = new Error('Hanya kaprodi yang dapat mengakses');
    err.status = 403;
    throw err;
  }
};

// Get semua usulan dari dosen (PENDING_APPROVAL)
const getPendingApprovals = async (req, res) => {
  try {
    ensureKaprodiRole(req.user);
    const { tahunAjaran } = req.query;
    
    const where = {
      status: 'PENDING_APPROVAL',
      assignedBy: 'DOSEN'
    };
    
    if (req.user.programStudiId) {
      where.mataKuliah = {
        programStudiId: req.user.programStudiId
      };
    }
    
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;

    const items = await prisma.penugasanMengajar.findMany({
      where,
      include: {
        mataKuliah: { include: { programStudi: true } },
        dosen: true
      },
      orderBy: [{ createdAt: 'desc' }]
    });

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('getPendingApprovals error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal mengambil data' });
  }
};

// Get semua penugasan dengan filter
const getAllAssignments = async (req, res) => {
  try {
    ensureKaprodiRole(req.user);
    const { tahunAjaran, status, dosenId, mataKuliahId } = req.query;
    
    const where = {};
    
    if (req.user.programStudiId) {
      where.mataKuliah = {
        programStudiId: req.user.programStudiId
      };
    }
    
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;
    if (status) where.status = status;
    if (dosenId) where.dosenId = dosenId;
    if (mataKuliahId) where.mataKuliahId = parseInt(mataKuliahId);

    const items = await prisma.penugasanMengajar.findMany({
      where,
      include: {
        mataKuliah: { include: { programStudi: true } },
        dosen: true
      },
      orderBy: [{ tahunAjaran: 'desc' }, { mataKuliah: { semester: 'asc' } }, { createdAt: 'desc' }]
    });

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('getAllAssignments error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal mengambil data' });
  }
};

// Approve usulan dosen
const approveAssignment = async (req, res) => {
  try {
    ensureKaprodiRole(req.user);
    const { id } = req.params;
    
    const existing = await prisma.penugasanMengajar.findUnique({
      where: { id: Number(id) },
      include: { mataKuliah: true }
    });
    
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }
    
    if (req.user.programStudiId && existing.mataKuliah.programStudiId !== req.user.programStudiId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk mata kuliah ini' });
    }
    
    if (existing.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Penugasan ini sudah tidak dalam status pending' });
    }
    
    // Cek apakah sudah ada ACTIVE untuk MK ini di tahun ajaran ini
    const existingActive = await prisma.penugasanMengajar.findFirst({
      where: {
        mataKuliahId: existing.mataKuliahId,
        tahunAjaran: existing.tahunAjaran,
        status: 'ACTIVE',
        id: { not: existing.id }
      }
    });
    
    if (existingActive) {
      return res.status(409).json({ success: false, message: 'Mata kuliah ini sudah diambil dosen lain di periode ini' });
    }
    
    // Update status ke ACTIVE
    const updated = await prisma.penugasanMengajar.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        approvedBy: req.user.username,
        approvedAt: new Date()
      },
      include: {
        mataKuliah: { include: { programStudi: true } },
        dosen: true
      }
    });
    
    return res.json({ success: true, data: updated, message: 'Penugasan disetujui' });
  } catch (error) {
    console.error('approveAssignment error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal menyetujui penugasan' });
  }
};

// Reject usulan dosen
const rejectAssignment = async (req, res) => {
  try {
    ensureKaprodiRole(req.user);
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const existing = await prisma.penugasanMengajar.findUnique({
      where: { id: Number(id) },
      include: { mataKuliah: true }
    });
    
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }
    
    if (req.user.programStudiId && existing.mataKuliah.programStudiId !== req.user.programStudiId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk mata kuliah ini' });
    }
    
    if (existing.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Penugasan ini sudah tidak dalam status pending' });
    }
    const updated = await prisma.penugasanMengajar.update({
      where: { id: existing.id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Tidak disebutkan',
        approvedBy: req.user.username,
        approvedAt: new Date()
      },
      include: {
        mataKuliah: { include: { programStudi: true } },
        dosen: true
      }
    });
    
    return res.json({ success: true, data: updated, message: 'Penugasan ditolak' });
  } catch (error) {
    console.error('rejectAssignment error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal menolak penugasan' });
  }
};

// Reassign ke dosen lain
const reassignToDosen = async (req, res) => {
  try {
    ensureKaprodiRole(req.user);
    const { id } = req.params;
    const { dosenId } = req.body;
    
    if (!dosenId) {
      return res.status(400).json({ success: false, message: 'dosenId wajib diisi' });
    }
    
    const existing = await prisma.penugasanMengajar.findUnique({
      where: { id: Number(id) },
      include: { mataKuliah: true }
    });
    
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }
    
    if (req.user.programStudiId && existing.mataKuliah.programStudiId !== req.user.programStudiId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk mata kuliah ini' });
    }
    
    const dosenExists = await prisma.dosen.findUnique({
      where: { nip: dosenId }
    });
    
    if (!dosenExists) {
      return res.status(404).json({ success: false, message: 'Dosen tidak ditemukan' });
    }
    
    // Cek apakah dosen baru sudah punya assignment ACTIVE untuk MK ini di tahun ajaran ini
    const existingActive = await prisma.penugasanMengajar.findFirst({
      where: {
        mataKuliahId: existing.mataKuliahId,
        tahunAjaran: existing.tahunAjaran,
        status: 'ACTIVE',
        dosenId: dosenId,
        id: { not: existing.id }
      }
    });
    
    if (existingActive) {
      return res.status(409).json({ success: false, message: 'Dosen ini sudah memiliki penugasan aktif untuk mata kuliah ini di periode yang sama' });
    }
    
    // Cancel assignment lama jika ada ACTIVE
    if (existing.status === 'ACTIVE') {
      await prisma.penugasanMengajar.updateMany({
        where: {
          mataKuliahId: existing.mataKuliahId,
          tahunAjaran: existing.tahunAjaran,
          status: 'ACTIVE'
        },
        data: { status: 'CANCELLED' }
      });
    }
    
    // Update assignment ke dosen baru
    const updated = await prisma.penugasanMengajar.update({
      where: { id: existing.id },
      data: {
        dosenId: dosenId,
        status: 'ACTIVE',
        assignedBy: 'KAPRODI',
        assignedById: req.user.username,
        approvedBy: req.user.username,
        approvedAt: new Date(),
        rejectionReason: null
      },
      include: {
        mataKuliah: { include: { programStudi: true } },
        dosen: true
      }
    });
    
    return res.json({ success: true, data: updated, message: 'Penugasan dialihkan ke dosen lain' });
  } catch (error) {
    console.error('reassignToDosen error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal mengalihkan penugasan' });
  }
};

// Kaprodi assign langsung (create new assignment)
const assignDirectly = async (req, res) => {
  try {
    ensureKaprodiRole(req.user);
    const { mataKuliahId, dosenId, tahunAjaran } = req.body;
    
    if (!mataKuliahId || !dosenId || !tahunAjaran) {
      return res.status(400).json({ success: false, message: 'mataKuliahId, dosenId, tahunAjaran wajib diisi' });
    }
    
    const mk = await prisma.mataKuliah.findUnique({ where: { id: Number(mataKuliahId) } });
    if (!mk) return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    
    if (req.user.programStudiId && mk.programStudiId !== req.user.programStudiId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk mata kuliah ini' });
    }
    
    // Cek dosen exists
    const dosen = await prisma.dosen.findUnique({ where: { nip: dosenId } });
    if (!dosen) return res.status(404).json({ success: false, message: 'Dosen tidak ditemukan' });
    
    // Semester otomatis mengikuti semester kurikulum MK
    const semester = mk.semester;
    
    // Cek apakah sudah ada ACTIVE untuk MK ini di tahun ajaran ini
    const existingActive = await prisma.penugasanMengajar.findFirst({
      where: {
        mataKuliahId: Number(mataKuliahId),
        tahunAjaran,
        status: 'ACTIVE'
      }
    });
    
    if (existingActive) {
      // Jika sudah ada, reassign
      const updated = await prisma.penugasanMengajar.update({
        where: { id: existingActive.id },
        data: {
          dosenId,
          assignedBy: 'KAPRODI',
          assignedById: req.user.username,
          approvedBy: req.user.username,
          approvedAt: new Date()
        },
        include: {
          mataKuliah: { include: { programStudi: true } },
          dosen: true
        }
      });
      return res.json({ success: true, data: updated, message: 'Penugasan diupdate' });
    }
    
    // Create new assignment
    const created = await prisma.penugasanMengajar.create({
      data: {
        mataKuliahId: Number(mataKuliahId),
        dosenId,
        tahunAjaran,
        semester: semester, // Menggunakan semester kurikulum dari MK
        status: 'ACTIVE',
        assignedBy: 'KAPRODI',
        assignedById: req.user.username,
        approvedBy: req.user.username,
        approvedAt: new Date()
      },
      include: {
        mataKuliah: { include: { programStudi: true } },
        dosen: true
      }
    });
    
    return res.status(201).json({ success: true, data: created, message: 'Penugasan berhasil dibuat' });
  } catch (error) {
    console.error('assignDirectly error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Penugasan sudah ada untuk periode ini' });
    }
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal membuat penugasan' });
  }
};

// Cancel assignment
const cancelAssignment = async (req, res) => {
  try {
    ensureKaprodiRole(req.user);
    const { id } = req.params;
    
    const existing = await prisma.penugasanMengajar.findUnique({
      where: { id: Number(id) },
      include: { mataKuliah: true }
    });
    
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }
    
    if (req.user.programStudiId && existing.mataKuliah.programStudiId !== req.user.programStudiId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk mata kuliah ini' });
    }
    
    const updated = await prisma.penugasanMengajar.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' },
      include: {
        mataKuliah: { include: { programStudi: true } },
        dosen: true
      }
    });
    
    return res.json({ success: true, data: updated, message: 'Penugasan dibatalkan' });
  } catch (error) {
    console.error('cancelAssignment error:', error);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Gagal membatalkan penugasan' });
  }
};

module.exports = {
  getPendingApprovals,
  getAllAssignments,
  approveAssignment,
  rejectAssignment,
  reassignToDosen,
  assignDirectly,
  cancelAssignment
};

