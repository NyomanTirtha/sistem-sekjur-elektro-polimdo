require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash password untuk semua user (password: 123456)
    const hashedPassword = await bcrypt.hash('123456', 10);
    console.log('Memulai proses seeding database...');

    // Hapus semua data yang ada (hati-hati di production!)
    console.log('Membersihkan data lama...');
    await prisma.pengajuanSADetail.deleteMany();
    await prisma.pengajuanSA.deleteMany();
    await prisma.penugasanMengajar.deleteMany();
    await prisma.mahasiswa.deleteMany();
    await prisma.dosen.deleteMany();
    await prisma.mataKuliah.deleteMany();
    await prisma.programStudi.deleteMany();
    await prisma.user.deleteMany();
    await prisma.jurusan.deleteMany();

    // 1. Insert Jurusan
    console.log('Memasukkan data Jurusan...');
    await prisma.jurusan.createMany({
      data: [
        { id: 1, nama: 'Teknik Elektro' }
      ],
    });

    // 2. Insert Program Studi
    console.log('Memasukkan data Program Studi...');
    await prisma.programStudi.createMany({
      data: [
        { 
          id: 1, 
          nama: 'D4 Teknik Informatika', 
          ketuaProdi: 'Harson Kapoh,ST,.MT',
          jurusanId: 1
        },
        { 
          id: 2, 
          nama: 'D4 Teknik Listrik', 
          ketuaProdi: 'I Gede Para Atmaja,ST.,MT',
          jurusanId: 1
        }
      ],
    });

    // 3. Insert Users
    console.log('Memasukkan data User...');
    await prisma.user.createMany({
      data: [
        // Kajur (Admin)
        { 
          username: 'admin', 
          nama: 'Marson James Budiman, SST., MT.', 
          password: hashedPassword, 
          role: 'SEKJUR',
          jurusanId: 1
        },
        
        // Ketua Prodi D4 Teknik Informatika
        { 
          username: '197101011999031004', 
          nama: 'Harson Kapoh,ST,.MT', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null
        },
        
        // Ketua Prodi D4 Teknik Listrik
        { 
          username: '196901301993031003', 
          nama: 'I Gede Para Atmaja,ST.,MT', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null
        },
        
        // Dosen
        { 
          username: '197405232002121004', 
          nama: 'Maksy Sendiang, SST.,MIT', 
          password: hashedPassword, 
          role: 'DOSEN',
          jurusanId: null
        },
        { 
          username: '196602071989032001', 
          nama: 'Fitria Claudya Lahinta, S.S,T.,MT', 
          password: hashedPassword, 
          role: 'DOSEN',
          jurusanId: null
        },
        
        // Mahasiswa
        { 
          username: '23024099', 
          nama: 'RICHARD APOUW', 
          password: hashedPassword, 
          role: 'MAHASISWA',
          jurusanId: null
        },
        { 
          username: '24023052', 
          nama: 'ARIEL PAULUS KAPOH', 
          password: hashedPassword, 
          role: 'MAHASISWA',
          jurusanId: null
        }
      ]
    });

    // 4. Insert Dosen
    console.log('Memasukkan data Dosen...');
    await prisma.dosen.createMany({
      data: [
        // Ketua Prodi D4 Teknik Informatika
        {
          nip: '197101011999031004',
          nama: 'Harson Kapoh,ST,.MT',
          prodiId: 1,
          noTelp: '081234567890',
          alamat: 'Jl. Sudirman No. 45, Manado',
          isKaprodi: true
        },
        // Ketua Prodi D4 Teknik Listrik
        {
          nip: '196901301993031003',
          nama: 'I Gede Para Atmaja,ST.,MT',
          prodiId: 2,
          noTelp: '081234567891',
          alamat: 'Jl. Sam Ratulangi No. 78, Manado',
          isKaprodi: true
        },
        // Dosen biasa
        {
          nip: '197405232002121004',
          nama: 'Maksy Sendiang, SST.,MIT',
          prodiId: 1,
          noTelp: '081234567892',
          alamat: 'Jl. Piere Tendean No. 12, Manado',
          isKaprodi: false
        },
        {
          nip: '196602071989032001',
          nama: 'Fitria Claudya Lahinta, S.S,T.,MT',
          prodiId: 2,
          noTelp: '081234567893',
          alamat: 'Jl. Wolter Monginsidi No. 33, Manado',
          isKaprodi: false
        }
      ]
    });

    // 5. Insert Mahasiswa
    console.log('Memasukkan data Mahasiswa...');
    await prisma.mahasiswa.createMany({
      data: [
        { 
          nim: '23024099', 
          nama: 'RICHARD APOUW', 
          programStudiId: 1,
          angkatan: '2023', 
          semester: 3, 
          noTelp: '082134567890', 
          alamat: 'Jl. Raya Malalayang No. 123, Manado' 
        },
        { 
          nim: '24023052', 
          nama: 'ARIEL PAULUS KAPOH', 
          programStudiId: 2,
          angkatan: '2024', 
          semester: 3, 
          noTelp: '082134567891', 
          alamat: 'Jl. Sario No. 456, Manado' 
        }
      ]
    });

    // 6. Insert Mata Kuliah
    console.log('Memasukkan data Mata Kuliah...');
    
    // Mata Kuliah D4 Teknik Informatika (Semester 1-2)
    const mataKuliahInformatika = [
      // Semester 1
      { nama: 'Agama', sks: 2, semester: 1, programStudiId: 1 },
      { nama: 'Pancasila', sks: 2, semester: 1, programStudiId: 1 },
      { nama: 'Bahasa Indonesia', sks: 2, semester: 1, programStudiId: 1 },
      { nama: 'Bahasa Inggris Teknik 1', sks: 2, semester: 1, programStudiId: 1 },
      { nama: 'Matematika Dasar', sks: 3, semester: 1, programStudiId: 1 },
      { nama: 'Fisika Dasar', sks: 3, semester: 1, programStudiId: 1 },
      { nama: 'Konsep Teknologi Informasi', sks: 2, semester: 1, programStudiId: 1 },
      { nama: 'Algoritma dan Pemrograman Dasar', sks: 3, semester: 1, programStudiId: 1 },
      { nama: 'Praktikum Algoritma dan Pemrograman', sks: 1, semester: 1, programStudiId: 1 },
      { nama: 'Pengantar Sistem Informasi', sks: 2, semester: 1, programStudiId: 1 },
      { nama: 'Workshop Jaringan Komputer Dasar', sks: 2, semester: 1, programStudiId: 1 },
      
      // Semester 2
      { nama: 'Bahasa Inggris Teknik 2', sks: 2, semester: 2, programStudiId: 1 },
      { nama: 'Matematika Diskrit', sks: 3, semester: 2, programStudiId: 1 },
      { nama: 'Algoritma dan Struktur Data', sks: 3, semester: 2, programStudiId: 1 },
      { nama: 'Praktikum Algoritma dan Struktur Data', sks: 1, semester: 2, programStudiId: 1 },
      { nama: 'Organisasi dan Arsitektur Komputer', sks: 3, semester: 2, programStudiId: 1 },
      { nama: 'Basis Data Dasar', sks: 3, semester: 2, programStudiId: 1 },
      { nama: 'Praktikum Basis Data', sks: 1, semester: 2, programStudiId: 1 },
      { nama: 'Desain Web', sks: 2, semester: 2, programStudiId: 1 },
      { nama: 'Pemrograman Web Dasar', sks: 2, semester: 2, programStudiId: 1 },
      { nama: 'Praktikum Pemrograman Web', sks: 1, semester: 2, programStudiId: 1 },
      { nama: 'Metode Numerik', sks: 2, semester: 2, programStudiId: 1 },
      { nama: 'Kewirausahaan', sks: 2, semester: 2, programStudiId: 1 }
    ];

    // Mata Kuliah D4 Teknik Listrik (Semester 1-2)
    const mataKuliahListrik = [
      // Semester 1
      { nama: 'Agama', sks: 2, semester: 1, programStudiId: 2 },
      { nama: 'Pancasila', sks: 2, semester: 1, programStudiId: 2 },
      { nama: 'Bahasa Indonesia', sks: 2, semester: 1, programStudiId: 2 },
      { nama: 'Bahasa Inggris Teknik 1', sks: 2, semester: 1, programStudiId: 2 },
      { nama: 'Matematika Dasar', sks: 3, semester: 1, programStudiId: 2 },
      { nama: 'Fisika Dasar', sks: 3, semester: 1, programStudiId: 2 },
      { nama: 'Kimia Dasar', sks: 2, semester: 1, programStudiId: 2 },
      { nama: 'Dasar Rangkaian Listrik', sks: 3, semester: 1, programStudiId: 2 },
      { nama: 'Praktikum Dasar Rangkaian Listrik', sks: 1, semester: 1, programStudiId: 2 },
      { nama: 'Gambar Teknik Listrik', sks: 2, semester: 1, programStudiId: 2 },
      { nama: 'Pengantar Teknik Elektro', sks: 2, semester: 1, programStudiId: 2 },
      
      // Semester 2
      { nama: 'Bahasa Inggris Teknik 2', sks: 2, semester: 2, programStudiId: 2 },
      { nama: 'Matematika Teknik', sks: 3, semester: 2, programStudiId: 2 },
      { nama: 'Rangkaian Listrik I', sks: 3, semester: 2, programStudiId: 2 },
      { nama: 'Praktikum Rangkaian Listrik I', sks: 1, semester: 2, programStudiId: 2 },
      { nama: 'Elektronika Dasar', sks: 3, semester: 2, programStudiId: 2 },
      { nama: 'Praktikum Elektronika Dasar', sks: 1, semester: 2, programStudiId: 2 },
      { nama: 'Mesin Listrik Dasar', sks: 3, semester: 2, programStudiId: 2 },
      { nama: 'Praktikum Mesin Listrik', sks: 1, semester: 2, programStudiId: 2 },
      { nama: 'Instalasi Listrik Dasar', sks: 2, semester: 2, programStudiId: 2 },
      { nama: 'Praktikum Instalasi Listrik', sks: 1, semester: 2, programStudiId: 2 },
      { nama: 'Keselamatan dan Kesehatan Kerja', sks: 2, semester: 2, programStudiId: 2 },
      { nama: 'Kewirausahaan', sks: 2, semester: 2, programStudiId: 2 }
    ];

    await prisma.mataKuliah.createMany({
      data: [...mataKuliahInformatika, ...mataKuliahListrik]
    });

    console.log('\n✅ Seeding berhasil!');
    console.log('============================================');
    console.log('Informasi Login:');
    console.log('--------------------------------------------');
    console.log('Kajur (SEKJUR):');
    console.log('  Username: admin');
    console.log('  Password: 123456');
    console.log('\nKetua Prodi D4 Teknik Informatika:');
    console.log('  Username: 197101011999031004 (NIP)');
    console.log('  Password: 123456');
    console.log('\nKetua Prodi D4 Teknik Listrik:');
    console.log('  Username: 196901301993031003 (NIP)');
    console.log('  Password: 123456');
    console.log('\nDosen:');
    console.log('  Username: 197405232002121004 (NIP) - Maksy Sendiang');
    console.log('  Username: 196602071989032001 (NIP) - Fitria Claudya Lahinta');
    console.log('  Password: 123456');
    console.log('\nMahasiswa:');
    console.log('  Username: 23024099 (NIM) - RICHARD APOUW - D4 Teknik Informatika');
    console.log('  Username: 24023052 (NIM) - ARIEL PAULUS KAPOH - D4 Teknik Listrik');
    console.log('  Password: 123456');
    console.log('\nSemua user menggunakan password: 123456');
    console.log('============================================');
    console.log('\nData yang dibuat:');
    console.log(`  - Jurusan: 1 (Teknik Elektro)`);
    console.log(`  - Program Studi: 2 (D4 Teknik Informatika, D4 Teknik Listrik)`);
    console.log(`  - Dosen: 4 (2 Kaprodi + 2 Dosen)`);
    console.log(`  - Mahasiswa: 2`);
    console.log(`  - Mata Kuliah D4 Teknik Informatika: ${mataKuliahInformatika.length} (Semester 1-2)`);
    console.log(`  - Mata Kuliah D4 Teknik Listrik: ${mataKuliahListrik.length} (Semester 1-2)`);
    console.log(`  - Total Mata Kuliah: ${mataKuliahInformatika.length + mataKuliahListrik.length}`);
    console.log('============================================');

  } catch (error) {
    console.error('❌ Error saat seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan proses seeding
main();
