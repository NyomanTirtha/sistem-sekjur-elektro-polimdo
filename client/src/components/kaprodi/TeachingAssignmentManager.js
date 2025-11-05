import React, { useEffect, useState, useMemo } from 'react';
import { teachingAssignmentsAPI } from '../../utils/api';
import { dosenAPI } from '../../utils/api';
import { mataKuliahAPI } from '../../utils/api';

const currentAcademicYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  const next = y + 1;
  return `${y}/${next}`;
};

export default function TeachingAssignmentManager() {
  const [activeTab, setActiveTab] = useState('pending');
  const [tahunAjaran, setTahunAjaran] = useState(currentAcademicYear());
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState('');
  
  // Form untuk tambah penugasan
  const [formData, setFormData] = useState({ mataKuliahId: '', dosenId: '', tahunAjaran: currentAcademicYear() });
  const [dosenList, setDosenList] = useState([]);
  const [mataKuliahList, setMataKuliahList] = useState([]);
  
  // Filter untuk semua penugasan
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDosenId, setFilterDosenId] = useState('');
  const [filterMataKuliahId, setFilterMataKuliahId] = useState('');

  const tahunOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return [
      `${now - 1}/${now}`,
      `${now}/${now + 1}`,
      `${now + 1}/${now + 2}`
    ];
  }, []);

  const loadPendingApprovals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teachingAssignmentsAPI.getPendingApprovals({ tahunAjaran });
      setPendingApprovals(res?.data || []);
    } catch (e) {
      setError(e.message || 'Gagal memuat usulan');
    } finally {
      setLoading(false);
    }
  };

  const loadAllAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teachingAssignmentsAPI.getAllAssignments({
        tahunAjaran,
        status: filterStatus || undefined,
        dosenId: filterDosenId || undefined,
        mataKuliahId: filterMataKuliahId || undefined
      });
      setAllAssignments(res?.data || []);
    } catch (e) {
      setError(e.message || 'Gagal memuat penugasan');
    } finally {
      setLoading(false);
    }
  };

  const loadDosenList = async () => {
    setLoadingForm(true);
    try {
      const res = await dosenAPI.getAll();
      // Handle different response formats
      if (res?.data) {
        setDosenList(res.data);
      } else if (Array.isArray(res)) {
        setDosenList(res);
      } else {
        setDosenList([]);
      }
      console.log('Dosen loaded:', res?.data || res);
    } catch (e) {
      console.error('Error loading dosen:', e);
      setError(`Gagal memuat data dosen: ${e.message}`);
      setDosenList([]);
    } finally {
      setLoadingForm(false);
    }
  };

  const loadMataKuliahList = async () => {
    setLoadingForm(true);
    try {
      const res = await mataKuliahAPI.getAll();
      // Handle different response formats
      if (res?.data) {
        setMataKuliahList(res.data);
      } else if (Array.isArray(res)) {
        setMataKuliahList(res);
      } else {
        setMataKuliahList([]);
      }
      console.log('Mata kuliah loaded:', res?.data || res);
    } catch (e) {
      console.error('Error loading mata kuliah:', e);
      setError(`Gagal memuat data mata kuliah: ${e.message}`);
      setMataKuliahList([]);
    } finally {
      setLoadingForm(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingApprovals();
    } else if (activeTab === 'all') {
      loadAllAssignments();
    } else if (activeTab === 'add') {
      // Load data untuk form tambah penugasan
      loadDosenList();
      loadMataKuliahList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tahunAjaran, filterStatus, filterDosenId, filterMataKuliahId]);

  const handleApprove = async (id) => {
    if (!window.confirm('Setujui penugasan ini?')) return;
    setError('');
    try {
      await teachingAssignmentsAPI.approve(id);
      await loadPendingApprovals();
      await loadAllAssignments();
      alert('Penugasan disetujui!');
    } catch (e) {
      setError(e.message || 'Gagal menyetujui penugasan');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Alasan penolakan:');
    if (!reason) return;
    setError('');
    try {
      await teachingAssignmentsAPI.reject(id, reason);
      await loadPendingApprovals();
      await loadAllAssignments();
      alert('Penugasan ditolak!');
    } catch (e) {
      setError(e.message || 'Gagal menolak penugasan');
    }
  };

  const handleReassign = async (id) => {
    const dosenId = window.prompt('Masukkan NIP dosen baru:');
    if (!dosenId) return;
    setError('');
    try {
      await teachingAssignmentsAPI.reassign(id, dosenId);
      await loadPendingApprovals();
      await loadAllAssignments();
      alert('Penugasan dialihkan ke dosen lain!');
    } catch (e) {
      setError(e.message || 'Gagal mengalihkan penugasan');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Batalkan penugasan ini?')) return;
    setError('');
    try {
      await teachingAssignmentsAPI.cancel(id);
      await loadAllAssignments();
      alert('Penugasan dibatalkan!');
    } catch (e) {
      setError(e.message || 'Gagal membatalkan penugasan');
    }
  };

  const handleAddAssignment = async () => {
    if (!formData.mataKuliahId || !formData.dosenId) {
      setError('Mata kuliah dan dosen harus dipilih');
      return;
    }
    setError('');
    setLoadingForm(true);
    try {
      await teachingAssignmentsAPI.assignDirectly(formData);
      setFormData({ mataKuliahId: '', dosenId: '', tahunAjaran: currentAcademicYear() });
      await loadAllAssignments();
      alert('Penugasan berhasil dibuat!');
      setActiveTab('all'); // Pindah ke tab semua penugasan setelah berhasil
    } catch (e) {
      setError(e.message || 'Gagal membuat penugasan');
    } finally {
      setLoadingForm(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING_APPROVAL': <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Menunggu</span>,
      'ACTIVE': <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Aktif</span>,
      'REJECTED': <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Ditolak</span>,
      'CANCELLED': <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Dibatalkan</span>
    };
    return badges[status] || <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{status}</span>;
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Kelola Penugasan Mengajar</h2>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Usulan dari Dosen ({pendingApprovals.length})
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Semua Penugasan
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'add' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Tambah Penugasan
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <label>
          Tahun Ajaran
          <select className="ml-2 border px-2 py-1" value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)}>
            {tahunOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        {activeTab === 'all' && (
          <>
            <label>
              Status
              <select className="ml-2 border px-2 py-1" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Semua</option>
                <option value="PENDING_APPROVAL">Menunggu</option>
                <option value="ACTIVE">Aktif</option>
                <option value="REJECTED">Ditolak</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </label>
          </>
        )}
        <button className="border px-3 py-1 bg-blue-500 text-white hover:bg-blue-600" onClick={activeTab === 'pending' ? loadPendingApprovals : loadAllAssignments} disabled={loading}>
          Refresh
        </button>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">Info:</span> Semester mengikuti semester kurikulum mata kuliah
        </div>
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <div>
          <h3 className="font-medium mb-2">Usulan yang Menunggu Persetujuan</h3>
          {loading ? (
            <div>Memuat...</div>
          ) : (
            <div className="space-y-2">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="border p-3 bg-yellow-50 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.mataKuliah?.nama}</div>
                      <div className="text-sm text-gray-600">
                        Dosen: {item.dosen?.nama} ({item.dosenId}) • {item.tahunAjaran} • Semester {item.semester} (Kurikulum)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Diajukan: {new Date(item.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" onClick={() => handleApprove(item.id)}>
                        Setujui
                      </button>
                      <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={() => handleReject(item.id)}>
                        Tolak
                      </button>
                      <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => handleReassign(item.id)}>
                        Alihkan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingApprovals.length === 0 && <div className="text-sm text-gray-600">Tidak ada usulan yang menunggu persetujuan.</div>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div>
          <h3 className="font-medium mb-2">Semua Penugasan</h3>
          {loading ? (
            <div>Memuat...</div>
          ) : (
            <div className="space-y-2">
              {allAssignments.map((item) => (
                <div key={item.id} className="border p-3 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.mataKuliah?.nama}</div>
                      <div className="text-sm text-gray-600">
                        Dosen: {item.dosen?.nama} ({item.dosenId}) • {item.tahunAjaran} • Semester {item.semester} (Kurikulum)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.assignedBy === 'DOSEN' ? 'Diajukan oleh dosen' : 'Ditunjuk langsung oleh Kaprodi'} • 
                        {item.approvedAt && ` Disetujui: ${new Date(item.approvedAt).toLocaleDateString('id-ID')}`}
                      </div>
                      {item.rejectionReason && (
                        <div className="text-xs text-red-600 mt-1">Alasan ditolak: {item.rejectionReason}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      {item.status === 'ACTIVE' && (
                        <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm" onClick={() => handleCancel(item.id)}>
                          Batalkan
                        </button>
                      )}
                      {item.status === 'PENDING_APPROVAL' && (
                        <>
                          <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm" onClick={() => handleApprove(item.id)}>
                            Setujui
                          </button>
                          <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm" onClick={() => handleReject(item.id)}>
                            Tolak
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {allAssignments.length === 0 && <div className="text-sm text-gray-600">Tidak ada penugasan.</div>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="border p-4 rounded max-w-md">
          <h3 className="font-medium mb-4">Tambah Penugasan Baru</h3>
          {loadingForm && <div className="text-sm text-gray-600 mb-2">Memuat data...</div>}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Mata Kuliah</label>
              <select
                className="w-full border px-2 py-1"
                value={formData.mataKuliahId}
                onChange={(e) => setFormData({ ...formData, mataKuliahId: e.target.value })}
                disabled={loadingForm}
              >
                <option value="">Pilih Mata Kuliah</option>
                {mataKuliahList.length === 0 && !loadingForm && (
                  <option disabled>Belum ada mata kuliah</option>
                )}
                {mataKuliahList.map((mk) => (
                  <option key={mk.id} value={mk.id}>{mk.nama} (Semester {mk.semester} Kurikulum)</option>
                ))}
              </select>
              {mataKuliahList.length === 0 && !loadingForm && (
                <div className="text-xs text-red-600 mt-1">Tidak ada mata kuliah tersedia</div>
              )}
              {formData.mataKuliahId && (
                <div className="text-xs text-blue-600 mt-1">
                  Semester kurikulum: {mataKuliahList.find(mk => mk.id === parseInt(formData.mataKuliahId))?.semester || '-'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dosen</label>
              <select
                className="w-full border px-2 py-1"
                value={formData.dosenId}
                onChange={(e) => setFormData({ ...formData, dosenId: e.target.value })}
                disabled={loadingForm}
              >
                <option value="">Pilih Dosen</option>
                {dosenList.length === 0 && !loadingForm && (
                  <option disabled>Belum ada dosen</option>
                )}
                {dosenList.map((dosen) => (
                  <option key={dosen.nip} value={dosen.nip}>{dosen.nama} ({dosen.nip})</option>
                ))}
              </select>
              {dosenList.length === 0 && !loadingForm && (
                <div className="text-xs text-red-600 mt-1">Tidak ada dosen tersedia</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tahun Ajaran</label>
              <select
                className="w-full border px-2 py-1"
                value={formData.tahunAjaran}
                onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
              >
                {tahunOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Semester akan otomatis mengikuti semester kurikulum mata kuliah yang dipilih
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleAddAssignment} disabled={loadingForm || !formData.mataKuliahId || !formData.dosenId}>
                Simpan
              </button>
              <button className="px-4 py-2 border rounded hover:bg-gray-100" onClick={() => setActiveTab('all')}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

