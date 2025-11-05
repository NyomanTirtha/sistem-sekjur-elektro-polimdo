import React from 'react';
import { XCircle, AlertCircle, Eye, FileText, User, CreditCard, GraduationCap } from 'lucide-react';
import { formatCurrency } from '../../../utilitas/helper/pengajuanSAUtils';
import { getProgramStudiName } from '../../../utilitas/helper/programStudiUtils';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
      >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ zIndex: 10000 }}
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          duration: 0.3
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header dengan gradient */}
        <div className="relative p-8 text-white bg-gradient-to-br from-cyan-600 via-cyan-700 to-blue-800">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full shadow-lg"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Detail Pengajuan SA</h2>
                <p className="text-sm text-cyan-100">Informasi lengkap pengajuan Studi Atas</p>
              </div>
            </div>
            <motion.button
              onClick={() => setShowModal(false)}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/80 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close modal"
            >
              <XCircle className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-8 py-6 sm:py-8">

            <div className="space-y-4">
              {/* Only show student info section if not logged in as student */}
              {userType !== 'mahasiswa' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Informasi Mahasiswa</h4>
                  <div className="text-sm text-blue-700">
                    <p><strong>Nama:</strong> {selectedFormDetail.mahasiswa?.nama || 'N/A'}</p>
                    <p><strong>NIM:</strong> {
                      selectedFormDetail.mahasiswa?.nim || 
                      selectedFormDetail.mahasiswaId || 
                      selectedFormDetail.nim || 
                      selectedFormDetail.mahasiswa?.id ||
                      'N/A'
                    }</p>
                    <p><strong>Program Studi:</strong> {getProgramStudiName(selectedFormDetail.mahasiswa?.programStudiId)}</p>
                    <p><strong>Angkatan:</strong> {selectedFormDetail.mahasiswa?.angkatan || 'N/A'}</p>
                    <p><strong>Semester:</strong> {selectedFormDetail.mahasiswa?.semester || 'N/A'}</p>
                    <p><strong>No. Telepon:</strong> {selectedFormDetail.mahasiswa?.noTelp || 'N/A'}</p>
                    <p><strong>Alamat:</strong> {selectedFormDetail.mahasiswa?.alamat || 'N/A'}</p>
                    <p><strong>Tanggal Pengajuan:</strong> {new Date(selectedFormDetail.tanggalPengajuan).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Detail Pengajuan SA</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Mata Kuliah SA
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                      <span className="font-medium text-gray-900">
                        {typeof selectedFormDetail.mataKuliah === 'object' 
                          ? selectedFormDetail.mataKuliah.nama 
                          : selectedFormDetail.mataKuliah || 'Belum diisi'}
                      </span>
                    </div>
                  </div>

                  {/* Tampilkan daftar mata kuliah jika ada mataKuliahList */}
                  {selectedFormDetail.mataKuliahList && selectedFormDetail.mataKuliahList.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Daftar Mata Kuliah ({selectedFormDetail.mataKuliahList.length} mata kuliah)
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 space-y-2">
                        {selectedFormDetail.mataKuliahList.map((mk, index) => (
                          <div key={mk.id || index} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                            <span className="font-medium text-gray-900">{index + 1}. {mk.nama}</span>
                            <span className="text-gray-600 text-sm">{mk.sks} SKS</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nominal Pembayaran
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                      <span className="font-medium text-gray-900">
                        {selectedFormDetail.nominal ? formatCurrency(selectedFormDetail.nominal) : 'Belum diisi'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Keterangan Pengajuan
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 min-h-[80px]">
                      <p className="text-gray-900 text-sm leading-relaxed">
                        {selectedFormDetail.keterangan || 'Belum ada keterangan'}
                      </p>
                    </div>
                  </div>

                  {/* Informasi Status dan Dosen (untuk kaprodi) */}
                  {userType === 'kaprodi' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Status Pengajuan
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            selectedFormDetail.status === 'MENUNGGU_VERIFIKASI_KAPRODI' 
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : selectedFormDetail.status === 'DALAM_PROSES_SA'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : selectedFormDetail.status === 'SELESAI'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {selectedFormDetail.status === 'MENUNGGU_VERIFIKASI_KAPRODI' && 'Menunggu Verifikasi Kaprodi'}
                            {selectedFormDetail.status === 'DALAM_PROSES_SA' && 'Dalam Proses SA'}
                            {selectedFormDetail.status === 'SELESAI' && 'Selesai'}
                            {selectedFormDetail.status === 'DITOLAK' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white border border-red-700 shadow-lg ring-2 ring-red-500 gap-1">
                                <XCircle className="w-4 h-4 text-white" />
                                Ditolak
                              </span>
                            )}
                            {selectedFormDetail.status === 'PROSES_PENGAJUAN' && 'Proses Pengajuan'}
                          </span>
                        </div>
                      </div>

                      {selectedFormDetail.dosen && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Dosen yang Ditugaskan
                          </label>
                          <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium text-gray-900">{selectedFormDetail.dosen.nama}</span>
                              <span className="text-gray-500 text-sm">({selectedFormDetail.dosen.nip})</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Bukti Pembayaran */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Bukti Pembayaran
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">{selectedFormDetail.buktiPembayaran || 'Tidak ada bukti'}</span>
                        </div>
                        {selectedFormDetail.buktiPembayaran && (
                          <button
                            onClick={() => window.open(`http://localhost:5000/uploads/${selectedFormDetail.buktiPembayaran}`, '_blank')}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 flex items-center gap-1"
                            title="Lihat bukti pembayaran"
                          >
                            <Eye className="w-3 h-3" />
                            Lihat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Keterangan Penolakan (khusus mahasiswa, jika status DITOLAK) */}
                  {userType === 'mahasiswa' && selectedFormDetail.status === 'DITOLAK' && selectedFormDetail.keteranganReject && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="text-sm text-red-700">
                          <strong>Pengajuan Anda ditolak</strong>
                          <p className="mt-1">Alasan penolakan: <span className="font-medium">{selectedFormDetail.keteranganReject}</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Only show next steps for non-student users */}
              {userType !== 'mahasiswa' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      <strong>Langkah Selanjutnya:</strong>
                      <p className="mt-1">Setelah melihat detail form, Anda dapat memverifikasi pengajuan ini dan menugaskan dosen yang sesuai dengan mata kuliah dan topik yang diajukan mahasiswa.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
            Tutup
          </motion.button>
        </div>
      </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ModalFormDetail;