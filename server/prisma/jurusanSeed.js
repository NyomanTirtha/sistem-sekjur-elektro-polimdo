require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedJurusanAndUsers() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    console.log('🏛️ Memulai seeding Jurusan dan Users...');

    // Hapus data yang ada (urutan penting untuk foreign key constraints)
    console.log('🧹 Membersihkan data lama...');
    await prisma.pengajuanSADetail.deleteMany();
    await prisma.pengajuanSA.deleteMany();
    await prisma.mahasiswa.deleteMany();
    await prisma.dosen.deleteMany();
    await prisma.mataKuliah.deleteMany();
    await prisma.programStudi.deleteMany();
    await prisma.user.deleteMany();
    await prisma.jurusan.deleteMany();

    // 1. Insert Jurusan
    console.log('🏢 Memasukkan data Jurusan...');
    await prisma.jurusan.createMany({
      data: [
        { id: 1, nama: 'Teknik Elektro' },
        { id: 2, nama: 'Teknik Informatika' },
        { id: 3, nama: 'Teknik Sipil' },
        { id: 4, nama: 'Teknik Mesin' },
      ],
    });

    // 2. Insert Users (Sekjur, Admin, dll)
    console.log('👥 Memasukkan data Users...');
    await prisma.user.createMany({
      data: [
        // Sekretaris Jurusan - masing-masing jurusan
        { 
          username: 'sekjur_elektro', 
          nama: 'Sekretaris Jurusan Elektro', 
          password: hashedPassword, 
          role: 'SEKJUR',
          jurusanId: 1 // Teknik Elektro
        },
        { 
          username: 'sekjur_informatika', 
          nama: 'Sekretaris Jurusan Informatika', 
          password: hashedPassword, 
          role: 'SEKJUR',
          jurusanId: 2 // Teknik Informatika
        },
        { 
          username: 'sekjur_sipil', 
          nama: 'Sekretaris Jurusan Sipil', 
          password: hashedPassword, 
          role: 'SEKJUR',
          jurusanId: 3 // Teknik Sipil
        },
        { 
          username: 'sekjur_mesin', 
          nama: 'Sekretaris Jurusan Mesin', 
          password: hashedPassword, 
          role: 'SEKJUR',
          jurusanId: 4 // Teknik Mesin
        },
        
        // Kaprodi untuk setiap jurusan
        { 
          username: '198501012010011001', 
          nama: 'Dr. Andi Pratama, M.Kom', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null // Akan diset berdasarkan program studi
        },
        { 
          username: '198501012010011002', 
          nama: 'Dr. Budi Elektro, M.T', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null
        },
        { 
          username: '198501012010011003', 
          nama: 'Dr. Rahman Sipil, M.T', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null
        },
        { 
          username: '198501012010011004', 
          nama: 'Dr. Agus Mesin, M.T', 
          password: hashedPassword, 
          role: 'KAPRODI',
          jurusanId: null
        },
        
        // Users untuk Dosen
        { username: '198502022010012001', nama: 'Dr. Nina Sari, M.T', password: hashedPassword, role: 'DOSEN', jurusanId: null },
        { username: '198502022010012002', nama: 'Ir. Dewi Kusuma, M.Kom', password: hashedPassword, role: 'DOSEN', jurusanId: null },
        { username: '198502022010012003', nama: 'Prof. Ahmad Teknik, Ph.D', password: hashedPassword, role: 'DOSEN', jurusanId: null },
        { username: '198502022010012004', nama: 'Dr. Sari Informatika, M.T', password: hashedPassword, role: 'DOSEN', jurusanId: null },
        { username: '198502022010012005', nama: 'Ir. Indah Sipil, M.T', password: hashedPassword, role: 'DOSEN', jurusanId: null },
        { username: '198502022010012006', nama: 'Dr. Rudi Sipil, M.Eng', password: hashedPassword, role: 'DOSEN', jurusanId: null },
        { username: '198502022010012007', nama: 'Ir. Lina Mesin, M.T', password: hashedPassword, role: 'DOSEN', jurusanId: null },
        { username: '198502022010012008', nama: 'Dr. Hendra Mesin, M.Eng', password: hashedPassword, role: 'DOSEN', jurusanId: null },
        
        // Users untuk Mahasiswa (akan dibuat banyak)
        // Elektro
        { username: '22001001', nama: 'Ahmad Elektro Satu', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22001002', nama: 'Sari Elektro Dua', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22001003', nama: 'Budi Elektro Tiga', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22001004', nama: 'Rina Elektro Empat', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        // Informatika
        { username: '22002001', nama: 'Ahmad Informatika Satu', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22002002', nama: 'Sari Informatika Dua', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22002003', nama: 'Budi Informatika Tiga', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22002004', nama: 'Rina Informatika Empat', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        // Sipil
        { username: '22003001', nama: 'Ahmad Sipil Satu', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22003002', nama: 'Sari Sipil Dua', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22003003', nama: 'Budi Sipil Tiga', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        // Mesin
        { username: '22004001', nama: 'Ahmad Mesin Satu', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22004002', nama: 'Sari Mesin Dua', password: hashedPassword, role: 'MAHASISWA', jurusanId: null },
        { username: '22004003', nama: 'Budi Mesin Tiga', password: hashedPassword, role: 'MAHASISWA', jurusanId: null }
      ]
    });

    // 3. Insert Program Studi dengan relasi ke Jurusan
    console.log('📚 Memasukkan data Program Studi...');
    await prisma.programStudi.createMany({
      data: [
        // Jurusan Elektro (ID: 1)
        { id: 1, nama: 'S1 Teknik Elektro', ketuaProdi: 'Dr. Budi Elektro, M.T', jurusanId: 1 },
        { id: 2, nama: 'D3 Teknik Elektro', ketuaProdi: 'Ir. Sari Elektro, M.T', jurusanId: 1 },
        
        // Jurusan Informatika (ID: 2)
        { id: 3, nama: 'S1 Teknik Informatika', ketuaProdi: 'Dr. Andi Pratama, M.Kom', jurusanId: 2 },
        { id: 4, nama: 'S1 Sistem Informasi', ketuaProdi: 'Dr. Sari Informatika, M.T', jurusanId: 2 },
        { id: 5, nama: 'D3 Teknik Informatika', ketuaProdi: 'Ir. Dewi Kusuma, M.Kom', jurusanId: 2 },
        
        // Jurusan Sipil (ID: 3)
        { id: 6, nama: 'S1 Teknik Sipil', ketuaProdi: 'Dr. Rahman Sipil, M.T', jurusanId: 3 },
        { id: 7, nama: 'D3 Teknik Sipil', ketuaProdi: 'Ir. Indah Sipil, M.T', jurusanId: 3 },
        
        // Jurusan Mesin (ID: 4)
        { id: 8, nama: 'S1 Teknik Mesin', ketuaProdi: 'Dr. Agus Mesin, M.T', jurusanId: 4 },
        { id: 9, nama: 'D3 Teknik Mesin', ketuaProdi: 'Ir. Lina Mesin, M.T', jurusanId: 4 },
      ],
    });

    // 4. Insert Dosen untuk setiap jurusan
    console.log('👨‍🏫 Memasukkan data Dosen...');
    await prisma.dosen.createMany({
      data: [
        // Dosen Elektro
        { 
          nip: '198502022010012001', 
          nama: 'Dr. Nina Sari, M.T', 
          prodiId: 1, // S1 Teknik Elektro
          noTelp: '081234567001', 
          alamat: 'Jl. Elektro No. 1, Manado',
          isKaprodi: false 
        },
        { 
          nip: '198501012010011002', 
          nama: 'Dr. Budi Elektro, M.T', 
          prodiId: 1, // S1 Teknik Elektro
          noTelp: '081234567002', 
          alamat: 'Jl. Elektro No. 2, Manado',
          isKaprodi: true 
        },
        { 
          nip: '198502022010012003', 
          nama: 'Prof. Ahmad Teknik, Ph.D', 
          prodiId: 2, // D3 Teknik Elektro
          noTelp: '081234567003', 
          alamat: 'Jl. Elektro No. 3, Manado',
          isKaprodi: false 
        },
        
        // Dosen Informatika
        { 
          nip: '198501012010011001', 
          nama: 'Dr. Andi Pratama, M.Kom', 
          prodiId: 3, // S1 Teknik Informatika
          noTelp: '081234567004', 
          alamat: 'Jl. Informatika No. 1, Manado',
          isKaprodi: true 
        },
        { 
          nip: '198502022010012004', 
          nama: 'Dr. Sari Informatika, M.T', 
          prodiId: 4, // S1 Sistem Informasi
          noTelp: '081234567005', 
          alamat: 'Jl. Informatika No. 2, Manado',
          isKaprodi: true 
        },
        { 
          nip: '198502022010012002', 
          nama: 'Ir. Dewi Kusuma, M.Kom', 
          prodiId: 5, // D3 Teknik Informatika
          noTelp: '081234567006', 
          alamat: 'Jl. Informatika No. 3, Manado',
          isKaprodi: true 
        },
        
        // Dosen Sipil
        { 
          nip: '198501012010011003', 
          nama: 'Dr. Rahman Sipil, M.T', 
          prodiId: 6, // S1 Teknik Sipil
          noTelp: '081234567007', 
          alamat: 'Jl. Sipil No. 1, Manado',
          isKaprodi: true 
        },
        { 
          nip: '198502022010012005', 
          nama: 'Ir. Indah Sipil, M.T', 
          prodiId: 7, // D3 Teknik Sipil
          noTelp: '081234567008', 
          alamat: 'Jl. Sipil No. 2, Manado',
          isKaprodi: true 
        },
        { 
          nip: '198502022010012006', 
          nama: 'Dr. Rudi Sipil, M.Eng', 
          prodiId: 6, // S1 Teknik Sipil
          noTelp: '081234567009', 
          alamat: 'Jl. Sipil No. 3, Manado',
          isKaprodi: false 
        },
        
        // Dosen Mesin
        { 
          nip: '198501012010011004', 
          nama: 'Dr. Agus Mesin, M.T', 
          prodiId: 8, // S1 Teknik Mesin
          noTelp: '081234567010', 
          alamat: 'Jl. Mesin No. 1, Manado',
          isKaprodi: true 
        },
        { 
          nip: '198502022010012007', 
          nama: 'Ir. Lina Mesin, M.T', 
          prodiId: 9, // D3 Teknik Mesin
          noTelp: '081234567011', 
          alamat: 'Jl. Mesin No. 2, Manado',
          isKaprodi: true 
        },
        { 
          nip: '198502022010012008', 
          nama: 'Dr. Hendra Mesin, M.Eng', 
          prodiId: 8, // S1 Teknik Mesin
          noTelp: '081234567012', 
          alamat: 'Jl. Mesin No. 3, Manado',
          isKaprodi: false 
        }
      ]
    });

    // 5. Insert Mahasiswa untuk setiap jurusan
    console.log('🎓 Memasukkan data Mahasiswa...');
    await prisma.mahasiswa.createMany({
      data: [
        // Mahasiswa Elektro
        { 
          nim: '22001001', 
          nama: 'Ahmad Elektro Satu', 
          programStudiId: 1, // S1 Teknik Elektro
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567001', 
          alamat: 'Jl. Mahasiswa Elektro No. 1, Manado' 
        },
        { 
          nim: '22001002', 
          nama: 'Sari Elektro Dua', 
          programStudiId: 1, // S1 Teknik Elektro
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567002', 
          alamat: 'Jl. Mahasiswa Elektro No. 2, Manado' 
        },
        { 
          nim: '22001003', 
          nama: 'Budi Elektro Tiga', 
          programStudiId: 2, // D3 Teknik Elektro
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567003', 
          alamat: 'Jl. Mahasiswa Elektro No. 3, Manado' 
        },
        { 
          nim: '22001004', 
          nama: 'Rina Elektro Empat', 
          programStudiId: 2, // D3 Teknik Elektro
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567004', 
          alamat: 'Jl. Mahasiswa Elektro No. 4, Manado' 
        },
        
        // Mahasiswa Informatika
        { 
          nim: '22002001', 
          nama: 'Ahmad Informatika Satu', 
          programStudiId: 3, // S1 Teknik Informatika
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567011', 
          alamat: 'Jl. Mahasiswa Informatika No. 1, Manado' 
        },
        { 
          nim: '22002002', 
          nama: 'Sari Informatika Dua', 
          programStudiId: 4, // S1 Sistem Informasi
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567012', 
          alamat: 'Jl. Mahasiswa Informatika No. 2, Manado' 
        },
        { 
          nim: '22002003', 
          nama: 'Budi Informatika Tiga', 
          programStudiId: 5, // D3 Teknik Informatika
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567013', 
          alamat: 'Jl. Mahasiswa Informatika No. 3, Manado' 
        },
        { 
          nim: '22002004', 
          nama: 'Rina Informatika Empat', 
          programStudiId: 3, // S1 Teknik Informatika
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567014', 
          alamat: 'Jl. Mahasiswa Informatika No. 4, Manado' 
        },
        
        // Mahasiswa Sipil
        { 
          nim: '22003001', 
          nama: 'Ahmad Sipil Satu', 
          programStudiId: 6, // S1 Teknik Sipil
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567021', 
          alamat: 'Jl. Mahasiswa Sipil No. 1, Manado' 
        },
        { 
          nim: '22003002', 
          nama: 'Sari Sipil Dua', 
          programStudiId: 7, // D3 Teknik Sipil
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567022', 
          alamat: 'Jl. Mahasiswa Sipil No. 2, Manado' 
        },
        { 
          nim: '22003003', 
          nama: 'Budi Sipil Tiga', 
          programStudiId: 6, // S1 Teknik Sipil
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567023', 
          alamat: 'Jl. Mahasiswa Sipil No. 3, Manado' 
        },
        
        // Mahasiswa Mesin
        { 
          nim: '22004001', 
          nama: 'Ahmad Mesin Satu', 
          programStudiId: 8, // S1 Teknik Mesin
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567031', 
          alamat: 'Jl. Mahasiswa Mesin No. 1, Manado' 
        },
        { 
          nim: '22004002', 
          nama: 'Sari Mesin Dua', 
          programStudiId: 9, // D3 Teknik Mesin
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567032', 
          alamat: 'Jl. Mahasiswa Mesin No. 2, Manado' 
        },
        { 
          nim: '22004003', 
          nama: 'Budi Mesin Tiga', 
          programStudiId: 8, // S1 Teknik Mesin
          angkatan: '2022', 
          semester: 5, 
          noTelp: '082134567033', 
          alamat: 'Jl. Mahasiswa Mesin No. 3, Manado' 
        }
      ]
    });

    // 6. Insert Mata Kuliah untuk setiap program studi
    console.log('📖 Memasukkan data Mata Kuliah...');
    await prisma.mataKuliah.createMany({
      data: [
        // Mata Kuliah Elektro
        { nama: 'Rangkaian Listrik I', sks: 3, semester: 1, programStudiId: 1 },
        { nama: 'Matematika Teknik', sks: 3, semester: 1, programStudiId: 1 },
        { nama: 'Elektronika Analog', sks: 3, semester: 3, programStudiId: 1 },
        { nama: 'Sistem Kontrol', sks: 3, semester: 5, programStudiId: 1 },
        { nama: 'Instalasi Listrik', sks: 2, semester: 2, programStudiId: 2 },
        { nama: 'Motor Listrik', sks: 3, semester: 4, programStudiId: 2 },
        
        // Mata Kuliah Informatika
        { nama: 'Pemrograman Dasar', sks: 3, semester: 1, programStudiId: 3 },
        { nama: 'Algoritma dan Struktur Data', sks: 3, semester: 2, programStudiId: 3 },
        { nama: 'Basis Data', sks: 3, semester: 3, programStudiId: 3 },
        { nama: 'Jaringan Komputer', sks: 3, semester: 5, programStudiId: 3 },
        { nama: 'Analisis Sistem', sks: 3, semester: 2, programStudiId: 4 },
        { nama: 'Manajemen Proyek TI', sks: 3, semester: 4, programStudiId: 4 },
        { nama: 'Web Programming', sks: 3, semester: 3, programStudiId: 5 },
        { nama: 'Mobile Programming', sks: 3, semester: 5, programStudiId: 5 },
        
        // Mata Kuliah Sipil
        { nama: 'Mekanika Teknik', sks: 3, semester: 2, programStudiId: 6 },
        { nama: 'Struktur Beton', sks: 3, semester: 4, programStudiId: 6 },
        { nama: 'Ilmu Ukur Tanah', sks: 3, semester: 3, programStudiId: 6 },
        { nama: 'Gambar Teknik Sipil', sks: 2, semester: 1, programStudiId: 7 },
        { nama: 'Bahan Konstruksi', sks: 3, semester: 2, programStudiId: 7 },
        
        // Mata Kuliah Mesin
        { nama: 'Termodinamika', sks: 3, semester: 3, programStudiId: 8 },
        { nama: 'Mekanika Fluida', sks: 3, semester: 4, programStudiId: 8 },
        { nama: 'Elemen Mesin', sks: 3, semester: 5, programStudiId: 8 },
        { nama: 'Praktik Bengkel', sks: 2, semester: 2, programStudiId: 9 },
        { nama: 'Maintenance Mesin', sks: 3, semester: 4, programStudiId: 9 }
      ]
    });

    console.log('✅ Seeding Jurusan dan Users berhasil!');
    console.log('============================================');
    console.log('📊 SUMMARY DATA:');
    console.log('--------------------------------------------');
    console.log('🏢 Jurusan: 4');
    console.log('📚 Program Studi: 9');
    console.log('👨‍🏫 Dosen: 12');
    console.log('🎓 Mahasiswa: 15');
    console.log('📖 Mata Kuliah: 24');
    console.log('👥 Users: 30+');
    console.log('');
    console.log('📋 AKUN TESTING:');
    console.log('--------------------------------------------');
    console.log('🔵 SEKRETARIS JURUSAN:');
    console.log('  • sekjur_elektro     → Akses: Data Teknik Elektro');
    console.log('  • sekjur_informatika → Akses: Data Teknik Informatika');
    console.log('  • sekjur_sipil       → Akses: Data Teknik Sipil');
    console.log('  • sekjur_mesin       → Akses: Data Teknik Mesin');
    console.log('');
    console.log('🟡 KAPRODI (contoh):');
    console.log('  • 198501012010011001 → Dr. Andi Pratama (S1 Teknik Informatika)');
    console.log('  • 198501012010011002 → Dr. Budi Elektro (S1 Teknik Elektro)');
    console.log('');
    console.log('🟢 DOSEN (contoh):');
    console.log('  • 198502022010012001 → Dr. Nina Sari (Teknik Elektro)');
    console.log('  • 198502022010012004 → Dr. Sari Informatika (Teknik Informatika)');
    console.log('');
    console.log('🟣 MAHASISWA (contoh):');
    console.log('  • 22001001 → Ahmad Elektro (S1 Teknik Elektro)');
    console.log('  • 22002001 → Ahmad Informatika (S1 Teknik Informatika)');
    console.log('  • 22003001 → Ahmad Sipil (S1 Teknik Sipil)');
    console.log('  • 22004001 → Ahmad Mesin (S1 Teknik Mesin)');
    console.log('');
    console.log('🔑 Password untuk semua akun: 123456');
    console.log('============================================');

    return true;
  } catch (error) {
    console.error('❌ Error saat seeding Jurusan:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedJurusanAndUsers();
    console.log('\n🎉 Seeding selesai!');
  } catch (error) {
    console.error('💥 Gagal melakukan seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  seedJurusanAndUsers,
  prisma
};

if (require.main === module) {
  main();
}