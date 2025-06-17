require('dotenv').config({ path: '../.env' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash password "123" untuk semua user
    const hashedPassword = await bcrypt.hash('123', 10);

    console.log('Memulai insert data...');

    // 1. Insert Program Studi (tanpa relasi ke Jurusan)
    const programStudi = await prisma.programStudi.createMany({
      data: [
        {
          id: 1, // Menetapkan ID pertama
          nama: 'S1 Teknik Informatika',
          ketuaProdi: 'Dr. Andi Pratama, M.Kom'
        },
        {
          id: 2, // Menetapkan ID kedua
          nama: 'S1 Sistem Informasi',
          ketuaProdi: 'Dr. Nina Sari, M.T'
        },
        {
          id: 3, // Menetapkan ID ketiga
          nama: 'S1 Teknik Komputer',
          ketuaProdi: 'Dr. Rudi Hermawan, M.Eng'
        },
        {
          id: 4, // Menetapkan ID keempat
          nama: 'D3 Teknik Informatika',
          ketuaProdi: 'Ir. Dewi Kusuma, M.Kom'
        }
      ]
    });
    console.log('✓ Data Program Studi berhasil diinsert');

    // 2. Insert Users (Admin, Dosen, Mahasiswa)
    const users = await prisma.user.createMany({
      data: [
        { username: 'admin', nama: 'Administrator', password: hashedPassword, role: 'ADMIN' },
        { username: '198501012010011001', nama: 'Dr. Andi Pratama, M.Kom', password: hashedPassword, role: 'DOSEN' },
        { username: '198502022010012002', nama: 'Dr. Nina Sari, M.T', password: hashedPassword, role: 'DOSEN' },
        { username: '198503032010013003', nama: 'Dr. Rudi Hermawan, M.Eng', password: hashedPassword, role: 'DOSEN' },
        { username: '198504042010014004', nama: 'Ir. Dewi Kusuma, M.Kom', password: hashedPassword, role: 'DOSEN' },
        { username: '198505052010015005', nama: 'Prof. Budi Santoso, Ph.D', password: hashedPassword, role: 'KAPRODI' },
        { username: '2021001', nama: 'Ahmad Rizki Pratama', password: hashedPassword, role: 'MAHASISWA' },
        { username: '2021002', nama: 'Sari Dewi Lestari', password: hashedPassword, role: 'MAHASISWA' },
        { username: '2021003', nama: 'Budi Setiawan', password: hashedPassword, role: 'MAHASISWA' },
        { username: '2021004', nama: 'Rina Kartika Sari', password: hashedPassword, role: 'MAHASISWA' },
        { username: '2021005', nama: 'Doni Prasetyo', password: hashedPassword, role: 'MAHASISWA' },
        { username: '2022001', nama: 'Maya Sari Indah', password: hashedPassword, role: 'MAHASISWA' },
        { username: '2022002', nama: 'Eko Wahyudi', password: hashedPassword, role: 'MAHASISWA' },
        { username: '2022003', nama: 'Fitri Handayani', password: hashedPassword, role: 'MAHASISWA' },
        { username: '2023001', nama: 'Arif Rahman Hakim', password: hashedPassword, role: 'MAHASISWA' },
        { username: '2023002', nama: 'Lina Marlina', password: hashedPassword, role: 'MAHASISWA' }
      ]
    });
    console.log('✓ Data Users berhasil diinsert');

    // 3. Insert Dosen (tanpa relasi ke Jurusan)
    const dosen = await prisma.dosen.createMany({
      data: [
        { nip: '198501012010011001', nama: 'Dr. Andi Pratama, M.Kom', prodiId: 1, noTelp: '081234567801', alamat: 'Jl. Merdeka No. 1, Jakarta', isKaprodi: false },
        { nip: '198502022010012002', nama: 'Dr. Nina Sari, M.T', prodiId: 2, noTelp: '081234567802', alamat: 'Jl. Sudirman No. 2, Jakarta', isKaprodi: false },
        { nip: '198503032010013003', nama: 'Dr. Rudi Hermawan, M.Eng', prodiId: 3, noTelp: '081234567803', alamat: 'Jl. Thamrin No. 3, Jakarta', isKaprodi: false },
        { nip: '198504042010014004', nama: 'Ir. Dewi Kusuma, M.Kom', prodiId: 4, noTelp: '081234567804', alamat: 'Jl. Gatot Subroto No. 4, Jakarta', isKaprodi: false },
        { nip: '198505052010015005', nama: 'Prof. Budi Santoso, Ph.D', prodiId: 1, noTelp: '081234567805', alamat: 'Jl. Kuningan No. 5, Jakarta', isKaprodi: true }
      ]
    });
    console.log('✓ Data Dosen berhasil diinsert');

    // 4. Insert Mahasiswa (tanpa relasi ke Jurusan)
    const mahasiswa = await prisma.mahasiswa.createMany({
      data: [
        { nim: '2021001', nama: 'Ahmad Rizki Pratama', programStudiId: 1, angkatan: '2021', semester: 7, noTelp: '081234567001', alamat: 'Jl. Kebon Jeruk No. 1, Jakarta' },
        { nim: '2021002', nama: 'Sari Dewi Lestari', programStudiId: 1, angkatan: '2021', semester: 7, noTelp: '081234567002', alamat: 'Jl. Cempaka Putih No. 2, Jakarta' },
        { nim: '2021003', nama: 'Budi Setiawan', programStudiId: 2, angkatan: '2021', semester: 7, noTelp: '081234567003', alamat: 'Jl. Pasar Minggu No. 3, Jakarta' },
        { nim: '2021004', nama: 'Rina Kartika Sari', programStudiId: 2, angkatan: '2021', semester: 7, noTelp: '081234567004', alamat: 'Jl. Kalimalang No. 4, Jakarta' },
        { nim: '2021005', nama: 'Doni Prasetyo', programStudiId: 3, angkatan: '2021', semester: 7, noTelp: '081234567005', alamat: 'Jl. Raya Bogor No. 5, Jakarta' },
        { nim: '2022001', nama: 'Maya Sari Indah', programStudiId: 1, angkatan: '2022', semester: 5, noTelp: '081234567006', alamat: 'Jl. Pancoran No. 6, Jakarta' },
        { nim: '2022002', nama: 'Eko Wahyudi', programStudiId: 4, angkatan: '2022', semester: 5, noTelp: '081234567007', alamat: 'Jl. Tebet No. 7, Jakarta' },
        { nim: '2022003', nama: 'Fitri Handayani', programStudiId: 2, angkatan: '2022', semester: 5, noTelp: '081234567008', alamat: 'Jl. Menteng No. 8, Jakarta' },
        { nim: '2023001', nama: 'Arif Rahman Hakim', programStudiId: 1, angkatan: '2023', semester: 3, noTelp: '081234567009', alamat: 'Jl. Kemang No. 9, Jakarta' },
        { nim: '2023002', nama: 'Lina Marlina', programStudiId: 3, angkatan: '2023', semester: 3, noTelp: '081234567010', alamat: 'Jl. Senayan No. 10, Jakarta' }
      ]
    });
    console.log('✓ Data Mahasiswa berhasil diinsert');

    console.log('\n🎉 Semua data berhasil diinsert!');
    console.log('\nInformasi Login:');
    console.log('================');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: 123');
    console.log('\nContoh Dosen:');
    console.log('  Username: 198501012010011001 (NIP)');
    console.log('  Password: 123');
    console.log('\nContoh Mahasiswa:');
    console.log('  Username: 2021001 (NIM)');
    console.log('  Password: 123');
    console.log('\nSemua user menggunakan password: 123');

  } catch (error) {
    console.error('Error saat insert data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan fungsi main
main();
