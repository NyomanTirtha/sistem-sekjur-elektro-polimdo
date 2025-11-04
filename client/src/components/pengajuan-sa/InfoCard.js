import React from 'react';
import { AlertCircle } from 'lucide-react';

const InfoCard = ({ userType }) => {
  const getInfoContent = () => {
    switch (userType) {
      case 'mahasiswa':
        return (
          <div>
            <strong>Alur Pengajuan SA:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li><strong>Upload bukti pembayaran & pilih mata kuliah</strong> - Status: "Menunggu Verifikasi Sekretaris Jurusan"</li>
              <li><strong>Sekretaris Jurusan verifikasi pembayaran</strong> - Status berubah: "Menunggu Verifikasi Kaprodi"</li>
              <li><strong>Kaprodi verifikasi dan tentukan dosen pembimbing</strong> - Status: "Dalam Proses SA"</li>
              <li><strong>Dosen memberikan bimbingan dan nilai akhir</strong> - Status: "Selesai"</li>
            </ol>
            <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
              <strong>💡 Tips:</strong> Pastikan nominal pembayaran sesuai dengan total SKS mata kuliah yang dipilih (1 SKS = Rp 300.000).
            </div>
          </div>
        );
      case 'sekjur':
        return (
          <div>
            <strong>Tugas Sekretaris Jurusan:</strong> Verifikasi bukti pembayaran mahasiswa. Periksa nominal, tanggal, dan validitas pembayaran sebelum menyetujui atau menolak pengajuan.
            <br /><em>💡 Tip: Gunakan tombol "Verifikasi" untuk menyetujui atau "Tolak" untuk menolak dengan alasan.</em>
          </div>
        );
      case 'kaprodi':
        return (
          <div>
            <strong>Tugas Kaprodi:</strong> Setelah admin verifikasi pembayaran, Anda perlu memverifikasi pengajuan dan menugaskan dosen yang sesuai dengan mata kuliah yang dipilih mahasiswa.
            <br /><em>💡 Tip: Gunakan tombol "Detail" untuk melihat informasi lengkap sebelum assign dosen.</em>
          </div>
        );
      case 'dosen':
        return (
          <div>
            <strong>Tugas Dosen:</strong> Berikan bimbingan SA kepada mahasiswa yang ditugaskan kepada Anda dan input nilai akhir setelah mahasiswa menyelesaikan tugas.
            <br /><em>💡 Tip: Anda hanya melihat pengajuan SA yang ditugaskan kepada Anda oleh Kaprodi.</em>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
        <div className="text-sm text-blue-700">
          {getInfoContent()}
        </div>
      </div>
    </div>
  );
};

export default InfoCard;