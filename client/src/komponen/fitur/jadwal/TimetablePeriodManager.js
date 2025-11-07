import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  X,
  Clock,
  Users,
  FileText,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import axios from "axios";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const TimetablePeriodManager = ({ authToken }) => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periodSchedules, setPeriodSchedules] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [formData, setFormData] = useState({
    semester: "",
    tahunAkademik: "",
  });

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/timetable/periods",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        setPeriods(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
      alert("Gagal mengambil data periode timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPeriod = async (period) => {
    setSelectedPeriod(period);
    setShowDetailModal(true);
    setLoadingDetail(true);

    try {
      // Fetch schedules for this period
      const response = await axios.get(
        `http://localhost:5000/api/sekjur-schedules/all-prodi?periodId=${period.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        setPeriodSchedules(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching period schedules:", error);
      alert("Gagal mengambil jadwal periode");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/timetable/periods",
        formData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Periode timetable berhasil dibuat");
        setShowCreateModal(false);
        setFormData({ semester: "", tahunAkademik: "" });
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error creating period:", error);
      alert(error.response?.data?.message || "Gagal membuat periode timetable");
    }
  };

  const handleUpdateStatus = async (periodId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/timetable/periods/${periodId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      if (response.data.success) {
        alert("Status periode berhasil diupdate");
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error updating period status:", error);
      alert(error.response?.data?.message || "Gagal mengupdate status periode");
    }
  };

  const handleDeletePeriod = async (periodId) => {
    const period = periods.find((p) => p.id === periodId);
    const hasSchedules = period?.stats?.totalProdi > 0;

    const confirmMessage = hasSchedules
      ? "⚠️ PERHATIAN!\n\nPeriode ini memiliki jadwal yang sudah dibuat.\nMenghapus periode akan menghapus SEMUA jadwal yang terkait!\n\nApakah Anda yakin ingin melanjutkan?"
      : "Apakah Anda yakin ingin menghapus periode ini?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/timetable/periods/${periodId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Periode berhasil dihapus");
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error deleting period:", error);
      alert(error.response?.data?.message || "Gagal menghapus periode");
    }
  };

  const handlePublishPeriod = async (periodId) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin mempublish semua jadwal yang sudah diapprove?",
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/timetable/periods/${periodId}/publish`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Jadwal berhasil dipublish");
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error publishing schedules:", error);
      alert(error.response?.data?.message || "Gagal mempublish jadwal");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "text-gray-600 bg-gray-100";
      case "ACTIVE":
        return "text-green-600 bg-green-100";
      case "CLOSED":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "ACTIVE":
        return "Aktif";
      case "CLOSED":
        return "Ditutup";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data periode timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kelola Periode Timetable
          </h1>
          <p className="text-gray-600">
            Buat dan kelola periode untuk jadwal kuliah
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Buat Periode Baru
        </button>
      </div>

      {/* Periods List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {periods.map((period) => (
          <div
            key={period.id}
            className="bg-white rounded-lg shadow-md border border-gray-200"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {period.semester} {period.tahunAkademik}
                  </h3>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}
                  >
                    {getStatusLabel(period.status)}
                  </span>
                </div>
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>

              {/* Statistics */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Prodi:</span>
                  <span className="font-medium">
                    {period.stats?.totalProdi || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jadwal Selesai:</span>
                  <span className="font-medium">
                    {period.stats?.completedSchedules || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Menunggu Review:</span>
                  <span className="font-medium">
                    {period.stats?.pendingSchedules || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Draft:</span>
                  <span className="font-medium">
                    {period.stats?.draftSchedules || 0}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewPeriod(period)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Lihat
                  </button>

                  {period.status === "DRAFT" && (
                    <button
                      onClick={() => handleUpdateStatus(period.id, "ACTIVE")}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aktifkan
                    </button>
                  )}

                  {period.status === "ACTIVE" &&
                    period.stats?.completedSchedules > 0 && (
                      <button
                        onClick={() => handlePublishPeriod(period.id)}
                        className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        Publish
                      </button>
                    )}

                  {period.status === "ACTIVE" && (
                    <button
                      onClick={() => handleUpdateStatus(period.id, "CLOSED")}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Tutup
                    </button>
                  )}
                </div>

                {/* Delete button - show for DRAFT or CLOSED periods */}
                {(period.status === "DRAFT" || period.status === "CLOSED") && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeletePeriod(period.id)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-red-300 bg-red-50 rounded-md text-sm text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus Periode
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {periods.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada periode timetable
          </h3>
          <p className="text-gray-600 mb-4">
            Buat periode timetable pertama untuk memulai penjadwalan
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Buat Periode Baru
          </button>
        </div>
      )}

      {/* Create Period Modal */}
      {showCreateModal &&
        ReactDOM.createPortal(
          <AnimatePresence>
            <motion.div
              key="create-modal-backdrop"
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowCreateModal(false);
                  setFormData({ semester: "", tahunAkademik: "" });
                }
              }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
                style={{ zIndex: 10000 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleCreatePeriod}>
                  {/* Header */}
                  <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Buat Periode Timetable Baru
                          </h3>
                          <p className="text-sm text-blue-100">
                            Tambahkan periode baru untuk jadwal kuliah
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setFormData({ semester: "", tahunAkademik: "" });
                        }}
                        className="p-2 hover:bg-blue-800 rounded-lg transition-colors text-white"
                        aria-label="Close modal"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 bg-gray-50 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester *
                      </label>
                      <div className="relative">
                        <select
                          value={formData.semester}
                          onChange={(e) =>
                            setFormData({ ...formData, semester: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                          required
                        >
                          <option value="">Pilih Semester</option>
                          <option value="GANJIL">Ganjil</option>
                          <option value="GENAP">Genap</option>
                          <option value="ANTARA">Antara</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tahun Akademik *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.tahunAkademik}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tahunAkademik: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="Contoh: 2024/2025"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <BookOpen className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Format: Tahun/Tahun (contoh: 2024/2025)
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({ semester: "", tahunAkademik: "" });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Simpan
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}

      {/* Period Detail Modal */}
      {showDetailModal &&
        selectedPeriod &&
        ReactDOM.createPortal(
          <AnimatePresence>
            <motion.div
              key="detail-modal-backdrop"
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowDetailModal(false);
                  setSelectedPeriod(null);
                  setPeriodSchedules([]);
                }
              }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
                style={{ zIndex: 10000 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                          Detail Periode Timetable
                        </h3>
                        <p className="text-lg text-blue-100 font-medium">
                          {selectedPeriod.semester} {selectedPeriod.tahunAkademik}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(selectedPeriod.status)}`}
                        >
                          {getStatusLabel(selectedPeriod.status)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedPeriod(null);
                        setPeriodSchedules([]);
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
                  <div className="p-6 space-y-6">
                    {/* Statistics Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-blue-600 font-medium mb-1">
                              Total Prodi
                            </p>
                            <p className="text-3xl font-bold text-blue-900">
                              {selectedPeriod.stats?.totalProdi || 0}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-green-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-green-600 font-medium mb-1">
                              Selesai
                            </p>
                            <p className="text-3xl font-bold text-green-900">
                              {selectedPeriod.stats?.completedSchedules || 0}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-yellow-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-yellow-600 font-medium mb-1">
                              Pending
                            </p>
                            <p className="text-3xl font-bold text-yellow-900">
                              {selectedPeriod.stats?.pendingSchedules || 0}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 font-medium mb-1">
                              Draft
                            </p>
                            <p className="text-3xl font-bold text-gray-900">
                              {selectedPeriod.stats?.draftSchedules || 0}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedules List */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-gray-600" />
                          <h4 className="text-lg font-semibold text-gray-900">
                            Jadwal Program Studi
                          </h4>
                        </div>
                      </div>
                      <div className="p-6">
                        {loadingDetail ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                              <p className="text-sm text-gray-600">
                                Memuat jadwal...
                              </p>
                            </div>
                          </div>
                        ) : periodSchedules.length > 0 ? (
                          <div className="space-y-3">
                            {periodSchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all bg-white"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <GraduationCap className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900 text-lg">
                                          {schedule.prodi?.nama || "N/A"}
                                        </h5>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-600 pl-12">
                                      <span className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        <span className="font-medium">
                                          {schedule._count?.scheduleItems || 0}
                                        </span>{" "}
                                        Item Jadwal
                                      </span>
                                      {schedule.submittedAt && (
                                        <span className="flex items-center gap-2">
                                          <Clock className="w-4 h-4" />
                                          Diajukan:{" "}
                                          {new Date(
                                            schedule.submittedAt
                                          ).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <span
                                      className={`inline-block px-4 py-2 rounded-lg text-xs font-semibold ${getScheduleStatusColor(schedule.status)}`}
                                    >
                                      {getScheduleStatusLabel(schedule.status)}
                                    </span>
                                  </div>
                                </div>
                                {schedule.sekjurNotes && (
                                  <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                                    <p className="text-xs font-semibold text-yellow-800 mb-1 flex items-center gap-2">
                                      <FileText className="w-3 h-3" />
                                      Catatan Sekjur:
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                      {schedule.sekjurNotes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                            <h5 className="text-lg font-medium text-gray-900 mb-2">
                              Belum ada jadwal
                            </h5>
                            <p className="text-sm text-gray-500">
                              Belum ada jadwal untuk periode ini
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedPeriod(null);
                      setPeriodSchedules([]);
                    }}
                    className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium inline-flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Tutup
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

const getScheduleStatusColor = (status) => {
  switch (status) {
    case "DRAFT":
      return "text-gray-600 bg-gray-100";
    case "SUBMITTED":
      return "text-blue-600 bg-blue-100";
    case "UNDER_REVIEW":
      return "text-yellow-600 bg-yellow-100";
    case "APPROVED":
      return "text-green-600 bg-green-100";
    case "PUBLISHED":
      return "text-purple-600 bg-purple-100";
    case "REJECTED":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

const getScheduleStatusLabel = (status) => {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Diajukan";
    case "UNDER_REVIEW":
      return "Direview";
    case "APPROVED":
      return "Disetujui";
    case "PUBLISHED":
      return "Published";
    case "REJECTED":
      return "Ditolak";
    default:
      return status;
  }
};

export default TimetablePeriodManager;
