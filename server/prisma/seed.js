require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash password untuk semua user
    const hashedPassword = await bcrypt.hash('123456', 10);
    console.log('Memulai proses seeding database...');

    // Hapus semua data yang ada (hati-hati di production!)
    console.log('Membersihkan data lama...');
    await prisma.pengajuanSADetail.deleteMany();
    await prisma.pengajuanSA.deleteMany();
    await prisma.mahasiswa.deleteMany();
    await prisma.dosen.deleteMany();
    await prisma.mataKuliah.deleteMany();
    await prisma.programStudi.deleteMany();
    await prisma.user.deleteMany();

    // 1. Insert Program Studi
    console.log('Memasukkan data Program Studi...');
    await prisma.programStudi.createMany({
      data: [
        { id: 1, nama: 'S1 Teknik Informatika', ketuaProdi: 'Dr. Andi Pratama, M.Kom' },
        { id: 2, nama: 'S1 Sistem Informasi', ketuaProdi: 'Dr. Nina Sari, M.T' },
        { id: 3, nama: 'S1 Teknik Komputer', ketuaProdi: 'Dr. Rudi Hermawan, M.Eng' },
        { id: 4, nama: 'D3 Teknik Informatika', ketuaProdi: 'Ir. Dewi Kusuma, M.Kom' },
      ],
    });

    // 2. Insert Users
    console.log('Memasukkan data User...');
    await prisma.user.createMany({
      data: [
        // Admin
        { username: 'admin', nama: 'Administrator', password: hashedPassword, role: 'ADMIN' },
        
        // Kaprodi (1 orang)
        { username: '198501012010011001', nama: 'Dr. Andi Pratama, M.Kom', password: hashedPassword, role: 'KAPRODI' },
        
        // Dosen (3 orang)
        { username: '198502022010012002', nama: 'Dr. Nina Sari, M.T', password: hashedPassword, role: 'DOSEN' },
        { username: '198503032010013003', nama: 'Dr. Rudi Hermawan, M.Eng', password: hashedPassword, role: 'DOSEN' },
        { username: '198504042010014004', nama: 'Ir. Dewi Kusuma, M.Kom', password: hashedPassword, role: 'DOSEN' },
        
        // Mahasiswa (4 orang dengan NIM 22024001-004)
        { username: '22024001', nama: 'Ahmad Rizki Pratama', password: hashedPassword, role: 'MAHASISWA' },
        { username: '22024002', nama: 'Sari Dewi Lestari', password: hashedPassword, role: 'MAHASISWA' },
        { username: '22024003', nama: 'Budi Setiawan', password: hashedPassword, role: 'MAHASISWA' },
        { username: '22024004', nama: 'Rina Kartika Sari', password: hashedPassword, role: 'MAHASISWA' }
      ]
    });

    // 3. Insert Dosen
    console.log('Memasukkan data Dosen...');
    await prisma.dosen.createMany({
      data: [
        // Kaprodi
        {
          nip: '198501012010011001',
          nama: 'Dr. Andi Pratama, M.Kom',
          prodiId: 1,
          noTelp: '081234567801',
          alamat: 'Jl. Merdeka No. 1, Manado',
          isKaprodi: true
        },
        // Dosen biasa
        {
          nip: '198502022010012002',
          nama: 'Dr. Nina Sari, M.T',
          prodiId: 2,
          noTelp: '081234567802',
          alamat: 'Jl. Sudirman No. 2, Manado',
          isKaprodi: false
        },
        {
          nip: '198503032010013003',
          nama: 'Dr. Rudi Hermawan, M.Eng',
          prodiId: 3,
          noTelp: '081234567803',
          alamat: 'Jl. Thamrin No. 3, Manado',
          isKaprodi: false
        },
        {
          nip: '198504042010014004',
          nama: 'Ir. Dewi Kusuma, M.Kom',
          prodiId: 4,
          noTelp: '081234567804',
          alamat: 'Jl. Gatot Subroto No. 4, Manado',
          isKaprodi: false
        }
      ]
    });

    // 4. Insert Mahasiswa
    console.log('Memasukkan data Mahasiswa...');
    await prisma.mahasiswa.createMany({
      data: [
        { nim: '22024001', nama: 'Ahmad Rizki Pratama', programStudiId: 1, angkatan: '2022', semester: 5, noTelp: '081234567001', alamat: 'Jl. Kebon Jeruk No. 1, Manado' },
        { nim: '22024002', nama: 'Sari Dewi Lestari', programStudiId: 1, angkatan: '2022', semester: 5, noTelp: '081234567002', alamat: 'Jl. Cempaka Putih No. 2, Manado' },
        { nim: '22024003', nama: 'Budi Setiawan', programStudiId: 2, angkatan: '2022', semester: 5, noTelp: '081234567003', alamat: 'Jl. Pasar Minggu No. 3, Manado' },
        { nim: '22024004', nama: 'Rina Kartika Sari', programStudiId: 2, angkatan: '2022', semester: 5, noTelp: '081234567004', alamat: 'Jl. Kalimalang No. 4, Manado' }
      ]
    });

    // 5. Insert Mata Kuliah
    console.log('Memasukkan data Mata Kuliah...');
    await prisma.mataKuliah.createMany({
      data: [
        { nama: 'Pemrograman Web', sks: 3 },
        { nama: 'Basis Data', sks: 3 },
        { nama: 'Algoritma dan Struktur Data', sks: 4 },
        { nama: 'Jaringan Komputer', sks: 3 },
        { nama: 'Sistem Operasi', sks: 3 },
        { nama: 'Kecerdasan Buatan', sks: 3 },
        { nama: 'Pemrograman Mobile', sks: 3 },
        { nama: 'Rekayasa Perangkat Lunak', sks: 3 },
        { nama: 'Manajemen Proyek TI', sks: 3 },
        { nama: 'Keamanan Informasi', sks: 3 }
      ]
    });

    console.log('\n✅ Seeding berhasil!');
    console.log('============================================');
    console.log('Informasi Login:');
    console.log('--------------------------------------------');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: 123456');
    console.log('\nKaprodi:');
    console.log('  Username: 198501012010011001 (NIP)');
    console.log('  Password: 123456');
    console.log('\nDosen:');
    console.log('  Username: 198502022010012002 (NIP)');
    console.log('  Password: 123456');
    console.log('\nMahasiswa:');
    console.log('  Username: 22024001 (NIM)');
    console.log('  Password: 123456');
    console.log('\nSemua user menggunakan password: 123456');
    console.log('============================================');

  } catch (error) {
    console.error('❌ Error saat seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan proses seeding
main();