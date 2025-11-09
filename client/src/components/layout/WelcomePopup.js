import React, { useState, useEffect } from "react";
import {
  X,
  Info,
  Shield,
  Crown,
  GraduationCap,
  User,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WelcomePopup = ({ userType, currentUser, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Cek apakah user sudah melihat popup untuk role ini
    const storageKey = `welcome_popup_${userType}_${currentUser?.username || currentUser?.id}`;
    const hasSeenPopup = localStorage.getItem(storageKey);

    if (!hasSeenPopup) {
      setIsVisible(true);
    }
  }, [userType, currentUser]);

  const handleClose = () => {
    const storageKey = `welcome_popup_${userType}_${currentUser?.username || currentUser?.id}`;
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    if (onClose) onClose();
  };

  const getContent = () => {
    const userName = currentUser?.nama || currentUser?.name || "Pengguna";
    const roleLabels = {
      mahasiswa: "Mahasiswa",
      sekjur: "Sekretaris Jurusan",
      kaprodi: "Ketua Program Studi",
      dosen: "Dosen",
    };
    const roleLabel = roleLabels[userType] || "Pengguna";

    switch (userType) {
      case "mahasiswa":
        return {
          icon: User,
          iconColor: "text-green-600",
          title: `Selamat Datang, ${userName}!`,
          subtitle: roleLabel,
          content: (
            <div className="space-y-3 text-sm text-gray-700">
              <div className="font-semibold text-base text-gray-800 mb-2">
                Alur Pengajuan SA:
              </div>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>
                  <strong>Upload bukti pembayaran & pilih mata kuliah</strong>
                  <br />
                  <span className="text-gray-500 italic">
                    → Status: "Menunggu Verifikasi Sekretaris Jurusan"
                  </span>
                </li>
                <li>
                  <strong>Sekretaris Jurusan verifikasi pembayaran</strong>
                  <br />
                  <span className="text-gray-500 italic">
                    → Status: "Menunggu Verifikasi Kaprodi"
                  </span>
                </li>
                <li>
                  <strong>
                    Kaprodi verifikasi dan tentukan dosen pembimbing
                  </strong>
                  <br />
                  <span className="text-gray-500 italic">
                    → Status: "Dalam Proses SA"
                  </span>
                </li>
                <li>
                  <strong>Dosen memberikan bimbingan dan nilai akhir</strong>
                  <br />
                  <span className="text-gray-500 italic">
                    → Status: "Selesai"
                  </span>
                </li>
              </ol>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>💡 Tips:</strong> Pastikan nominal pembayaran sesuai
                  dengan total SKS mata kuliah yang dipilih (1 SKS = Rp
                  300.000).
                </p>
              </div>
            </div>
          ),
        };

      case "sekjur":
        return {
          icon: Shield,
          iconColor: "text-red-600",
          title: `Selamat Datang, ${userName}!`,
          subtitle: roleLabel,
          content: (
            <div className="space-y-3 text-sm text-gray-700">
              <div className="font-semibold text-base text-gray-800 mb-2">
                Tugas Anda:
              </div>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>
                  Verifikasi bukti pembayaran mahasiswa yang mengajukan SA
                </li>
                <li>Periksa nominal, tanggal, dan validitas pembayaran</li>
                <li>
                  Setujui atau tolak pengajuan dengan memberikan alasan yang
                  jelas
                </li>
                <li>
                  Mengelola akun pengguna (Sekjur, Kaprodi, Dosen, Mahasiswa)
                </li>
                <li>
                  Mengelola data akademik (Jurusan, Program Studi, Mata Kuliah,
                  Dosen, Mahasiswa)
                </li>
                <li>Review dan approve jadwal yang diajukan oleh Kaprodi</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>💡 Tips:</strong> Gunakan tombol "Verifikasi" untuk
                  menyetujui atau "Tolak" untuk menolak dengan alasan yang
                  jelas.
                </p>
              </div>
            </div>
          ),
        };

      case "kaprodi":
        return {
          icon: Crown,
          iconColor: "text-purple-600",
          title: `Selamat Datang, ${userName}!`,
          subtitle: roleLabel,
          content: (
            <div className="space-y-3 text-sm text-gray-700">
              <div className="font-semibold text-base text-gray-800 mb-2">
                Tugas Anda:
              </div>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>
                  Verifikasi pengajuan SA setelah Sekretaris Jurusan menyetujui
                  pembayaran
                </li>
                <li>
                  Menugaskan dosen pembimbing yang sesuai dengan mata kuliah
                  yang dipilih mahasiswa
                </li>
                <li>Mengelola jadwal mengajar untuk program studi Anda</li>
                <li>
                  Review dan submit jadwal untuk disetujui oleh Sekretaris
                  Jurusan
                </li>
              </ul>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>💡 Tips:</strong> Gunakan tombol "Detail" untuk
                  melihat informasi lengkap sebelum assign dosen. Pastikan dosen
                  yang ditugaskan sesuai dengan kompetensi mata kuliah.
                </p>
              </div>
            </div>
          ),
        };

      case "dosen":
        return {
          icon: GraduationCap,
          iconColor: "text-blue-600",
          title: `Selamat Datang, ${userName}!`,
          subtitle: roleLabel,
          content: (
            <div className="space-y-3 text-sm text-gray-700">
              <div className="font-semibold text-base text-gray-800 mb-2">
                Tugas Anda:
              </div>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>
                  Memberikan bimbingan SA kepada mahasiswa yang ditugaskan
                  kepada Anda
                </li>
                <li>
                  Input nilai akhir setelah mahasiswa menyelesaikan tugas SA
                </li>
                <li>
                  Mengajukan request jadwal mengajar untuk mata kuliah yang
                  ingin Anda ajarkan
                </li>
                <li>Melihat jadwal mengajar yang telah disetujui</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>💡 Tips:</strong> Anda hanya melihat pengajuan SA yang
                  ditugaskan kepada Anda oleh Kaprodi. Pastikan memberikan
                  bimbingan yang berkualitas dan nilai yang objektif.
                </p>
              </div>
            </div>
          ),
        };

      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  const Icon = content.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            {/* Popup */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div
                className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-lg`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`bg-white bg-opacity-20 p-3 rounded-lg`}>
                      <Icon
                        className={`w-6 h-6 ${content.iconColor.replace("text-", "text-white")}`}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{content.title}</h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {content.subtitle} • Panduan penggunaan sistem
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">{content.content}</div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-center">
                <button
                  onClick={handleClose}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WelcomePopup;
