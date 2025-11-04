require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedProgramStudi() {
  try {
    console.log('🏫 Memulai seeding Program Studi...');

    // Hapus data Program Studi yang ada
    console.log('🧹 Membersihkan data Program Studi lama...');
    await prisma.programStudi.deleteMany();

    // Insert Program Studi
    console.log('📚 Memasukkan data Program Studi...');
    const programStudiData = [
      { id: 1, nama: 'S1 Teknik Informatika', ketuaProdi: 'Dr. Andi Pratama, M.Kom' },
      { id: 2, nama: 'S1 Sistem Informasi', ketuaProdi: 'Dr. Nina Sari, M.T' },
      { id: 3, nama: 'S1 Teknik Komputer', ketuaProdi: 'Dr. Rudi Hermawan, M.Eng' },
      { id: 4, nama: 'D3 Teknik Informatika', ketuaProdi: 'Ir. Dewi Kusuma, M.Kom' },
    ];

    await prisma.programStudi.createMany({
      data: programStudiData,
    });

    console.log(`✅ Berhasil menambahkan ${programStudiData.length} Program Studi:`);
    programStudiData.forEach((prodi, index) => {
      console.log(`   ${index + 1}. ${prodi.nama} - Ketua: ${prodi.ketuaProdi}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Error saat seeding Program Studi:', error);
    throw error;
  }
}

// Fungsi untuk menjalankan seeding jika file ini dipanggil langsung
async function main() {
  try {
    await seedProgramStudi();
    console.log('\n🎉 Seeding Program Studi selesai!');
  } catch (error) {
    console.error('💥 Gagal melakukan seeding Program Studi:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export fungsi untuk digunakan di file lain
module.exports = {
  seedProgramStudi,
  prisma
};

// Jalankan main jika file ini dipanggil langsung
if (require.main === module) {
  main();
}