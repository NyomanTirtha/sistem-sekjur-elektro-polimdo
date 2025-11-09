// utils/programStudiUtils.js

// Mapping program studi ID ke nama
export const PROGRAM_STUDI_MAPPING = {
  1: 'D4 Teknik Informatika',
  2: 'D4 Teknik Listrik'
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