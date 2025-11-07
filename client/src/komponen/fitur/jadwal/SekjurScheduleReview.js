import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  FileText,
  AlertCircle,
  Calendar,
  User,
  BookOpen,
  MapPin,
  Users,
} from "lucide-react";
import axios from "axios";
import TimetableGridView from "./TimetableGridView";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../../utilitas/notifikasi/alertUtils';

const SekjurScheduleReview = ({ authToken }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("SUBMITTED");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    fetchPeriods();
    fetchSchedules();
  }, [filterStatus, selectedPeriod]);

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/timetable/periods",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (response.data.success) {
        setPeriods(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (selectedPeriod) params.append("periodId", selectedPeriod);

      const response = await axios.get(
        `http://localhost:5000/api/sekjur-schedules/all-prodi?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        setSchedules(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      showErrorAlert("Gagal mengambil data jadwal");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const handleApprove = async (scheduleId) => {
    showConfirm(
      "Apakah Anda yakin ingin menyetujui jadwal ini? Jadwal yang disetujui akan masuk ke sistem.",
      async () => {
        try {
          const response = await axios.post(
            `http://localhost:5000/api/sekjur-schedules/${scheduleId}/approve`,
            { notes: approveNotes || null },
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );

          if (response.data.success) {
            showSuccessAlert("Jadwal berhasil disetujui!");
            setApproveNotes("");
            setShowDetailModal(false);
            fetchSchedules();
          }
        } catch (error) {
          console.error("Error approving schedule:", error);
          showErrorAlert(
            error.response?.data?.message || "Gagal menyetujui jadwal"
          );
        }
      },
      null,
      "Konfirmasi Setujui",
      "info"
    );
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      showWarningAlert("Alasan penolakan harus diisi!");
      return;
    }

    if (!selectedSchedule) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/sekjur-schedules/${selectedSchedule.id}/reject`,
        { notes: rejectNotes },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        showSuccessAlert("Jadwal ditolak dan dikembalikan untuk revisi");
        setRejectNotes("");
        setShowRejectModal(false);
        setShowDetailModal(false);
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error rejecting schedule:", error);
      showErrorAlert(
        error.response?.data?.message || "Gagal menolak jadwal"
      );
    }
  };

  const handleUnpublish = async (scheduleId) => {
    showConfirm(
      "Apakah Anda yakin ingin meng-unpublish jadwal ini? Jadwal akan dikembalikan ke status APPROVED dan bisa diubah kembali.",
      async () => {
        try {
          const response = await axios.post(
            `http://localhost:5000/api/sekjur-schedules/${scheduleId}/unpublish`,
            {},
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );

          if (response.data.success) {
            showSuccessAlert("Jadwal berhasil di-unpublish!");
            setShowDetailModal(false);
            fetchSchedules();
          }
        } catch (error) {
          console.error("Error unpublishing schedule:", error);
          showErrorAlert(
            error.response?.data?.message || "Gagal melakukan unpublish jadwal"
          );
        }
      },
      null,
      "Konfirmasi Unpublish",
      "warning"
    );
  };

  const handleStartReview = async (scheduleId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/sekjur-schedules/${scheduleId}/review`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        showSuccessAlert("Status jadwal diubah menjadi 'Sedang Direview'");
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error starting review:", error);
      showErrorAlert(error.response?.data?.message || "Gagal memulai review");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PUBLISHED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "SUBMITTED":
        return "Menunggu Review";
      case "UNDER_REVIEW":
        return "Sedang Direview";
      case "APPROVED":
        return "Disetujui";
      case "REJECTED":
        return "Ditolak";
      case "PUBLISHED":
        return "Published";
      default:
        return status;
    }
  };

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

  const groupSchedulesByDay = (scheduleItems) => {
    const days = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
    const grouped = {};

    if (!scheduleItems || !Array.isArray(scheduleItems)) {
      days.forEach((day) => {
        grouped[day] = [];
      });
      return grouped;
    }

    days.forEach((day) => {
      grouped[day] = scheduleItems
        .filter((item) => item && item.hari === day)
        .sort((a, b) => {
          if (!a || !a.jamMulai) return 1;
          if (!b || !b.jamMulai) return -1;
          return a.jamMulai.localeCompare(b.jamMulai);
        });
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data jadwal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Review Jadwal Prodi</h1>
        <p className="text-sm text-gray-600">
          Review dan setujui jadwal yang diajukan oleh Kaprodi
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Periode
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Periode</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.semester} {period.tahunAkademik}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="SUBMITTED">Menunggu Review</option>
              <option value="UNDER_REVIEW">Sedang Direview</option>
              <option value="APPROVED">Disetujui</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-2">
        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Tidak ada jadwal
            </h3>
            <p className="text-xs text-gray-600">
              Belum ada jadwal yang perlu direview untuk filter yang dipilih
            </p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white rounded-md border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {schedule.prodi?.nama || "N/A"}
                    </h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getStatusColor(schedule.status)}`}
                    >
                      {getStatusLabel(schedule.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                    <span>{schedule.timetablePeriod?.semester} {schedule.timetablePeriod?.tahunAkademik}</span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {schedule._count?.scheduleItems || 0} Item
                    </span>
                    {schedule.submittedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateSafe(schedule.submittedAt, { day: "numeric", month: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {schedule.sekjurNotes && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <p className="font-medium text-yellow-800 mb-0.5">Catatan:</p>
                  <p className="text-yellow-700 line-clamp-1">{schedule.sekjurNotes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleViewDetail(schedule)}
                  className="inline-flex items-center px-2.5 py-1 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Detail
                </button>

                {schedule.status === "SUBMITTED" && (
                  <button
                    onClick={() => handleStartReview(schedule.id)}
                    className="inline-flex items-center px-2.5 py-1 bg-yellow-600 text-white rounded-md text-xs hover:bg-yellow-700"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Mulai Review
                  </button>
                )}

                {(schedule.status === "SUBMITTED" ||
                  schedule.status === "UNDER_REVIEW") && (
                    <>
                      <button
                        onClick={() => handleApprove(schedule.id)}
                        className="inline-flex items-center px-2.5 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Setujui
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowRejectModal(true);
                        }}
                        className="inline-flex items-center px-2.5 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Tolak
                      </button>
                    </>
                  )}

                {schedule.status === "PUBLISHED" && (
                  <button
                    onClick={() => handleUnpublish(schedule.id)}
                    className="inline-flex items-center px-2.5 py-1 bg-orange-600 text-white rounded-md text-xs hover:bg-orange-700"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Unpublish
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {typeof window !== 'undefined' && showDetailModal && selectedSchedule && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="detail-modal"
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetailModal(false);
                setSelectedSchedule(null);
              }
            }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
              style={{ zIndex: 10000 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-gray-600 to-gray-700 border-b border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">
                      Detail Jadwal: {selectedSchedule.prodi?.nama}
                    </h2>
                    <p className="text-sm text-gray-200">
                      {selectedSchedule.timetablePeriod?.semester}{" "}
                      {selectedSchedule.timetablePeriod?.tahunAkademik}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedSchedule(null);
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
                  {selectedSchedule.scheduleItems &&
                    selectedSchedule.scheduleItems.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Tampilan Grid Jadwal
                        </h4>
                        <TimetableGridView
                          scheduleItems={selectedSchedule.scheduleItems}
                          className="bg-white rounded-lg border border-gray-200 p-4"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p>Jadwal kosong</p>
                    </div>
                  )}

                  {/* Notes Section */}
                  {(selectedSchedule.status === "SUBMITTED" ||
                    selectedSchedule.status === "UNDER_REVIEW") && (
                      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Catatan untuk Kaprodi (Opsional)
                        </label>
                        <textarea
                          value={approveNotes}
                          onChange={(e) => setApproveNotes(e.target.value)}
                          placeholder="Tambahkan catatan jika diperlukan..."
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                      </div>
                    )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedSchedule(null);
                    setApproveNotes("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Tutup
                </button>
                {(selectedSchedule.status === "SUBMITTED" ||
                  selectedSchedule.status === "UNDER_REVIEW") && (
                    <>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setShowRejectModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Tolak Jadwal
                      </button>
                      <button
                        onClick={() => handleApprove(selectedSchedule.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Setujui Jadwal
                      </button>
                    </>
                  )}
                {selectedSchedule.status === "PUBLISHED" && (
                  <button
                    onClick={() => handleUnpublish(selectedSchedule.id)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Unpublish Jadwal
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Reject Modal */}
      {typeof window !== 'undefined' && showRejectModal && selectedSchedule && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="reject-modal"
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowRejectModal(false);
                setRejectNotes("");
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
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-gray-600 to-gray-700 border-b border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">Tolak Jadwal</h2>
                    <p className="text-sm text-gray-200">Jadwal: {selectedSchedule.prodi?.nama}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectNotes("");
                    }}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                    aria-label="Close modal"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Penolakan *
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Jelaskan alasan penolakan dan apa yang perlu diperbaiki..."
                  rows="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Catatan ini akan dikirim ke Kaprodi untuk revisi
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectNotes("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Tolak Jadwal
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

export default SekjurScheduleReview;
