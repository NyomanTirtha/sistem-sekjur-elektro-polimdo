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
      alert("Gagal mengambil data jadwal");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const handleApprove = async (scheduleId) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menyetujui jadwal ini? Jadwal yang disetujui akan masuk ke sistem."
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/sekjur-schedules/${scheduleId}/approve`,
        { notes: approveNotes || null },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        alert("Jadwal berhasil disetujui!");
        setApproveNotes("");
        setShowDetailModal(false);
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error approving schedule:", error);
      alert(
        error.response?.data?.message || "Gagal menyetujui jadwal"
      );
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      alert("Alasan penolakan harus diisi!");
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
        alert("Jadwal ditolak dan dikembalikan untuk revisi");
        setRejectNotes("");
        setShowRejectModal(false);
        setShowDetailModal(false);
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error rejecting schedule:", error);
      alert(
        error.response?.data?.message || "Gagal menolak jadwal"
      );
    }
  };

  const handleUnpublish = async (scheduleId) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin meng-unpublish jadwal ini? Jadwal akan dikembalikan ke status APPROVED dan bisa diubah kembali."
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/sekjur-schedules/${scheduleId}/unpublish`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        alert("Jadwal berhasil di-unpublish!");
        setShowDetailModal(false);
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error unpublishing schedule:", error);
      alert(
        error.response?.data?.message || "Gagal melakukan unpublish jadwal"
      );
    }
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
        alert("Status jadwal diubah menjadi 'Sedang Direview'");
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error starting review:", error);
      alert(error.response?.data?.message || "Gagal memulai review");
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

  const groupSchedulesByDay = (scheduleItems) => {
    const days = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
    const grouped = {};

    days.forEach((day) => {
      grouped[day] = scheduleItems
        .filter((item) => item.hari === day)
        .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Jadwal Prodi</h1>
        <p className="text-gray-600">
          Review dan setujui jadwal yang diajukan oleh Kaprodi
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada jadwal
            </h3>
            <p className="text-gray-600">
              Belum ada jadwal yang perlu direview untuk filter yang dipilih
            </p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {schedule.prodi?.nama || "N/A"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {schedule.timetablePeriod?.semester}{" "}
                    {schedule.timetablePeriod?.tahunAkademik}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {schedule._count?.scheduleItems || 0} Item Jadwal
                    </span>
                    {schedule.submittedAt && (
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Diajukan:{" "}
                        {new Date(schedule.submittedAt).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}
                >
                  {getStatusLabel(schedule.status)}
                </span>
              </div>

              {schedule.sekjurNotes && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs font-medium text-yellow-800 mb-1">
                    Catatan Review:
                  </p>
                  <p className="text-sm text-yellow-700">
                    {schedule.sekjurNotes}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetail(schedule)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Detail
                </button>

                {schedule.status === "SUBMITTED" && (
                  <button
                    onClick={() => handleStartReview(schedule.id)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Mulai Review
                  </button>
                )}

                {(schedule.status === "SUBMITTED" ||
                  schedule.status === "UNDER_REVIEW") && (
                  <>
                    <button
                      onClick={() => handleApprove(schedule.id)}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Setujui
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setShowRejectModal(true);
                      }}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Tolak
                    </button>
                  </>
                )}

                {schedule.status === "PUBLISHED" && (
                  <button
                    onClick={() => handleUnpublish(schedule.id)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Unpublish
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Detail Jadwal: {selectedSchedule.prodi?.nama}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedSchedule.timetablePeriod?.semester}{" "}
                  {selectedSchedule.timetablePeriod?.tahunAkademik}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSchedule(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
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
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Catatan untuk Kaprodi (Opsional)
                  </label>
                  <textarea
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    placeholder="Tambahkan catatan jika diperlukan..."
                    rows="3"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSchedule(null);
                  setApproveNotes("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Tolak Jadwal
                  </button>
                  <button
                    onClick={() => handleApprove(selectedSchedule.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Setujui Jadwal
                  </button>
                </>
              )}
              {selectedSchedule.status === "PUBLISHED" && (
                <button
                  onClick={() => handleUnpublish(selectedSchedule.id)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Unpublish Jadwal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Tolak Jadwal
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Jadwal: {selectedSchedule.prodi?.nama}
              </p>
            </div>

            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penolakan *
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Jelaskan alasan penolakan dan apa yang perlu diperbaiki..."
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Catatan ini akan dikirim ke Kaprodi untuk revisi
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectNotes("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Tolak Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SekjurScheduleReview;
