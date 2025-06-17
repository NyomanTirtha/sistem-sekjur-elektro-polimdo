import React from 'react';

const FilterStatus = ({ filterStatus, setFilterStatus, userType }) => {
  if (userType === 'mahasiswa') return null;

  return (
    <div className="mb-4">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2"
      >
        <option value="ALL">Semua Status</option>
        <option value="PROSES_PENGAJUAN">Menunggu Verifikasi Admin</option>
        <option value="MENUNGGU_VERIFIKASI_KAPRODI">Menunggu Verifikasi Kaprodi</option>
        <option value="DALAM_PROSES_SA">Dalam Proses SA</option>
        <option value="SELESAI">Selesai</option>
        <option value="DITOLAK">Ditolak</option>
      </select>
    </div>
  );
};

export default FilterStatus;