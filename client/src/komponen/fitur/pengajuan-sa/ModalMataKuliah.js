import React, { useState, useEffect } from 'react';
import { XCircle, Send } from 'lucide-react';
import { MATA_KULIAH_OPTIONS } from '../../../konstanta/pengajuanSAConstants';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../../utilitas/notifikasi/alertUtils';
import ReactDOM from 'react-dom';

const ModalMataKuliah = ({ 
  showModal, 
  setShowModal, 
  authToken, 
  selectedPengajuanId, 
  onSubmitSuccess 
}) => {
  const [formData, setFormData] = useState({
    mataKuliah: '',
    keteranganMataKuliah: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi form
    if (!formData.mataKuliah || !formData.keteranganMataKuliah) {
      showWarningAlert('Harap isi semua field yang diperlukan');
      return;
    }

    showConfirm(
      `Apakah Anda yakin ingin mengajukan SA untuk mata kuliah "${formData.mataKuliah}"?\n\nSetelah disubmit, data akan dikirim ke Kaprodi untuk penentuan dosen pembimbing.`,
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/pengajuan-sa/${selectedPengajuanId}/mata-kuliah`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              mataKuliah: formData.mataKuliah,
              keteranganMataKuliah: formData.keteranganMataKuliah
            })
          });

          if (response.ok) {
            showSuccessAlert('Form pengajuan SA berhasil disubmit!\nData Anda telah dikirim ke Kaprodi untuk verifikasi dan penentuan dosen pembimbing.');
            resetForm();
            if (onSubmitSuccess) {
              onSubmitSuccess();
            }
          } else {
            const errorData = await response.json();
            showErrorAlert(errorData.error || 'Gagal submit form');
          }
        } catch (error) {
          console.error('Error submitting mata kuliah:', error);
          showErrorAlert('Terjadi kesalahan saat submit form');
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Submit Pengajuan SA',
      'warning',
      'Submit',
      'Batal'
    );
  };

  const resetForm = () => {
    setShowModal(false);
    setFormData({ mataKuliah: '', keteranganMataKuliah: '' });
  };

  if (!showModal) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Form Pengajuan Mata Kuliah SA</h3>
          <button
            onClick={resetForm}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-sm text-green-700">
                <strong>Pembayaran Anda telah diverifikasi Sekretaris Jurusan!</strong>
                <p className="mt-1">Silakan isi form berikut untuk melanjutkan pengajuan SA Anda. Data ini akan dilihat oleh Kaprodi untuk verifikasi dan penentuan dosen pembimbing yang sesuai.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Kuliah SA *
            </label>
            <select
              value={formData.mataKuliah}
              onChange={(e) => setFormData({
                ...formData, 
                mataKuliah: e.target.value
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Pilih Mata Kuliah</option>
              {MATA_KULIAH_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan Pengajuan *
            </label>
            <textarea
              value={formData.keteranganMataKuliah}
              onChange={(e) => setFormData({
                ...formData, 
                keteranganMataKuliah: e.target.value
              })}
              placeholder="Jelaskan alasan pengajuan SA, topik yang ingin dipelajari, atau keterangan lainnya..."
              rows="4"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Keterangan ini akan membantu Kaprodi memverifikasi pengajuan dan menentukan dosen yang tepat untuk membimbing Anda.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!formData.mataKuliah || !formData.keteranganMataKuliah}
            className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
              formData.mataKuliah && formData.keteranganMataKuliah
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            Submit Form
          </button>
          
          <button
            onClick={resetForm}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
          >
            Batal
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalMataKuliah;