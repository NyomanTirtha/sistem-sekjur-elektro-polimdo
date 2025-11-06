// 1. components/pengajuan-sa/ModalDetailAdmin.js
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, User, CreditCard, GraduationCap, FileText, Eye, CheckCircle, X, Calendar, BookOpen } from 'lucide-react';
import { formatCurrency, getSemesterFromDate } from '../../../utilitas/helper/pengajuanSAUtils';
import { getProgramStudiName } from '../../../utilitas/helper/programStudiUtils';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../../utilitas/notifikasi/alertUtils';

const ModalDetailSekjur = ({ 
  showModal, 
  setShowModal, 
  selectedDetail,
  onVerifikasi,
  onTolak
}) => {
  const [showTolakModal, setShowTolakModal] = useState(false);
  const [alasanPenolakan, setAlasanPenolakan] = useState('');

  if (!showModal || !selectedDetail) return null;

  const handleVerifikasi = () => {
    showConfirm(
      'Apakah Anda yakin ingin memverifikasi pembayaran pengajuan SA ini?\n\nSetelah diverifikasi, pengajuan akan diteruskan ke Kaprodi untuk verifikasi dan penentuan dosen.',
      () => {
        onVerifikasi(selectedDetail.id);
        setShowModal(false);
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Verifikasi Pembayaran',
      'warning',
      'Verifikasi',
      'Batal'
    );
  };

  const handleTolak = () => {
    setShowTolakModal(true);
  };

  const handleTolakConfirm = () => {
    if (!alasanPenolakan.trim()) {
      showWarningAlert('Alasan penolakan harus diisi!');
      return;
    }

    showConfirm(
      `Apakah Anda yakin ingin menolak pengajuan SA ini?\n\nAlasan: ${alasanPenolakan}`,
      () => {
        onTolak(selectedDetail.id, alasanPenolakan);
        setShowTolakModal(false);
        setAlasanPenolakan('');
        setShowModal(false);
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
          <div className="p-6 text-white bg-blue-600 border-b border-blue-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1">Detail Pengajuan SA</h2>
                <p className="text-sm text-blue-100">Verifikasi Pembayaran - Sekretaris Jurusan</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-blue-700 rounded transition-colors text-white"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6 space-y-4">
          {/* Informasi Mahasiswa */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-3 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Informasi Mahasiswa</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Nama</p>
                    <p className="text-sm font-medium text-gray-900">{selectedDetail.mahasiswa?.nama || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">NIM</p>
                    <p className="text-sm font-medium text-gray-900">{selectedDetail.mahasiswa?.nim || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Program Studi</p>
                    <p className="text-sm font-medium text-gray-900">{getProgramStudiName(selectedDetail.mahasiswa?.programStudiId) || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Tanggal Pengajuan</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedDetail.tanggalPengajuan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Semester</p>
                    <p className="text-sm font-medium text-gray-900">{getSemesterFromDate(selectedDetail.tanggalPengajuan) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Pembayaran */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-5 py-3 border-b border-green-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Informasi Pembayaran</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-500 mb-1">Nominal Pembayaran</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(selectedDetail.nominal || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Total SKS</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
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
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Estimasi Biaya</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(calculateEstimatedCost())}</span>
                </div>
                <div className="md:col-span-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Selisih</span>
                    <span className={`text-sm font-bold ${
                      calculateDifference() >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(calculateDifference())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mata Kuliah yang Dipilih */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-5 py-3 border-b border-purple-200">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">
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
            </div>
            <div className="p-5">
              {selectedDetail.mataKuliahList && selectedDetail.mataKuliahList.length > 0 ? (
                <div className="space-y-2">
                  {selectedDetail.mataKuliahList.map((mk, index) => (
                    <div key={mk.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{mk.nama}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                        {mk.sks} SKS
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-900">
                    {typeof selectedDetail.mataKuliah === 'object' 
                      ? selectedDetail.mataKuliah.nama 
                      : selectedDetail.mataKuliah || 'Mata kuliah tidak tersedia'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Keterangan Pengajuan */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Keterangan Pengajuan</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedDetail.keterangan || 'Tidak ada keterangan'}
                </p>
              </div>
            </div>
          </div>

          {/* Bukti Pembayaran */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-5 py-3 border-b border-orange-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">Bukti Pembayaran</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedDetail.buktiPembayaran || 'Tidak ada bukti'}</p>
                    <p className="text-xs text-gray-500 mt-1">Periksa bukti pembayaran untuk memverifikasi nominal dan keabsahan transaksi</p>
                  </div>
                </div>
                {selectedDetail.buktiPembayaran && (
                  <button
                    onClick={() => window.open(`http://localhost:5000/uploads/${selectedDetail.buktiPembayaran}`, '_blank')}
                    className="ml-3 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium text-sm flex-shrink-0 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Aksi Verifikasi */}
          {selectedDetail.status === 'PROSES_PENGAJUAN' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 px-5 py-3 border-b border-yellow-200">
                <h3 className="font-semibold text-yellow-900">Aksi Verifikasi</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleVerifikasi}
                    className="bg-green-500 text-white py-2.5 px-4 rounded-lg hover:bg-green-600 font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verifikasi Pembayaran
                  </button>
                  <button
                    onClick={handleTolak}
                    className="bg-red-500 text-white py-2.5 px-4 rounded-lg hover:bg-red-600 font-medium flex items-center justify-center gap-2 transition-colors"
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
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex justify-end rounded-b-3xl">
            <motion.button
              onClick={() => setShowModal(false)}
              className="px-6 py-3 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200 flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Tutup Detail
            </motion.button>
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
