const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const statsController = {
  // Mengambil semua statistik untuk dashboard
  getAllStats: async (req, res) => {
    try {
      // Menggunakan Prisma untuk menghitung jumlah data
      const totalMahasiswa = await prisma.mahasiswa.count();
      const totalDosen = await prisma.dosen.count();
      const totalProgramStudi = await prisma.programStudi.count();
      
      // Menghitung total user berdasarkan role
      const totalUsers = await prisma.user.count();
      const totalSekjur = await prisma.user.count({
        where: { role: 'SEKJUR' }
      });
      const totalMahasiswaUsers = await prisma.user.count({
        where: { role: 'MAHASISWA' }
      });
      const totalKaprodiUsers = await prisma.user.count({
        where: { role: 'KAPRODI' }
      });
      
      // Menghitung dosen yang juga kaprodi
      const totalKaprodi = await prisma.dosen.count({
        where: { isKaprodi: true }
      });
      
      // Menghitung pengajuan SA berdasarkan status
      const totalPengajuanSA = await prisma.pengajuanSA.count();
      const pengajuanSelesai = await prisma.pengajuanSA.count({
        where: { status: 'SELESAI' }
      });
      const pengajuanDalamProses = await prisma.pengajuanSA.count({
        where: { status: 'DALAM_PROSES_SA' }
      });
      const pengajuanMenunggu = await prisma.pengajuanSA.count({
        where: { status: 'PROSES_PENGAJUAN' }
      });

      // Format response sesuai kebutuhan frontend
      const stats = [
        {
          icon: 'Users',
          label: 'Total Mahasiswa',
          value: totalMahasiswa.toString(),
          color: 'text-blue-600'
        },
        {
          icon: 'GraduationCap',
          label: 'Total Dosen',
          value: totalDosen.toString(),
          color: 'text-green-600'
        },
        {
          icon: 'Building',
          label: 'Program Studi',
          value: totalProgramStudi.toString(),
          color: 'text-purple-600'
        },
        {
          icon: 'UserCheck',
          label: 'Total Kaprodi',
          value: totalKaprodi.toString(),
          color: 'text-orange-600'
        },
        {
          icon: 'Shield',
          label: 'Total Sekjur',
          value: totalSekjur.toString(),
          color: 'text-red-600'
        },
        {
          icon: 'UserCog',
          label: 'Total User Login',
          value: totalUsers.toString(),
          color: 'text-gray-600'
        }
      ];

      // Statistik pengajuan SA
      const pengajuanStats = [
        {
          icon: 'FileText',
          label: 'Total Pengajuan SA',
          value: totalPengajuanSA.toString(),
          color: 'text-blue-500'
        },
        {
          icon: 'CheckCircle',
          label: 'Pengajuan Selesai',
          value: pengajuanSelesai.toString(),
          color: 'text-green-500'
        },
        {
          icon: 'Clock',
          label: 'Dalam Proses',
          value: pengajuanDalamProses.toString(),
          color: 'text-yellow-500'
        },
        {
          icon: 'AlertCircle',
          label: 'Menunggu Proses',
          value: pengajuanMenunggu.toString(),
          color: 'text-orange-500'
        }
      ];

      res.status(200).json({
        success: true,
        message: "Statistik berhasil diambil",
        data: {
          generalStats: stats,
          pengajuanStats: pengajuanStats,
          userStats: {
            totalUsers,
            totalSekjur,
            totalMahasiswaUsers,
            totalKaprodiUsers
          }
        }
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil statistik",
        error: error.message
      });
    }
  },

  // Mendapatkan statistik detail untuk analisis lebih lanjut
  getDetailedStats: async (req, res) => {
    try {
      // Statistik pengajuan SA per bulan (6 bulan terakhir)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const pengajuanPerBulan = await prisma.pengajuanSA.groupBy({
        by: ['status'],
        where: {
          tanggalPengajuan: {
            gte: sixMonthsAgo
          }
        },
        _count: {
          _all: true
        }
      });

      // Statistik user login per role
      const userStatsPerRole = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          _all: true
        }
      });

      // Statistik program studi dengan kaprodi
      const statsPerProdi = await prisma.programStudi.findMany({
        select: {
          id: true,
          nama: true,
          ketuaProdi: true,
          _count: {
            select: {
              mahasiswa: true,
              dosen: true
            }
          },
          // Dosen yang menjadi kaprodi di prodi ini
          dosen: {
            where: { isKaprodi: true },
            select: {
              nip: true,
              nama: true
            }
          }
        }
      });

      // Statistik pengajuan SA terbaru (10 terakhir)
      const recentPengajuan = await prisma.pengajuanSA.findMany({
        take: 10,
        orderBy: {
          tanggalPengajuan: 'desc'
        },
        select: {
          id: true,
          status: true,
          tanggalPengajuan: true,
          mahasiswa: {
            select: {
              nim: true,
              nama: true,
              programStudi: {
                select: { nama: true }
              }
            }
          },
          dosen: {
            select: {
              nip: true,
              nama: true
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: "Statistik detail berhasil diambil",
        data: {
          statsPerProdi,
          pengajuanPerBulan,
          userStatsPerRole,
          recentPengajuan
        }
      });
    } catch (error) {
      console.error("Error fetching detailed stats:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil statistik detail",
        error: error.message
      });
    }
  },

  // Statistik khusus untuk role tertentu
  getStatsByRole: async (req, res) => {
    try {
      const { userType, userId } = req.user; // Dari middleware auth

      let stats = {};

      switch (userType) {
        case 'sekjur':
          // Sekjur bisa lihat semua statistik
          const allStats = await statsController.getAllStats(req, res);
          return;

        case 'mahasiswa':
          // Mahasiswa hanya bisa lihat statistik pengajuan SA mereka
          const mahasiswaPengajuan = await prisma.pengajuanSA.findMany({
            where: { mahasiswaId: userId },
            select: {
              id: true,
              status: true,
              tanggalPengajuan: true,
              nilaiAkhir: true,
              keterangan: true,
              dosen: {
                select: {
                  nama: true
                }
              }
            }
          });

          const totalPengajuanMahasiswa = mahasiswaPengajuan.length;
          const selesaiMahasiswa = mahasiswaPengajuan.filter(p => p.status === 'SELESAI').length;
          const prosesMahasiswa = mahasiswaPengajuan.filter(p => p.status === 'DALAM_PROSES_SA').length;
          const menungguMahasiswa = mahasiswaPengajuan.filter(p => p.status === 'PROSES_PENGAJUAN').length;

          stats = {
            totalPengajuan: totalPengajuanMahasiswa,
            selesai: selesaiMahasiswa,
            dalamProses: prosesMahasiswa,
            menunggu: menungguMahasiswa,
            pengajuanList: mahasiswaPengajuan
          };
          break;

        case 'kaprodi':
          // Kaprodi bisa lihat statistik pengajuan SA di prodi mereka
          const dosenData = await prisma.dosen.findUnique({
            where: { nip: userId },
            include: { prodi: true }
          });

          if (!dosenData || !dosenData.isKaprodi) {
            return res.status(403).json({
              success: false,
              message: "Akses ditolak. Hanya kaprodi yang dapat melihat statistik ini."
            });
          }

          const pengajuanProdi = await prisma.pengajuanSA.findMany({
            where: {
              mahasiswa: {
                programStudiId: dosenData.prodiId
              }
            },
            include: {
              mahasiswa: {
                select: {
                  nim: true,
                  nama: true
                }
              },
              dosen: {
                select: {
                  nama: true
                }
              }
            }
          });

          stats = {
            namaProdi: dosenData.prodi.nama,
            totalPengajuan: pengajuanProdi.length,
            selesai: pengajuanProdi.filter(p => p.status === 'SELESAI').length,
            dalamProses: pengajuanProdi.filter(p => p.status === 'DALAM_PROSES_SA').length,
            menunggu: pengajuanProdi.filter(p => p.status === 'PROSES_PENGAJUAN').length,
            pengajuanList: pengajuanProdi
          };
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Role tidak valid"
          });
      }

      res.status(200).json({
        success: true,
        message: "Statistik berhasil diambil",
        data: stats
      });

    } catch (error) {
      console.error("Error fetching stats by role:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil statistik",
        error: error.message
      });
    }
  }
};

module.exports = statsController;