import React, { useEffect, useMemo, useState } from 'react';
import { teachingAssignmentsAPI } from '../../utils/api';

const currentAcademicYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  const next = y + 1;
  return `${y}/${next}`;
};

export default function TeachingPicker() {
  const [tahunAjaran, setTahunAjaran] = useState(currentAcademicYear());
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [availRes, pendingRes, activeRes] = await Promise.all([
        teachingAssignmentsAPI.getAvailable({ tahunAjaran }),
        teachingAssignmentsAPI.mine({ tahunAjaran, status: 'PENDING_APPROVAL' }),
        teachingAssignmentsAPI.mine({ tahunAjaran, status: 'ACTIVE' })
      ]);
      setAvailable(availRes?.data || []);
      setMine([
        ...(pendingRes?.data || []),
        ...(activeRes?.data || [])
      ]);
    } catch (e) {
      setError(e.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaran]);

  const onAssign = async (mataKuliahId) => {
    setError('');
    try {
      await teachingAssignmentsAPI.assign({ mataKuliahId, tahunAjaran });
      await loadData();
      alert('Pengajuan berhasil dikirim! Menunggu persetujuan Kaprodi.');
    } catch (e) {
      if (e.message?.includes('409') || /sudah diambil/i.test(e.message)) {
        setError('Mata kuliah sudah diambil dosen lain atau sudah ada pengajuan.');
      } else {
        setError(e.message || 'Gagal mengambil mata kuliah');
      }
    }
  };

  const onUnassign = async (id) => {
    setError('');
    try {
      await teachingAssignmentsAPI.unassign(id);
      await loadData();
    } catch (e) {
      setError(e.message || 'Gagal melepas mata kuliah');
    }
  };

  const tahunOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return [
      `${now - 1}/${now}`,
      `${now}/${now + 1}`,
      `${now + 1}/${now + 2}`
    ];
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Penugasan Mengajar</h2>

      <div className="flex items-center gap-3">
        <label>
          Tahun Ajaran
          <select className="ml-2 border px-2 py-1" value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)}>
            {tahunOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <button className="border px-3 py-1 bg-blue-500 text-white hover:bg-blue-600" onClick={loadData} disabled={loading}>Refresh</button>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">Info:</span> Semester mengikuti semester kurikulum mata kuliah
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <h3 className="font-medium mb-2">Tersedia untuk Diambil</h3>
          {loading ? (
            <div>Memuat...</div>
          ) : (
            <ul className="space-y-2">
              {available.map((mk) => (
                <li key={mk.id} className="border p-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{mk.nama}</div>
                    <div className="text-xs text-gray-600">SKS {mk.sks} • Semester {mk.semester} (Kurikulum) • {mk.programStudi?.nama}</div>
                  </div>
                  <button className="border px-3 py-1 bg-blue-500 text-white hover:bg-blue-600" onClick={() => onAssign(mk.id)}>Ajukan</button>
                </li>
              ))}
              {available.length === 0 && <li className="text-sm text-gray-600">Tidak ada mata kuliah tersedia.</li>}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">Usulan Saya (Menunggu Persetujuan)</h3>
          {loading ? (
            <div>Memuat...</div>
          ) : (
            <ul className="space-y-2">
              {mine.filter(item => item.status === 'PENDING_APPROVAL').map((item) => (
                <li key={item.id} className="border p-2 flex items-center justify-between bg-yellow-50">
                  <div>
                    <div className="font-medium">{item.mataKuliah?.nama}</div>
                    <div className="text-xs text-gray-600">{item.tahunAjaran} • Semester {item.semester} (Kurikulum) • {item.mataKuliah?.programStudi?.nama}</div>
                    <div className="text-xs text-yellow-600 mt-1">⏳ Menunggu persetujuan Kaprodi</div>
                  </div>
                  <button className="border px-3 py-1 bg-red-500 text-white hover:bg-red-600" onClick={() => onUnassign(item.id)}>Batalkan</button>
                </li>
              ))}
              {mine.filter(item => item.status === 'PENDING_APPROVAL').length === 0 && <li className="text-sm text-gray-600">Tidak ada usulan yang menunggu persetujuan.</li>}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">Penugasan Aktif</h3>
          {loading ? (
            <div>Memuat...</div>
          ) : (
            <ul className="space-y-2">
              {mine.filter(item => item.status === 'ACTIVE').map((item) => (
                <li key={item.id} className="border p-2 flex items-center justify-between bg-green-50">
                  <div>
                    <div className="font-medium">{item.mataKuliah?.nama}</div>
                    <div className="text-xs text-gray-600">{item.tahunAjaran} • Semester {item.semester} (Kurikulum) • {item.mataKuliah?.programStudi?.nama}</div>
                    <div className="text-xs text-green-600 mt-1">✅ Disetujui dan aktif</div>
                  </div>
                  <button className="border px-3 py-1 bg-red-500 text-white hover:bg-red-600" onClick={() => onUnassign(item.id)}>Lepas</button>
                </li>
              ))}
              {mine.filter(item => item.status === 'ACTIVE').length === 0 && <li className="text-sm text-gray-600">Belum ada penugasan aktif.</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}





