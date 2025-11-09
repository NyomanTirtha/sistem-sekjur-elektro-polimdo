import React from 'react';
import { XCircle, AlertCircle, Eye, FileText, User, CreditCard, GraduationCap, Calendar, Phone, MapPin, BookOpen } from 'lucide-react';
import { formatCurrency } from '../../../utils/helper/pengajuanSAUtils';
import { getProgramStudiName } from '../../../utils/helper/programStudiUtils';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from './StatusBadge';
import { getTheme } from '../../../utils/theme';

const ModalFormDetail = ({ 
  showModal, 
  setShowModal, 
  selectedFormDetail,
  userType = 'kaprodi',
  currentUser = {}
}) => {
  if (!showModal || !selectedFormDetail) return null;

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

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
      >
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ zIndex: 10000 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 ${theme.primary.bg} text-white border-b ${theme.primary.border}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white mb-0.5">Detail Pengajuan SA</h2>
              <p className="text-xs text-white/80">Informasi lengkap pengajuan Studi Atas</p>
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
            {userType !== 'mahasiswa' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className={`px-4 py-2.5 ${getLightBg()} border-b ${getLightBorder()}`}>
                  <h3 className={`text-sm font-semibold ${getTextColor()}`}>Informasi Mahasiswa</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Nama</p>
                      <p className="text-sm font-medium text-gray-900">{selectedFormDetail.mahasiswa?.nama || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">NIM</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFormDetail.mahasiswa?.nim || 
                         selectedFormDetail.mahasiswaId || 
                         selectedFormDetail.nim || 
                         selectedFormDetail.mahasiswa?.id ||
                         'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Program Studi</p>
                      <p className="text-sm font-medium text-gray-900">{getProgramStudiName(selectedFormDetail.mahasiswa?.programStudiId) || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Angkatan</p>
                      <p className="text-sm font-medium text-gray-900">{selectedFormDetail.mahasiswa?.angkatan || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Semester</p>
                      <p className="text-sm font-medium text-gray-900">{selectedFormDetail.mahasiswa?.semester || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">No. Telepon</p>
                      <p className="text-sm font-medium text-gray-900">{selectedFormDetail.mahasiswa?.noTelp || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-500 mb-0.5">Alamat</p>
                      <p className="text-sm font-medium text-gray-900">{selectedFormDetail.mahasiswa?.alamat || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Tanggal Pengajuan</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFormDetail.tanggalPengajuan 
                          ? new Date(selectedFormDetail.tanggalPengajuan).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Pengajuan SA */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className={`px-4 py-2.5 ${getLightBg()} border-b ${getLightBorder()}`}>
                <h3 className={`text-sm font-semibold ${getTextColor()}`}>Detail Pengajuan SA</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Mata Kuliah */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Mata Kuliah</p>
                  {selectedFormDetail.mataKuliahList && selectedFormDetail.mataKuliahList.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedFormDetail.mataKuliahList.map((mk, index) => (
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
                      {typeof selectedFormDetail.mataKuliah === 'object' 
                        ? selectedFormDetail.mataKuliah.nama 
                        : selectedFormDetail.mataKuliah || 'Belum diisi'}
                    </p>
                  )}
                </div>

                {/* Nominal Pembayaran */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Nominal Pembayaran</p>
                  <div className={`p-2.5 ${getLightBg()} rounded border ${getLightBorder()}`}>
                    <span className={`text-base font-semibold ${getTextColor()}`}>
                      {selectedFormDetail.nominal ? formatCurrency(selectedFormDetail.nominal) : 'Belum diisi'}
                    </span>
                  </div>
                </div>

                {/* Keterangan */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Keterangan Pengajuan</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedFormDetail.keterangan || 'Tidak ada keterangan'}
                  </p>
                </div>

                {/* Status dan Dosen (untuk kaprodi) */}
                {userType === 'kaprodi' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Status</p>
                      <StatusBadge status={selectedFormDetail.status} />
                    </div>
                    {selectedFormDetail.dosen && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Dosen Pengampu</p>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedFormDetail.dosen.nama}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{selectedFormDetail.dosen.nip}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bukti Pembayaran */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Bukti Pembayaran</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{selectedFormDetail.buktiPembayaran || 'Tidak ada bukti'}</p>
                    </div>
                    {selectedFormDetail.buktiPembayaran && (
                      <button
                        onClick={() => window.open(`http://localhost:5000/uploads/${selectedFormDetail.buktiPembayaran}`, '_blank')}
                        className={`${theme.primary.bg} text-white px-3 py-1.5 rounded text-xs font-medium ${theme.primary.hover} flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-sm`}
                        title="Lihat bukti pembayaran"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lihat
                      </button>
                    )}
                  </div>
                </div>

                {/* Keterangan Penolakan */}
                {userType === 'mahasiswa' && selectedFormDetail.status === 'DITOLAK' && selectedFormDetail.keteranganReject && (
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-800 mb-0.5">Pengajuan Ditolak</p>
                        <p className="text-xs text-red-700">
                          <span className="font-medium">Alasan:</span> {selectedFormDetail.keteranganReject}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Langkah Selanjutnya */}
            {userType !== 'mahasiswa' && (
              <div className={`${getLightBg()} border ${getLightBorder()} rounded-lg p-3`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={`w-4 h-4 ${getTextColor()} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-xs font-semibold ${getTextColor()} mb-0.5`}>Langkah Selanjutnya</p>
                    <p className={`text-xs ${getTextColor()}`}>
                      Setelah melihat detail form, Anda dapat memverifikasi pengajuan ini dan menugaskan dosen yang sesuai dengan mata kuliah dan topik yang diajukan mahasiswa.
                    </p>
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
  );
};

export default ModalFormDetail;
