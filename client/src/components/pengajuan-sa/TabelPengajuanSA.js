import React, { useState } from 'react';
import { User, GraduationCap, Eye, Save, Edit3, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getSemesterFromDate, formatCurrency } from '../../utils/pengajuanSAUtils';
import { getProgramStudiName } from '../../utils/programStudiUtils';
import PengajuanSAService from '../../services/pengajuanSAService';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../utils/alertUtils';

const TabelPengajuanSA = ({ 
  pengajuanList, 
  userType, 
  currentUser, 
  dosenList, 
  authToken,
  onUpdateStatus,
  onUpdateNilai,
  onUpdateNilaiDetail,
  onLihatFormDetail,
  fetchPengajuanSA,
  startIndex = 0
}) => {
  // State untuk loading dan updating
  const [isUpdating, setIsUpdating] = useState({});
  const [assigningRows, setAssigningRows] = useState({});

  // State untuk input nilai
  const [nilaiInputs, setNilaiInputs] = useState({});

  // State untuk assign dosen
  const [selectedDosenPerRow, setSelectedDosenPerRow] = useState({});
  const [assignedRows, setAssignedRows] = useState({});
  const [statusPerRow, setStatusPerRow] = useState({});

  // State untuk modal tolak pengajuan
  const [showTolakModal, setShowTolakModal] = useState(false);
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [selectedPengajuanId, setSelectedPengajuanId] = useState(null);

  // Use data directly from props (pagination handled by parent)
  const currentRows = pengajuanList;

  const handleUpdateStatus = async (pengajuanId, newStatus, dosenId = null, detailId = null) => {
    await onUpdateStatus(pengajuanId, newStatus, dosenId, detailId);
    setSelectedDosenPerRow({});
  };

  // ✅ FIXED: Handle assign dosen per baris
  const handleAssignDosen = async (item) => {
    const rowId = item.id;
    const selectedDosen = selectedDosenPerRow[rowId];
    
    if (!selectedDosen) {
      showWarningAlert('Silakan pilih dosen terlebih dahulu');
      return;
    }

    setAssigningRows(prev => ({ ...prev, [rowId]: true }));
    
    try {
      // Use detailId for per-mata-kuliah assignment
      await onUpdateStatus(item.pengajuanSAId || item.id, 'DALAM_PROSES_SA', selectedDosen, item.id);
      
      // Clear selected dosen untuk baris ini
      setSelectedDosenPerRow(prev => {
        const newState = { ...prev };
        delete newState[rowId];
        return newState;
      });
      
      // ✅ FIXED: Mark baris ini sebagai sudah di-assign
      setAssignedRows(prev => ({ ...prev, [rowId]: true }));
      
      // ✅ FIXED: Update status per baris menjadi DALAM_PROSES_SA
      setStatusPerRow(prev => ({ ...prev, [rowId]: 'DALAM_PROSES_SA' }));
      
      // Refresh data
      await fetchPengajuanSA();
      
    } catch (error) {
      console.error('Error assigning dosen:', error);
      showErrorAlert('Gagal menugaskan dosen. Silakan coba lagi.');
    } finally {
      setAssigningRows(prev => ({ ...prev, [rowId]: false }));
    }
  };

  // ✅ IMPROVED: Handle nilai input dengan row-specific state
  const handleNilaiInputChange = (rowId, value) => {
    setNilaiInputs(prev => ({
      ...prev,
      [rowId]: value
    }));
  };

  // ✅ IMPROVED: Handle nilai update dengan proper loading state untuk per mata kuliah
  const handleUpdateNilai = async (item) => {
    const nilai = nilaiInputs[item.id];
    if (!nilai || nilai < 0 || nilai > 100) {
      showWarningAlert('Harap masukkan nilai yang valid (0-100)');
      return;
    }

    // Validasi ID
    if (!item.id || isNaN(item.id) || item.id <= 0) {
      showErrorAlert('❌ ID pengajuan SA tidak valid. Silakan refresh halaman.');
      return;
    }

    // Remove the confirmation dialog from here - it will be handled in PengajuanSAList.js
    setIsUpdating({ ...isUpdating, [item.id]: true });
    try {
      // ✅ FIXED: Gunakan updateNilaiDetail untuk per mata kuliah
      await onUpdateNilaiDetail(item.id, nilai);
      setNilaiInputs({ ...nilaiInputs, [item.id]: '' });
      showSuccessAlert(`Nilai ${nilai} berhasil diinput untuk mata kuliah "${item.mataKuliah?.nama || 'SA'}!\nMata kuliah ini telah selesai dinilai.`);
    } catch (error) {
      console.error('Error updating nilai:', error);
      
      // Jika error 404 (data tidak ditemukan), refresh data otomatis
      if (error.message.includes('tidak ditemukan')) {
        showWarningAlert(`❌ ${error.message}\n\nMemperbarui data...`);
        // Trigger refresh dari parent component
        if (typeof fetchPengajuanSA === 'function') {
          fetchPengajuanSA();
        }
      } else {
        showErrorAlert(`❌ Error: ${error.message}`);
      }
    } finally {
      setIsUpdating({ ...isUpdating, [item.id]: false });
    }
  };

  const handleTolakPengajuan = async (pengajuanId) => {
    setSelectedPengajuanId(pengajuanId);
    setShowTolakModal(true);
  };

  const handleTolakConfirm = async () => {
    if (!alasanPenolakan.trim()) {
      showWarningAlert('Alasan penolakan harus diisi!');
      return;
    }

    showConfirm(
      `Apakah Anda yakin ingin menolak pengajuan SA ini?\n\nAlasan: ${alasanPenolakan}`,
      async () => {
        try {
          const pengajuanSAService = new PengajuanSAService(authToken);
          await pengajuanSAService.tolakPengajuanSA(selectedPengajuanId, alasanPenolakan);
          showSuccessAlert('Pengajuan SA berhasil ditolak!');
          fetchPengajuanSA();
          setShowTolakModal(false);
          setAlasanPenolakan('');
        } catch (error) {
          console.error('Error rejecting pengajuan:', error);
          showErrorAlert(`❌ Error: ${error.message}`);
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Tolak Pengajuan',
      'danger',
      'Tolak',
      'Batal'
    );
  };

  // ✅ NEW: Check if sekjur can input nilai untuk mata kuliah spesifik
  const canSekjurInputNilai = (item) => {
    if (userType !== 'sekjur') return false;
    const currentStatus = statusPerRow[item.id] || item.status;
    // Sekjur bisa input nilai untuk status DALAM_PROSES_SA atau SELESAI (jika belum ada nilai)
    if (currentStatus !== 'DALAM_PROSES_SA' && currentStatus !== 'SELESAI') return false;
    if (item.nilaiAkhir !== null && item.nilaiAkhir !== undefined) {
      return false; // Sudah ada nilai untuk mata kuliah ini
    }
    return true; // Sekjur bisa input nilai untuk semua mata kuliah yang belum dinilai
  };

  // Tambahkan fungsi untuk konversi nilai ke indeks huruf
  const getIndeksHuruf = (nilai) => {
    if (nilai == null || isNaN(nilai)) return '-';
    if (nilai >= 85) return 'A';
    if (nilai >= 70) return 'B';
    if (nilai >= 55) return 'C';
    if (nilai >= 40) return 'D';
    return 'E';
  };

  if (pengajuanList.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {userType === 'mahasiswa' ? 'Belum ada pengajuan SA' : 
             userType === 'dosen' ? 'Belum ada SA yang ditugaskan' :
             'Tidak ada data pengajuan SA'}
          </h3>
          <p className="text-gray-500">
            {userType === 'mahasiswa' 
              ? 'Klik tombol "Ajukan SA" untuk membuat pengajuan baru'
              : userType === 'dosen'
              ? 'Anda belum memiliki mahasiswa SA yang ditugaskan oleh Kaprodi'
              : 'Belum ada pengajuan SA yang perlu diproses'
            }
          </p>
          {userType === 'dosen' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tips untuk Dosen:</strong> Jika Anda yakin ada SA yang ditugaskan ke Anda, 
                pastikan format identifier Anda (username/email/NIP) sesuai dengan data di sistem.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* ✅ CONDITIONAL HEADER - SEKJUR vs OTHERS */}
          {userType === 'sekjur' ? (
            // 🎯 HEADER SEKJUR - WITH MATA KULIAH
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mahasiswa</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mata Kuliah</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nominal</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Semester</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dosen</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nilai</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Indeks</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
          ) : (
            // 🎯 HEADER NORMAL - UNTUK USER TYPE LAIN
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">No</th>
                {userType !== 'mahasiswa' && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mahasiswa</th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mata Kuliah</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nominal</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Semester</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                {/* Sembunyikan kolom Dosen jika userType === 'dosen' */}
                {userType !== 'dosen' && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dosen</th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nilai</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Indeks</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
          )}

          {/* ✅ CONDITIONAL BODY - SEKJUR vs OTHERS */}
          {userType === 'sekjur' ? (
            // 🎯 BODY SEKJUR - SIMPLIFIED
            <tbody className="divide-y divide-gray-200">
              {currentRows.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                  
                  {/* Mahasiswa */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{item.mahasiswa?.nama || 'N/A'}</div>
                        <div className="text-gray-500 text-xs">{item.mahasiswaId}</div>
                        <div className="text-gray-400 text-xs">{getProgramStudiName(item.mahasiswa?.programStudiId)}</div>
                      </div>
                    </div>
                  </td>

                  {/* Mata Kuliah - SEKJUR View */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.isGrouped ? (
                      <div>
                        <div className="font-medium">
                          {item.mataKuliahList && item.mataKuliahList.length > 0
                            ? item.mataKuliahList.map((mk, idx) => (
                                <span key={mk.id}>
                                  {mk.nama} (Sem {mk.semester}){idx < item.mataKuliahList.length - 1 ? ', ' : ''}
                                </span>
                              ))
                            : (item.mataKuliah || 'Mata kuliah tidak tersedia')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.jumlahMataKuliah || 0} mata kuliah • {item.totalSKS || 0} SKS
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">
                          {item.mataKuliah?.nama || item.mataKuliah || 'N/A'}
                          {item.mataKuliah?.semester && (
                            <span> (Sem {item.mataKuliah.semester})</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.mataKuliah?.sks || 0} SKS
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Nominal */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium text-green-600">
                      {formatCurrency(item.nominal || 0)}
                    </div>
                    {item.isGrouped ? null : (
                      <div className="text-xs text-gray-500">
                        {item.mataKuliah?.sks || 0} SKS
                      </div>
                    )}
                  </td>

                  {/* Tanggal */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID')}
                  </td>

                  {/* Semester */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {typeof item.semesterPengajuan === 'number' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {`(Sem ${item.semesterPengajuan}) ${getSemesterFromDate(item.tanggalPengajuan)}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        Tidak diketahui
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={statusPerRow[item.id] || item.status} />
                  </td>

                  {/* Dosen */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.dosen ? (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{item.dosen.nama}</div>
                          <div className="text-gray-500 text-xs">{item.dosen.nip || item.dosenId}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Belum ditentukan</span>
                    )}
                  </td>

                  {/* Nilai */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.nilaiAkhir ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-bold text-green-600 text-lg">{item.nilaiAkhir}</span>
                        {userType === 'mahasiswa' && item.semuaSudahDinilai && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">✓ Selesai</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Belum dinilai</span>
                    )}
                  </td>

                  {/* Indeks */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.nilaiAkhir ? (
                      <span className="font-bold text-blue-700">{getIndeksHuruf(item.nilaiAkhir)}</span>
                    ) : (
                      <span className="text-gray-400 italic">Belum dinilai</span>
                    )}
                  </td>

                  {/* Aksi SEKJUR */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onLihatFormDetail(item)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 font-medium"
                        title="Lihat detail pengajuan SA"
                      >
                        Detail
                      </button>

                      {item.status === 'PROSES_PENGAJUAN' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'MENUNGGU_VERIFIKASI_KAPRODI')}
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 font-medium"
                            title="Verifikasi pembayaran SA"
                          >
                            Verifikasi
                          </button>
                          <button
                            onClick={() => handleTolakPengajuan(item.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 font-medium"
                            title="Tolak pengajuan SA"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            // 🎯 BODY NORMAL - UNTUK USER TYPE LAIN
            <tbody className="divide-y divide-gray-200">
              {currentRows.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                  {userType !== 'mahasiswa' && (
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{item.mahasiswa?.nama || 'N/A'}</div>
                          <div className="text-gray-500 text-xs">{item.mahasiswaId}</div>
                          <div className="text-gray-400 text-xs">{getProgramStudiName(item.mahasiswa?.programStudiId)}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.isGrouped ? (
                      <div>
                        <div className="font-medium">
                          {item.mataKuliahList && item.mataKuliahList.length > 0
                            ? item.mataKuliahList.map((mk, idx) => (
                                <span key={mk.id}>
                                  {mk.nama} (Sem {mk.semester}){idx < item.mataKuliahList.length - 1 ? ', ' : ''}
                                </span>
                              ))
                            : (item.mataKuliah || 'Mata kuliah tidak tersedia')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.jumlahMataKuliah || 0} mata kuliah • {item.totalSKS || 0} SKS
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">
                          {item.mataKuliah?.nama || item.mataKuliah || 'N/A'}
                          {item.mataKuliah?.semester && (
                            <span> (Sem {item.mataKuliah.semester})</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.mataKuliah?.sks || 0} SKS
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium text-green-600">
                      {formatCurrency(item.nominal || 0)}
                    </div>
                    {item.isGrouped ? null : (
                      <div className="text-xs text-gray-500">
                        {item.mataKuliah?.sks || 0} SKS
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {typeof item.semesterPengajuan === 'number' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {`(Sem ${item.semesterPengajuan}) ${getSemesterFromDate(item.tanggalPengajuan)}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        Tidak diketahui
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {userType === 'dosen' && item.nilaiAkhir ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          SELESAI
                        </span>
                      </div>
                    ) : (
                      <StatusBadge status={statusPerRow[item.id] || item.status} />
                    )}
                  </td>
                  {/* Kolom Dosen: hanya tampil jika userType bukan dosen */}
                  {userType !== 'dosen' && (
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.dosen ? (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{item.dosen.nama}</div>
                            <div className="text-gray-500 text-xs">{item.dosen.nip || item.dosenId}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Belum ditentukan</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.nilaiAkhir ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-bold text-green-600 text-lg">{item.nilaiAkhir}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Belum dinilai</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.nilaiAkhir ? (
                      <span className="font-bold text-blue-700">{getIndeksHuruf(item.nilaiAkhir)}</span>
                    ) : (
                      <span className="text-gray-400 italic">Belum dinilai</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* ✅ ENHANCED: Aksi SEKJUR - Assign Dosen */}
                      {userType === 'kaprodi' && (statusPerRow[item.id] || item.status) === 'MENUNGGU_VERIFIKASI_KAPRODI' && (!item.dosenId || item.dosenId === '' || item.dosen == null) && !assignedRows[item.id] && (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedDosenPerRow[item.id] || ''}
                            onChange={(e) => setSelectedDosenPerRow({ ...selectedDosenPerRow, [item.id]: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                            disabled={assigningRows[item.id]}
                          >
                            <option value="">Pilih Dosen</option>
                            {dosenList.map(dosen => (
                              <option key={dosen.nip} value={dosen.nip}>
                                {dosen.nama}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignDosen(item)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Verifikasi dan tugaskan dosen untuk SA"
                            disabled={!selectedDosenPerRow[item.id] || assigningRows[item.id]}
                          >
                            {assigningRows[item.id] ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Assigning...
                              </>
                            ) : (
                              'Assign'
                            )}
                          </button>
                        </div>
                      )}

                      {/* ✅ ENHANCED: Aksi SEKJUR - Input Nilai */}
                      {canSekjurInputNilai(item) && (
                        <div className="flex items-center gap-2 bg-green-50 p-2 rounded border border-green-200">
                          <Edit3 className="w-4 h-4 text-green-600" />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0-100"
                            value={nilaiInputs[item.id] || ''}
                            onChange={(e) => handleNilaiInputChange(item.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-20 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            disabled={isUpdating[item.id]}
                          />
                          <button
                            onClick={() => handleUpdateNilai(item)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={`Input nilai untuk mata kuliah ${item.mataKuliah?.nama || 'SA'}`}
                            disabled={!nilaiInputs[item.id] || isUpdating[item.id]}
                          >
                            {isUpdating[item.id] ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3" />
                                Input
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* ✅ Button Detail untuk semua user type */}
                      {(userType !== 'kaprodi' || (statusPerRow[item.id] || item.status) !== 'MENUNGGU_VERIFIKASI_KAPRODI' || item.dosenId || assignedRows[item.id]) && (
                        <button
                          onClick={() => onLihatFormDetail(item)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 font-medium"
                          title="Lihat detail pengajuan SA"
                        >
                          {(userType === 'kaprodi' && (statusPerRow[item.id] || item.status) === 'MENUNGGU_VERIFIKASI_KAPRODI' && (item.dosenId || assignedRows[item.id])) ? 'Lihat' : 'Detail'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      
      {/* ✅ DEBUG INFO untuk Dosen */}
      {userType === 'dosen' && pengajuanList.length === 0 && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-2">🔍 Debug Info untuk Dosen:</p>
            <p><strong>Username:</strong> {currentUser.username}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>NIP:</strong> {currentUser.nip}</p>
            <p className="mt-2 text-xs">
              Pastikan salah satu dari identifier di atas sesuai dengan dosenId yang di-assign oleh Kaprodi.
            </p>
          </div>
        </div>
      )}

      {/* Modal Tolak Pengajuan */}
      {showTolakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Tolak Pengajuan SA</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penolakan *
              </label>
              <textarea
                value={alasanPenolakan}
                onChange={(e) => setAlasanPenolakan(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTolakConfirm}
                disabled={!alasanPenolakan.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  alasanPenolakan.trim()
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Tolak
              </button>
              <button
                onClick={() => {
                  setShowTolakModal(false);
                  setAlasanPenolakan('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabelPengajuanSA;