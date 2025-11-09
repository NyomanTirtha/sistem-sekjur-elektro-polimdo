import React from 'react';
import { Info } from 'lucide-react';

const InfoCard = ({ userType }) => {
  const getInfoContent = () => {
    switch (userType) {
      case 'mahasiswa':
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Alur Pengajuan SA:</div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 leading-relaxed">
              <li>Upload bukti pembayaran & pilih mata kuliah → <span className="text-gray-500 italic">Status: "Menunggu Verifikasi Sekretaris Jurusan"</span></li>
              <li>Sekretaris Jurusan verifikasi pembayaran → <span className="text-gray-500 italic">Status: "Menunggu Verifikasi Kaprodi"</span></li>
              <li>Kaprodi verifikasi dan tentukan dosen pembimbing → <span className="text-gray-500 italic">Status: "Dalam Proses SA"</span></li>
              <li>Dosen memberikan bimbingan dan nilai akhir → <span className="text-gray-500 italic">Status: "Selesai"</span></li>
            </ol>
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
              <span className="font-medium">Tips:</span> Pastikan nominal pembayaran sesuai dengan total SKS mata kuliah yang dipilih (1 SKS = Rp 300.000).
            </div>
          </div>
        );
      case 'sekjur':
        return (
          <div className="text-xs text-gray-600 leading-relaxed">
            <span className="font-medium">Tugas:</span> Verifikasi bukti pembayaran mahasiswa. Periksa nominal, tanggal, dan validitas pembayaran sebelum menyetujui atau menolak pengajuan.
            <span className="text-gray-500 italic block mt-1">💡 Gunakan tombol "Verifikasi" untuk menyetujui atau "Tolak" untuk menolak dengan alasan.</span>
          </div>
        );
      case 'kaprodi':
        return (
          <div className="text-xs text-gray-600 leading-relaxed">
            <span className="font-medium">Tugas:</span> Setelah admin verifikasi pembayaran, Anda perlu memverifikasi pengajuan dan menugaskan dosen yang sesuai dengan mata kuliah yang dipilih mahasiswa.
            <span className="text-gray-500 italic block mt-1">💡 Gunakan tombol "Detail" untuk melihat informasi lengkap sebelum assign dosen.</span>
          </div>
        );
      case 'dosen':
        return (
          <div className="text-xs text-gray-600 leading-relaxed">
            <span className="font-medium">Tugas:</span> Berikan bimbingan SA kepada mahasiswa yang ditugaskan kepada Anda dan input nilai akhir setelah mahasiswa menyelesaikan tugas.
            <span className="text-gray-500 italic block mt-1">💡 Anda hanya melihat pengajuan SA yang ditugaskan kepada Anda oleh Kaprodi.</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {getInfoContent()}
        </div>
      </div>
    </div>
  );
};

export default InfoCard;