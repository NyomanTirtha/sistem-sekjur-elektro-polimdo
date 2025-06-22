import React from 'react';
import { XCircle, AlertCircle, Eye, FileText, User, CreditCard, GraduationCap } from 'lucide-react';
import { formatCurrency } from '../../utils/pengajuanSAUtils';
import { getProgramStudiName } from '../../utils/programStudiUtils';

const ModalFormDetail = ({ 
  showModal, 
  setShowModal, 
  selectedFormDetail,
  userType = 'kaprodi'
}) => {
  if (!showModal || !selectedFormDetail) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Detail Form Pengajuan SA</h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="w-5 h-5" />
          </button>
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
                        {selectedFormDetail.status === 'DITOLAK' && 'Ditolak'}
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
    </div>
  );
};

export default ModalFormDetail;