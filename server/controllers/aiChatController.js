const aiChatService = require('../services/aiChatService');

class AIChatController {
  // ✨ HANDLE CHAT MESSAGE
  async handleChatMessage(req, res) {
    try {
      const { message, userId, userRole } = req.body;
      
      console.log('Chat request received:', { message, userId, userRole });

      if (!message || !userId || !userRole) {
        console.log('Missing required fields:', { message: !!message, userId: !!userId, userRole: !!userRole });
        return res.status(400).json({
          success: false,
          message: 'Pesan, userId, dan userRole diperlukan'
        });
      }

      console.log('Generating AI response for user:', { userId, userRole });

      // Generate AI response using RAG
      const result = await aiChatService.generateResponse(userId, userRole, message);

      console.log('AI response result:', { success: result.success, hasResponse: !!result.response });

      if (result.success) {
        res.json({
          success: true,
          response: result.response,
          timestamp: new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        });
      } else {
        console.log('AI service returned error:', result.error);
        res.status(500).json({
          success: false,
          message: result.response,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in handleChatMessage:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan dalam memproses pesan',
        error: error.message
      });
    }
  }

  // ✨ GET USER CONTEXT FOR CHAT
  async getUserContext(req, res) {
    try {
      const { userId, userRole } = req.params;

      if (!userId || !userRole) {
        return res.status(400).json({
          success: false,
          message: 'userId dan userRole diperlukan'
        });
      }

      const { userData, saData } = await aiChatService.identifyUserContext(userId, userRole);

      res.json({
        success: true,
        userData,
        saData: saData || [],
        message: 'Konteks pengguna berhasil diambil'
      });
    } catch (error) {
      console.error('Error in getUserContext:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan dalam mengambil konteks pengguna'
      });
    }
  }

  // ✨ GET CHAT SUGGESTIONS BASED ON ROLE
  async getChatSuggestions(req, res) {
    try {
      const { userRole } = req.params;

      const suggestions = {
        'MAHASISWA': [
          'Bagaimana status pengajuan SA saya?',
          'Apa saja syarat untuk mengajukan SA?',
          'Berapa lama estimasi penyelesaian SA?',
          'Dokumen apa saja yang perlu saya upload?',
          'Kapan saya bisa mulai mengajukan SA?'
        ],
        'DOSEN': [
          'Daftar mahasiswa yang saya bimbing',
          'Ada notifikasi SA baru?',
          'Status SA mahasiswa bimbingan saya',
          'Berapa SA yang perlu saya validasi?',
          'Mahasiswa mana yang belum upload dokumen?'
        ],
        'KAPRODI': [
          'Rekap SA program studi saya',
          'Berapa SA yang menunggu verifikasi?',
          'Statistik SA per status',
          'SA yang perlu perhatian khusus',
          'Mahasiswa yang sering mengajukan SA'
        ],
        'ADMIN': [
          'Kelengkapan dokumen SA terbaru',
          'Histori SA dalam sistem',
          'Deteksi duplikat pengajuan',
          'Statistik SA per program studi',
          'SA yang perlu tindak lanjut'
        ]
      };

      res.json({
        success: true,
        suggestions: suggestions[userRole.toUpperCase()] || [
          'Bagaimana saya bisa membantu Anda?',
          'Ada pertanyaan tentang sistem SA?'
        ]
      });
    } catch (error) {
      console.error('Error in getChatSuggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan dalam mengambil saran chat'
      });
    }
  }

  // ✨ GET DYNAMIC CHAT SUGGESTIONS
  async getDynamicSuggestions(req, res) {
    try {
      const { role } = req.params;
      const userId = req.user?.id || req.user?.nim || req.user?.nip;

      if (!role || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Role dan user ID diperlukan'
        });
      }

      console.log('🎯 Generating dynamic suggestions for:', { role, userId });

      // Get user context for personalized suggestions
      const { userData, additionalStats, systemData } = await aiChatService.identifyUserContext(userId, role);

      // Generate role-specific suggestions
      let suggestions = [];

      switch (role.toUpperCase()) {
        case 'MAHASISWA':
          suggestions = [
            'Bagaimana status SA terbaru saya?',
            'Apa saja syarat pengajuan SA?',
            'Berapa lama proses verifikasi SA?',
            'Bagaimana cara mengajukan SA?',
            'Apa yang harus saya lakukan jika SA ditolak?'
          ];

          // Add contextual suggestions based on user data
          if (additionalStats.totalSA === 0) {
            suggestions.unshift('Bagaimana cara mengajukan SA pertama kali?');
          } else if (additionalStats.pendingSA > 0) {
            suggestions.unshift(`Kapan SA saya yang pending akan selesai?`);
          } else if (additionalStats.rejectedSA > 0) {
            suggestions.unshift('Bagaimana memperbaiki SA yang ditolak?');
          }

          if (additionalStats.prodiStats) {
            suggestions.push(`Bagaimana performa saya dibanding mahasiswa prodi lain?`);
          }
          break;

        case 'DOSEN':
          suggestions = [
            'Berapa banyak SA yang perlu saya nilai?',
            'Bagaimana template penilaian SA yang baik?',
            'Apa saja kriteria penilaian SA?',
            'Bagaimana cara memberikan feedback yang efektif?',
            'Berapa lama waktu ideal untuk menilai SA?'
          ];

          // Add contextual suggestions
          if (additionalStats.needGrading > 0) {
            suggestions.unshift(`Saya punya ${additionalStats.needGrading} SA yang belum dinilai`);
          }

          if (additionalStats.colleagueStats?.length > 0) {
            suggestions.push('Bagaimana performa saya dibanding kolega?');
          }
          break;

        case 'KAPRODI':
          suggestions = [
            'Berapa banyak SA yang menunggu verifikasi?',
            'Bagaimana statistik SA program studi saya?',
            'Apa saja kriteria verifikasi SA?',
            'Bagaimana cara mempercepat proses verifikasi?',
            'Bagaimana performa dosen dalam bimbingan SA?'
          ];

          // Add contextual suggestions
          if (additionalStats.pendingVerification > 0) {
            suggestions.unshift(`Ada ${additionalStats.pendingVerification} SA yang menunggu verifikasi`);
          }

          if (additionalStats.dosenPerformance?.length > 0) {
            suggestions.push('Bagaimana distribusi bimbingan antar dosen?');
          }
          break;

        case 'ADMIN':
          suggestions = [
            'Bagaimana statistik keseluruhan sistem SA?',
            'Program studi mana yang paling aktif?',
            'Mata kuliah apa yang paling populer?',
            'Bagaimana tingkat penyelesaian SA?',
            'Ada berapa SA yang sedang diproses?'
          ];

          // Add contextual suggestions based on system data
          if (systemData?.systemStats) {
            const totalSA = Object.values(systemData.systemStats).reduce((sum, count) => sum + count, 0);
            suggestions.unshift(`Total SA dalam sistem: ${totalSA}`);
          }

          if (systemData?.programDetails?.length > 0) {
            const mostActiveProdi = systemData.programDetails
              .sort((a, b) => b.mahasiswaCount - a.mahasiswaCount)[0];
            suggestions.push(`Program studi ${mostActiveProdi?.nama} paling aktif`);
          }
          break;

        default:
          suggestions = [
            'Bagaimana cara menggunakan sistem SA?',
            'Apa saja fitur yang tersedia?',
            'Bagaimana cara mendapatkan bantuan?'
          ];
      }

      // Add system-wide suggestions
      suggestions.push(
        'Bagaimana cara menggunakan fitur chat ini?',
        'Apa saja yang bisa saya tanyakan?'
      );

      // Limit to 8 suggestions
      suggestions = suggestions.slice(0, 8);

      console.log('✅ Dynamic suggestions generated:', suggestions.length);

      res.json({
        success: true,
        suggestions,
        role,
        context: {
          totalSA: additionalStats?.totalSA || 0,
          pendingCount: additionalStats?.pendingSA || additionalStats?.pendingVerification || 0,
          completionRate: additionalStats?.completedSA ? 
            Math.round((additionalStats.completedSA / additionalStats.totalSA) * 100) : 0
        }
      });

    } catch (error) {
      console.error('❌ Error generating dynamic suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghasilkan saran chat',
        error: error.message
      });
    }
  }
}

module.exports = new AIChatController(); 