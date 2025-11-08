import React, { useState, useEffect } from "react";
import Loading from "../../umum/Loading";
import {
  Send,
  Clock,
  MapPin,
  Book,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { showSuccessAlert, showErrorAlert, showConfirm } from '../../../utilitas/notifikasi/alertUtils';

// Helper function untuk format date dengan validasi
const formatDateSafe = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("id-ID", options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

const DosenScheduleRequestManager = ({ authToken }) => {
  const [myRequests, setMyRequests] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    mataKuliahId: "",
    preferredHari: "",
    preferredJamMulai: "",
    preferredJamSelesai: "",
    preferredRuanganId: "",
    preferredKelas: "",
    alasanRequest: "",
  });
  const [availableKelas, setAvailableKelas] = useState([]);

  const daysOrder = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMyRequests(),
        fetchAvailableCourses(),
        fetchAvailableRooms(),
        fetchAvailableKelas(),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableKelas = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/prodi-schedules/kelas-list",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.data.success) {
        setAvailableKelas(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching available kelas:", error);
      setAvailableKelas([]);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/dosen-requests/my-requests",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.data.success) {
        setMyRequests(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching my requests:", error);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/auth/mata-kuliah",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.data.success) {
        setAvailableCourses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching available courses:", error);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/ruangan", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
        setAvailableRooms(response.data.data.filter((room) => room && room.isActive));
      } else {
        setAvailableRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/dosen-requests",
        formData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        showSuccessAlert("Request berhasil disubmit ke kaprodi");
        setShowCreateModal(false);
        setFormData({
          mataKuliahId: "",
          preferredHari: "",
          preferredJamMulai: "",
          preferredJamSelesai: "",
          preferredRuanganId: "",
          preferredKelas: "",
          alasanRequest: "",
        });
        fetchMyRequests();
        fetchAvailableCourses();
      }
    } catch (error) {
      console.error("Error creating request:", error);
      showErrorAlert(error.response?.data?.message || "Gagal membuat request");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    showConfirm(
      "Apakah Anda yakin ingin menghapus request ini?",
      async () => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/dosen-requests/${requestId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
            showSuccessAlert("Request berhasil dihapus");
        fetchMyRequests();
        fetchAvailableCourses();
      }
    } catch (error) {
      console.error("Error deleting request:", error);
          showErrorAlert(error.response?.data?.message || "Gagal menghapus request");
    }
      },
      null,
      "Konfirmasi Hapus",
      "warning"
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "APPROVED":
        return "text-green-600 bg-green-100";
      case "REJECTED":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <AlertCircle className="w-4 h-4" />;
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "Menunggu";
      case "APPROVED":
        return "Disetujui";
      case "REJECTED":
        return "Ditolak";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loading message="Memuat data request..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Request Jadwal Mengajar
          </h1>
          <p className="text-gray-600">
            Ajukan request untuk mata kuliah yang ingin Anda ajarkan
          </p>
        </div>
        {availableCourses.length > 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send className="w-5 h-5 mr-2" />
            Buat Request Baru
          </button>
        )}
      </div>

      {/* My Requests List */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">
          Daftar Request Saya
        </h2>

        {myRequests.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <Send className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Belum ada request
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              {availableCourses.length === 0
                ? "Tidak ada mata kuliah yang tersedia untuk di-request saat ini"
                : "Buat request pertama Anda untuk mengajar mata kuliah tertentu"}
            </p>
            {availableCourses.length > 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Buat Request Baru
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-md border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Nama Mata Kuliah - Fixed Width */}
                  <div className="w-48 flex-shrink-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate" title={request.mataKuliah.nama}>
                        {request.mataKuliah.nama}
                      </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {request.mataKuliah.sks} SKS
                      </p>
                    </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(request.status)}`}
                    >
                      {getStatusIcon(request.status)}
                      <span className="ml-1">
                        {getStatusLabel(request.status)}
                      </span>
                    </span>
                  </div>

                  {/* Info Waktu & Ruangan */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{request.preferredHari}, {request.preferredJamMulai}-{request.preferredJamSelesai}</span>
                      </span>
                      {request.preferredRuangan && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{request.preferredRuangan.nama}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {request.status === "PENDING" && (
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* Alasan Request */}
                {request.alasanRequest && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 line-clamp-1">
                      <span className="font-medium">Alasan:</span> {request.alasanRequest}
                    </p>
                  </div>
                )}

                {/* Catatan Kaprodi */}
                {request.kaprodiNotes && (
                  <div className={`mt-2 pt-2 border-t border-gray-100`}>
                    <p className={`text-xs line-clamp-1 ${
                      request.status === "APPROVED"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}>
                      <span className="font-medium">Catatan Kaprodi:</span> {request.kaprodiNotes}
                    </p>
                  </div>
                )}

                {/* Footer - Date */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Disubmit: {formatDateSafe(request.submittedAt, { day: "numeric", month: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {typeof window !== 'undefined' && showCreateModal && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="create-request-modal"
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
                setFormData({
                  mataKuliahId: "",
                  preferredHari: "",
                  preferredJamMulai: "",
                  preferredJamSelesai: "",
                  preferredRuanganId: "",
                  preferredKelas: "",
                  alasanRequest: "",
                });
              }
            }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
              style={{ zIndex: 10000 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
            <form onSubmit={handleCreateRequest}>
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">Buat Request Jadwal Baru</h2>
                      <p className="text-sm text-blue-100">Ajukan mata kuliah yang ingin Anda ajarkan</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({
                          mataKuliahId: "",
                          preferredHari: "",
                          preferredJamMulai: "",
                          preferredJamSelesai: "",
                          preferredRuanganId: "",
                          alasanRequest: "",
                        });
                      }}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mata Kuliah *
                  </label>
                  <select
                    value={formData.mataKuliahId}
                    onChange={(e) =>
                      setFormData({ ...formData, mataKuliahId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Mata Kuliah</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.nama} ({course.sks} SKS) - Semester{" "}
                        {course.semester}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hari Preferensi *
                    </label>
                    <select
                      value={formData.preferredHari}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferredHari: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Pilih Hari</option>
                      {daysOrder.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ruangan Preferensi
                    </label>
                    <select
                      value={formData.preferredRuanganId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferredRuanganId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Ruangan (Opsional)</option>
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.nama} (Kapasitas: {room.kapasitas})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jam Mulai *
                    </label>
                    <input
                      type="time"
                      value={formData.preferredJamMulai}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferredJamMulai: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jam Selesai *
                    </label>
                    <input
                      type="time"
                      value={formData.preferredJamSelesai}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferredJamSelesai: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kelas *
                  </label>
                  <select
                    value={formData.preferredKelas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredKelas: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Kelas</option>
                    {availableKelas.map((kelas) => (
                      <option key={kelas} value={kelas}>
                        {kelas}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Pilih kelas yang tersedia di program studi Anda. Jika kelas belum ada, silakan hubungi Kaprodi untuk membuat jadwal kelas terlebih dahulu.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alasan Request *
                  </label>
                  <textarea
                    value={formData.alasanRequest}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alasanRequest: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Jelaskan mengapa Anda ingin mengajar mata kuliah ini..."
                    required
                  />
                </div>
                </div>
              </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      mataKuliahId: "",
                      preferredHari: "",
                      preferredJamMulai: "",
                      preferredJamSelesai: "",
                      preferredRuanganId: "",
                      alasanRequest: "",
                    });
                  }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default DosenScheduleRequestManager;
