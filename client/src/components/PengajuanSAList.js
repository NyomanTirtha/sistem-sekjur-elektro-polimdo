// components/PengajuanSAList.js (Main Component - Updated with Report Button)
import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3  // ✨ NEW ICON FOR REPORT
} from 'lucide-react';

// Hooks
import { usePengajuanSA } from '../hooks/usePengajuanSA';

// Components
import FormPengajuanSA from './pengajuan-sa/FormPengajuanSA';
import ModalMataKuliah from './pengajuan-sa/ModalMataKuliah';
import ModalFormDetail from './pengajuan-sa/ModalFormDetail';
import ModalDetailAdmin from './pengajuan-sa/ModalDetailAdmin';
import FilterStatus from './pengajuan-sa/FilterStatus';
import TabelPengajuanSA from './pengajuan-sa/TabelPengajuanSA';
import InfoCard from './pengajuan-sa/InfoCard';
import LaporanSA from './LaporanSA'; // ✨ NEW IMPORT

// Services
import PengajuanSAService from '../services/pengajuanSAService';

// Utils
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../utils/alertUtils';

const PengajuanSAList = ({ authToken, currentUser, userType }) => {
  // Custom hook untuk data management
  const {
    pengajuanList,
    filteredPengajuan,
    loading,
    dosenList,
    mataKuliahList,
    filterStatus,
    setFilterStatus,
    fetchPengajuanSA
  } = usePengajuanSA(authToken, userType, currentUser);

  // State untuk form dan modal
  const [showForm, setShowForm] = useState(false);
  const [showMataKuliahForm, setShowMataKuliahForm] = useState(false);
  const [showFormDetail, setShowFormDetail] = useState(false);
  const [selectedPengajuanId, setSelectedPengajuanId] = useState(null);
  const [selectedFormDetail, setSelectedFormDetail] = useState(null);
  const [showDetailAdmin, setShowDetailAdmin] = useState(false);
  const [selectedDetailAdmin, setSelectedDetailAdmin] = useState(null);
  
  // ✨ NEW STATE FOR REPORT PAGE
  const [showLaporan, setShowLaporan] = useState(false);

  // ✨ PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination options
  const itemsPerPageOptions = [
    { value: 10, label: '10 per halaman' },
    { value: 25, label: '25 per halaman' },
    { value: 50, label: '50 per halaman' },
    { value: 100, label: '100 per halaman' }
  ];

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, itemsPerPage]);

  // ✨ PAGINATION CALCULATIONS
  const totalItems = filteredPengajuan.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPengajuan = filteredPengajuan.slice(startIndex, endIndex);

  // ✨ PAGINATION FUNCTIONS
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftOffset = Math.floor(maxVisiblePages / 2);
      const rightOffset = maxVisiblePages - leftOffset - 1;
      
      let start = Math.max(1, currentPage - leftOffset);
      let end = Math.min(totalPages, currentPage + rightOffset);
      
      if (end - start + 1 < maxVisiblePages) {
        if (start === 1) {
          end = Math.min(totalPages, start + maxVisiblePages - 1);
        } else {
          start = Math.max(1, end - maxVisiblePages + 1);
        }
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // ✨ STATISTICS CALCULATION
  const getStatistics = () => {
    const stats = {
      total: pengajuanList.length,
      proses: pengajuanList.filter(p => p.status === 'PROSES_PENGAJUAN').length,
      menunggu: pengajuanList.filter(p => p.status === 'MENUNGGU_VERIFIKASI_KAPRODI').length,
      dalam_proses: pengajuanList.filter(p => p.status === 'DALAM_PROSES_SA').length,
      selesai: pengajuanList.filter(p => p.status === 'SELESAI').length,
      ditolak: pengajuanList.filter(p => p.status === 'DITOLAK').length
    };
    return stats;
  };

  const stats = getStatistics();

  // Service untuk API calls
  const pengajuanSAService = new PengajuanSAService(authToken);

  // ✨ IF SHOWING REPORT PAGE, RENDER LAPORAN COMPONENT
  if (showLaporan) {
    return (
      <LaporanSA
        authToken={authToken}
        currentUser={currentUser}
        userType={userType}
        pengajuanList={pengajuanList}
        dosenList={dosenList}
        onBack={() => setShowLaporan(false)}
      />
    );
  }

  // Event handlers
  const handleUpdateStatus = async (pengajuanId, newStatus, dosenId = null, detailId = null) => {
    let confirmMessage = '';
    let actionType = '';

    if (userType === 'sekjur' && newStatus === 'MENUNGGU_VERIFIKASI_KAPRODI') {
      confirmMessage = 'Apakah Anda yakin ingin memverifikasi pembayaran pengajuan SA ini?\n\nSetelah diverifikasi, pengajuan akan diteruskan ke Kaprodi untuk verifikasi dan penentuan dosen.';
      actionType = 'Verifikasi Pembayaran';
    } else if (userType === 'kaprodi' && dosenId && newStatus === 'DALAM_PROSES_SA') {
      const selectedDosenName = dosenList.find(d => d.nip === dosenId)?.nama || dosenId;
      confirmMessage = `Apakah Anda yakin ingin memverifikasi pengajuan ini dan menugaskan "${selectedDosenName}" sebagai dosen pengampu SA?\n\nSetelah diverifikasi dan ditugaskan, dosen akan bertanggung jawab mengampu mahasiswa.`;
      actionType = 'Verifikasi Kaprodi & Penugasan Dosen';
    }

    if (confirmMessage) {
      showConfirm(
        confirmMessage,
        async () => {
          try {
            await pengajuanSAService.updateStatus(pengajuanId, newStatus, dosenId, detailId);
            
            if (actionType === 'Verifikasi Pembayaran') {
              showSuccessAlert('Pembayaran berhasil diverifikasi!\nPengajuan SA telah diteruskan ke Kaprodi untuk verifikasi dan penentuan dosen.');
            } else if (actionType === 'Verifikasi Kaprodi & Penugasan Dosen') {
              showSuccessAlert('Pengajuan berhasil diverifikasi dan dosen berhasil ditugaskan!\nDosen dapat mulai mengampu mahasiswa.');
            } else {
              showSuccessAlert('Status berhasil diupdate!');
            }
            
            fetchPengajuanSA();
          } catch (error) {
            console.error('Error updating status:', error);
            showErrorAlert(error.message);
          }
        },
        () => {
          // User cancelled
        },
        actionType,
        'warning',
        'Verifikasi',
        'Batal'
      );
      return;
    }

    // If no confirmation needed, proceed directly
    try {
      await pengajuanSAService.updateStatus(pengajuanId, newStatus, dosenId, detailId);
      showSuccessAlert('Status berhasil diupdate!');
      fetchPengajuanSA();
    } catch (error) {
      console.error('Error updating status:', error);
      showErrorAlert(error.message);
    }
  };

  const handleUpdateNilai = async (id, nilai) => {
    if (!nilai || nilai < 0 || nilai > 100) {
      showWarningAlert('Harap masukkan nilai yang valid (0-100)');
      return;
    }

    showConfirm(
      `Apakah Anda yakin ingin memberikan nilai "${nilai}" untuk SA ini?\n\nSetelah nilai diinput, SA akan dinyatakan SELESAI dan tidak dapat diubah lagi.`,
      async () => {
        try {
          await pengajuanSAService.updateNilai(id, nilai);
          showSuccessAlert(`Nilai ${nilai} berhasil diinput!\nSA telah selesai dan mahasiswa dapat melihat hasilnya.`);
          fetchPengajuanSA();
        } catch (error) {
          console.error('Error updating nilai:', error);
          showErrorAlert(`${error.message}\n\nMemperbarui data...`);
          fetchPengajuanSA();
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Input Nilai',
      'warning',
      'Input Nilai',
      'Batal'
    );
  };

  const handleUpdateNilaiDetail = async (detailId, nilai) => {
    if (!nilai || nilai < 0 || nilai > 100) {
      showWarningAlert('Harap masukkan nilai yang valid (0-100)');
      return;
    }

    showConfirm(
      `Apakah Anda yakin ingin memberikan nilai "${nilai}" untuk mata kuliah ini?\n\nSetelah nilai diinput, mata kuliah ini akan dinyatakan SELESAI dan tidak dapat diubah lagi.`,
      async () => {
        try {
          await pengajuanSAService.updateNilaiDetail(detailId, nilai);
          showSuccessAlert(`Nilai ${nilai} berhasil diinput!\nMata kuliah ini telah selesai dinilai.`);
          fetchPengajuanSA();
        } catch (error) {
          console.error('Error updating nilai detail:', error);
          showErrorAlert(`${error.message}\n\nMemperbarui data...`);
          fetchPengajuanSA();
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Input Nilai',
      'warning',
      'Input Nilai',
      'Batal'
    );
  };

  // Handler untuk modal form detail (kaprodi)
  const handleLihatFormDetail = (item) => {
    console.log('Form detail data:', item);
    setSelectedFormDetail(item);
    setShowFormDetail(true);
  };

  // Handler untuk modal detail admin
  const handleLihatDetailAdmin = (item) => {
    console.log('Admin detail data:', item);
    setSelectedDetailAdmin(item);
    setShowDetailAdmin(true);
  };

  // Handler untuk verifikasi dari modal admin
  const handleVerifikasiFromModal = (pengajuanId) => {
    handleUpdateStatus(pengajuanId, 'MENUNGGU_VERIFIKASI_KAPRODI');
  };

  // Handler untuk tolak dari modal admin
  const handleTolakFromModal = async (pengajuanId, reason) => {
    try {
      await pengajuanSAService.tolakPengajuan(pengajuanId, reason);
      showSuccessAlert('Pengajuan SA berhasil ditolak!');
      fetchPengajuanSA();
    } catch (error) {
      console.error('Error rejecting pengajuan:', error);
      showErrorAlert(error.message);
    }
  };

  const handleFormSubmitSuccess = () => {
    setShowForm(false);
    fetchPengajuanSA();
  };

  const handleMataKuliahSubmitSuccess = () => {
    setShowMataKuliahForm(false);
    setSelectedPengajuanId(null);
    setTimeout(() => {
      fetchPengajuanSA();
    }, 100);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Memuat data pengajuan SA...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✨ UPDATED HEADER WITH REPORT BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {userType === 'mahasiswa' ? 'Pengajuan SA Saya' : 
             userType === 'sekjur' ? 'Verifikasi Pembayaran SA' :
             userType === 'kaprodi' ? 'Verifikasi & Penugasan SA' :
             'SA yang Saya Ampu'}
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Items per page selector */}
          <div>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* ✨ REPORT BUTTON - Show for sekjur, kaprodi, and dosen */}
          {(userType === 'sekjur' || userType === 'kaprodi' || userType === 'dosen') && (
            <button
              onClick={() => setShowLaporan(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Laporan
            </button>
          )}

          {userType === 'mahasiswa' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Ajukan SA
            </button>
          )}
        </div>
      </div>

      {/* ✨ STATISTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Proses</p>
              <p className="text-xl font-bold text-gray-900">{stats.proses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Menunggu</p>
              <p className="text-xl font-bold text-gray-900">{stats.menunggu}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Dalam Proses</p>
              <p className="text-xl font-bold text-gray-900">{stats.dalam_proses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Selesai</p>
              <p className="text-xl font-bold text-gray-900">{stats.selesai}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Pengajuan SA */}
      <FormPengajuanSA
        showForm={showForm}
        setShowForm={setShowForm}
        authToken={authToken}
        currentUser={currentUser}
        mataKuliahList={mataKuliahList}
        onSubmitSuccess={handleFormSubmitSuccess}
      />

      {/* Modal Form Mata Kuliah */}
      <ModalMataKuliah
        showModal={showMataKuliahForm}
        setShowModal={setShowMataKuliahForm}
        authToken={authToken}
        selectedPengajuanId={selectedPengajuanId}
        onSubmitSuccess={handleMataKuliahSubmitSuccess}
      />

      {/* Modal Form Detail (untuk Kaprodi) */}
      <ModalFormDetail
        showModal={showFormDetail}
        setShowModal={setShowFormDetail}
        selectedFormDetail={selectedFormDetail}
        userType={userType}
      />

      {/* Modal Detail Admin */}
      <ModalDetailAdmin
        showModal={showDetailAdmin}
        setShowModal={setShowDetailAdmin}
        selectedDetail={selectedDetailAdmin}
        onVerifikasi={handleVerifikasiFromModal}
        onTolak={handleTolakFromModal}
      />

      {/* Filter Status */}
      <FilterStatus
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        userType={userType}
      />

      {/* ✨ TABLE WITH PAGINATION INFO */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Table Header Info */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">
              Data Pengajuan SA ({totalItems} total, menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)})
            </h3>
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
          </div>
        </div>

        {/* Tabel Pengajuan SA dengan Data Terpaginasi */}
        <TabelPengajuanSA
          pengajuanList={currentPengajuan} // ✨ PASS PAGINATED DATA
          userType={userType}
          currentUser={currentUser}
          dosenList={dosenList}
          authToken={authToken}
          onUpdateStatus={handleUpdateStatus}
          onUpdateNilai={handleUpdateNilai}
          onUpdateNilaiDetail={handleUpdateNilaiDetail}
          onLihatFormDetail={userType === 'sekjur' ? handleLihatDetailAdmin : handleLihatFormDetail}
          fetchPengajuanSA={fetchPengajuanSA}
          startIndex={startIndex} // ✨ PASS START INDEX FOR NUMBERING
        />

        {/* ✨ PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                {/* First Page */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Halaman pertama"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm rounded ${
                        page === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Halaman selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Halaman terakhir"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <InfoCard userType={userType} />
    </div>
  );
};

export default PengajuanSAList;