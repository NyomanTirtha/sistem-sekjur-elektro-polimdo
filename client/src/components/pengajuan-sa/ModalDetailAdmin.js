// 1. components/pengajuan-sa/ModalDetailAdmin.js
import React, { useState } from 'react';
import { XCircle, User, CreditCard, GraduationCap, FileText, Eye, CheckCircle, X } from 'lucide-react';
import { formatCurrency, getSemesterFromDate } from '../../utils/pengajuanSAUtils';
import { getProgramStudiName } from '../../utils/programStudiUtils';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../utils/alertUtils';

const ModalDetailAdmin = ({ 
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Detail Pengajuan SA - Admin</h2>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informasi Mahasiswa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Informasi Mahasiswa</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Nama:</span>
                <span className="text-blue-900 ml-2">{selectedDetail.mahasiswa?.nama || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">NIM:</span>
                <span className="text-blue-900 ml-2">{selectedDetail.mahasiswa?.nim || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Program Studi:</span>
                <span className="text-blue-900 ml-2">{getProgramStudiName(selectedDetail.mahasiswa?.programStudiId)}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Tanggal Pengajuan:</span>
                <span className="text-blue-900 ml-2">
                  {new Date(selectedDetail.tanggalPengajuan).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Semester:</span>
                <span className="text-blue-900 ml-2">{getSemesterFromDate(selectedDetail.tanggalPengajuan)}</span>
              </div>
            </div>
          </div>

          {/* Informasi Pembayaran */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Informasi Pembayaran</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-700">Nominal Pembayaran:</span>
                <span className="font-bold text-green-900 text-lg">{formatCurrency(selectedDetail.nominal || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700">Total SKS:</span>
                <span className="font-medium text-green-900">
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
              <div className="flex justify-between items-center">
                <span className="text-green-700">Estimasi Biaya (300k/SKS):</span>
                <span className="font-medium text-green-900">{formatCurrency(calculateEstimatedCost())}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-green-300">
                <span className="text-green-700 font-medium">Selisih:</span>
                <span className={`font-bold text-lg ${
                  calculateDifference() >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(calculateDifference())}
                </span>
              </div>
            </div>
          </div>

          {/* Mata Kuliah yang Dipilih */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-800">
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
            
            {/* Tampilkan daftar mata kuliah jika ada mataKuliahList */}
            {selectedDetail.mataKuliahList && selectedDetail.mataKuliahList.length > 0 ? (
              <div className="bg-white border border-purple-200 rounded px-3 py-2 space-y-2">
                {selectedDetail.mataKuliahList.map((mk, index) => (
                  <div key={mk.id || index} className="flex justify-between items-center p-2 bg-purple-50 rounded border border-purple-200">
                    <span className="font-medium text-purple-900">{index + 1}. {mk.nama}</span>
                    <span className="text-purple-700 text-sm">{mk.sks} SKS</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                <span className="font-medium text-gray-900">
                  {typeof selectedDetail.mataKuliah === 'object' 
                    ? selectedDetail.mataKuliah.nama 
                    : selectedDetail.mataKuliah || 'Mata kuliah tidak tersedia'}
                </span>
              </div>
            )}
          </div>

          {/* Keterangan Pengajuan */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Keterangan Pengajuan</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded p-3 min-h-[60px]">
              <p className="text-gray-700 text-sm leading-relaxed">
                {selectedDetail.keterangan || 'Tidak ada keterangan'}
              </p>
            </div>
          </div>

          {/* Bukti Pembayaran */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">Bukti Pembayaran</h3>
            </div>
            <div className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded">
              <div>
                <p className="font-medium text-orange-900">File: {selectedDetail.buktiPembayaran}</p>
                <p className="text-orange-700 text-sm">Periksa bukti pembayaran untuk memverifikasi nominal dan keabsahan transaksi</p>
              </div>
              <button
                onClick={() => window.open(`http://localhost:5000/uploads/${selectedDetail.buktiPembayaran}`, '_blank')}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium"
              >
                <Eye className="w-4 h-4" />
                Lihat Bukti
              </button>
            </div>
          </div>

          {/* Aksi Verifikasi */}
          {selectedDetail.status === 'PROSES_PENGAJUAN' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-3">Aksi Verifikasi</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleVerifikasi}
                  className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 font-medium flex items-center justify-center gap-2"
                >
                  Verifikasi Pembayaran
                </button>
                <button
                  onClick={handleTolak}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Tolak Pengajuan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 font-medium"
          >
            Tutup Detail
          </button>
        </div>
      </div>

      {showTolakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Alasan Penolakan</h2>
              <button
                onClick={() => setShowTolakModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Alasan Penolakan</h3>
                </div>
                <div className="bg-white border border-gray-200 rounded p-3 min-h-[60px]">
                  <textarea
                    value={alasanPenolakan}
                    onChange={(e) => setAlasanPenolakan(e.target.value)}
                    className="w-full h-20 p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleTolakConfirm}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 font-medium"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalDetailAdmin;
