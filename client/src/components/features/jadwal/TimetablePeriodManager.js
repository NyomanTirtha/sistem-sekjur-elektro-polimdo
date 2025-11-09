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
} from "lucide-react";
import axios from "axios";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { showSuccessAlert, showErrorAlert, showConfirm } from '../../../utils/notifikasi/alertUtils';
import Loading from "../../common/Loading";
import { TABLE, BUTTON, BADGE } from '../../../constants/colors';

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
      showErrorAlert("Gagal mengambil data periode timetable");
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
      showErrorAlert("Gagal mengambil jadwal periode");
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
        showSuccessAlert("Periode timetable berhasil dibuat");
        setShowCreateModal(false);
        setFormData({ semester: "", tahunAkademik: "" });
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error creating period:", error);
      showErrorAlert(error.response?.data?.message || "Gagal membuat periode timetable");
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
        showSuccessAlert("Status periode berhasil diupdate");
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error updating period status:", error);
      showErrorAlert(error.response?.data?.message || "Gagal mengupdate status periode");
    }
  };

  const handleDeletePeriod = async (periodId) => {
    const period = periods.find((p) => p.id === periodId);
    const hasSchedules = period?.stats?.totalProdi > 0;

    const confirmMessage = hasSchedules
      ? "⚠️ PERHATIAN!\n\nPeriode ini memiliki jadwal yang sudah dibuat.\nMenghapus periode akan menghapus SEMUA jadwal yang terkait!\n\nApakah Anda yakin ingin melanjutkan?"
      : "Apakah Anda yakin ingin menghapus periode ini?";

    showConfirm(
      confirmMessage,
      async () => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/timetable/periods/${periodId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
            showSuccessAlert("Periode berhasil dihapus");
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error deleting period:", error);
          showErrorAlert(error.response?.data?.message || "Gagal menghapus periode");
    }
      },
      null,
      hasSchedules ? "Peringatan" : "Konfirmasi Hapus",
      hasSchedules ? "danger" : "warning"
    );
  };

  const handlePublishPeriod = async (periodId) => {
    showConfirm(
        "Apakah Anda yakin ingin mempublish semua jadwal yang sudah diapprove?",
      async () => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/timetable/periods/${periodId}/publish`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
            showSuccessAlert("Jadwal berhasil dipublish");
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error publishing schedules:", error);
          showErrorAlert(error.response?.data?.message || "Gagal mempublish jadwal");
    }
      },
      null,
      "Konfirmasi Publish",
      "info"
    );
  };

  const handleUnpublishSchedule = async (scheduleId) => {
    showConfirm(
        "Apakah Anda yakin ingin meng-unpublish jadwal ini? Jadwal akan dikembalikan ke status APPROVED dan bisa diubah kembali.",
      async () => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/sekjur-schedules/${scheduleId}/unpublish`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
            showSuccessAlert("Jadwal berhasil di-unpublish!");
        // Refresh period schedules
        if (selectedPeriod) {
          handleViewPeriod(selectedPeriod);
        }
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error unpublishing schedule:", error);
          showErrorAlert(
        error.response?.data?.message || "Gagal melakukan unpublish jadwal",
      );
    }
      },
      null,
      "Konfirmasi Unpublish",
      "warning"
    );
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
        <Loading message="Memuat data periode timetable..." size="lg" />
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
          className={`${BUTTON.primary} inline-flex items-center`}
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
                    className={`${BUTTON.secondary} flex-1 inline-flex justify-center items-center text-sm`}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Lihat
                  </button>

                  {period.status === "DRAFT" && (
                    <button
                      onClick={() => handleUpdateStatus(period.id, "ACTIVE")}
                      className={`${BUTTON.success} flex-1 inline-flex justify-center items-center text-sm`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aktifkan
                    </button>
                  )}

                  {period.status === "ACTIVE" &&
                    period.stats?.completedSchedules > 0 && (
                      <button
                        onClick={() => handlePublishPeriod(period.id)}
                        className={`${BUTTON.primary} flex-1 inline-flex justify-center items-center text-sm`}
                      >
                        Publish
                      </button>
                    )}

                  {period.status === "ACTIVE" && (
                    <button
                      onClick={() => handleUpdateStatus(period.id, "CLOSED")}
                      className={`${BUTTON.danger} flex-1 inline-flex justify-center items-center text-sm`}
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
                      className={`${BUTTON.danger} flex-1 inline-flex justify-center items-center text-sm`}
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
            className={`${BUTTON.primary} inline-flex items-center`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Buat Periode Baru
          </button>
        </div>
      )}

      {/* Create Period Modal */}
      {typeof window !== 'undefined' && showCreateModal && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="create-period-modal"
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
              className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden"
              style={{ zIndex: 10000 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
            <form onSubmit={handleCreatePeriod}>
                {/* Header */}
                <div className={`p-5 ${TABLE.header} border-b border-gray-800`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">Buat Periode Timetable Baru</h2>
                      <p className="text-sm text-gray-200">Tentukan semester dan tahun akademik</p>
                    </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ semester: "", tahunAkademik: "" });
                  }}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
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
                  <select
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Pilih Semester</option>
                    <option value="GANJIL">Ganjil</option>
                    <option value="GENAP">Genap</option>
                    <option value="ANTARA">Antara</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Akademik *
                  </label>
                  <input
                    type="text"
                    value={formData.tahunAkademik}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tahunAkademik: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: 2024/2025"
                    required
                  />
                </div>
              </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ semester: "", tahunAkademik: "" });
                  }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                    className={BUTTON.primary}
                >
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
      {typeof window !== 'undefined' && showDetailModal && selectedPeriod && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="period-detail-modal"
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
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
              style={{ zIndex: 10000 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-5 ${TABLE.header} border-b border-gray-800`}>
                <div className="flex justify-between items-center">
              <div>
                    <h2 className="text-xl font-semibold text-white mb-1">
                      Detail Periode: {selectedPeriod.semester} {selectedPeriod.tahunAkademik}
                    </h2>
                    <p className="text-sm text-gray-200">
                      Status: <span className={`${BADGE.gray} ml-2`}>
                  {getStatusLabel(selectedPeriod.status)}
                </span>
                    </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPeriod(null);
                  setPeriodSchedules([]);
                }}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                    aria-label="Close modal"
              >
                    <XCircle className="w-5 h-5" />
              </button>
                </div>
            </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-6">
              {/* Statistics Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Total Prodi
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {selectedPeriod.stats?.totalProdi || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        Selesai
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {selectedPeriod.stats?.completedSchedules || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {selectedPeriod.stats?.pendingSchedules || 0}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Draft</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedPeriod.stats?.draftSchedules || 0}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Schedules List */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Jadwal Program Studi
                </h4>

                {loadingDetail ? (
                  <div className="flex items-center justify-center py-8">
                    <Loading message="Memuat jadwal..." size="sm" />
                  </div>
                ) : periodSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {periodSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900">
                              {schedule.prodi?.nama || "N/A"}
                            </h5>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center">
                                <FileText className="w-4 h-4 mr-1" />
                                {schedule._count?.scheduleItems || 0} Item
                                Jadwal
                              </span>
                              {schedule.submittedAt && (
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {new Date(
                                    schedule.submittedAt,
                                  ).toLocaleDateString("id-ID")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className={BADGE.gray}>
                              {getScheduleStatusLabel(schedule.status)}
                            </span>
                          </div>
                        </div>
                        {schedule.sekjurNotes && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs font-medium text-yellow-800 mb-1">
                              Catatan Sekjur:
                            </p>
                            <p className="text-sm text-yellow-700">
                              {schedule.sekjurNotes}
                            </p>
                          </div>
                        )}
                        {schedule.status === "PUBLISHED" && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleUnpublishSchedule(schedule.id)}
                              className={`${BUTTON.danger} inline-flex items-center gap-1 text-xs`}
                            >
                              <XCircle className="w-3 h-3" />
                              Unpublish
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p>Belum ada jadwal untuk periode ini</p>
                  </div>
                )}
              </div>
              </div>
            </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPeriod(null);
                  setPeriodSchedules([]);
                }}
                className={BUTTON.secondary}
              >
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
