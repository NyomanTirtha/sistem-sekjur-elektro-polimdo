// utils/programStudiUtils.js

// Mapping program studi ID ke nama
export const PROGRAM_STUDI_MAPPING = {
  1: 'S1 Teknik Informatika',
  2: 'S1 Sistem Informasi', 
  3: 'S1 Teknik Komputer',
  4: 'D3 Teknik Informatika'
};

// Function untuk mendapatkan nama program studi berdasarkan ID
export const getProgramStudiName = (programStudiId) => {
  if (!programStudiId) return 'N/A';
  
  const id = typeof programStudiId === 'string' ? parseInt(programStudiId) : programStudiId;
  return PROGRAM_STUDI_MAPPING[id] || `Program Studi ID: ${programStudiId}`;
};

// Function untuk mendapatkan semua program studi sebagai array
export const getAllProgramStudi = () => {
  return Object.entries(PROGRAM_STUDI_MAPPING).map(([id, nama]) => ({
    id: parseInt(id),
    nama
  }));
}; 