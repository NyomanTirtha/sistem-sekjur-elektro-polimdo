const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AIChatService {
  constructor() {
    this.ollamaUrl = 'http://localhost:11434';
    this.modelName = 'llama3.2:latest';
  }

  // Generate AI response using Ollama
  async generateResponse(userId, userRole, userQuery) {
    try {
      await this.checkOllamaConnection();
      
      const context = await this.buildComprehensiveContext(userId, userRole, userQuery);
      const prompt = this.createPrompt(userRole, context, userQuery);
      const response = await this.generateOllamaResponse(prompt, userRole, userId);
      
      return { 
        success: true, 
        response, 
        context: context.slice(0, 300) + '...' 
      };
    } catch (error) {
      console.error('AIChatService error:', error.message);
      return { 
        success: false, 
        response: this.getHumanErrorResponse(userRole),
        error: error.message 
      };
    }
  }

  // Cek koneksi ke Ollama
  async checkOllamaConnection() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000
      });
      
      if (!response.data.models || response.data.models.length === 0) {
        throw new Error('Tidak ada model yang tersedia di Ollama');
      }
      
      const modelExists = response.data.models.some(model => 
        model.name === this.modelName || model.name.startsWith('llama3.2')
      );
      
      if (!modelExists) {
        throw new Error(`Model ${this.modelName} tidak ditemukan`);
      }
      
      console.log('✅ Ollama connection OK, model tersedia');
      return true;
    } catch (error) {
      console.error('❌ Ollama connection failed:', error.message);
      throw new Error(`Ollama tidak dapat diakses: ${error.message}`);
    }
  }

  // Kirim prompt ke Ollama dengan konteks yang lebih personal
  async generateOllamaResponse(prompt, userRole, userId) {
    try {
      const systemMessage = this.createHumanSystemMessage(userRole, userId);
      
      console.log('🚀 Mengirim request ke Ollama...');
      console.log('Model:', this.modelName);

      const response = await axios.post(`${this.ollamaUrl}/api/chat`, {
        model: this.modelName,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        stream: false,
        options: {
          temperature: 0.7, // Lebih fokus pada akurasi data
          top_p: 0.9,
          top_k: 40,
          num_predict: 500
        }
      }, {
        timeout: 600000,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('✅ Response dari Ollama diterima');
      
      if (!response.data || !response.data.message || !response.data.message.content) {
        console.error('❌ Format response tidak sesuai:', response.data);
        throw new Error('Format response Ollama tidak sesuai');
      }

      const aiResponse = response.data.message.content.trim();
      console.log('📝 AI Response:', aiResponse.substring(0, 200) + '...');
      
      return this.enhanceResponseWithPersonalization(aiResponse, userRole, userId);

    } catch (error) {
      console.error('❌ Ollama integration error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service tidak berjalan. Jalankan: ollama serve');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Timeout - Ollama membutuhkan waktu terlalu lama');
      } else if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(`Ollama error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
      }
      
      throw error;
    }
  }

  // Enhanced human-like prompt creation
  createPrompt(userRole, context, userQuery) {
    return `Konteks Data dari Database Politeknik Negeri Manado:
${context}

Pertanyaan User (${userRole}): "${userQuery}"

INSTRUKSI PENTING:
1. Jawab HANYA berdasarkan data yang ada di konteks di atas
2. Jika data tidak tersedia di konteks, katakan dengan jelas "Data tidak tersedia dalam sistem"
3. Untuk status SA, sebutkan detail lengkap: status, tanggal, jenis SA
4. Gunakan data yang akurat sesuai database
5. Jangan berikan informasi umum atau saran menghubungi pihak lain jika data sudah tersedia
6. Berikan response dalam bahasa Indonesia yang ramah dan informatif

Jawaban berdasarkan data:`;
  }

  // More human system message
  createHumanSystemMessage(userRole, userId) {
    const rolePersonas = {
      'MAHASISWA': `Kamu adalah Zara, asisten AI yang ramah untuk mahasiswa Politeknik Negeri Manado. 
        Berikan informasi yang akurat berdasarkan data database yang tersedia. 
        Fokus pada status SA, riwayat pengajuan, dan data akademik mereka.`,
        
      'DOSEN': `Kamu adalah Zara, asisten AI profesional untuk dosen Politeknik Negeri Manado. 
        Berikan informasi tentang mahasiswa bimbingan, status SA yang perlu ditangani, 
        dan data akademik berdasarkan database.`,
        
      'KAPRODI': `Kamu adalah Zara, asisten AI untuk Kepala Program Studi Politeknik Negeri Manado. 
        Berikan laporan dan statistik berdasarkan data database program studi, 
        termasuk status SA yang perlu verifikasi.`,
        
      'ADMIN': `Kamu adalah Zara, asisten AI untuk Admin Politeknik Negeri Manado. 
        Berikan statistik sistem, data mahasiswa/dosen, dan status keseluruhan 
        berdasarkan database yang tersedia.`
    };

    const baseInstructions = `
ATURAN UTAMA:
- Jawab HANYA berdasarkan data yang tersedia dalam konteks
- Jika user bertanya tentang status SA, berikan detail lengkap dari database
- Jika data tidak ada, katakan dengan jelas "Data tidak ditemukan dalam sistem"
- Gunakan angka dan fakta yang akurat dari database
- Berikan informasi dalam format yang mudah dipahami
- Gunakan emoticon secukupnya untuk kehangatan

FORMAT RESPONSE:
- Jawaban langsung berdasarkan data
- Detail spesifik dari database  
- Informasi tambahan yang relevan
- Pertanyaan follow-up jika diperlukan
`;

    return (rolePersonas[userRole?.toUpperCase()] || rolePersonas['MAHASISWA']) + baseInstructions;
  }

  // Enhanced context builder with comprehensive database access
  async buildComprehensiveContext(userId, userRole, userQuery) {
    try {
      let context = '';
      
      if (userRole === 'MAHASISWA') {
        context = await this.buildMahasiswaContext(userId, userQuery);
      } else if (userRole === 'DOSEN') {
        context = await this.buildDosenContext(userId, userQuery);
      } else if (userRole === 'KAPRODI') {
        context = await this.buildKaprodiContext(userId, userQuery);
      } else if (userRole === 'ADMIN') {
        context = await this.buildAdminContext(userId, userQuery);
      }

      // Add general system information if needed
      if (this.needsSystemInfo(userQuery)) {
        const systemInfo = await this.getSystemInformation();
        context += '\n\n' + systemInfo;
      }
      
      return context;
      
    } catch (err) {
      console.error('Context building error:', err);
      return 'ERROR: Tidak dapat mengakses database. Silakan coba lagi atau hubungi admin.';
    }
  }

  // Check if query needs system information
  needsSystemInfo(query) {
    const systemKeywords = ['sistem', 'informasi umum', 'program studi', 'prodi', 'universitas'];
    return systemKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Detailed context for Mahasiswa - FIXED DATABASE ACCESS
  async buildMahasiswaContext(userId, userQuery) {
    try {
      const mhs = await prisma.mahasiswa.findUnique({
        where: { nim: userId },
        include: {
          programStudi: {
            include: {
              dosen: true
            }
          },
          pengajuanSA: {
            orderBy: { tanggalPengajuan: 'desc' },
            include: {
              details: {
                include: {
                  mataKuliah: true,
                  dosen: true
                }
              }
            }
          }
        }
      });

      if (!mhs) {
        return `ERROR: Data mahasiswa dengan NIM ${userId} tidak ditemukan dalam database.`;
      }

      // Statistik SA yang lebih detail
      const totalSA = mhs.pengajuanSA.length;
      const statusCount = {
        SELESAI: 0,
        DALAM_PROSES_SA: 0,
        PROSES_PENGAJUAN: 0,
        MENUNGGU_VERIFIKASI_KAPRODI: 0,
        DITOLAK: 0
      };

      mhs.pengajuanSA.forEach(sa => {
        if (statusCount.hasOwnProperty(sa.status)) {
          statusCount[sa.status]++;
        }
      });

      // SA terakhir dengan detail lengkap
      const saTermudah = mhs.pengajuanSA[0];
      let detailSATermudah = '';
      if (saTermudah) {
        const tanggal = new Date(saTermudah.tanggalPengajuan).toLocaleDateString('id-ID');
        const mataKuliahList = saTermudah.details.map(detail => 
          `${detail.mataKuliah.nama} (${detail.mataKuliah.sks} SKS)`
        ).join(', ');
        
        detailSATermudah = `
Status: ${saTermudah.status}
Tanggal Pengajuan: ${tanggal}
Mata Kuliah: ${mataKuliahList}
Nominal: Rp ${Number(saTermudah.nominal).toLocaleString('id-ID')}
${saTermudah.keterangan ? `Keterangan: ${saTermudah.keterangan}` : ''}
${saTermudah.keteranganReject ? `Alasan Ditolak: ${saTermudah.keteranganReject}` : ''}`;
      }

      // Riwayat 5 SA terbaru
      const riwayatSA = mhs.pengajuanSA.slice(0, 5).map((sa, index) => {
        const tanggal = new Date(sa.tanggalPengajuan).toLocaleDateString('id-ID');
        const jumlahMK = sa.details.length;
        return `${index + 1}. ${sa.status} - ${tanggal} (${jumlahMK} mata kuliah)`;
      }).join('\n');

      return `=== DATA MAHASISWA ===
Nama: ${mhs.nama}
NIM: ${mhs.nim}
Program Studi: ${mhs.programStudi?.nama || 'Tidak tersedia'}
Angkatan: ${mhs.angkatan}
Semester: ${mhs.semester}
No. Telepon: ${mhs.noTelp}
Alamat: ${mhs.alamat}

=== STATISTIK PENGAJUAN SA ===
Total Pengajuan: ${totalSA}
✅ Selesai: ${statusCount.SELESAI}
🔄 Dalam Proses SA: ${statusCount.DALAM_PROSES_SA}
⏳ Proses Pengajuan: ${statusCount.PROSES_PENGAJUAN}
⏸️ Menunggu Verifikasi Kaprodi: ${statusCount.MENUNGGU_VERIFIKASI_KAPRODI}
❌ Ditolak: ${statusCount.DITOLAK}

=== PENGAJUAN SA TERAKHIR ===
${saTermudah ? detailSATermudah : 'Belum ada pengajuan SA'}

=== RIWAYAT 5 PENGAJUAN TERBARU ===
${riwayatSA || 'Belum ada riwayat pengajuan'}

=== DOSEN PROGRAM STUDI ===
${mhs.programStudi?.dosen?.map(d => `- ${d.nama} (NIP: ${d.nip})`).join('\n') || 'Data dosen tidak tersedia'}`;

    } catch (error) {
      console.error('Error building mahasiswa context:', error);
      return `ERROR: Gagal mengambil data mahasiswa ${userId} dari database. Error: ${error.message}`;
    }
  }

  // Detailed context for Dosen - FIXED DATABASE ACCESS
  async buildDosenContext(userId, userQuery) {
    try {
      const dosen = await prisma.dosen.findUnique({
        where: { nip: userId },
        include: { 
          prodi: {
            include: {
              mahasiswa: {
                include: {
                  pengajuanSA: {
                    where: {
                      status: { 
                        in: ['PROSES_PENGAJUAN', 'DALAM_PROSES_SA', 'MENUNGGU_VERIFIKASI_KAPRODI'] 
                      }
                    },
                    orderBy: { tanggalPengajuan: 'desc' },
                    include: {
                      details: {
                        include: {
                          mataKuliah: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!dosen) {
        return `ERROR: Data dosen dengan NIP ${userId} tidak ditemukan dalam database.`;
      }

      const totalMahasiswa = dosen.prodi?.mahasiswa?.length || 0;
      const mahasiswaAktif = dosen.prodi?.mahasiswa?.filter(m => m.semester <= 14)?.length || 0;
      
      // SA yang memerlukan perhatian dosen
      const saMenunggu = [];
      const saStats = { PROSES_PENGAJUAN: 0, DALAM_PROSES_SA: 0, MENUNGGU_VERIFIKASI_KAPRODI: 0 };
      
      dosen.prodi?.mahasiswa?.forEach(mhs => {
        mhs.pengajuanSA?.forEach(sa => {
          saStats[sa.status]++;
          const tanggal = new Date(sa.tanggalPengajuan).toLocaleDateString('id-ID');
          const jumlahMK = sa.details.length;
          saMenunggu.push(`- ${mhs.nama} (${mhs.nim}): ${sa.status} - ${tanggal} (${jumlahMK} mata kuliah)`);
        });
      });

      return `=== DATA DOSEN ===
Nama: ${dosen.nama}
NIP: ${dosen.nip}
Program Studi: ${dosen.prodi?.nama || 'Tidak tersedia'}
Status Kaprodi: ${dosen.isKaprodi ? 'Ya' : 'Tidak'}
No. Telepon: ${dosen.noTelp || 'Tidak tersedia'}
Alamat: ${dosen.alamat || 'Tidak tersedia'}

=== MAHASISWA PROGRAM STUDI ===
Total Mahasiswa: ${totalMahasiswa}
Mahasiswa Aktif (≤14 semester): ${mahasiswaAktif}

=== SA YANG MEMERLUKAN PERHATIAN ===
🔄 Dalam Proses SA: ${saStats.DALAM_PROSES_SA}
⏳ Proses Pengajuan: ${saStats.PROSES_PENGAJUAN}
⏸️ Menunggu Verifikasi Kaprodi: ${saStats.MENUNGGU_VERIFIKASI_KAPRODI}

=== DETAIL SA PENDING ===
${saMenunggu.length > 0 ? saMenunggu.slice(0, 10).join('\n') : 'Tidak ada SA yang perlu perhatian saat ini'}`;

    } catch (error) {
      console.error('Error building dosen context:', error);
      return `ERROR: Gagal mengambil data dosen ${userId} dari database. Error: ${error.message}`;
    }
  }

  // Detailed context for Kaprodi - FIXED DATABASE ACCESS
  async buildKaprodiContext(userId, userQuery) {
    try {
      const kaprodi = await prisma.dosen.findUnique({
        where: { nip: userId },
        include: {
          prodi: {
            include: {
              mahasiswa: {
                include: {
                  pengajuanSA: {
                    orderBy: { tanggalPengajuan: 'desc' },
                    include: {
                      details: {
                        include: {
                          mataKuliah: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!kaprodi) {
        return `ERROR: Data kaprodi dengan NIP ${userId} tidak ditemukan dalam database.`;
      }

      // Statistik SA per status
      const saStats = {
        SELESAI: 0,
        DALAM_PROSES_SA: 0,
        PROSES_PENGAJUAN: 0,
        MENUNGGU_VERIFIKASI_KAPRODI: 0,
        DITOLAK: 0
      };

      const totalMahasiswa = kaprodi.prodi?.mahasiswa?.length || 0;
      let totalSA = 0;

      // SA yang menunggu verifikasi kaprodi
      const saMenungguVerifikasi = [];

      kaprodi.prodi?.mahasiswa?.forEach(mhs => {
        mhs.pengajuanSA?.forEach(sa => {
          totalSA++;
          if (saStats.hasOwnProperty(sa.status)) {
            saStats[sa.status]++;
          }
          
          if (sa.status === 'MENUNGGU_VERIFIKASI_KAPRODI') {
            const tanggal = new Date(sa.tanggalPengajuan).toLocaleDateString('id-ID');
            const jumlahMK = sa.details.length;
            saMenungguVerifikasi.push(`- ${mhs.nama} (${mhs.nim}): ${tanggal} - ${jumlahMK} mata kuliah`);
          }
        });
      });

      return `=== DATA KEPALA PROGRAM STUDI ===
Nama: ${kaprodi.nama}
NIP: ${kaprodi.nip}
Program Studi: ${kaprodi.prodi?.nama || 'Tidak tersedia'}
No. Telepon: ${kaprodi.noTelp || 'Tidak tersedia'}

=== STATISTIK PROGRAM STUDI ===
Total Mahasiswa: ${totalMahasiswa}
Total Pengajuan SA: ${totalSA}

=== REKAP STATUS SA ===
✅ Selesai: ${saStats.SELESAI}
🔄 Dalam Proses SA: ${saStats.DALAM_PROSES_SA}
⏳ Proses Pengajuan: ${saStats.PROSES_PENGAJUAN}
⏸️ Menunggu Verifikasi Kaprodi: ${saStats.MENUNGGU_VERIFIKASI_KAPRODI}
❌ Ditolak: ${saStats.DITOLAK}

=== SA MENUNGGU VERIFIKASI KAPRODI ===
${saMenungguVerifikasi.length > 0 ? saMenungguVerifikasi.slice(0, 15).join('\n') : 'Tidak ada SA yang menunggu verifikasi'}`;

    } catch (error) {
      console.error('Error building kaprodi context:', error);
      return `ERROR: Gagal mengambil data kaprodi ${userId} dari database. Error: ${error.message}`;
    }
  }

  // Detailed context for Admin - FIXED DATABASE ACCESS
  async buildAdminContext(userId, userQuery) {
    try {
      // Statistik keseluruhan sistem
      const totalMhs = await prisma.mahasiswa.count();
      const totalDosen = await prisma.dosen.count();
      const totalProdi = await prisma.programStudi.count();
      const totalMataKuliah = await prisma.mataKuliah.count();

      // Statistik SA
      const allSA = await prisma.pengajuanSA.findMany({
        include: {
          mahasiswa: {
            include: {
              programStudi: true
            }
          },
          details: {
            include: {
              mataKuliah: true
            }
          }
        }
      });

      const saStats = {
        SELESAI: 0,
        DALAM_PROSES_SA: 0,
        PROSES_PENGAJUAN: 0,
        MENUNGGU_VERIFIKASI_KAPRODI: 0,
        DITOLAK: 0
      };

      let totalDetail = 0;
      allSA.forEach(sa => {
        if (saStats.hasOwnProperty(sa.status)) {
          saStats[sa.status]++;
        }
        totalDetail += sa.details.length;
      });

      // SA terbaru
      const saTerbaru = allSA
        .sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan))
        .slice(0, 10)
        .map(sa => {
          const tanggal = new Date(sa.tanggalPengajuan).toLocaleDateString('id-ID');
          return `- ${sa.mahasiswa.nama} (${sa.mahasiswa.nim}) - ${sa.mahasiswa.programStudi.nama} - ${sa.status} - ${tanggal}`;
        });

      // Statistik per prodi
      const prodiStats = await prisma.programStudi.findMany({
        include: {
          _count: {
            select: { 
              mahasiswa: true,
              dosen: true
            }
          }
        }
      });

      const prodiInfo = prodiStats.map(prodi => 
        `- ${prodi.nama}: ${prodi._count.mahasiswa} mahasiswa, ${prodi._count.dosen} dosen`
      ).join('\n');

      return `=== STATISTIK SISTEM POLITEKNIK NEGERI MANADO ===
Total Mahasiswa: ${totalMhs}
Total Dosen: ${totalDosen}
Total Program Studi: ${totalProdi}
Total Mata Kuliah: ${totalMataKuliah}

=== STATISTIK PENGAJUAN SA ===
Total Pengajuan SA: ${allSA.length}
Total Detail Mata Kuliah: ${totalDetail}
✅ Selesai: ${saStats.SELESAI}
🔄 Dalam Proses SA: ${saStats.DALAM_PROSES_SA}
⏳ Proses Pengajuan: ${saStats.PROSES_PENGAJUAN}
⏸️ Menunggu Verifikasi Kaprodi: ${saStats.MENUNGGU_VERIFIKASI_KAPRODI}
❌ Ditolak: ${saStats.DITOLAK}

=== BREAKDOWN PER PROGRAM STUDI ===
${prodiInfo}

=== 10 PENGAJUAN SA TERBARU ===
${saTerbaru.join('\n')}`;

    } catch (error) {
      console.error('Error building admin context:', error);
      return `ERROR: Gagal mengambil statistik sistem dari database. Error: ${error.message}`;
    }
  }

  // Get general system information
  async getSystemInformation() {
    try {
      const prodiList = await prisma.programStudi.findMany({
        include: {
          _count: {
            select: { mahasiswa: true }
          }
        }
      });

      const prodiInfo = prodiList.map(prodi => 
        `- ${prodi.nama}: ${prodi._count.mahasiswa} mahasiswa`
      ).join('\n');

      const mataKuliah = await prisma.mataKuliah.findMany({
        orderBy: { nama: 'asc' }
      });

      const mkInfo = mataKuliah.slice(0, 10).map(mk => 
        `- ${mk.nama} (${mk.sks} SKS)`
      ).join('\n');

      return `=== INFORMASI SISTEM SA POLITEKNIK NEGERI MANADO ===
Sistem Pengajuan Surat Aktif untuk administrasi akademik mahasiswa.

=== PROGRAM STUDI TERSEDIA ===
${prodiInfo}

=== CONTOH MATA KULIAH ===
${mkInfo}
${mataKuliah.length > 10 ? `... dan ${mataKuliah.length - 10} mata kuliah lainnya` : ''}

=== STATUS SA YANG TERSEDIA ===
- PROSES_PENGAJUAN: Pengajuan baru sedang diproses
- MENUNGGU_VERIFIKASI_KAPRODI: Menunggu verifikasi dari Kaprodi
- DALAM_PROSES_SA: Sedang dalam proses pembuatan surat
- SELESAI: Surat aktif telah selesai dan dapat diambil
- DITOLAK: Pengajuan ditolak dengan alasan tertentu`;

    } catch (error) {
      return '=== SISTEM SA POLITEKNIK NEGERI MANADO ===\nSistem Pengajuan Surat Aktif untuk keperluan administrasi akademik mahasiswa.';
    }
  }

  // Enhance response with personalization
  enhanceResponseWithPersonalization(response, userRole, userId) {
    let enhancedResponse = response;

    // Add encouraging words for students
    if (userRole === 'MAHASISWA') {
      const encouragements = [
        'Semangat kuliah nya! 💪',
        'Tetap semangat belajar! 📚',
        'Sukses selalu untuk perkuliahannya! 🌟'
      ];
      const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
      
      // Tambahkan encouraging message hanya jika response tidak mengandung error
      if (!enhancedResponse.includes('ERROR:')) {
        enhancedResponse += `\n\n${randomEncouragement}`;
      }
    }

    return enhancedResponse;
  }

  // Human-like error responses
  getHumanErrorResponse(userRole) {
    const errorResponses = {
      'MAHASISWA': 'Maaf, ada kendala dalam mengakses data dari sistem 😅 Coba tanya lagi sebentar lagi ya, atau bisa langsung ke TU jika urgent!',
      'DOSEN': 'Mohon maaf Pak/Bu, ada gangguan koneksi database sesaat. Silakan coba beberapa saat lagi.',
      'KAPRODI': 'Mohon maaf Pak/Bu Kaprodi, sistem database sedang mengalami gangguan. Tim IT sedang menangani.',
      'ADMIN': 'Database error detected. Periksa koneksi Prisma dan Ollama service. Mungkin perlu restart service.'
    };
    return errorResponses[userRole?.toUpperCase()] || errorResponses['MAHASISWA'];
  }

  // Method untuk testing koneksi dengan response yang lebih natural
  async testConnection() {
    try {
      console.log('🔍 Testing connections...');
      
      // Test database connection
      await prisma.$connect();
      console.log('✅ Database connection OK');
      
      // Test Ollama connection
      await this.checkOllamaConnection();
      
      // Test with sample query
      const testResponse = await this.generateResponse(
        'test-user', 
        'ADMIN', 
        'Berikan statistik sistem'
      );
      
      console.log('✅ Test berhasil!');
      console.log('Response:', testResponse);
      return testResponse;
    } catch (error) {
      console.error('❌ Test gagal:', error.message);
      return { 
        success: false, 
        error: error.message,
        response: 'Test gagal - periksa koneksi database dan Ollama'
      };
    }
  }

  // Method untuk cleanup
  async cleanup() {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  }
}

module.exports = new AIChatService();