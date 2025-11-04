import React from 'react';
import { XCircle, AlertCircle, Eye, FileText, User, CreditCard, GraduationCap } from 'lucide-react';
import { formatCurrency } from '../../utils/pengajuanSAUtils';
import { getProgramStudiName } from '../../utils/programStudiUtils';
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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg sm:max-w-xl max-h-[90vh] flex flex-col overflow-y-auto relative"
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.25 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-3 right-3 p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 shadow transition-colors z-10"
            aria-label="Tutup"
          >
            <XCircle className="w-7 h-7" />
          </button>
          <div className="px-4 sm:px-8 pt-8 pb-6 sm:pb-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detail Form Pengajuan SA</h3>
            </div>

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

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ModalFormDetail;