const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// =====================================================
// PENUGASAN MENGAJAR ROUTES
// =====================================================

// GET /api/penugasan/my-requests - Dosen melihat daftar pengajuan tugas mengajarnya
router.get("/my-requests", async (req, res) => {
  try {
    const dosenNip = req.user.username;
    if (req.user.role !== 'DOSEN') {
        return res.status(403).json({ success: false, message: "Hanya dosen yang dapat mengakses." });
    }

    const requests = await prisma.penugasanMengajar.findMany({
      where: { dosenId: dosenNip },
      include: {
        mataKuliah: { select: { nama: true, sks: true, semester: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching my teaching assignments:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data pengajuan." });
  }
});

// POST /api/penugasan/request - Dosen mengajukan diri untuk sebuah mata kuliah
router.post("/request", async (req, res) => {
  const { mataKuliahId } = req.body;
  const dosenNip = req.user.username;

  try {
    if (req.user.role !== 'DOSEN') {
        return res.status(403).json({ success: false, message: "Hanya dosen yang dapat mengajukan." });
    }
     if (!mataKuliahId) {
        return res.status(400).json({ success: false, message: "Mata kuliah harus dipilih." });
    }

    const dosen = await prisma.dosen.findUnique({ where: { nip: dosenNip } });
    const mataKuliah = await prisma.mataKuliah.findUnique({ where: { id: parseInt(mataKuliahId) } });

    if (!dosen || !mataKuliah || dosen.prodiId !== mataKuliah.programStudiId) {
        return res.status(400).json({ success: false, message: "Mata kuliah tidak valid atau tidak sesuai dengan prodi Anda." });
    }

    // Ambil periode aktif untuk menentukan tahun ajaran dan semester
    const activePeriod = await prisma.timetablePeriod.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
    });

    if (!activePeriod) {
        return res.status(400).json({ success: false, message: "Saat ini tidak ada periode akademik yang aktif untuk membuat pengajuan." });
    }

    // Cek apakah sudah ada pengajuan untuk matkul & periode yang sama
    const existingAssignment = await prisma.penugasanMengajar.findFirst({
        where: {
            dosenId: dosenNip,
            mataKuliahId: parseInt(mataKuliahId),
            tahunAjaran: activePeriod.tahunAkademik,
            semester: activePeriod.semester === 'GANJIL' ? 1 : 2, // Asumsi semester ganjil/genap
        }
    });

    if (existingAssignment) {
        return res.status(400).json({ success: false, message: "Anda sudah pernah mengajukan mata kuliah ini untuk periode sekarang." });
    }

    const newAssignment = await prisma.penugasanMengajar.create({
      data: {
        mataKuliahId: parseInt(mataKuliahId),
        dosenId: dosenNip,
        tahunAjaran: activePeriod.tahunAkademik,
        semester: activePeriod.semester === 'GANJIL' ? 1 : 2, // Asumsi semester ganjil/genap
        status: "PENDING_APPROVAL",
        assignedBy: "DOSEN",
        assignedById: dosenNip,
        requestedBy: dosenNip,
      },
    });

    res.status(201).json({ success: true, message: "Pengajuan berhasil dikirim ke Kaprodi untuk verifikasi.", data: newAssignment });
  } catch (error) {
    console.error("Error creating teaching assignment request:", error);
    res.status(500).json({ success: false, message: "Gagal membuat pengajuan." });
  }
});


// GET /api/penugasan/for-kaprodi - Kaprodi melihat daftar pengajuan di prodinya
router.get("/for-kaprodi", async (req, res) => {
    try {
        const kaprodiUsername = req.user.username;
        if (req.user.role !== 'KAPRODI') {
            return res.status(403).json({ success: false, message: "Hanya Kaprodi yang dapat mengakses." });
        }

        const user = await prisma.user.findUnique({
            where: { username: kaprodiUsername },
            select: { programStudiId: true }
        });

        if (!user || !user.programStudiId) {
            return res.status(400).json({ success: false, message: "User tidak terkait dengan program studi." });
        }

        const assignments = await prisma.penugasanMengajar.findMany({
            where: {
                mataKuliah: {
                    programStudiId: user.programStudiId
                },
                status: 'PENDING_APPROVAL'
            },
            include: {
                dosen: { select: { nama: true, nip: true } },
                mataKuliah: { select: { nama: true, sks: true, semester: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ success: true, data: assignments });

    } catch (error)
    {
        console.error("Error fetching assignments for Kaprodi:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil data pengajuan." });
    }
});

// POST /api/penugasan/:id/approve - Kaprodi menyetujui pengajuan
router.post("/:id/approve", async (req, res) => {
    const { id } = req.params;
    const kaprodiUsername = req.user.username;

    try {
        if (req.user.role !== 'KAPRODI') {
            return res.status(403).json({ success: false, message: "Hanya Kaprodi yang dapat menyetujui." });
        }

        const assignment = await prisma.penugasanMengajar.findUnique({ where: { id: parseInt(id) }});
        if (!assignment || assignment.status !== 'PENDING_APPROVAL') {
            return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan atau sudah diproses." });
        }

        const updatedAssignment = await prisma.penugasanMengajar.update({
            where: { id: parseInt(id) },
            data: {
                status: 'ACTIVE',
                approvedBy: kaprodiUsername,
                approvedAt: new Date()
            }
        });

        res.json({ success: true, message: "Pengajuan telah disetujui.", data: updatedAssignment });

    } catch (error) {
        console.error("Error approving assignment:", error);
        res.status(500).json({ success: false, message: "Gagal menyetujui pengajuan." });
    }
});

// POST /api/penugasan/:id/reject - Kaprodi menolak pengajuan
router.post("/:id/reject", async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const kaprodiUsername = req.user.username;

    try {
        if (req.user.role !== 'KAPRODI') {
            return res.status(403).json({ success: false, message: "Hanya Kaprodi yang dapat menolak." });
        }

        const assignment = await prisma.penugasanMengajar.findUnique({ where: { id: parseInt(id) }});
        if (!assignment || assignment.status !== 'PENDING_APPROVAL') {
            return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan atau sudah diproses." });
        }

        const updatedAssignment = await prisma.penugasanMengajar.update({
            where: { id: parseInt(id) },
            data: {
                status: 'REJECTED',
                approvedBy: kaprodiUsername, // Tetap catat siapa yg proses
                rejectionReason: reason || 'Ditolak oleh Kaprodi'
            }
        });

        res.json({ success: true, message: "Pengajuan telah ditolak.", data: updatedAssignment });

    } catch (error) {
        console.error("Error rejecting assignment:", error);
        res.status(500).json({ success: false, message: "Gagal menolak pengajuan." });
    }
});


module.exports = router;
