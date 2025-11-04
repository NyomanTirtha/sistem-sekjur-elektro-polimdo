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
  const [semester, setSemester] = useState(1);
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [availRes, mineRes] = await Promise.all([
        teachingAssignmentsAPI.getAvailable({ tahunAjaran, semester }),
        teachingAssignmentsAPI.mine({ tahunAjaran, semester })
      ]);
      setAvailable(availRes?.data || []);
      setMine(mineRes?.data || []);
    } catch (e) {
      setError(e.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaran, semester]);

  const onAssign = async (mataKuliahId) => {
    setError('');
    try {
      await teachingAssignmentsAPI.assign({ mataKuliahId, tahunAjaran, semester });
      await loadData();
    } catch (e) {
      if (e.message?.includes('409') || /sudah diambil/i.test(e.message)) {
        setError('Mata kuliah sudah diambil dosen lain.');
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
        <label>
          Semester
          <select className="ml-2 border px-2 py-1" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <button className="border px-3 py-1" onClick={loadData} disabled={loading}>Refresh</button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="text-xs text-gray-600">SKS {mk.sks} • Smt {mk.semester} • {mk.programStudi?.nama}</div>
                  </div>
                  <button className="border px-3 py-1" onClick={() => onAssign(mk.id)}>Ambil</button>
                </li>
              ))}
              {available.length === 0 && <li className="text-sm text-gray-600">Tidak ada mata kuliah tersedia.</li>}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">Mata Kuliah Saya</h3>
          {loading ? (
            <div>Memuat...</div>
          ) : (
            <ul className="space-y-2">
              {mine.map((item) => (
                <li key={item.id} className="border p-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.mataKuliah?.nama}</div>
                    <div className="text-xs text-gray-600">{item.tahunAjaran} • Smt {item.semester} • {item.mataKuliah?.programStudi?.nama}</div>
                  </div>
                  <button className="border px-3 py-1" onClick={() => onUnassign(item.id)}>Lepas</button>
                </li>
              ))}
              {mine.length === 0 && <li className="text-sm text-gray-600">Belum ada penugasan.</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}





