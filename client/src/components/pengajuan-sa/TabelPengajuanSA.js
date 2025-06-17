import React, { useState } from 'react';
import { User, GraduationCap, Eye, Save, Edit3, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getSemesterFromDate, formatCurrency } from '../../utils/pengajuanSAUtils';
import PengajuanSAService from '../../services/pengajuanSAService';

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
  fetchPengajuanSA
}) => {
  // ✅ FIXED: State untuk assign dosen per baris
  const [selectedDosenPerRow, setSelectedDosenPerRow] = useState({}); // { rowId: dosenId }
  const [assigningRows, setAssigningRows] = useState({}); // Loading state per row untuk assign
  const [assignedRows, setAssignedRows] = useState({}); // Track baris yang sudah di-assign
  const [statusPerRow, setStatusPerRow] = useState({}); // Track status per baris
  const [nilaiInputs, setNilaiInputs] = useState({}); // Multiple inputs untuk setiap row
  const [isUpdating, setIsUpdating] = useState({}); // Loading state per row
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Calculate pagination values
  const totalPages = Math.ceil(pengajuanList.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = pengajuanList.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleUpdateStatus = async (pengajuanId, newStatus, dosenId = null, detailId = null) => {
    await onUpdateStatus(pengajuanId, newStatus, dosenId, detailId);
    setSelectedDosenPerRow({});
  };

  // ✅ FIXED: Handle assign dosen per baris
  const handleAssignDosen = async (item) => {
    const rowId = item.id;
    const selectedDosen = selectedDosenPerRow[rowId];
    
    if (!selectedDosen) {
      alert('Silakan pilih dosen terlebih dahulu');
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
      alert('Gagal menugaskan dosen. Silakan coba lagi.');
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
      alert('Harap masukkan nilai yang valid (0-100)');
      return;
    }

    // Validasi ID
    if (!item.id || isNaN(item.id) || item.id <= 0) {
      alert('❌ ID pengajuan SA tidak valid. Silakan refresh halaman.');
      return;
    }

    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin memberikan nilai "${nilai}" untuk mata kuliah "${item.mataKuliah?.nama || 'SA'} ini?\n\nSetelah nilai diinput, mata kuliah ini akan dinyatakan SELESAI. Jika semua mata kuliah dalam pengajuan SA ini sudah dinilai, maka seluruh pengajuan SA akan dinyatakan SELESAI.`
    );

    if (!isConfirmed) {
      return;
    }

    setIsUpdating({ ...isUpdating, [item.id]: true });

    try {
      // ✅ FIXED: Gunakan updateNilaiDetail untuk per mata kuliah
      await onUpdateNilaiDetail(item.id, nilai);
      setNilaiInputs({ ...nilaiInputs, [item.id]: '' });
      alert(`✅ Nilai ${nilai} berhasil diinput untuk mata kuliah "${item.mataKuliah?.nama || 'SA'}!\nMata kuliah ini telah selesai dinilai.`);
    } catch (error) {
      console.error('Error updating nilai:', error);
      
      // Jika error 404 (data tidak ditemukan), refresh data otomatis
      if (error.message.includes('tidak ditemukan')) {
        alert(`❌ ${error.message}\n\nMemperbarui data...`);
        // Trigger refresh dari parent component
        if (typeof fetchPengajuanSA === 'function') {
          fetchPengajuanSA();
        }
      } else {
        alert(`❌ Error: ${error.message}`);
      }
    } finally {
      setIsUpdating({ ...isUpdating, [item.id]: false });
    }
  };

  const handleTolakPengajuan = async (pengajuanId) => {
    const reason = prompt('Masukkan alasan penolakan:');
    if (!reason || reason.trim() === '') {
      alert('Alasan penolakan harus diisi!');
      return;
    }

    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menolak pengajuan SA ini?\n\nAlasan: ${reason}\n\nSetelah ditolak, pengajuan tidak dapat diubah lagi.`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const pengajuanSAService = new PengajuanSAService(authToken);
      await pengajuanSAService.tolakPengajuanSA(pengajuanId, reason);
      alert('✅ Pengajuan SA berhasil ditolak!');
      fetchPengajuanSA();
    } catch (error) {
      console.error('Error rejecting pengajuan:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // ✅ IMPROVED: Check if dosen can input nilai untuk mata kuliah spesifik
  const canDosenInputNilai = (item) => {
    if (userType !== 'dosen') return false;
    const currentStatus = statusPerRow[item.id] || item.status;
    if (currentStatus !== 'DALAM_PROSES_SA') return false;
    
    // ✅ FIXED: Cek apakah mata kuliah ini sudah dinilai
    if (item.nilaiAkhir !== null && item.nilaiAkhir !== undefined) {
      return false; // Sudah ada nilai untuk mata kuliah ini
    }
    
    // Check if current dosen is assigned to this specific mata kuliah
    const isAssigned = item.dosenId === currentUser.username ||
                      item.dosenId === currentUser.nip ||
                      item.dosenId === currentUser.email ||
                      item.dosenId === currentUser.id;
    
    console.log('🔍 Can dosen input nilai check:', {
      userType,
      status: currentStatus,
      nilaiAkhir: item.nilaiAkhir,
      mataKuliah: item.mataKuliah?.nama,
      itemDosenId: item.dosenId,
      currentUserIdentifiers: {
        username: currentUser.username,
        nip: currentUser.nip,
        email: currentUser.email,
        id: currentUser.id
      },
      isAssigned,
      result: isAssigned
    });
    
    return isAssigned;
  };

  // ✅ NEW: Check if admin can input nilai untuk mata kuliah spesifik
  const canAdminInputNilai = (item) => {
    if (userType !== 'admin') return false;
    const currentStatus = statusPerRow[item.id] || item.status;
    
    // Admin bisa input nilai untuk status DALAM_PROSES_SA atau SELESAI (jika belum ada nilai)
    if (currentStatus !== 'DALAM_PROSES_SA' && currentStatus !== 'SELESAI') return false;
    
    // ✅ FIXED: Cek apakah mata kuliah ini sudah dinilai
    if (item.nilaiAkhir !== null && item.nilaiAkhir !== undefined) {
      return false; // Sudah ada nilai untuk mata kuliah ini
    }
    
    console.log('🔍 Can admin input nilai check:', {
      userType,
      status: currentStatus,
      nilaiAkhir: item.nilaiAkhir,
      mataKuliah: item.mataKuliah?.nama,
      result: true
    });
    
    return true; // Admin bisa input nilai untuk semua mata kuliah yang belum dinilai
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
          {/* ✅ CONDITIONAL HEADER - ADMIN vs OTHERS */}
          {userType === 'admin' ? (
            // 🎯 HEADER ADMIN - WITH MATA KULIAH
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dosen</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nilai</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
          )}

          {/* ✅ CONDITIONAL BODY - ADMIN vs OTHERS */}
          {userType === 'admin' ? (
            // 🎯 BODY ADMIN - SIMPLIFIED
            <tbody className="divide-y divide-gray-200">
              {currentRows.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                  
                  {/* Mahasiswa */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{item.mahasiswa?.nama || 'N/A'}</div>
                        <div className="text-gray-500 text-xs">{item.mahasiswaId}</div>
                      </div>
                    </div>
                  </td>

                  {/* Mata Kuliah - Admin View */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.isGrouped ? (
                      // GROUPED: Tampilkan gabungan mata kuliah
                      <div>
                        <div className="font-medium">
                          {item.mataKuliah || 'Mata kuliah tidak tersedia'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.jumlahMataKuliah || 0} mata kuliah • {item.totalSKS || 0} SKS
                        </div>
                      </div>
                    ) : (
                      // NOT GROUPED: Tampilkan satu mata kuliah per baris  
                      <div>
                        <div className="font-medium">
                          {item.mataKuliah?.nama || item.mataKuliah || 'N/A'}
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      {getSemesterFromDate(item.tanggalPengajuan)}
                    </span>
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

                  {/* Aksi Admin */}
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
                  <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                  {userType !== 'mahasiswa' && (
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{item.mahasiswa?.nama || 'N/A'}</div>
                          <div className="text-gray-500 text-xs">{item.mahasiswaId}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {/* ✅ LOGIC TAMPILAN MATA KULIAH BERDASARKAN isGrouped */}
                    {item.isGrouped ? (
                      // GROUPED: Tampilkan gabungan mata kuliah
                      <div>
                        <div className="font-medium">
                          {item.mataKuliah || 'Mata kuliah tidak tersedia'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.jumlahMataKuliah || 0} mata kuliah • {item.totalSKS || 0} SKS
                        </div>
                      </div>
                    ) : (
                      // NOT GROUPED: Tampilkan satu mata kuliah per baris  
                      <div>
                        <div className="font-medium">
                          {item.mataKuliah?.nama || item.mataKuliah || 'N/A'}
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      {getSemesterFromDate(item.tanggalPengajuan)}
                    </span>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* ✅ ENHANCED: Aksi Kaprodi - Assign Dosen */}
                      {userType === 'kaprodi' && (statusPerRow[item.id] || item.status) === 'MENUNGGU_VERIFIKASI_KAPRODI' && !item.dosenId && !assignedRows[item.id] && (
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

                      {/* ✅ ENHANCED: Aksi Dosen - Input Nilai */}
                      {canDosenInputNilai(item) && (
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

                      {/* ✅ NEW: Aksi Admin - Input Nilai */}
                      {canAdminInputNilai(item) && (
                        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-200">
                          <Edit3 className="w-4 h-4 text-blue-600" />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0-100"
                            value={nilaiInputs[item.id] || ''}
                            onChange={(e) => handleNilaiInputChange(item.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            disabled={isUpdating[item.id]}
                          />
                          <button
                            onClick={() => handleUpdateNilai(item)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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

                      {/* ✅ Button Lihat Bukti Pembayaran */}
                      <button
                        onClick={() => window.open(`http://localhost:5000/uploads/${item.buktiPembayaran}`, '_blank')}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 flex items-center gap-1"
                        title="Lihat bukti pembayaran"
                      >
                        <Eye className="w-3 h-3" />
                        Lihat
                      </button>

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
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, pengajuanList.length)}</span> of{' '}
              <span className="font-medium">{pengajuanList.length}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4 inline" />
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 inline" />
            </button>
          </div>
        </div>
      )}
      
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
    </div>
  );
};

export default TabelPengajuanSA;