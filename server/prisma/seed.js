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
        { id: 1, nama: 'Teknik Elektro' },
        { id: 2, nama: 'Teknik Sipil' }
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
        },
        { 
          id: 3, 
          nama: 'D4 Teknik Konstruksi Bangunan Gedung', 
          ketuaProdi: 'Dr. Ir. Budi Santoso, MT.',
          jurusanId: 2
        },
        { 
          id: 4, 
          nama: 'D4 Teknik Konstruksi Jalan dan Jembatan', 
          ketuaProdi: 'Ir. Ahmad Wijaya, ST., MT.',
          jurusanId: 2
        }
      ],
    });

    // 3. Insert Users
    console.log('Memasukkan data User...');
    await prisma.user.createMany({
      data: [
        // Sekretaris Jurusan Teknik Elektro
        { 
          username: 'admin', 
          nama: 'Marson James Budiman, SST., MT.', 
          password: hashedPassword, 
          role: 'SEKJUR',
          jurusanId: 1
        },
        // Sekretaris Jurusan Teknik Sipil
        { 
          username: 'sekjur_sipil', 
          nama: 'Pendekar Trio Lonan, ST., MT.', 
          password: hashedPassword, 
          role: 'SEKJUR',
          jurusanId: 2
        },
        
        // Kaprodi Teknik Sipil
        { 
          username: '197201011998031007', 
          nama: 'Dr. Ir. Budi Santoso, MT.', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null,
          programStudiId: 3
        },
        { 
          username: '197301011998031008', 
          nama: 'Ir. Ahmad Wijaya, ST., MT.', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null,
          programStudiId: 4
        },
        
        { 
          username: '197101011999031004', 
          nama: 'Harson Kapoh,ST,.MT', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null,
          programStudiId: 1
        },
        { 
          username: '196901301993031003', 
          nama: 'I Gede Para Atmaja,ST.,MT', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null,
          programStudiId: 2
        },
        
        // Dosen Teknik Elektro
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
        // Dosen Teknik Sipil
        { 
          username: '197501011998031005', 
          nama: 'Ir. Siti Nurhaliza, ST., MT.', 
          password: hashedPassword, 
          role: 'DOSEN',
          jurusanId: null
        },
        { 
          username: '197601011998031006', 
          nama: 'Drs. Muhammad Rizki, ST., M.Eng.', 
          password: hashedPassword, 
          role: 'DOSEN',
          jurusanId: null
        },
        { 
          username: '197701011998031009', 
          nama: 'Ir. Dewi Sartika, ST., MT.', 
          password: hashedPassword, 
          role: 'DOSEN',
          jurusanId: null
        },
        { 
          username: '197801011998031010', 
          nama: 'Drs. Agus Setiawan, ST., M.Sc.', 
          password: hashedPassword, 
          role: 'DOSEN',
          jurusanId: null
        },
        
        // Mahasiswa Teknik Elektro
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
        },
        // Mahasiswa Teknik Sipil
        { 
          username: '23025001', 
          nama: 'RUDI HERMAWAN', 
          password: hashedPassword, 
          role: 'MAHASISWA',
          jurusanId: null
        },
        { 
          username: '23025002', 
          nama: 'SARI INDAH SARI', 
          password: hashedPassword, 
          role: 'MAHASISWA',
          jurusanId: null
        },
        { 
          username: '24025001', 
          nama: 'ANDI PRASETYA', 
          password: hashedPassword, 
          role: 'MAHASISWA',
          jurusanId: null
        },
        { 
          username: '24025002', 
          nama: 'LINA KARTIKA', 
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
        // Dosen biasa Teknik Elektro
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
        },
        // Kaprodi Teknik Sipil
        {
          nip: '197201011998031007',
          nama: 'Dr. Ir. Budi Santoso, MT.',
          prodiId: 3,
          noTelp: '081234567896',
          alamat: 'Jl. Teknik Sipil No. 10, Manado',
          isKaprodi: true
        },
        {
          nip: '197301011998031008',
          nama: 'Ir. Ahmad Wijaya, ST., MT.',
          prodiId: 4,
          noTelp: '081234567897',
          alamat: 'Jl. Teknik Sipil No. 20, Manado',
          isKaprodi: true
        },
        // Dosen Teknik Sipil
        {
          nip: '197501011998031005',
          nama: 'Ir. Siti Nurhaliza, ST., MT.',
          prodiId: 3,
          noTelp: '081234567894',
          alamat: 'Jl. Teknik Sipil No. 1, Manado',
          isKaprodi: false
        },
        {
          nip: '197601011998031006',
          nama: 'Drs. Muhammad Rizki, ST., M.Eng.',
          prodiId: 4,
          noTelp: '081234567895',
          alamat: 'Jl. Teknik Sipil No. 2, Manado',
          isKaprodi: false
        },
        {
          nip: '197701011998031009',
          nama: 'Ir. Dewi Sartika, ST., MT.',
          prodiId: 3,
          noTelp: '081234567898',
          alamat: 'Jl. Teknik Sipil No. 3, Manado',
          isKaprodi: false
        },
        {
          nip: '197801011998031010',
          nama: 'Drs. Agus Setiawan, ST., M.Sc.',
          prodiId: 4,
          noTelp: '081234567899',
          alamat: 'Jl. Teknik Sipil No. 4, Manado',
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
        },
        // Mahasiswa Teknik Sipil
        { 
          nim: '23025001', 
          nama: 'RUDI HERMAWAN', 
          programStudiId: 3,
          angkatan: '2023', 
          semester: 3, 
          noTelp: '082134567892', 
          alamat: 'Jl. Teknik Sipil No. 100, Manado' 
        },
        { 
          nim: '23025002', 
          nama: 'SARI INDAH SARI', 
          programStudiId: 3,
          angkatan: '2023', 
          semester: 3, 
          noTelp: '082134567893', 
          alamat: 'Jl. Teknik Sipil No. 101, Manado' 
        },
        { 
          nim: '24025001', 
          nama: 'ANDI PRASETYA', 
          programStudiId: 4,
          angkatan: '2024', 
          semester: 3, 
          noTelp: '082134567894', 
          alamat: 'Jl. Teknik Sipil No. 200, Manado' 
        },
        { 
          nim: '24025002', 
          nama: 'LINA KARTIKA', 
          programStudiId: 4,
          angkatan: '2024', 
          semester: 3, 
          noTelp: '082134567895', 
          alamat: 'Jl. Teknik Sipil No. 201, Manado' 
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

    // Mata Kuliah D4 Teknik Konstruksi Bangunan Gedung (Semester 1-2)
    const mataKuliahTKBG = [
      // Semester 1
      { nama: 'Agama', sks: 2, semester: 1, programStudiId: 3 },
      { nama: 'Pancasila', sks: 2, semester: 1, programStudiId: 3 },
      { nama: 'Bahasa Indonesia', sks: 2, semester: 1, programStudiId: 3 },
      { nama: 'Bahasa Inggris Teknik 1', sks: 2, semester: 1, programStudiId: 3 },
      { nama: 'Matematika Dasar', sks: 3, semester: 1, programStudiId: 3 },
      { nama: 'Fisika Dasar', sks: 3, semester: 1, programStudiId: 3 },
      { nama: 'Kimia Dasar', sks: 2, semester: 1, programStudiId: 3 },
      { nama: 'Gambar Teknik Sipil', sks: 2, semester: 1, programStudiId: 3 },
      { nama: 'Pengantar Teknik Sipil', sks: 2, semester: 1, programStudiId: 3 },
      { nama: 'Mekanika Teknik Dasar', sks: 3, semester: 1, programStudiId: 3 },
      { nama: 'Praktikum Mekanika Teknik', sks: 1, semester: 1, programStudiId: 3 },
      
      // Semester 2
      { nama: 'Bahasa Inggris Teknik 2', sks: 2, semester: 2, programStudiId: 3 },
      { nama: 'Matematika Teknik', sks: 3, semester: 2, programStudiId: 3 },
      { nama: 'Mekanika Tanah Dasar', sks: 3, semester: 2, programStudiId: 3 },
      { nama: 'Praktikum Mekanika Tanah', sks: 1, semester: 2, programStudiId: 3 },
      { nama: 'Struktur Beton Dasar', sks: 3, semester: 2, programStudiId: 3 },
      { nama: 'Praktikum Struktur Beton', sks: 1, semester: 2, programStudiId: 3 },
      { nama: 'Bahan Bangunan', sks: 2, semester: 2, programStudiId: 3 },
      { nama: 'Praktikum Bahan Bangunan', sks: 1, semester: 2, programStudiId: 3 },
      { nama: 'Perencanaan Bangunan Gedung', sks: 2, semester: 2, programStudiId: 3 },
      { nama: 'Keselamatan dan Kesehatan Kerja', sks: 2, semester: 2, programStudiId: 3 },
      { nama: 'Kewirausahaan', sks: 2, semester: 2, programStudiId: 3 }
    ];

    // Mata Kuliah D4 Teknik Konstruksi Jalan dan Jembatan (Semester 1-2)
    const mataKuliahTKJJ = [
      // Semester 1
      { nama: 'Agama', sks: 2, semester: 1, programStudiId: 4 },
      { nama: 'Pancasila', sks: 2, semester: 1, programStudiId: 4 },
      { nama: 'Bahasa Indonesia', sks: 2, semester: 1, programStudiId: 4 },
      { nama: 'Bahasa Inggris Teknik 1', sks: 2, semester: 1, programStudiId: 4 },
      { nama: 'Matematika Dasar', sks: 3, semester: 1, programStudiId: 4 },
      { nama: 'Fisika Dasar', sks: 3, semester: 1, programStudiId: 4 },
      { nama: 'Kimia Dasar', sks: 2, semester: 1, programStudiId: 4 },
      { nama: 'Gambar Teknik Sipil', sks: 2, semester: 1, programStudiId: 4 },
      { nama: 'Pengantar Teknik Sipil', sks: 2, semester: 1, programStudiId: 4 },
      { nama: 'Mekanika Teknik Dasar', sks: 3, semester: 1, programStudiId: 4 },
      { nama: 'Praktikum Mekanika Teknik', sks: 1, semester: 1, programStudiId: 4 },
      
      // Semester 2
      { nama: 'Bahasa Inggris Teknik 2', sks: 2, semester: 2, programStudiId: 4 },
      { nama: 'Matematika Teknik', sks: 3, semester: 2, programStudiId: 4 },
      { nama: 'Mekanika Tanah Dasar', sks: 3, semester: 2, programStudiId: 4 },
      { nama: 'Praktikum Mekanika Tanah', sks: 1, semester: 2, programStudiId: 4 },
      { nama: 'Perencanaan Jalan', sks: 3, semester: 2, programStudiId: 4 },
      { nama: 'Praktikum Perencanaan Jalan', sks: 1, semester: 2, programStudiId: 4 },
      { nama: 'Bahan Konstruksi Jalan', sks: 2, semester: 2, programStudiId: 4 },
      { nama: 'Praktikum Bahan Konstruksi Jalan', sks: 1, semester: 2, programStudiId: 4 },
      { nama: 'Perencanaan Jembatan Dasar', sks: 2, semester: 2, programStudiId: 4 },
      { nama: 'Keselamatan dan Kesehatan Kerja', sks: 2, semester: 2, programStudiId: 4 },
      { nama: 'Kewirausahaan', sks: 2, semester: 2, programStudiId: 4 }
    ];

    await prisma.mataKuliah.createMany({
      data: [...mataKuliahInformatika, ...mataKuliahListrik, ...mataKuliahTKBG, ...mataKuliahTKJJ]
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
