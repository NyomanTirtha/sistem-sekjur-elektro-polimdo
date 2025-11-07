import React, { useState, memo, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, GraduationCap, Eye, Save, Edit3, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getSemesterFromDate, formatCurrency } from '../../../utilitas/helper/pengajuanSAUtils';
import { getProgramStudiName } from '../../../utilitas/helper/programStudiUtils';
import PengajuanSAService from '../../../layanan/pengajuanSAService';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../../utilitas/notifikasi/alertUtils';

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

    const selectedDosenName = dosenList.find(d => d.nip === selectedDosen || d.id === selectedDosen)?.nama || selectedDosen;
    const mataKuliahName = item.mataKuliah?.nama || item.mataKuliah || 'SA';

    showConfirm(
      `Apakah Anda yakin ingin menugaskan "${selectedDosenName}" sebagai dosen pengampu untuk mata kuliah "${mataKuliahName}"?\n\nSetelah ditugaskan, dosen akan bertanggung jawab mengampu mahasiswa untuk mata kuliah ini.`,
      async () => {
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

          showSuccessAlert(`Dosen "${selectedDosenName}" berhasil ditugaskan untuk mata kuliah "${mataKuliahName}"!`);

        } catch (error) {
          if (process.env.NODE_ENV === 'development') console.error('Error assigning dosen:', error);
          showErrorAlert('Gagal menugaskan dosen. Silakan coba lagi.');
        } finally {
          setAssigningRows(prev => ({ ...prev, [rowId]: false }));
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Penugasan Dosen',
      'warning',
      'Tugaskan',
      'Batal'
    );
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
      showErrorAlert('ID pengajuan SA tidak valid. Silakan refresh halaman.');
      return;
    }

    setIsUpdating({ ...isUpdating, [item.id]: true });
    try {
      await onUpdateNilaiDetail(item.id, nilai);
      setNilaiInputs({ ...nilaiInputs, [item.id]: '' });

      if (typeof fetchPengajuanSA === 'function') {
        setStatusPerRow({});
        await new Promise(resolve => setTimeout(resolve, 300));
        await fetchPengajuanSA();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating nilai:', error);

      if (error.message.includes('tidak ditemukan')) {
        showWarningAlert(`${error.message}\n\nMemperbarui data...`);
        if (typeof fetchPengajuanSA === 'function') {
          fetchPengajuanSA();
        }
      } else {
        showErrorAlert(`Error: ${error.message}`);
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
          if (process.env.NODE_ENV === 'development') console.error('Error rejecting pengajuan:', error);
          showErrorAlert(`Error: ${error.message}`);
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
    // Jika sudah ada nilai, tidak bisa diubah
    if (item.nilaiAkhir !== null && item.nilaiAkhir !== undefined) {
      return false; // Sudah ada nilai untuk mata kuliah ini
    }
    // ✅ FIXED: Prioritaskan item.status dari backend yang sudah ter-update
    const currentStatus = item.status || statusPerRow[item.id];
    // Sekjur bisa input nilai untuk status DALAM_PROSES_SA atau SELESAI (jika belum ada nilai)
    // Catatan: Master status bisa SELESAI tapi detail ini belum dinilai, jadi masih bisa input
    if (currentStatus !== 'DALAM_PROSES_SA' && currentStatus !== 'SELESAI') return false;
    return true; // Sekjur bisa input nilai untuk semua mata kuliah yang belum dinilai
  };

  // ✅ NEW: Check if dosen can input nilai untuk mata kuliah yang ditugaskan kepadanya
  const canDosenInputNilai = (item) => {
    if (userType !== 'dosen') return false;
    // Jika sudah ada nilai, tidak bisa diubah
    if (item.nilaiAkhir !== null && item.nilaiAkhir !== undefined) {
      return false;
    }
    // ✅ FIXED: Prioritaskan item.status dari backend yang sudah ter-update
    const currentStatus = item.status || statusPerRow[item.id];
    // Dosen hanya bisa input nilai untuk status DALAM_PROSES_SA atau SELESAI (jika master sudah selesai tapi detail ini belum)
    // Catatan: Master status bisa SELESAI jika detail lain sudah dinilai, tapi detail ini belum, jadi masih bisa input
    if (currentStatus !== 'DALAM_PROSES_SA' && currentStatus !== 'SELESAI') return false;
    // Pastikan dosenId sesuai dengan dosen yang login
    const dosenId = item.dosenId || item.dosen?.nip;
    const currentUserId = currentUser?.username || currentUser?.nip;
    if (dosenId && dosenId !== currentUserId) {
      return false; // Bukan tugas dosen ini
    }
    return true;
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

  // ✅ NEW: Fungsi untuk mendapatkan status efektif per detail
  // Jika detail sudah ada nilai, tampilkan sebagai SELESAI meskipun master status masih DALAM_PROSES_SA
  // Jika detail sudah di-assign dosen, tampilkan sebagai DALAM_PROSES_SA meskipun master status masih MENUNGGU_VERIFIKASI_KAPRODI
  const getDetailStatus = (item) => {
    // Jika detail sudah ada nilai, statusnya SELESAI untuk detail ini (prioritas tertinggi)
    if (item.nilaiAkhir !== null && item.nilaiAkhir !== undefined) {
      return 'SELESAI';
    }
    
    // Jika detail sudah di-assign dosen (dosenId tidak null), statusnya DALAM_PROSES_SA untuk detail ini
    // Kecuali jika master status sudah DITOLAK atau PROSES_PENGAJUAN
    const masterStatus = item.status || statusPerRow[item.id];
    const hasDosen = item.dosenId !== null && item.dosenId !== undefined && item.dosenId !== '';
    const hasDosenObject = item.dosen !== null && item.dosen !== undefined;
    
    if ((hasDosen || hasDosenObject) && masterStatus !== 'DITOLAK' && masterStatus !== 'PROSES_PENGAJUAN') {
      return 'DALAM_PROSES_SA';
    }
    
    // Jika belum ada nilai dan belum ada dosen, gunakan status dari master atau statusPerRow
    return masterStatus;
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
        <table className="w-full border-collapse">
          {/* ✅ CONDITIONAL HEADER - SEKJUR vs OTHERS */}
          {userType === 'sekjur' ? (
            // 🎯 HEADER SEKJUR - WITH MATA KULIAH
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Mahasiswa</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Mata Kuliah</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Nominal</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Tanggal</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Semester</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Dosen</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Nilai</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Indeks</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
          ) : (
            // 🎯 HEADER NORMAL - UNTUK USER TYPE LAIN
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                {userType !== 'mahasiswa' && (
                  <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Mahasiswa</th>
                )}
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Mata Kuliah</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Nominal</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Tanggal</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Semester</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                {/* Sembunyikan kolom Dosen jika userType === 'dosen' */}
                {userType !== 'dosen' && (
                  <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Dosen</th>
                )}
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Nilai</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Indeks</th>
                <th className="px-2.5 py-2 text-left text-xs font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
          )}

          {/* ✅ CONDITIONAL BODY - SEKJUR vs OTHERS */}
          {userType === 'sekjur' ? (
            // 🎯 BODY SEKJUR - SIMPLIFIED
            <tbody>
              {currentRows.map((item, index) => (
                <tr key={item.id || index} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-2.5 py-2 text-xs text-gray-900 text-center">{startIndex + index + 1}</td>

                  {/* Mahasiswa */}
                  <td className="px-2.5 py-2 text-xs text-gray-900">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div 
                          className="font-medium truncate max-w-[140px] cursor-help" 
                          title={`${item.mahasiswa?.nama || 'N/A'} - ${item.mahasiswaId || ''} - ${getProgramStudiName(item.mahasiswa?.programStudiId) || ''}`}
                        >
                          {item.mahasiswa?.nama || 'N/A'}
                        </div>
                        <div className="text-gray-500 text-[10px]" title={item.mahasiswaId}>
                          {item.mahasiswaId}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Mata Kuliah - SEKJUR View */}
                  <td className="px-2.5 py-2 text-xs text-gray-900">
                    {item.isGrouped ? (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {item.mataKuliahList && item.mataKuliahList.length > 0 ? (
                            item.mataKuliahList.map((mk, idx) => (
                              <div
                                key={mk.id || idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-900 cursor-help"
                                title={`${mk.nama} - ${mk.sks} SKS${mk.semester ? ` - Semester ${mk.semester}` : ''}`}
                              >
                                <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="truncate max-w-[140px]">{mk.nama}</span>
                                <span className="text-blue-600 font-semibold flex-shrink-0">{mk.sks}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500 italic">Mata kuliah tidak tersedia</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500" title={`${item.jumlahMataKuliah || 0} mata kuliah • Total ${item.totalSKS || 0} SKS`}>
                          {item.jumlahMataKuliah || 0} MK • {item.totalSKS || 0} SKS
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div 
                          className="font-medium text-gray-900 truncate max-w-[180px] cursor-help" 
                          title={`${item.mataKuliah?.nama || item.mataKuliah || 'N/A'} - ${item.mataKuliah?.sks || 0} SKS${item.mataKuliah?.semester ? ` - Semester ${item.mataKuliah.semester}` : ''}`}
                        >
                          {item.mataKuliah?.nama || item.mataKuliah || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.mataKuliah?.sks || 0} SKS
                          {item.mataKuliah?.semester && ` • S${item.mataKuliah.semester}`}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Nominal */}
                  <td className="px-2.5 py-2 text-xs text-gray-900">
                    <div 
                      className="font-medium text-green-600 whitespace-nowrap cursor-help" 
                      title={`Nominal: ${formatCurrency(item.nominal || 0)}`}
                    >
                      {formatCurrency(item.nominal || 0)}
                    </div>
                  </td>

                  {/* Tanggal */}
                  <td className="px-2.5 py-2 text-xs text-gray-900 whitespace-nowrap">
                    <span 
                      className="cursor-help"
                      title={new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    >
                      {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </td>

                  {/* Semester */}
                  <td className="px-2.5 py-2 text-xs text-gray-900">
                    {(() => {
                      const semesterPengajuan = item.semesterPengajuan;
                      const tahunAjaran = item.tanggalPengajuan ? getSemesterFromDate(item.tanggalPengajuan) : null;
                      const fullText = semesterPengajuan && tahunAjaran 
                        ? `${tahunAjaran} - Semester ${semesterPengajuan}`
                        : semesterPengajuan 
                        ? `Semester ${semesterPengajuan}`
                        : tahunAjaran || '-';

                      if (semesterPengajuan && tahunAjaran) {
                        return <span className="text-gray-700 whitespace-nowrap cursor-help" title={fullText}>{tahunAjaran}</span>;
                      } else if (semesterPengajuan) {
                        return <span className="text-gray-700 whitespace-nowrap cursor-help" title={fullText}>S{semesterPengajuan}</span>;
                      } else if (tahunAjaran) {
                        return <span className="text-gray-700 whitespace-nowrap cursor-help" title={fullText}>{tahunAjaran}</span>;
                      } else {
                        return <span className="text-gray-400 italic">-</span>;
                      }
                    })()}
                  </td>

                  {/* Status */}
                  <td className="px-2.5 py-2">
                    <div className="cursor-help" title={`Status: ${getDetailStatus(item)}`}>
                      <StatusBadge status={getDetailStatus(item)} />
                    </div>
                  </td>

                  {/* Dosen */}
                  <td className="px-2.5 py-2 text-xs text-gray-900">
                    {item.dosen ? (
                      <div className="min-w-0">
                        <div 
                          className="font-medium text-gray-900 truncate max-w-[120px] cursor-help" 
                          title={`${item.dosen.nama} - ${item.dosen.nip || item.dosenId}`}
                        >
                          {item.dosen.nama}
                        </div>
                        <div 
                          className="text-gray-500 text-[10px] truncate max-w-[120px] cursor-help" 
                          title={item.dosen.nip || item.dosenId}
                        >
                          {item.dosen.nip || item.dosenId}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>

                  {/* Nilai */}
                  <td className="px-2.5 py-2 text-xs text-gray-900 text-center">
                    {item.nilaiAkhir ? (
                      <span 
                        className="font-semibold text-gray-900 cursor-help" 
                        title={`Nilai: ${item.nilaiAkhir} - Indeks: ${getIndeksHuruf(item.nilaiAkhir)}`}
                      >
                        {item.nilaiAkhir}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>

                  {/* Indeks */}
                  <td className="px-2.5 py-2 text-xs text-gray-900 text-center">
                    {item.nilaiAkhir ? (
                      <span 
                        className="font-semibold text-gray-900 cursor-help" 
                        title={`Indeks: ${getIndeksHuruf(item.nilaiAkhir)} - Nilai: ${item.nilaiAkhir}`}
                      >
                        {getIndeksHuruf(item.nilaiAkhir)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>

                  {/* Aksi SEKJUR */}
                  <td className="px-2.5 py-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => onLihatFormDetail(item)}
                        className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs hover:bg-blue-600 font-medium whitespace-nowrap"
                        title="Lihat detail pengajuan SA"
                      >
                        Detail
                      </button>

                      {item.status === 'PROSES_PENGAJUAN' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'MENUNGGU_VERIFIKASI_KAPRODI')}
                            className="bg-green-500 text-white px-2 py-0.5 rounded text-xs hover:bg-green-600 font-medium whitespace-nowrap"
                            title="Verifikasi pembayaran SA"
                          >
                            Verifikasi
                          </button>
                          <button
                            onClick={() => handleTolakPengajuan(item.id)}
                            className="bg-red-500 text-white px-2 py-0.5 rounded text-xs hover:bg-red-600 font-medium whitespace-nowrap"
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
            <tbody>
              {currentRows.map((item, index) => (
                <tr key={item.id || index} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-2.5 py-2 text-xs text-gray-900 text-center">{startIndex + index + 1}</td>
                  {userType !== 'mahasiswa' && (
                    <td className="px-2.5 py-2 text-xs text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div 
                            className="font-medium truncate max-w-[140px] cursor-help" 
                            title={`${item.mahasiswa?.nama || 'N/A'} - ${item.mahasiswaId || ''} - ${getProgramStudiName(item.mahasiswa?.programStudiId) || ''}`}
                          >
                            {item.mahasiswa?.nama || 'N/A'}
                          </div>
                          <div className="text-gray-500 text-[10px]" title={item.mahasiswaId}>
                            {item.mahasiswaId}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-2.5 py-2 text-xs text-gray-900">
                    {item.isGrouped ? (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {item.mataKuliahList && item.mataKuliahList.length > 0 ? (
                            item.mataKuliahList.map((mk, idx) => (
                              <div
                                key={mk.id || idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-900 cursor-help"
                                title={`${mk.nama} - ${mk.sks} SKS${mk.semester ? ` - Semester ${mk.semester}` : ''}`}
                              >
                                <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="truncate max-w-[140px]">{mk.nama}</span>
                                <span className="text-blue-600 font-semibold flex-shrink-0">{mk.sks}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500 italic">Mata kuliah tidak tersedia</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 cursor-help" title={`${item.jumlahMataKuliah || 0} mata kuliah • Total ${item.totalSKS || 0} SKS`}>
                          {item.jumlahMataKuliah || 0} MK • {item.totalSKS || 0} SKS
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div 
                          className="font-medium text-gray-900 truncate max-w-[180px] cursor-help" 
                          title={`${item.mataKuliah?.nama || item.mataKuliah || 'N/A'} - ${item.mataKuliah?.sks || 0} SKS${item.mataKuliah?.semester ? ` - Semester ${item.mataKuliah.semester}` : ''}`}
                        >
                          {item.mataKuliah?.nama || item.mataKuliah || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.mataKuliah?.sks || 0} SKS
                          {item.mataKuliah?.semester && ` • S${item.mataKuliah.semester}`}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-2.5 py-2 text-xs text-gray-900">
                    <div 
                      className="font-medium text-green-600 whitespace-nowrap cursor-help" 
                      title={`Nominal: ${formatCurrency(item.nominal || 0)}`}
                    >
                      {formatCurrency(item.nominal || 0)}
                    </div>
                  </td>
                  <td className="px-2.5 py-2 text-xs text-gray-900 whitespace-nowrap">
                    <span 
                      className="cursor-help"
                      title={new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    >
                      {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                  <td className="px-2.5 py-2 text-xs text-gray-900">
                    {(() => {
                      const semesterPengajuan = item.semesterPengajuan;
                      const tahunAjaran = item.tanggalPengajuan ? getSemesterFromDate(item.tanggalPengajuan) : null;
                      const fullText = semesterPengajuan && tahunAjaran 
                        ? `${tahunAjaran} - Semester ${semesterPengajuan}`
                        : semesterPengajuan 
                        ? `Semester ${semesterPengajuan}`
                        : tahunAjaran || '-';

                      if (semesterPengajuan && tahunAjaran) {
                        return <span className="text-gray-700 whitespace-nowrap cursor-help" title={fullText}>{tahunAjaran}</span>;
                      } else if (semesterPengajuan) {
                        return <span className="text-gray-700 whitespace-nowrap cursor-help" title={fullText}>S{semesterPengajuan}</span>;
                      } else if (tahunAjaran) {
                        return <span className="text-gray-700 whitespace-nowrap cursor-help" title={fullText}>{tahunAjaran}</span>;
                      } else {
                        return <span className="text-gray-400 italic">-</span>;
                      }
                    })()}
                  </td>
                  <td className="px-2.5 py-2">
                    <div className="cursor-help" title={`Status: ${getDetailStatus(item)}`}>
                      <StatusBadge status={getDetailStatus(item)} />
                    </div>
                  </td>
                  {/* Kolom Dosen: hanya tampil jika userType bukan dosen */}
                  {userType !== 'dosen' && (
                    <td className="px-2.5 py-2 text-xs text-gray-900">
                      {item.dosen ? (
                        <div className="min-w-0">
                          <div 
                            className="font-medium text-gray-900 truncate max-w-[120px] cursor-help" 
                            title={`${item.dosen.nama} - ${item.dosen.nip || item.dosenId}`}
                          >
                            {item.dosen.nama}
                          </div>
                          <div 
                            className="text-gray-500 text-[10px] truncate max-w-[120px] cursor-help" 
                            title={item.dosen.nip || item.dosenId}
                          >
                            {item.dosen.nip || item.dosenId}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-2.5 py-2 text-xs text-gray-900 text-center">
                    {item.nilaiAkhir ? (
                      <span 
                        className="font-semibold text-gray-900 cursor-help" 
                        title={`Nilai: ${item.nilaiAkhir} - Indeks: ${getIndeksHuruf(item.nilaiAkhir)}`}
                      >
                        {item.nilaiAkhir}
                      </span>
                    ) : canDosenInputNilai(item) ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="0-100"
                          value={nilaiInputs[item.id] || ''}
                          onChange={(e) => handleNilaiInputChange(item.id, e.target.value)}
                          className="border border-blue-300 rounded px-1.5 py-0.5 text-xs w-16 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          disabled={isUpdating[item.id]}
                        />
                        <button
                          onClick={() => handleUpdateNilai(item)}
                          className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs hover:bg-blue-600 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          title={`Input nilai untuk mata kuliah ${item.mataKuliah?.nama || 'SA'}`}
                          disabled={!nilaiInputs[item.id] || isUpdating[item.id]}
                        >
                          {isUpdating[item.id] ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ...
                            </>
                          ) : (
                            <>
                              <Save className="w-3 h-3" />
                              Save
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2 text-xs text-gray-900 text-center">
                    {item.nilaiAkhir ? (
                      <span 
                        className="font-semibold text-gray-900 cursor-help" 
                        title={`Indeks: ${getIndeksHuruf(item.nilaiAkhir)} - Nilai: ${item.nilaiAkhir}`}
                      >
                        {getIndeksHuruf(item.nilaiAkhir)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
                      {/* ✅ SIMPLIFIED: Form Assign Dosen - Kompak dan Inline */}
                      {userType === 'kaprodi' && (item.status || statusPerRow[item.id]) === 'MENUNGGU_VERIFIKASI_KAPRODI' && (!item.dosenId || item.dosenId === '' || item.dosen == null) && !assignedRows[item.id] && (
                        <>
                          <select
                            value={selectedDosenPerRow[item.id] || ''}
                            onChange={(e) => setSelectedDosenPerRow({ ...selectedDosenPerRow, [item.id]: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            disabled={assigningRows[item.id]}
                            style={{ minWidth: '150px', maxWidth: '200px' }}
                          >
                            <option value="">Pilih Dosen</option>
                            {dosenList.map(dosen => (
                              <option key={dosen.nip} value={dosen.nip}>
                                {dosen.nama} {dosen.nip ? `(${dosen.nip})` : ''}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignDosen(item)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            title="Tugaskan dosen"
                            disabled={!selectedDosenPerRow[item.id] || assigningRows[item.id]}
                          >
                            {assigningRows[item.id] ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Tugaskan</span>
                              </>
                            )}
                          </button>
                        </>
                      )}

                      {/* ✅ ENHANCED: Aksi SEKJUR - Input Nilai */}
                      {canSekjurInputNilai(item) && (
                        <div className="flex items-center gap-1.5 bg-green-50 p-1.5 rounded border border-green-200">
                          <Edit3 className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0-100"
                            value={nilaiInputs[item.id] || ''}
                            onChange={(e) => handleNilaiInputChange(item.id, e.target.value)}
                            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs w-16 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            disabled={isUpdating[item.id]}
                          />
                          <button
                            onClick={() => handleUpdateNilai(item)}
                            className="bg-green-500 text-white px-2 py-0.5 rounded text-xs hover:bg-green-600 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            title={`Input nilai untuk mata kuliah ${item.mataKuliah?.nama || 'SA'}`}
                            disabled={!nilaiInputs[item.id] || isUpdating[item.id]}
                          >
                            {isUpdating[item.id] ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ...
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3" />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* ✅ Button Detail untuk semua user type */}
                      {(userType !== 'kaprodi' || (item.status || statusPerRow[item.id]) !== 'MENUNGGU_VERIFIKASI_KAPRODI' || item.dosenId || assignedRows[item.id]) && (
                        <button
                          onClick={() => onLihatFormDetail(item)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 font-medium whitespace-nowrap"
                          title="Lihat detail pengajuan SA"
                        >
                          {(userType === 'kaprodi' && (item.status || statusPerRow[item.id]) === 'MENUNGGU_VERIFIKASI_KAPRODI' && (item.dosenId || assignedRows[item.id])) ? 'Lihat' : 'Detail'}
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
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showTolakModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowTolakModal(false);
                  setAlasanPenolakan('');
                }
              }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
                style={{ zIndex: 10000 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 text-white bg-red-600 border-b border-red-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">Tolak Pengajuan SA</h2>
                      <p className="text-sm text-red-100">Berikan alasan penolakan pengajuan</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowTolakModal(false);
                        setAlasanPenolakan('');
                      }}
                      className="p-2 hover:bg-red-700 rounded transition-colors text-white"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alasan Penolakan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={alasanPenolakan}
                        onChange={(e) => setAlasanPenolakan(e.target.value)}
                        placeholder="Masukkan alasan penolakan pengajuan..."
                        rows="5"
                        className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Alasan penolakan akan dikirim ke mahasiswa yang mengajukan SA
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTolakModal(false);
                      setAlasanPenolakan('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleTolakConfirm}
                    disabled={!alasanPenolakan.trim()}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${alasanPenolakan.trim()
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    Tolak Pengajuan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default memo(TabelPengajuanSA);