import React from 'react';
import { XCircle, AlertCircle, Eye, FileText, User, CreditCard, GraduationCap, Calendar, Phone, MapPin, BookOpen } from 'lucide-react';
import { formatCurrency } from '../../../utilitas/helper/pengajuanSAUtils';
import { getProgramStudiName } from '../../../utilitas/helper/programStudiUtils';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from './StatusBadge';

const ModalFormDetail = ({ 
  showModal, 
  setShowModal, 
  selectedFormDetail,
  userType = 'kaprodi'
}) => {
  if (!showModal || !selectedFormDetail) return null;

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
        <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Detail Pengajuan SA</h2>
              <p className="text-sm text-blue-100">Informasi lengkap pengajuan Studi Atas</p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 hover:bg-blue-800 rounded-lg transition-colors text-white"
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
            {userType !== 'mahasiswa' && (
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
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedFormDetail.mahasiswa?.nama || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">NIM</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFormDetail.mahasiswa?.nim || 
                           selectedFormDetail.mahasiswaId || 
                           selectedFormDetail.nim || 
                           selectedFormDetail.mahasiswa?.id ||
                           'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Program Studi</p>
                        <p className="text-sm font-medium text-gray-900">{getProgramStudiName(selectedFormDetail.mahasiswa?.programStudiId) || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Angkatan</p>
                        <p className="text-sm font-medium text-gray-900">{selectedFormDetail.mahasiswa?.angkatan || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Semester</p>
                        <p className="text-sm font-medium text-gray-900">{selectedFormDetail.mahasiswa?.semester || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">No. Telepon</p>
                        <p className="text-sm font-medium text-gray-900">{selectedFormDetail.mahasiswa?.noTelp || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Alamat</p>
                        <p className="text-sm font-medium text-gray-900">{selectedFormDetail.mahasiswa?.alamat || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Tanggal Pengajuan</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFormDetail.tanggalPengajuan 
                            ? new Date(selectedFormDetail.tanggalPengajuan).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Pengajuan SA */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-5 py-3 border-b border-purple-200">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Detail Pengajuan SA</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* Mata Kuliah */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Mata Kuliah</label>
                  </div>
                  {selectedFormDetail.mataKuliahList && selectedFormDetail.mataKuliahList.length > 0 ? (
                    <div className="space-y-2">
                      {selectedFormDetail.mataKuliahList.map((mk, index) => (
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
                        {typeof selectedFormDetail.mataKuliah === 'object' 
                          ? selectedFormDetail.mataKuliah.nama 
                          : selectedFormDetail.mataKuliah || 'Belum diisi'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nominal Pembayaran */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Nominal Pembayaran</label>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-lg font-bold text-green-700">
                      {selectedFormDetail.nominal ? formatCurrency(selectedFormDetail.nominal) : 'Belum diisi'}
                    </span>
                  </div>
                </div>

                {/* Keterangan */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Keterangan Pengajuan</label>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedFormDetail.keterangan || 'Tidak ada keterangan'}
                    </p>
                  </div>
                </div>

                {/* Status dan Dosen (untuk kaprodi) */}
                {userType === 'kaprodi' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</label>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <StatusBadge status={selectedFormDetail.status} />
                      </div>
                    </div>
                    {selectedFormDetail.dosen && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Dosen Pengampu</label>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{selectedFormDetail.dosen.nama}</p>
                              <p className="text-xs text-gray-500">{selectedFormDetail.dosen.nip}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bukti Pembayaran */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Bukti Pembayaran</label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{selectedFormDetail.buktiPembayaran || 'Tidak ada bukti'}</span>
                    </div>
                    {selectedFormDetail.buktiPembayaran && (
                      <button
                        onClick={() => window.open(`http://localhost:5000/uploads/${selectedFormDetail.buktiPembayaran}`, '_blank')}
                        className="ml-3 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600 flex items-center gap-1.5 flex-shrink-0 transition-colors"
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
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800 mb-1">Pengajuan Ditolak</p>
                        <p className="text-sm text-red-700">
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
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Langkah Selanjutnya</p>
                    <p className="text-sm text-amber-800">
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
