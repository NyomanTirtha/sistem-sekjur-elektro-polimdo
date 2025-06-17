require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const mataKuliahData = [
  // Semester 1
  { nama: "Agama", sks: 3 },
  { nama: "Bahasa Inggris Teknik 1", sks: 2 },
  { nama: "Kewarganegaraan", sks: 3 },
  { nama: "Matematika Teknik 1", sks: 2 },
  { nama: "Matematika Diskrit", sks: 2 },
  { nama: "Konsep Teknologi Informasi", sks: 2 },
  { nama: "Logika dan Algoritma", sks: 2 },
  { nama: "Konsep Pemrograman", sks: 2 },
  { nama: "Praktikum Konsep Pemrograman", sks: 2 },
  { nama: "QMS", sks: 2 },
  { nama: "K3", sks: 1 },
  
  // Semester 2
  { nama: "Bahasa Inggris Teknik 2", sks: 2 },
  { nama: "Matematika Teknik 2", sks: 2 },
  { nama: "Metode Numerik", sks: 2 },
  { nama: "Organisasi dan Arsitektur Komputer", sks: 2 },
  { nama: "Dasar Sistem Informasi", sks: 2 },
  { nama: "Algoritma dan Struktur Data", sks: 2 },
  { nama: "Disain Web", sks: 2 },
  { nama: "Praktikum Algoritma dan Struktur Data", sks: 2 },
  { nama: "Praktikum Metode Numerik", sks: 2 },
  { nama: "Pancasila", sks: 2 },
  { nama: "Workshop Jaringan Komputer", sks: 2 },
  
  // Semester 3
  { nama: "Bahasa Inggris Teknik 3", sks: 2 },
  { nama: "Matematika Teknik 3", sks: 2 },
  { nama: "Pemrograman Berbasis Objek", sks: 2 },
  { nama: "Sistem Operasi", sks: 2 },
  { nama: "Basis Data 1", sks: 2 },
  { nama: "Praktikum Sistem Operasi", sks: 2 },
  { nama: "Praktikum Pemrograman Berbasis Objek", sks: 2 },
  { nama: "Praktikum Basis Data 1", sks: 2 },
  { nama: "Entrepreneurship", sks: 2 },
  { nama: "Statistik Teknik", sks: 2 },
  
  // Semester 4
  { nama: "Bahasa Inggris Teknik 4", sks: 2 },
  { nama: "Interaksi Manusia dan Komputer", sks: 2 },
  { nama: "Basis Data 2", sks: 2 },
  { nama: "Workshop Administrasi dan Manajemen Jaringan", sks: 2 },
  { nama: "Pemrograman Web", sks: 2 },
  { nama: "Praktikum Basis Data 2", sks: 2 },
  { nama: "Praktikum Pemrograman Web", sks: 2 },
  { nama: "Serat Optik", sks: 2 },
  { nama: "Workshop Mobile Programming", sks: 2 },
  { nama: "Disain Pengalaman Pengguna", sks: 2 },
  
  // Semester 5
  { nama: "Bahasa Indonesia", sks: 2 },
  { nama: "Grafika Komputer", sks: 2 },
  { nama: "Praktek Grafika Komputer", sks: 2 },
  { nama: "Rekayasa Perangkat Lunak", sks: 2 },
  { nama: "Game Programming", sks: 2 },
  { nama: "Praktek Game Programming", sks: 2 },
  { nama: "Kecerdasan Buatan", sks: 2 },
  { nama: "Workshop Keamanan Jaringan", sks: 2 },
  { nama: "Hukum TI dan Etika Profesi", sks: 2 },
  { nama: "Komputasi Awan", sks: 1 }
];

async function seedMataKuliah() {
  console.log('🌱 Mulai seeding mata kuliah...');
  
  try {
    // Hapus data lama jika ada
    await prisma.mataKuliah.deleteMany({});
    console.log('🗑️  Data mata kuliah lama dihapus');

    // Insert data baru
    const createdMataKuliah = await prisma.mataKuliah.createMany({
      data: mataKuliahData,
      skipDuplicates: true,
    });

    console.log(`✅ Berhasil menambahkan ${createdMataKuliah.count} mata kuliah`);
    
    // Tampilkan beberapa data yang berhasil ditambahkan
    const sampleData = await prisma.mataKuliah.findMany({
      take: 10,
      orderBy: { id: 'asc' }
    });
    
    console.log('📚 Sample mata kuliah yang ditambahkan:');
    sampleData.forEach(mk => {
      console.log(`   ${mk.id}. ${mk.nama} (${mk.sks} SKS)`);
    });
    
    // Tampilkan statistik SKS
    const totalSKS = mataKuliahData.reduce((total, mk) => total + mk.sks, 0);
    const uniqueSKS = [...new Set(mataKuliahData.map(mk => mk.sks))].sort();
    
    console.log('📊 Statistik:');
    console.log(`   Total mata kuliah: ${mataKuliahData.length}`);
    console.log(`   Total SKS: ${totalSKS}`);
    console.log(`   Variasi SKS: ${uniqueSKS.join(', ')}`);
    console.log(`   Rata-rata SKS: ${(totalSKS / mataKuliahData.length).toFixed(2)}`);
    
    console.log('🎉 Seeding mata kuliah selesai!');
    
  } catch (error) {
    console.error('❌ Error saat seeding mata kuliah:', error);
    throw error;
  }
}

// Export function untuk digunakan di main seed file
module.exports = { seedMataKuliah };

// Jalankan jika file ini dipanggil langsung
if (require.main === module) {
  seedMataKuliah()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}