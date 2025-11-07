import React, { useState, useEffect } from "react";
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
    alasanRequest: "",
  });

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
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
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
      if (response.data.success) {
        setAvailableRooms(response.data.data.filter((room) => room.isActive));
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
        alert("Request berhasil disubmit ke kaprodi");
        setShowCreateModal(false);
        setFormData({
          mataKuliahId: "",
          preferredHari: "",
          preferredJamMulai: "",
          preferredJamSelesai: "",
          preferredRuanganId: "",
          alasanRequest: "",
        });
        fetchMyRequests();
        fetchAvailableCourses();
      }
    } catch (error) {
      console.error("Error creating request:", error);
      alert(error.response?.data?.message || "Gagal membuat request");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus request ini?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/dosen-requests/${requestId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Request berhasil dihapus");
        fetchMyRequests();
        fetchAvailableCourses();
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(error.response?.data?.message || "Gagal menghapus request");
    }
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data request...</p>
        </div>
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

      {/* Available Courses Info */}
      {availableCourses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Mata Kuliah yang Tersedia untuk Request
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableCourses.slice(0, 6).map((course) => (
              <div key={course.id} className="text-sm text-blue-700">
                • {course.nama} ({course.sks} SKS)
              </div>
            ))}
            {availableCourses.length > 6 && (
              <div className="text-sm text-blue-700">
                ... dan {availableCourses.length - 6} lainnya
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Requests List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Daftar Request Saya
        </h2>

        {myRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum ada request
            </h3>
            <p className="text-gray-600 mb-4">
              {availableCourses.length === 0
                ? "Tidak ada mata kuliah yang tersedia untuk di-request saat ini"
                : "Buat request pertama Anda untuk mengajar mata kuliah tertentu"}
            </p>
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
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.mataKuliah.nama}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.mataKuliah.sks} SKS
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                    >
                      {getStatusIcon(request.status)}
                      <span className="ml-1">
                        {getStatusLabel(request.status)}
                      </span>
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {request.preferredHari}, {request.preferredJamMulai} -{" "}
                      {request.preferredJamSelesai}
                    </div>
                    {request.preferredRuangan && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {request.preferredRuangan.nama}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Alasan Request:
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.alasanRequest}
                    </p>
                  </div>

                  {request.kaprodiNotes && (
                    <div
                      className={`mb-4 p-3 rounded-md ${
                        request.status === "APPROVED"
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          request.status === "APPROVED"
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        <strong>Catatan Kaprodi:</strong> {request.kaprodiNotes}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Disubmit:{" "}
                      {new Date(request.submittedAt).toLocaleDateString(
                        "id-ID",
                      )}
                    </span>
                    {request.status === "PENDING" && (
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <form onSubmit={handleCreateRequest}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Buat Request Jadwal Baru
                </h3>
                <p className="text-sm text-gray-600">
                  Ajukan mata kuliah yang ingin Anda ajarkan
                </p>
              </div>

              <div className="px-6 py-4 space-y-4">
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

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DosenScheduleRequestManager;
