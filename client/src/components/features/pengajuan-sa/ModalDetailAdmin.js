// 1. components/pengajuan-sa/ModalDetailAdmin.js
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, User, CreditCard, GraduationCap, FileText, Eye, CheckCircle, X, Calendar, BookOpen } from 'lucide-react';
import { formatCurrency, getSemesterFromDate } from '../../../utils/helper/pengajuanSAUtils';
import { getProgramStudiName } from '../../../utils/helper/programStudiUtils';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../../utils/notifikasi/alertUtils';
import { getTheme } from '../../../utils/theme';

const ModalDetailSekjur = ({ 
  showModal, 
  setShowModal, 
  selectedDetail,
  onVerifikasi,
  onTolak,
  currentUser = {}
}) => {
  const [showTolakModal, setShowTolakModal] = useState(false);
  const [alasanPenolakan, setAlasanPenolakan] = useState('');

  if (!showModal || !selectedDetail) return null;

  // Get theme colors based on jurusan
  const theme = getTheme(currentUser);
  
  // Helper untuk mendapatkan warna light dari tema
  const getLightBg = () => {
    const jurusanName = currentUser?.jurusan?.nama || 
                       currentUser?.prodi?.jurusan?.nama || 
                       currentUser?.programStudi?.jurusan?.nama || '';
    
    if (jurusanName.toLowerCase().includes('elektro')) return 'bg-blue-50';
    if (jurusanName.toLowerCase().includes('sipil')) return 'bg-amber-50';
    if (jurusanName.toLowerCase().includes('informatika') || jurusanName.toLowerCase().includes('ti')) return 'bg-emerald-50';
    if (jurusanName.toLowerCase().includes('mesin')) return 'bg-red-50';
    if (jurusanName.toLowerCase().includes('arsitektur')) return 'bg-purple-50';
    return 'bg-gray-50';
  };

  const getLightBorder = () => {
    const jurusanName = currentUser?.jurusan?.nama || 
                       currentUser?.prodi?.jurusan?.nama || 
                       currentUser?.programStudi?.jurusan?.nama || '';
    
    if (jurusanName.toLowerCase().includes('elektro')) return 'border-blue-200';
    if (jurusanName.toLowerCase().includes('sipil')) return 'border-amber-200';
    if (jurusanName.toLowerCase().includes('informatika') || jurusanName.toLowerCase().includes('ti')) return 'border-emerald-200';
    if (jurusanName.toLowerCase().includes('mesin')) return 'border-red-200';
    if (jurusanName.toLowerCase().includes('arsitektur')) return 'border-purple-200';
    return 'border-gray-200';
  };

  const getTextColor = () => {
    const jurusanName = currentUser?.jurusan?.nama || 
                       currentUser?.prodi?.jurusan?.nama || 
                       currentUser?.programStudi?.jurusan?.nama || '';
    
    if (jurusanName.toLowerCase().includes('elektro')) return 'text-blue-700';
    if (jurusanName.toLowerCase().includes('sipil')) return 'text-amber-700';
    if (jurusanName.toLowerCase().includes('informatika') || jurusanName.toLowerCase().includes('ti')) return 'text-emerald-700';
    if (jurusanName.toLowerCase().includes('mesin')) return 'text-red-700';
    if (jurusanName.toLowerCase().includes('arsitektur')) return 'text-purple-700';
    return 'text-gray-700';
  };

  const handleVerifikasi = () => {
    onVerifikasi(selectedDetail.id);
    setShowModal(false);
  };

  const handleTolak = () => {
    setShowTolakModal(true);
  };

  const handleTolakConfirm = () => {
    if (!alasanPenolakan.trim()) {
      showWarningAlert('Alasan penolakan harus diisi!');
      return;
    }

    onTolak(selectedDetail.id, alasanPenolakan);
    setShowTolakModal(false);
    setAlasanPenolakan('');
    setShowModal(false);
  };

  const calculateEstimatedCost = () => {
    // Handle different data structures for mataKuliah
    let totalSKS = 0;
    
    if (selectedDetail.totalSKS) {
      totalSKS = selectedDetail.totalSKS;
    } else if (typeof selectedDetail.mataKuliah === 'object' && selectedDetail.mataKuliah.sks) {
      totalSKS = selectedDetail.mataKuliah.sks;
    } else if (selectedDetail.mataKuliahList && selectedDetail.mataKuliahList.length > 0) {
      totalSKS = selectedDetail.mataKuliahList.reduce((sum, mk) => sum + (mk.sks || 0), 0);
    }
    
    return totalSKS * 300000;
  };

  const calculateDifference = () => {
    const nominal = parseFloat(selectedDetail.nominal || 0);
    const estimatedCost = calculateEstimatedCost();
    return nominal - estimatedCost;
  };

  if (!showModal || !selectedDetail) return null;

  return typeof window !== 'undefined' && (
    <>
      {createPortal(
        <AnimatePresence>
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
              }
            }}
          >
        <motion.div 
          className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{ zIndex: 10000 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-5 ${theme.primary.bg} text-white border-b ${theme.primary.border}`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white mb-0.5">Detail Pengajuan SA</h2>
                <p className="text-xs text-white/80">Verifikasi Pembayaran - Sekretaris Jurusan</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-5 space-y-4">
          {/* Informasi Mahasiswa */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={`px-4 py-2.5 ${getLightBg()} border-b ${getLightBorder()}`}>
              <h3 className={`text-sm font-semibold ${getTextColor()}`}>Informasi Mahasiswa</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Nama</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDetail.mahasiswa?.nama || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">NIM</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDetail.mahasiswa?.nim || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Program Studi</p>
                  <p className="text-sm font-medium text-gray-900">{getProgramStudiName(selectedDetail.mahasiswa?.programStudiId) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tanggal Pengajuan</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedDetail.tanggalPengajuan).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Semester</p>
                  <p className="text-sm font-medium text-gray-900">{getSemesterFromDate(selectedDetail.tanggalPengajuan) || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Pembayaran */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={`px-4 py-2.5 ${getLightBg()} border-b ${getLightBorder()}`}>
              <h3 className={`text-sm font-semibold ${getTextColor()}`}>Informasi Pembayaran</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Nominal Pembayaran</p>
                <div className={`p-2.5 ${getLightBg()} rounded border ${getLightBorder()}`}>
                  <span className={`text-base font-semibold ${getTextColor()}`}>
                    {formatCurrency(selectedDetail.nominal || 0)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total SKS</p>
                  <p className="text-sm font-medium text-gray-900">
                    {(() => {
                      if (selectedDetail.totalSKS) {
                        return selectedDetail.totalSKS;
                      } else if (typeof selectedDetail.mataKuliah === 'object' && selectedDetail.mataKuliah.sks) {
                        return selectedDetail.mataKuliah.sks;
                      } else if (selectedDetail.mataKuliahList && selectedDetail.mataKuliahList.length > 0) {
                        return selectedDetail.mataKuliahList.reduce((sum, mk) => sum + (mk.sks || 0), 0);
                      }
                      return 0;
                    })()} SKS
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estimasi Biaya</p>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(calculateEstimatedCost())}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Selisih</p>
                  <p className={`text-sm font-semibold ${
                    calculateDifference() >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(calculateDifference())}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mata Kuliah yang Dipilih */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={`px-4 py-2.5 ${getLightBg()} border-b ${getLightBorder()}`}>
              <h3 className={`text-sm font-semibold ${getTextColor()}`}>
                Daftar Mata Kuliah ({(() => {
                  if (selectedDetail.jumlahMataKuliah) {
                    return selectedDetail.jumlahMataKuliah;
                  } else if (typeof selectedDetail.mataKuliah === 'object') {
                    return 1;
                  } else if (selectedDetail.mataKuliahList && selectedDetail.mataKuliahList.length > 0) {
                    return selectedDetail.mataKuliahList.length;
                  }
                  return 0;
                })()} mata kuliah)
              </h3>
            </div>
            <div className="p-4">
              {selectedDetail.mataKuliahList && selectedDetail.mataKuliahList.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedDetail.mataKuliahList.map((mk, index) => (
                    <div key={mk.id || index} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-gray-900">{mk.nama}</span>
                      <span className="text-xs text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                        {mk.sks} SKS
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-900">
                  {typeof selectedDetail.mataKuliah === 'object' 
                    ? selectedDetail.mataKuliah.nama 
                    : selectedDetail.mataKuliah || 'Mata kuliah tidak tersedia'}
                </p>
              )}
            </div>
          </div>

          {/* Keterangan Pengajuan */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={`px-4 py-2.5 ${getLightBg()} border-b ${getLightBorder()}`}>
              <h3 className={`text-sm font-semibold ${getTextColor()}`}>Keterangan Pengajuan</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedDetail.keterangan || 'Tidak ada keterangan'}
              </p>
            </div>
          </div>

          {/* Bukti Pembayaran */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={`px-4 py-2.5 ${getLightBg()} border-b ${getLightBorder()}`}>
              <h3 className={`text-sm font-semibold ${getTextColor()}`}>Bukti Pembayaran</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{selectedDetail.buktiPembayaran || 'Tidak ada bukti'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Periksa bukti pembayaran untuk memverifikasi nominal dan keabsahan transaksi</p>
                </div>
                {selectedDetail.buktiPembayaran && (
                  <button
                    onClick={() => window.open(`http://localhost:5000/uploads/${selectedDetail.buktiPembayaran}`, '_blank')}
                    className={`${theme.primary.bg} text-white px-3 py-1.5 rounded text-xs font-medium ${theme.primary.hover} flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-sm`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Aksi Verifikasi */}
          {selectedDetail.status === 'PROSES_PENGAJUAN' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className={`px-4 py-2.5 ${getLightBg()} border-b ${getLightBorder()}`}>
                <h3 className={`text-sm font-semibold ${getTextColor()}`}>Aksi Verifikasi</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleVerifikasi}
                    className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 font-medium flex items-center justify-center gap-2 transition-colors shadow-sm text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verifikasi Pembayaran
                  </button>
                  <button
                    onClick={handleTolak}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 font-medium flex items-center justify-center gap-2 transition-colors shadow-sm text-sm"
                  >
                    <X className="w-4 h-4" />
                    Tolak Pengajuan
                  </button>
                </div>
              </div>
            </div>
          )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Tutup
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
      )}
      <ModalTolakPengajuan
        showModal={showTolakModal}
        setShowModal={setShowTolakModal}
        alasanPenolakan={alasanPenolakan}
        setAlasanPenolakan={setAlasanPenolakan}
        onConfirm={handleTolakConfirm}
      />
    </>
  );
};

// Nested modal tolak pengajuan
const ModalTolakPengajuan = ({ showModal, setShowModal, alasanPenolakan, setAlasanPenolakan, onConfirm }) => {
  if (typeof window === 'undefined' || !showModal) return null;

  return createPortal(
    <AnimatePresence>
      {showModal && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 10001 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setAlasanPenolakan('');
            }
          }}
        >
          <motion.div 
            className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
            style={{ zIndex: 10002 }}
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
                  <h2 className="text-xl font-semibold mb-1">Alasan Penolakan</h2>
                  <p className="text-sm text-red-100">Berikan alasan penolakan pengajuan</p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
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
                  setShowModal(false);
                  setAlasanPenolakan('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!alasanPenolakan.trim()}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  alasanPenolakan.trim()
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Konfirmasi Tolak
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ModalDetailSekjur;
