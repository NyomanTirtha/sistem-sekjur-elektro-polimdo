const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mengambil semua pengajuan SA berdasarkan status
const getAllPengajuanSA = async (req, res) => {
  try {
    const { status } = req.query;
    
    if (status === 'PROSES_PENGAJUAN' || status === 'DITOLAK') {
      // Tampil sebagai grouped (1 baris per pengajuan)
      const pengajuanSA = await prisma.pengajuanSA.findMany({
        where: status ? { status } : {},
        include: {
          mahasiswa: true,
          details: {
            include: {
              mataKuliah: true
              // TIDAK include keterangan karena tidak ada di detail
            }
          }
        },
        orderBy: {
          tanggalPengajuan: 'desc'
        }
      });

      // Transform data untuk tampilan grouped
      const transformedData = pengajuanSA.map(pengajuan => ({
        id: pengajuan.id,
        mahasiswa: pengajuan.mahasiswa,
        mataKuliah: pengajuan.details.map(d => d.mataKuliah.nama).join(', '),
        mataKuliahList: pengajuan.details.map(d => ({
          id: d.mataKuliah.id,
          nama: d.mataKuliah.nama,
          sks: d.mataKuliah.sks,
          semester: d.mataKuliah.semester
        })),
        totalSKS: pengajuan.details.reduce((sum, d) => sum + d.mataKuliah.sks, 0),
        jumlahMataKuliah: pengajuan.details.length,
        buktiPembayaran: pengajuan.buktiPembayaran,
        tanggalPengajuan: pengajuan.tanggalPengajuan,
        semesterPengajuan: pengajuan.semesterPengajuan,
        status: pengajuan.status,
        keterangan: pengajuan.keterangan, // Dari master table
        nominal: pengajuan.nominal,
        keteranganReject: pengajuan.keteranganReject,
        isGrouped: true,
        dosen: pengajuan.details[0]?.dosen || null,
        dosenId: pengajuan.details[0]?.dosenId || null
      }));

      res.json(transformedData);
    } else {
      // Tampil sebagai detailed (multiple baris per mata kuliah)
      const pengajuanDetails = await prisma.pengajuanSADetail.findMany({
        where: status ? {
          pengajuanSA: { status }
        } : {},
        include: {
          pengajuanSA: {
            include: { mahasiswa: true }
          },
          mataKuliah: true,
          dosen: true
          // TIDAK include keterangan karena tidak ada di detail
        },
        orderBy: {
          pengajuanSA: {
            tanggalPengajuan: 'desc'
          }
        }
      });

      // Transform data untuk tampilan detailed
      const transformedData = pengajuanDetails.map(detail => ({
        id: detail.id,
        pengajuanSAId: detail.pengajuanSAId,
        mahasiswa: detail.pengajuanSA.mahasiswa,
        mataKuliah: {
          ...detail.mataKuliah,
          semester: detail.mataKuliah.semester
        },
        dosen: detail.dosen,
        nilaiAkhir: detail.nilaiAkhir,
        buktiPembayaran: detail.pengajuanSA.buktiPembayaran,
        tanggalPengajuan: detail.pengajuanSA.tanggalPengajuan,
        semesterPengajuan: detail.pengajuanSA.semesterPengajuan,
        status: detail.pengajuanSA.status,
        keterangan: detail.pengajuanSA.keterangan,
        nominal: detail.pengajuanSA.nominal,
        totalSKS: detail.mataKuliah?.sks || 0,
        isGrouped: false
      }));

      res.json(transformedData);
    }
  } catch (error) {
    console.error('Error getting all pengajuan SA:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mengambil pengajuan SA berdasarkan mahasiswa
const getPengajuanSAByMahasiswa = async (req, res) => {
  try {
    const mahasiswaId = req.params.mahasiswaId;
    
    console.log('Getting pengajuan SA for mahasiswa:', mahasiswaId);
    
    const pengajuanSA = await prisma.pengajuanSA.findMany({
      where: { 
        mahasiswaId: mahasiswaId
      },
      include: {
        mahasiswa: true,
        details: {
          include: {
            mataKuliah: true,
            dosen: true
            // TIDAK include keterangan karena tidak ada di detail
          }
        }
      },
      orderBy: {
        tanggalPengajuan: 'desc'
      }
    });
    
    // Transform data untuk mahasiswa (selalu tampil dengan detail mata kuliah)
    const transformedData = pengajuanSA.map(pengajuan => ({
      id: pengajuan.id,
      mahasiswa: pengajuan.mahasiswa,
      details: pengajuan.details.map(detail => ({
        id: detail.id,
        mataKuliah: {
          ...detail.mataKuliah,
          semester: detail.mataKuliah.semester
        },
        dosen: detail.dosen,
        nilaiAkhir: detail.nilaiAkhir
        // TIDAK include keterangan karena tidak ada di detail
      })),
      buktiPembayaran: pengajuan.buktiPembayaran,
      tanggalPengajuan: pengajuan.tanggalPengajuan,
      semesterPengajuan: pengajuan.semesterPengajuan,
      status: pengajuan.status,
      keterangan: pengajuan.keterangan, // Dari master table
      nominal: pengajuan.nominal,
      keteranganReject: pengajuan.keteranganReject
    }));
    
    console.log('Found pengajuan SA:', transformedData.length);
    res.json(transformedData);
  } catch (error) {
    console.error('Error getting pengajuan SA by mahasiswa:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mengambil pengajuan SA berdasarkan dosen
const getPengajuanSAByDosen = async (req, res) => {
  try {
    const dosenId = req.params.dosenId;
    
    const pengajuanDetails = await prisma.pengajuanSADetail.findMany({
      where: { 
        dosenId: dosenId,
        pengajuanSA: {
          status: {
            in: ['DALAM_PROSES_SA', 'SELESAI']
          }
        }
      },
      include: {
        pengajuanSA: {
          include: {
            mahasiswa: true
          }
        },
        mataKuliah: true,
        dosen: true
      },
      orderBy: {
        pengajuanSA: {
          tanggalPengajuan: 'desc'
        }
      }
    });
    
    // Transform data untuk dosen (selalu tampil dengan detail mata kuliah)
    const transformedData = pengajuanDetails.map(detail => ({
      id: detail.id,
      pengajuanSAId: detail.pengajuanSAId,
      mahasiswa: detail.pengajuanSA.mahasiswa,
      mataKuliah: {
        ...detail.mataKuliah,
        semester: detail.mataKuliah.semester
      },
      dosen: detail.dosen,
      nilaiAkhir: detail.nilaiAkhir,
      buktiPembayaran: detail.pengajuanSA.buktiPembayaran,
      tanggalPengajuan: detail.pengajuanSA.tanggalPengajuan,
      semesterPengajuan: detail.pengajuanSA.semesterPengajuan,
      status: detail.pengajuanSA.status,
      keterangan: detail.pengajuanSA.keterangan,
      nominal: detail.pengajuanSA.nominal,
      isGrouped: false
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error getting pengajuan SA by dosen:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get pengajuan SA by ID dengan semua details
const getPengajuanSAById = async (req, res) => {
  try {
    const pengajuanId = parseInt(req.params.id);
    
    const pengajuanSA = await prisma.pengajuanSA.findUnique({
      where: { id: pengajuanId },
      include: {
        mahasiswa: true,
        details: {
          include: {
            mataKuliah: true,
            dosen: true
            // TIDAK include keterangan karena tidak ada di detail
          }
        }
      }
    });

    if (!pengajuanSA) {
      return res.status(404).json({ error: 'Pengajuan SA tidak ditemukan' });
    }

    res.json(pengajuanSA);
  } catch (error) {
    console.error('Error getting pengajuan SA by ID:', error);
    res.status(500).json({ error: error.message });
  }
};

// Menambahkan pengajuan SA baru dengan multiple mata kuliah
const createPengajuanSA = async (req, res) => {
  try {
    const { mahasiswaId, keterangan, nominal, mataKuliahIds } = req.body;
    
    console.log('=== DEBUG CREATE PENGAJUAN SA ===');
    console.log('Received req.body:', req.body);
    console.log('Received req.file:', req.file);
    console.log('mataKuliahIds raw:', mataKuliahIds);
    console.log('mataKuliahIds type:', typeof mataKuliahIds);
    
    // Validasi file
    if (!req.file) {
      return res.status(400).json({ error: 'Bukti pembayaran harus diupload' });
    }
    
    // Validasi mahasiswa ID
    if (!mahasiswaId) {
      return res.status(400).json({ error: 'Mahasiswa ID harus diisi' });
    }

    // Validasi nominal
    if (!nominal || parseFloat(nominal) <= 0) {
      return res.status(400).json({ error: 'Nominal harus diisi dan lebih dari 0' });
    }

    // Parse mataKuliahIds
    let parsedMataKuliahIds;
    try {
      if (typeof mataKuliahIds === 'string') {
        // Coba parse sebagai JSON
        try {
          parsedMataKuliahIds = JSON.parse(mataKuliahIds);
        } catch {
          // Jika gagal, coba parse sebagai comma-separated
          parsedMataKuliahIds = mataKuliahIds.split(',').map(id => parseInt(id.trim()));
        }
      } else if (Array.isArray(mataKuliahIds)) {
        parsedMataKuliahIds = mataKuliahIds.map(id => parseInt(id));
      } else {
        // Check untuk format array mataKuliahIds[0], mataKuliahIds[1]
        const keys = Object.keys(req.body);
        const arrayKeys = keys.filter(key => key.startsWith('mataKuliahIds['));
        
        if (arrayKeys.length > 0) {
          parsedMataKuliahIds = arrayKeys
            .sort()
            .map(key => parseInt(req.body[key]));
        }
      }
    } catch (parseError) {
      console.error('Error parsing mataKuliahIds:', parseError);
      return res.status(400).json({ error: 'Format mata kuliah tidak valid' });
    }

    console.log('Parsed mataKuliahIds:', parsedMataKuliahIds);

    if (parsedMataKuliahIds.length === 0) {
      return res.status(400).json({ error: 'Mata kuliah harus dipilih minimal 1' });
    }

    // Filter valid IDs
    const validIds = parsedMataKuliahIds.filter(id => !isNaN(id) && id > 0);
    
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'ID mata kuliah tidak valid' });
    }
    
    // Cek mahasiswa exists
    const mahasiswaExists = await prisma.mahasiswa.findUnique({
      where: { nim: mahasiswaId }
    });
    
    if (!mahasiswaExists) {
      return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });
    }
    
    // Cek mata kuliah exists
    const mataKuliahExists = await prisma.mataKuliah.findMany({
      where: {
        id: {
          in: validIds
        }
      }
    });

    console.log('Found mata kuliah:', mataKuliahExists);

    if (mataKuliahExists.length !== validIds.length) {
      return res.status(404).json({ error: 'Beberapa mata kuliah tidak ditemukan' });
    }
    
    // Validasi semester: Mahasiswa hanya bisa mengambil mata kuliah di semester DI BAWAH semester saat ini
    const semesterMahasiswa = mahasiswaExists.semester;
    if (semesterMahasiswa) {
      const invalidMataKuliah = mataKuliahExists.filter(mk => {
        // Blokir jika semester mata kuliah >= semester mahasiswa saat ini
        return mk.semester >= semesterMahasiswa;
      });
      if (invalidMataKuliah.length > 0) {
        const invalidNames = invalidMataKuliah.map(mk => `"${mk.nama}" (semester ${mk.semester})`).join(', ');
        return res.status(400).json({ 
          error: `Anda semester ${semesterMahasiswa} tidak dapat mengambil mata kuliah: ${invalidNames}. Anda hanya dapat mengajukan SA untuk mata kuliah di semester ${semesterMahasiswa - 1} ke bawah (Semester 1 sampai Semester ${semesterMahasiswa - 1}).` 
        });
      }
    }
    
    // Create pengajuan SA dengan details dalam transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create master pengajuan SA
      const pengajuanSA = await tx.pengajuanSA.create({
        data: {
          mahasiswaId: mahasiswaId,
          buktiPembayaran: req.file.filename,
          keterangan: keterangan || 'Pengajuan SA', // Keterangan hanya di master
          nominal: parseFloat(nominal),
          status: 'PROSES_PENGAJUAN',
          semesterPengajuan: mahasiswaExists.semester
        }
      });

      console.log('Created pengajuan SA master:', pengajuanSA);

      // Create details untuk setiap mata kuliah (TANPA keterangan)
      const detailsData = validIds.map(mataKuliahId => ({
        pengajuanSAId: pengajuanSA.id,
        mataKuliahId: parseInt(mataKuliahId)
        // TIDAK ada keterangan di detail
      }));

      console.log('Creating details with data:', detailsData);

      await tx.pengajuanSADetail.createMany({
        data: detailsData
      });

      // Return pengajuan dengan details (TANPA select keterangan di detail)
      return await tx.pengajuanSA.findUnique({
        where: { id: pengajuanSA.id },
        include: {
          mahasiswa: true,
          details: {
            include: {
              mataKuliah: true
              // TIDAK include keterangan karena tidak ada
            }
          }
        }
      });
    });
    
    console.log('Final result:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating SA:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verifikasi pengajuan SA (Admin approve)
const verifikasiPengajuanSA = async (req, res) => {
  try {
    const pengajuanId = parseInt(req.params.id);
    
    console.log('Verifying pengajuan SA:', pengajuanId);
    
    const pengajuanSA = await prisma.pengajuanSA.update({
      where: { id: pengajuanId },
      data: {
        status: 'MENUNGGU_VERIFIKASI_KAPRODI'
      },
      include: {
        mahasiswa: true,
        details: {
          include: {
            mataKuliah: true
          }
        }
      }
    });
    
    console.log('Verified pengajuan SA:', pengajuanSA);
    res.json(pengajuanSA);
  } catch (error) {
    console.error('Error verifying SA:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tolak pengajuan SA (Admin reject)
const tolakPengajuanSA = async (req, res) => {
  try {
    const pengajuanId = parseInt(req.params.id);
    const { keteranganReject } = req.body;
    
    console.log('Rejecting pengajuan SA:', { pengajuanId, keteranganReject });
    
    if (!keteranganReject || keteranganReject.trim() === '') {
      return res.status(400).json({ error: 'Alasan penolakan harus diisi' });
    }
    
    const pengajuanSA = await prisma.pengajuanSA.update({
      where: { id: pengajuanId },
      data: {
        status: 'DITOLAK',
        keteranganReject: keteranganReject
      },
      include: {
        mahasiswa: true,
        details: {
          include: {
            mataKuliah: true
          }
        }
      }
    });
    
    console.log('Rejected pengajuan SA:', pengajuanSA);
    res.json(pengajuanSA);
  } catch (error) {
    console.error('Error rejecting SA:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get suggested dosen untuk mata kuliah tertentu (untuk auto-suggestion)
const getSuggestedDosen = async (req, res) => {
  try {
    const { mataKuliahId, pengajuanSAId } = req.query;
    
    if (!mataKuliahId) {
      return res.status(400).json({ error: 'mataKuliahId wajib diisi' });
    }
    
    const suggestions = [];
    
    // Ambil info MK dan pengajuan SA untuk mendapatkan semester pengajuan
    const mk = await prisma.mataKuliah.findUnique({
      where: { id: parseInt(mataKuliahId) }
    });
    
    if (!mk) {
      return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
    }
    
    let semesterPengajuan = null;
    let tahunAjaran = null;
    
    // Jika ada pengajuanSAId, ambil semesterPengajuan dari pengajuan SA
    if (pengajuanSAId) {
      const pengajuanSA = await prisma.pengajuanSA.findUnique({
        where: { id: parseInt(pengajuanSAId) },
        select: { semesterPengajuan: true, tanggalPengajuan: true }
      });
      
      if (pengajuanSA) {
        semesterPengajuan = pengajuanSA.semesterPengajuan;
        // Hitung tahun ajaran dari tanggal pengajuan
        const date = new Date(pengajuanSA.tanggalPengajuan);
        const year = date.getFullYear();
        tahunAjaran = `${year}/${year + 1}`;
      }
    }
    
    // 1. Cek dosen yang ACTIVE untuk MK tersebut di semester kurikulum yang sesuai
    // Semester di penugasan mengajar = semester kurikulum MK
    if (semesterPengajuan && mk.semester === semesterPengajuan && tahunAjaran) {
      const activeAssignments = await prisma.penugasanMengajar.findMany({
        where: {
          mataKuliahId: parseInt(mataKuliahId),
          tahunAjaran,
          semester: mk.semester, // Semester kurikulum MK
          status: 'ACTIVE'
        },
        include: {
          dosen: true
        }
      });
      
      activeAssignments.forEach(assignment => {
        suggestions.push({
          dosenId: assignment.dosenId,
          dosen: assignment.dosen,
          priority: 1, // Highest priority
          reason: `Dosen yang aktif mengajar mata kuliah ini di semester ${mk.semester}`
        });
      });
    }
    
    // 2. Cek dosen yang pernah mengajar MK tersebut di semester kurikulum yang sama (dari history)
    const historyAssignments = await prisma.penugasanMengajar.findMany({
      where: {
        mataKuliahId: parseInt(mataKuliahId),
        semester: mk.semester, // Semester kurikulum MK
        status: 'ACTIVE',
        dosenId: {
          notIn: suggestions.map(s => s.dosenId)
        }
      },
      include: {
        dosen: true
      },
      distinct: ['dosenId']
    });
    
    historyAssignments.forEach(assignment => {
      suggestions.push({
        dosenId: assignment.dosenId,
        dosen: assignment.dosen,
        priority: 2,
        reason: `Dosen yang pernah mengajar mata kuliah ini di semester ${mk.semester}`
      });
    });
    
    // 3. Cek dosen di prodi yang sama dengan MK
    if (mk) {
      const dosenInProdi = await prisma.dosen.findMany({
        where: {
          prodiId: mk.programStudiId,
          nip: {
            notIn: suggestions.map(s => s.dosenId)
          }
        }
      });
      
      dosenInProdi.forEach(dosen => {
        suggestions.push({
          dosenId: dosen.nip,
          dosen: dosen,
          priority: 3,
          reason: 'Dosen di program studi yang sama'
        });
      });
    }
    
    // Sort by priority
    suggestions.sort((a, b) => a.priority - b.priority);
    
    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Error getting suggested dosen:', error);
    res.status(500).json({ error: error.message });
  }
};

// Assign dosen ke mata kuliah tertentu (Kaprodi)
const assignDosenToMataKuliah = async (req, res) => {
  try {
    const detailId = parseInt(req.params.detailId);
    const { dosenId } = req.body;
    
    console.log('Assigning dosen:', { detailId, dosenId });
    
    if (!dosenId) {
      return res.status(400).json({ error: 'Dosen harus dipilih' });
    }
    
    // Cek dosen exists
    const dosenExists = await prisma.dosen.findUnique({
      where: { nip: dosenId }
    });
    
    if (!dosenExists) {
      return res.status(404).json({ error: 'Dosen tidak ditemukan' });
    }
    
    // Ambil detail pengajuan dengan info lengkap
    const existingDetail = await prisma.pengajuanSADetail.findUnique({
      where: { id: detailId },
      include: {
        pengajuanSA: {
          include: { mahasiswa: true }
        },
        mataKuliah: true
      }
    });
    
    if (!existingDetail) {
      return res.status(404).json({ error: 'Detail pengajuan tidak ditemukan' });
    }
    
    // Validasi semester: Mahasiswa hanya bisa mengambil mata kuliah di semester DI BAWAH semester saat ini
    const semesterPengajuan = existingDetail.pengajuanSA.semesterPengajuan;
    const semesterKurikulum = existingDetail.mataKuliah.semester;
    
    // Blokir jika semester mata kuliah >= semester mahasiswa saat ini
    if (semesterKurikulum >= semesterPengajuan) {
      return res.status(400).json({ 
        error: `Mahasiswa semester ${semesterPengajuan} tidak dapat mengambil mata kuliah "${existingDetail.mataKuliah.nama}" (semester ${semesterKurikulum}). Anda hanya dapat mengajukan SA untuk mata kuliah di semester ${semesterPengajuan - 1} ke bawah.` 
      });
    }
    
    // Validasi: Cek apakah dosen sudah ACTIVE untuk MK ini di semester kurikulum yang sesuai
    // DIHAPUS: Tidak perlu cek penugasan mengajar, pengajuan SA terpisah dari penugasan mengajar
    // Kaprodi bisa langsung assign dosen untuk pengajuan SA tanpa perlu dosen sudah ditugaskan mengajar
    
    const pengajuanDetail = await prisma.pengajuanSADetail.update({
      where: { id: detailId },
      data: {
        dosenId: dosenId
      },
      include: {
        pengajuanSA: {
          include: { mahasiswa: true }
        },
        mataKuliah: true,
        dosen: true
        // TIDAK include keterangan karena tidak ada di detail
      }
    });

    // Cek apakah semua detail sudah ada dosennya
    const allDetails = await prisma.pengajuanSADetail.findMany({
      where: {
        pengajuanSAId: pengajuanDetail.pengajuanSAId
      }
    });

    const allHaveDosen = allDetails.every(detail => detail.dosenId !== null);

    // Jika semua sudah ada dosen, update status ke DALAM_PROSES_SA
    if (allHaveDosen) {
      await prisma.pengajuanSA.update({
        where: { id: pengajuanDetail.pengajuanSAId },
        data: { status: 'DALAM_PROSES_SA' }
      });
    }
    
    console.log('Assigned dosen to mata kuliah:', pengajuanDetail);
    res.json(pengajuanDetail);
  } catch (error) {
    console.error('Error assigning dosen:', error);
    res.status(500).json({ error: error.message });
  }
};

// TAMBAHAN: Assign dosen ke semua mata kuliah dalam satu pengajuan SA (Kaprodi)
const assignAllDosenToMataKuliah = async (req, res) => {
  try {
    const pengajuanId = parseInt(req.params.id);
    const { dosenId } = req.body;
    
    console.log('🔍 DEBUG - Request params:', { 
      pengajuanId, 
      dosenId,
      params: req.params,
      body: req.body 
    });
    
    if (!dosenId) {
      console.log('❌ Error: Dosen tidak dipilih');
      return res.status(400).json({ error: 'Dosen harus dipilih' });
    }
    
    // Cek dosen exists
    const dosenExists = await prisma.dosen.findUnique({
      where: { nip: dosenId }
    });
    
    console.log('🔍 DEBUG - Dosen check:', { 
      dosenId,
      exists: !!dosenExists,
      dosenData: dosenExists 
    });
    
    if (!dosenExists) {
      console.log('❌ Error: Dosen tidak ditemukan');
      return res.status(404).json({ error: 'Dosen tidak ditemukan' });
    }
    
    // Cek pengajuan SA exists
    const pengajuanExists = await prisma.pengajuanSA.findUnique({
      where: { id: pengajuanId },
      include: {
        details: {
          include: {
            mataKuliah: true
          }
        },
        mahasiswa: true
      }
    });
    
    console.log('🔍 DEBUG - Pengajuan check:', { 
      pengajuanId,
      exists: !!pengajuanExists,
      details: pengajuanExists?.details?.length 
    });
    
    if (!pengajuanExists) {
      console.log('❌ Error: Pengajuan SA tidak ditemukan');
      return res.status(404).json({ error: 'Pengajuan SA tidak ditemukan' });
    }
    
    // Validasi semester pengajuan vs semester kurikulum
    const semesterPengajuan = pengajuanExists.semesterPengajuan;
    
    // Validasi setiap MK - Mahasiswa hanya bisa mengambil mata kuliah di semester DI BAWAH semester saat ini
    const validationErrors = [];
    for (const detail of pengajuanExists.details) {
      const semesterKurikulum = detail.mataKuliah.semester;
      
      // Blokir jika semester mata kuliah >= semester mahasiswa saat ini
      if (semesterKurikulum >= semesterPengajuan) {
        validationErrors.push(`Mahasiswa semester ${semesterPengajuan} tidak dapat mengambil "${detail.mataKuliah.nama}" (semester ${semesterKurikulum}). Anda hanya dapat mengajukan SA untuk mata kuliah di semester ${semesterPengajuan - 1} ke bawah.`);
      }
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: validationErrors.join('. ')
      });
    }
    
    // DIHAPUS: Tidak perlu cek penugasan mengajar, pengajuan SA terpisah dari penugasan mengajar
    // Kaprodi bisa langsung assign dosen untuk pengajuan SA tanpa perlu dosen sudah ditugaskan mengajar
    
    // Update semua detail dengan dosen yang sama
    const updateResult = await prisma.pengajuanSADetail.updateMany({
      where: {
        pengajuanSAId: pengajuanId
      },
      data: {
        dosenId: dosenId
      }
    });

    console.log('✅ DEBUG - Update details result:', updateResult);

    // Update status pengajuan ke DALAM_PROSES_SA
    const statusUpdate = await prisma.pengajuanSA.update({
      where: { id: pengajuanId },
      data: { status: 'DALAM_PROSES_SA' }
    });

    console.log('✅ DEBUG - Status update result:', statusUpdate);

    // Return updated pengajuan dengan details
    const updatedPengajuan = await prisma.pengajuanSA.findUnique({
      where: { id: pengajuanId },
      include: {
        mahasiswa: true,
        details: {
          include: {
            mataKuliah: true,
            dosen: true
          }
        }
      }
    });
    
    console.log('✅ DEBUG - Final result:', {
      id: updatedPengajuan.id,
      status: updatedPengajuan.status,
      detailsCount: updatedPengajuan.details.length,
      detailsWithDosen: updatedPengajuan.details.filter(d => d.dosenId === dosenId).length
    });

    res.json(updatedPengajuan);
  } catch (error) {
    console.error('❌ Error assigning dosen to all mata kuliah:', error);
    res.status(500).json({ error: error.message });
  }
};

// Input nilai SA per mata kuliah (Dosen/Admin)
const inputNilaiSA = async (req, res) => {
  try {
    const detailId = parseInt(req.params.detailId);
    const { nilaiAkhir } = req.body;
    
    console.log('Input nilai SA:', { detailId, nilaiAkhir });
    
    if (!nilaiAkhir || nilaiAkhir < 0 || nilaiAkhir > 100) {
      return res.status(400).json({ error: 'Nilai harus antara 0-100' });
    }
    
    // Cek apakah detail exists dan sudah ada nilai
    const existingDetail = await prisma.pengajuanSADetail.findUnique({
      where: { id: detailId },
      include: {
        pengajuanSA: {
          include: { mahasiswa: true }
        },
        mataKuliah: true,
        dosen: true
      }
    });
    
    if (!existingDetail) {
      return res.status(404).json({ 
        error: `Detail pengajuan SA dengan ID ${detailId} tidak ditemukan` 
      });
    }
    
    if (existingDetail.nilaiAkhir !== null) {
      return res.status(400).json({ 
        error: `Mata kuliah ${existingDetail.mataKuliah.nama} sudah dinilai dengan nilai ${existingDetail.nilaiAkhir}` 
      });
    }
    
    // Update nilai untuk detail specific
    await prisma.pengajuanSADetail.update({
      where: { id: detailId },
      data: {
        nilaiAkhir: parseFloat(nilaiAkhir)
      }
    });

    // Cek apakah semua detail dalam pengajuan SA ini sudah ada nilainya
    // Ambil ulang semua details setelah update untuk mendapatkan data terbaru
    const allDetails = await prisma.pengajuanSADetail.findMany({
      where: {
        pengajuanSAId: existingDetail.pengajuanSAId
      }
    });

    // Cek apakah semua detail sudah ada nilai (tidak null)
    const allHaveNilai = allDetails.length > 0 && allDetails.every(detail => detail.nilaiAkhir !== null && detail.nilaiAkhir !== undefined);

    console.log('✅ Checking all details:', {
      pengajuanSAId: existingDetail.pengajuanSAId,
      totalDetails: allDetails.length,
      detailsWithNilai: allDetails.filter(d => d.nilaiAkhir !== null && d.nilaiAkhir !== undefined).length,
      allHaveNilai: allHaveNilai
    });

    // Jika semua mata kuliah sudah ada nilai, update status master ke SELESAI
    if (allHaveNilai) {
      console.log('✅ All details have nilai, updating status to SELESAI');
      await prisma.pengajuanSA.update({
        where: { id: existingDetail.pengajuanSAId },
        data: { status: 'SELESAI' }
      });
      console.log('✅ Status updated to SELESAI for pengajuan:', existingDetail.pengajuanSAId);
    } else {
      console.log('⚠️ Not all details have nilai yet, status remains:', existingDetail.pengajuanSA.status);
    }

    // Return data pengajuan SA lengkap (status terbaru)
    const updatedPengajuan = await prisma.pengajuanSA.findUnique({
      where: { id: existingDetail.pengajuanSAId },
      include: {
        mahasiswa: true,
        details: {
          include: {
            mataKuliah: true,
            dosen: true
          }
        }
      }
    });
    res.json(updatedPengajuan);
  } catch (error) {
    console.error('Error input nilai SA:', error);
    res.status(500).json({ error: error.message });
  }
};

// BACKWARD COMPATIBILITY FUNCTIONS - Untuk mendukung routes lama

// UPDATE MATA KULIAH - FUNCTION LAMA YANG MASIH DIPANGGIL
const updateMataKuliah = async (req, res) => {
  try {
    const { mataKuliah, keteranganMataKuliah } = req.body;
    const pengajuanId = parseInt(req.params.id);
    
    console.log('Updating mata kuliah:', { 
      id: pengajuanId, 
      mataKuliah, 
      keteranganMataKuliah 
    });
    
    // Validasi input
    if (!mataKuliah || !keteranganMataKuliah) {
      return res.status(400).json({ 
        error: 'Mata kuliah dan keterangan harus diisi' 
      });
    }
    
    // Update pengajuan SA
    const pengajuanSA = await prisma.pengajuanSA.update({
      where: { id: pengajuanId },
      data: {
        keterangan: keteranganMataKuliah // Simpan keterangan
      },
      include: {
        mahasiswa: true,
        details: {
          include: {
            mataKuliah: true,
            dosen: true
          }
        }
      }
    });
    
    console.log('Updated pengajuan SA:', pengajuanSA);
    res.json(pengajuanSA);
  } catch (error) {
    console.error('Error updating mata kuliah:', error);
    res.status(500).json({ error: error.message });
  }
};

// Memperbarui status pengajuan SA (untuk admin/kaprodi) - FUNCTION LAMA
const updateStatusPengajuanSA = async (req, res) => {
  try {
    const { status, dosenId } = req.body;
    const pengajuanId = parseInt(req.params.id);
    
    console.log('Updating status:', { id: pengajuanId, status, dosenId });
    
    if (status === 'MENUNGGU_VERIFIKASI_KAPRODI') {
      // Admin verifikasi
      const pengajuanSA = await prisma.pengajuanSA.update({
        where: { id: pengajuanId },
        data: { status },
        include: {
          mahasiswa: true,
          details: {
            include: {
              mataKuliah: true,
              dosen: true
            }
          }
        }
      });
      
      res.json(pengajuanSA);
    } else if (status === 'DALAM_PROSES_SA' && dosenId) {
      // Kaprodi assign dosen - Update semua details dengan dosen yang sama (simplified)
      await prisma.pengajuanSADetail.updateMany({
        where: {
          pengajuanSAId: pengajuanId
        },
        data: {
          dosenId: dosenId
        }
      });

      const pengajuanSA = await prisma.pengajuanSA.update({
        where: { id: pengajuanId },
        data: { status },
        include: {
          mahasiswa: true,
          details: {
            include: {
              mataKuliah: true,
              dosen: true
            }
          }
        }
      });
      
      res.json(pengajuanSA);
    } else {
      return res.status(400).json({ error: 'Parameter tidak valid' });
    }
  } catch (error) {
    console.error('Error updating SA status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Memperbarui nilai SA (untuk dosen) - FUNCTION LAMA
const updateNilaiPengajuanSA = async (req, res) => {
  try {
    const { nilaiAkhir } = req.body;
    const pengajuanId = parseInt(req.params.id);
    
    console.log('Updating nilai:', { id: pengajuanId, nilaiAkhir });
    
    if (!nilaiAkhir || nilaiAkhir < 0 || nilaiAkhir > 100) {
      return res.status(400).json({ error: 'Nilai harus antara 0-100' });
    }
    
    // Update semua details dengan nilai yang sama (simplified)
    await prisma.pengajuanSADetail.updateMany({
      where: {
        pengajuanSAId: pengajuanId
      },
      data: {
        nilaiAkhir: parseFloat(nilaiAkhir)
      }
    });

    const pengajuanSA = await prisma.pengajuanSA.update({
      where: { id: pengajuanId },
      data: {
        status: 'SELESAI'
      },
      include: {
        mahasiswa: true,
        details: {
          include: {
            mataKuliah: true,
            dosen: true
          }
        }
      }
    });
    
    console.log('Updated nilai SA:', pengajuanSA);
    res.json(pengajuanSA);
  } catch (error) {
    console.error('Error updating SA nilai:', error);
    res.status(500).json({ error: error.message });
  }
};

// EXPORTS - Pastikan semua function ada termasuk yang baru ditambahkan
module.exports = {
  // Main functions
  getAllPengajuanSA,
  getPengajuanSAByMahasiswa,
  getPengajuanSAByDosen,
  getPengajuanSAById,
  createPengajuanSA,
  
  // Admin functions
  verifikasiPengajuanSA,
  tolakPengajuanSA,
  
  // Kaprodi functions
  getSuggestedDosen,
  assignDosenToMataKuliah,
  assignAllDosenToMataKuliah,
  
  // Dosen functions
  inputNilaiSA,
  
  // Backward compatibility functions (untuk routes lama)
  updateMataKuliah,
  updateStatusPengajuanSA,
  updateNilaiPengajuanSA
};