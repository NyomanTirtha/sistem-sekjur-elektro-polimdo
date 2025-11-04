require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const mataKuliahData = [
  // Semester 1
  { id: 1, nama: "Agama", sks: 3, semester: 1 },
  { id: 2, nama: "Bahasa Inggris Teknik 1", sks: 2, semester: 1 },
  { id: 3, nama: "Kewarganegaraan", sks: 3, semester: 1 },
  { id: 4, nama: "Matematika Teknik 1", sks: 2, semester: 1 },
  { id: 5, nama: "Matematika Diskrit", sks: 2, semester: 1 },
  { id: 6, nama: "Konsep Teknologi Informasi", sks: 2, semester: 1 },
  { id: 7, nama: "Logika dan Algoritma", sks: 2, semester: 1 },
  { id: 8, nama: "Konsep Pemrograman", sks: 2, semester: 1 },
  { id: 9, nama: "Praktikum Konsep Pemrograman", sks: 2, semester: 1 },
  { id: 10, nama: "QMS", sks: 2, semester: 1 },
  { id: 11, nama: "K3", sks: 1, semester: 1 },
  
  // Semester 2
  { id: 12, nama: "Bahasa Inggris Teknik 2", sks: 2, semester: 2 },
  { id: 13, nama: "Matematika Teknik 2", sks: 2, semester: 2 },
  { id: 14, nama: "Metode Numerik", sks: 2, semester: 2 },
  { id: 15, nama: "Organisasi dan Arsitektur Komputer", sks: 2, semester: 2 },
  { id: 16, nama: "Dasar Sistem Informasi", sks: 2, semester: 2 },
  { id: 17, nama: "Algoritma dan Struktur Data", sks: 2, semester: 2 },
  { id: 18, nama: "Disain Web", sks: 2, semester: 2 },
  { id: 19, nama: "Praktikum Algoritma dan Struktur Data", sks: 2, semester: 2 },
  { id: 20, nama: "Praktikum Metode Numerik", sks: 2, semester: 2 },
  { id: 21, nama: "Pancasila", sks: 2, semester: 2 },
  { id: 22, nama: "Workshop Jaringan Komputer", sks: 2, semester: 2 },
  
  // Semester 3
  { id: 23, nama: "Bahasa Inggris Teknik 3", sks: 2, semester: 3 },
  { id: 24, nama: "Matematika Teknik 3", sks: 2, semester: 3 },
  { id: 25, nama: "Pemrograman Berbasis Objek", sks: 2, semester: 3 },
  { id: 26, nama: "Sistem Operasi", sks: 2, semester: 3 },
  { id: 27, nama: "Basis Data 1", sks: 2, semester: 3 },
  { id: 28, nama: "Praktikum Sistem Operasi", sks: 2, semester: 3 },
  { id: 29, nama: "Praktikum Pemrograman Berbasis Objek", sks: 2, semester: 3 },
  { id: 30, nama: "Praktikum Basis Data 1", sks: 2, semester: 3 },
  { id: 31, nama: "Entrepreneurship", sks: 2, semester: 3 },
  { id: 32, nama: "Statistik Teknik", sks: 2, semester: 3 },
  
  // Semester 4
  { id: 33, nama: "Bahasa Inggris Teknik 4", sks: 2, semester: 4 },
  { id: 34, nama: "Interaksi Manusia dan Komputer", sks: 2, semester: 4 },
  { id: 35, nama: "Basis Data 2", sks: 2, semester: 4 },
  { id: 36, nama: "Workshop Administrasi dan Manajemen Jaringan", sks: 2, semester: 4 },
  { id: 37, nama: "Pemrograman Web", sks: 2, semester: 4 },
  { id: 38, nama: "Praktikum Basis Data 2", sks: 2, semester: 4 },
  { id: 39, nama: "Praktikum Pemrograman Web", sks: 2, semester: 4 },
  { id: 40, nama: "Serat Optik", sks: 2, semester: 4 },
  { id: 41, nama: "Workshop Mobile Programming", sks: 2, semester: 4 },
  { id: 42, nama: "Disain Pengalaman Pengguna", sks: 2, semester: 4 },
  
  // Semester 5
  { id: 43, nama: "Bahasa Indonesia", sks: 2, semester: 5 },
  { id: 44, nama: "Grafika Komputer", sks: 2, semester: 5 },
  { id: 45, nama: "Praktek Grafika Komputer", sks: 2, semester: 5 },
  { id: 46, nama: "Rekayasa Perangkat Lunak", sks: 2, semester: 5 },
  { id: 47, nama: "Game Programming", sks: 2, semester: 5 },
  { id: 48, nama: "Praktek Game Programming", sks: 2, semester: 5 },
  { id: 49, nama: "Kecerdasan Buatan", sks: 2, semester: 5 },
  { id: 50, nama: "Workshop Keamanan Jaringan", sks: 2, semester: 5 },
  { id: 51, nama: "Hukum TI dan Etika Profesi", sks: 2, semester: 5 },
  { id: 52, nama: "Komputasi Awan", sks: 1, semester: 5 }
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