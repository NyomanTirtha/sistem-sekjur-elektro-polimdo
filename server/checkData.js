const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== CHECKING DATABASE DATA ===');
    
    // Check mahasiswa
    const mahasiswa = await prisma.mahasiswa.findMany({
      take: 5,
      include: {
        programStudi: true,
        pengajuanSA: {
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
    
    console.log('\n=== MAHASISWA DATA ===');
    console.log(`Total mahasiswa: ${mahasiswa.length}`);
    mahasiswa.forEach((mhs, index) => {
      console.log(`${index + 1}. ${mhs.nama} (${mhs.nim}) - ${mhs.programStudi?.nama}`);
      console.log(`   SA count: ${mhs.pengajuanSA.length}`);
    });
    
    // Check dosen
    const dosen = await prisma.dosen.findMany({
      take: 5,
      include: {
        prodi: true,
        pengajuanDetails: {
          include: {
            pengajuanSA: {
              include: {
                mahasiswa: true
              }
            },
            mataKuliah: true
          }
        }
      }
    });
    
    console.log('\n=== DOSEN DATA ===');
    console.log(`Total dosen: ${dosen.length}`);
    dosen.forEach((d, index) => {
      console.log(`${index + 1}. ${d.nama} (${d.nip}) - ${d.prodi?.nama} - Kaprodi: ${d.isKaprodi}`);
      console.log(`   SA details count: ${d.pengajuanDetails.length}`);
    });
    
    // Check pengajuan SA
    const pengajuanSA = await prisma.pengajuanSA.findMany({
      take: 5,
      include: {
        mahasiswa: {
          include: {
            programStudi: true
          }
        },
        details: {
          include: {
            mataKuliah: true,
            dosen: true
          }
        }
      }
    });
    
    console.log('\n=== PENGAJUAN SA DATA ===');
    console.log(`Total pengajuan SA: ${pengajuanSA.length}`);
    pengajuanSA.forEach((sa, index) => {
      console.log(`${index + 1}. ID: ${sa.id} - ${sa.mahasiswa?.nama} - Status: ${sa.status}`);
      console.log(`   Details count: ${sa.details.length}`);
    });
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 