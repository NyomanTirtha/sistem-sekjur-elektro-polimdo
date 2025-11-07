import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Edit,
  Send,
  Save,
  Trash2,
  Clock,
  MapPin,
  User,
  Book,
  XCircle,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import axios from "axios";
import TimetableGridView from "./TimetableGridView";
import { getButtonPrimaryClass } from "../../../utilitas/theme";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const KaprodiScheduleManager = ({ authToken, currentUser }) => {
  const [schedules, setSchedules] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableDosen, setAvailableDosen] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  // State untuk request dari dosen
  const [dosenRequests, setDosenRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestFilterStatus, setRequestFilterStatus] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false);
  const [requestActionNotes, setRequestActionNotes] = useState("");
  const [requestSelectedPeriodId, setRequestSelectedPeriodId] = useState("");

  const [createFormData, setCreateFormData] = useState({
    timetablePeriodId: "",
  });

  const [itemFormData, setItemFormData] = useState({
    mataKuliahId: "",
    dosenId: "",
    hari: "",
    jamMulai: "",
    jamSelesai: "",
    ruanganId: "",
    kelas: "",
    kapasitasMahasiswa: "",
  });

  const daysOrder = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchDosenRequests();
  }, [requestFilterStatus]);

  // Debug useEffect to track availableRooms state
  useEffect(() => {
    console.log("🏢 Available rooms updated:", {
      count: availableRooms.length,
      rooms: availableRooms.map((r) => ({
        id: r.id,
        nama: r.nama,
        isActive: r.isActive,
      })),
    });
  }, [availableRooms]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMySchedules(),
        fetchPeriods(),
        fetchAvailableCourses(),
        fetchAvailableDosen(),
        fetchAvailableRooms(),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch request dari dosen
  const fetchDosenRequests = async () => {
    try {
      setLoadingRequests(true);
      const params = new URLSearchParams();
      if (requestFilterStatus) {
        params.append("status", requestFilterStatus);
      }
      
      const response = await axios.get(
        `http://localhost:5000/api/dosen-requests/for-my-prodi?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      
      if (response.data.success) {
        setDosenRequests(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dosen requests:", error);
      alert(error.response?.data?.message || "Gagal mengambil request dari dosen");
    } finally {
      setLoadingRequests(false);
    }
  };

  // Approve request
  const handleApproveRequest = async (requestId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/dosen-requests/${requestId}/approve`,
        { 
          notes: requestActionNotes || null,
          timetablePeriodId: requestSelectedPeriodId || null,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Request berhasil disetujui dan ditambahkan ke jadwal");
        setShowRequestDetailModal(false);
        setSelectedRequest(null);
        setRequestActionNotes("");
        setRequestSelectedPeriodId("");
        fetchDosenRequests();
        // Refresh jadwal prodi juga
        fetchMySchedules();
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.response?.data?.message || "Gagal menyetujui request");
    }
  };

  // Reject request
  const handleRejectRequest = async (requestId) => {
    if (!requestActionNotes || requestActionNotes.trim() === "") {
      alert("Alasan penolakan wajib diisi");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/dosen-requests/${requestId}/reject`,
        { notes: requestActionNotes },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Request berhasil ditolak");
        setShowRequestDetailModal(false);
        setSelectedRequest(null);
        setRequestActionNotes("");
        fetchDosenRequests();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(error.response?.data?.message || "Gagal menolak request");
    }
  };

  const fetchMySchedules = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/prodi-schedules/my-prodi",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.data.success) {
        setSchedules(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/timetable/periods",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.data.success) {
        setPeriods(response.data.data.filter((p) => p.status !== "CLOSED"));
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
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
      console.error("Error fetching courses:", error);
    }
  };

  const fetchAvailableDosen = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/dosen", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        setAvailableDosen(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dosen:", error);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/ruangan", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        const activeRooms = response.data.data.filter((room) => room.isActive);
        setAvailableRooms(activeRooms);
      } else {
        console.warn("Gagal mengambil data ruangan:", response.data.message);
        setAvailableRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      if (error.response?.status === 401) {
        console.error("Authentication failed - please login again");
      } else if (error.response?.status === 403) {
        console.error("Access denied to ruangan data");
      }
      setAvailableRooms([]);
    }
  };

  const fetchScheduleItems = async (scheduleId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/prodi-schedules/${scheduleId}/items`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.data.success) {
        setScheduleItems(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching schedule items:", error);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/prodi-schedules",
        createFormData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Jadwal berhasil dibuat");
        setShowCreateModal(false);
        setCreateFormData({ timetablePeriodId: "" });
        fetchMySchedules();
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert(error.response?.data?.message || "Gagal membuat jadwal");
    }
  };

  const handleAddScheduleItem = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem
        ? `http://localhost:5000/api/prodi-schedules/items/${editingItem.id}`
        : `http://localhost:5000/api/prodi-schedules/${selectedSchedule.id}/items`;

      const method = editingItem ? "put" : "post";

      const response = await axios[method](url, itemFormData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        alert(
          editingItem
            ? "Item jadwal berhasil diupdate"
            : "Item jadwal berhasil ditambahkan",
        );
        setShowAddItemModal(false);
        setEditingItem(null);
        setItemFormData({
          mataKuliahId: "",
          dosenId: "",
          hari: "",
          jamMulai: "",
          jamSelesai: "",
          ruanganId: "",
          kelas: "",
          kapasitasMahasiswa: "",
        });
        fetchScheduleItems(selectedSchedule.id);
        fetchMySchedules();
      }
    } catch (error) {
      console.error("Error saving schedule item:", error);
      alert(error.response?.data?.message || "Gagal menyimpan item jadwal");
    }
  };

  const handleDeleteScheduleItem = async (itemId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus item jadwal ini?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/prodi-schedules/items/${itemId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Item jadwal berhasil dihapus");
        fetchScheduleItems(selectedSchedule.id);
        fetchMySchedules();
      }
    } catch (error) {
      console.error("Error deleting schedule item:", error);
      alert(error.response?.data?.message || "Gagal menghapus item jadwal");
    }
  };

  const handleSubmitSchedule = async (scheduleId) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin submit jadwal ini ke sekjur untuk review?",
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/prodi-schedules/${scheduleId}/submit`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Jadwal berhasil disubmit ke sekjur untuk review");
        fetchMySchedules();
        if (selectedSchedule && selectedSchedule.id === scheduleId) {
          setSelectedSchedule({ ...selectedSchedule, status: "SUBMITTED" });
        }
      }
    } catch (error) {
      console.error("Error submitting schedule:", error);
      alert(error.response?.data?.message || "Gagal submit jadwal");
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    let confirmMessage =
      "Apakah Anda yakin ingin menghapus jadwal ini? Semua item jadwal akan ikut terhapus.";

    if (
      schedule?.status === "SUBMITTED" ||
      schedule?.status === "UNDER_REVIEW"
    ) {
      confirmMessage =
        "Apakah Anda yakin ingin membatalkan pengajuan jadwal ini?\n\nJadwal akan dikembalikan ke status DRAFT dan dapat diedit kembali.";
    } else if (schedule?.status === "REJECTED") {
      confirmMessage =
        "Apakah Anda yakin ingin menghapus jadwal yang ditolak ini?\n\nSemua item jadwal akan ikut terhapus.";
    } else if (
      schedule?.status === "APPROVED" ||
      schedule?.status === "PUBLISHED"
    ) {
      confirmMessage =
        "⚠️ PERINGATAN!\n\nJadwal ini sudah DISETUJUI/DIPUBLISH!\n\nMenghapus jadwal yang sudah disetujui dapat mengganggu sistem penjadwalan.\n\nApakah Anda yakin ingin menghapus jadwal ini?\nSemua item jadwal akan ikut terhapus.";
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/prodi-schedules/${scheduleId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        const message =
          schedule?.status === "SUBMITTED" ||
          schedule?.status === "UNDER_REVIEW"
            ? "Pengajuan jadwal berhasil dibatalkan"
            : "Jadwal berhasil dihapus";
        alert(message);
        fetchMySchedules();
        if (selectedSchedule && selectedSchedule.id === scheduleId) {
          setSelectedSchedule(null);
          setScheduleItems([]);
        }
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert(error.response?.data?.message || "Gagal menghapus jadwal");
    }
  };

  const openEditScheduleModal = (schedule) => {
    setEditingSchedule(schedule);
    setCreateFormData({
      timetablePeriodId: schedule.timetablePeriodId,
    });
    setShowEditScheduleModal(true);
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();

    if (!editingSchedule) return;

    try {
      const response = await axios.put(
        `http://localhost:5000/api/prodi-schedules/${editingSchedule.id}`,
        createFormData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        alert("Jadwal berhasil diperbarui");
        setShowEditScheduleModal(false);
        setEditingSchedule(null);
        setCreateFormData({ timetablePeriodId: "" });
        fetchMySchedules();
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert(error.response?.data?.message || "Gagal memperbarui jadwal");
    }
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setItemFormData({
      mataKuliahId: item.mataKuliah.id,
      dosenId: item.dosen.nip,
      hari: item.hari,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      ruanganId: item.ruangan.id,
      kelas: item.kelas || "",
      kapasitasMahasiswa: item.kapasitasMahasiswa || "",
    });
    setShowAddItemModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "text-gray-600 bg-gray-100";
      case "SUBMITTED":
        return "text-blue-600 bg-blue-100";
      case "UNDER_REVIEW":
        return "text-yellow-600 bg-yellow-100";
      case "APPROVED":
        return "text-green-600 bg-green-100";
      case "REJECTED":
        return "text-red-600 bg-red-100";
      case "PUBLISHED":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "SUBMITTED":
        return "Disubmit";
      case "UNDER_REVIEW":
        return "Direview";
      case "APPROVED":
        return "Disetujui";
      case "REJECTED":
        return "Ditolak";
      case "PUBLISHED":
        return "Dipublish";
      default:
        return status;
    }
  };

  // Helper functions untuk request status
  const getRequestStatusColor = (status) => {
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

  const getRequestStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "Menunggu Persetujuan";
      case "APPROVED":
        return "Disetujui";
      case "REJECTED":
        return "Ditolak";
      default:
        return status;
    }
  };

  const groupItemsByDay = (items) => {
    const grouped = {};
    daysOrder.forEach((day) => {
      grouped[day] = items
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kelola Jadwal Prodi
          </h1>
          <p className="text-gray-600">
            Buat dan kelola jadwal kuliah untuk program studi Anda
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`inline-flex items-center px-4 py-2 rounded-lg ${getButtonPrimaryClass(currentUser)}`}
        >
          <Plus className="w-5 h-5 mr-2" />
          Buat Jadwal Baru
        </button>
      </div>

      {/* Section Request dari Dosen */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Request Jadwal dari Dosen
              {dosenRequests.filter((r) => r.status === "PENDING").length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {dosenRequests.filter((r) => r.status === "PENDING").length} Pending
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600">
              Kelola request jadwal dari dosen di program studi Anda. Setelah disetujui, jadwal akan otomatis ditambahkan ke jadwal prodi Anda.
            </p>
          </div>
          <div>
            <select
              value={requestFilterStatus}
              onChange={(e) => setRequestFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu Persetujuan</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
        </div>

        {loadingRequests ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Memuat request...</p>
          </div>
        ) : dosenRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>Tidak ada request dari dosen</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dosenRequests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.mataKuliah?.nama || "N/A"}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRequestStatusColor(request.status)}`}
                      >
                        {getRequestStatusLabel(request.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {request.dosen?.nama || "N/A"}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {request.preferredHari}, {request.preferredJamMulai} - {request.preferredJamSelesai}
                      </div>
                      {request.preferredRuangan && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {request.preferredRuangan.nama}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Book className="w-4 h-4 mr-2" />
                        {request.mataKuliah?.sks || 0} SKS
                      </div>
                    </div>
                    {request.alasanRequest && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Alasan Request:
                        </p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {request.alasanRequest}
                        </p>
                      </div>
                    )}
                    {request.kaprodiNotes && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Catatan Kaprodi:
                        </p>
                        <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          {request.kaprodiNotes}
                        </p>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Dikirim: {new Date(request.submittedAt).toLocaleString("id-ID")}
                      {request.processedAt && (
                        <> • Diproses: {new Date(request.processedAt).toLocaleString("id-ID")}</>
                      )}
                    </div>
                  </div>
                  {request.status === "PENDING" && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setRequestActionNotes("");
                          setRequestSelectedPeriodId("");
                          setShowRequestDetailModal(true);
                        }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedules List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-white rounded-lg shadow-md border border-gray-200"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {schedule.timetablePeriod.semester}{" "}
                    {schedule.timetablePeriod.tahunAkademik}
                  </h3>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}
                  >
                    {getStatusLabel(schedule.status)}
                  </span>
                </div>
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Mata Kuliah:</span>
                  <span className="font-medium">
                    {schedule._count?.scheduleItems || 0}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Dibuat:</span>
                  <span className="font-medium ml-1">
                    {new Date(schedule.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
                {schedule.submittedAt && (
                  <div className="text-sm">
                    <span className="text-gray-600">Disubmit:</span>
                    <span className="font-medium ml-1">
                      {new Date(schedule.submittedAt).toLocaleDateString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                )}
              </div>

              {schedule.sekjurNotes && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Catatan Sekjur:</strong> {schedule.sekjurNotes}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      fetchScheduleItems(schedule.id);
                    }}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Kelola
                  </button>

                  {schedule.status === "DRAFT" &&
                    schedule._count?.scheduleItems > 0 && (
                      <button
                        onClick={() => handleSubmitSchedule(schedule.id)}
                        className={`flex-1 inline-flex justify-center items-center px-3 py-2 text-white rounded-md text-sm ${getButtonPrimaryClass(currentUser)}`}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Submit
                      </button>
                    )}

                  {(schedule.status === "SUBMITTED" ||
                    schedule.status === "UNDER_REVIEW") && (
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 shadow-sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Batalkan Pengajuan
                    </button>
                  )}

                  {schedule.status === "REJECTED" && (
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus Jadwal
                    </button>
                  )}

                  {(schedule.status === "APPROVED" ||
                    schedule.status === "PUBLISHED") && (
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus Jadwal
                    </button>
                  )}
                </div>

                {schedule.status === "DRAFT" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditScheduleModal(schedule)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-blue-300 bg-blue-50 rounded-md text-sm text-blue-700 hover:bg-blue-100"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-red-300 bg-red-50 rounded-md text-sm text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner - Workflow reminder */}
      {dosenRequests.filter((r) => r.status === "PENDING").length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-800">
                <strong>Peringatan:</strong> Ada {dosenRequests.filter((r) => r.status === "PENDING").length} request dari dosen yang menunggu persetujuan. 
                Setelah disetujui, jadwal akan <strong>otomatis ditambahkan</strong> ke jadwal prodi Anda. 
                Pastikan untuk mereview request sebelum membuat jadwal manual.
              </p>
            </div>
          </div>
        </div>
      )}

      {schedules.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada jadwal
          </h3>
          <p className="text-gray-600 mb-4">
            Buat jadwal pertama untuk program studi Anda
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`inline-flex items-center px-4 py-2 rounded-lg ${getButtonPrimaryClass(currentUser)}`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Buat Jadwal Baru
          </button>
        </div>
      )}

      {/* Schedule Detail Modal */}
      {typeof window !== 'undefined' && selectedSchedule && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="schedule-detail-modal"
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedSchedule(null);
                setScheduleItems([]);
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
              <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">
                        {selectedSchedule.timetablePeriod.semester} {selectedSchedule.timetablePeriod.tahunAkademik}
                      </h2>
                      <p className="text-sm text-blue-100">
                        Status: <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedSchedule.status)}`}>
                          {getStatusLabel(selectedSchedule.status)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {["DRAFT", "REJECTED"].includes(selectedSchedule.status) && (
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Tambah
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSchedule(null);
                        setScheduleItems([]);
                      }}
                      className="p-2 hover:bg-blue-800 rounded-lg transition-colors text-white"
                      aria-label="Close modal"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-6">
                {scheduleItems.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 mb-4">
                      {["DRAFT", "REJECTED"].includes(selectedSchedule.status)
                        ? "Belum ada jadwal. Klik 'Tambah' untuk menambahkan"
                        : "Jadwal kosong"}
                    </p>
                    {["DRAFT", "REJECTED"].includes(selectedSchedule.status) && (
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className={`inline-flex items-center px-3 py-1.5 rounded text-sm ${getButtonPrimaryClass(currentUser)}`}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Tambah Mata Kuliah
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Grid View */}
                    <TimetableGridView
                      scheduleItems={scheduleItems}
                      className="bg-white border border-gray-200 rounded p-3"
                    />
                    
                    {/* List View untuk Edit/Delete - hanya DRAFT/REJECTED */}
                    {["DRAFT", "REJECTED"].includes(selectedSchedule.status) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Daftar Item
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(groupItemsByDay(scheduleItems)).map(
                            ([day, items]) => (
                              <div key={day} className="border border-gray-200 rounded overflow-hidden">
                                <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                                  <h5 className="text-xs font-medium text-gray-700">{day}</h5>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {items.map((item) => (
                                    <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors">
                                      <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                          <h6 className="text-sm font-medium text-gray-900 mb-1.5 truncate">
                                            {item.mataKuliah.nama}
                                          </h6>
                                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                                            <div className="flex items-center">
                                              <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                              <span className="truncate">{item.jamMulai} - {item.jamSelesai}</span>
                                            </div>
                                            <div className="flex items-center">
                                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                              <span className="truncate">{item.ruangan.nama}</span>
                                            </div>
                                            <div className="flex items-center">
                                              <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                              <span className="truncate">{item.dosen.nama}</span>
                                            </div>
                                            <div className="flex items-center">
                                              <Book className="w-3 h-3 mr-1 flex-shrink-0" />
                                              <span>{item.mataKuliah.sks} SKS</span>
                                            </div>
                                          </div>
                                          {item.kelas && (
                                            <div className="mt-1 text-xs text-gray-500">
                                              Kelas: {item.kelas}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex gap-1.5">
                                          <button
                                            onClick={() => openEditItemModal(item)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Edit"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteScheduleItem(item.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Hapus"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Create Schedule Modal */}
      {typeof window !== 'undefined' && showCreateModal && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="create-schedule-modal"
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
                setCreateFormData({ timetablePeriodId: "" });
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
              <form onSubmit={handleCreateSchedule}>
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">Buat Jadwal Baru</h2>
                      <p className="text-sm text-blue-100">Pilih periode untuk jadwal baru</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setCreateFormData({ timetablePeriodId: "" });
                      }}
                      className="p-2 hover:bg-blue-800 rounded-lg transition-colors text-white"
                      aria-label="Close modal"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Periode Timetable *
                    </label>
                    <select
                      value={createFormData.timetablePeriodId}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          timetablePeriodId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    >
                      <option value="">Pilih Periode</option>
                      {periods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {period.semester} {period.tahunAkademik}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateFormData({ timetablePeriodId: "" });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-sm text-white ${getButtonPrimaryClass(currentUser)}`}
                  >
                    Buat
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Add/Edit Schedule Item Modal */}
      {typeof window !== 'undefined' && showAddItemModal && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="add-item-modal"
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddItemModal(false);
                setEditingItem(null);
                setItemFormData({
                  mataKuliahId: "",
                  dosenId: "",
                  hari: "",
                  jamMulai: "",
                  jamSelesai: "",
                  ruanganId: "",
                  kelas: "",
                  kapasitasMahasiswa: "",
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
              <form onSubmit={handleAddScheduleItem}>
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">
                        {editingItem ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
                      </h2>
                      <p className="text-sm text-blue-100">
                        {editingItem ? "Ubah informasi mata kuliah dalam jadwal" : "Tambahkan mata kuliah ke jadwal"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddItemModal(false);
                        setEditingItem(null);
                        setItemFormData({
                          mataKuliahId: "",
                          dosenId: "",
                          hari: "",
                          jamMulai: "",
                          jamSelesai: "",
                          ruanganId: "",
                          kelas: "",
                          kapasitasMahasiswa: "",
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
                  <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mata Kuliah *
                  </label>
                  <select
                    value={itemFormData.mataKuliahId}
                    onChange={(e) =>
                      setItemFormData({
                        ...itemFormData,
                        mataKuliahId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Mata Kuliah</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.nama} ({course.sks} SKS)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosen *
                  </label>
                  <select
                    value={itemFormData.dosenId}
                    onChange={(e) =>
                      setItemFormData({
                        ...itemFormData,
                        dosenId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Dosen</option>
                    {availableDosen.map((dosen) => (
                      <option key={dosen.nip} value={dosen.nip}>
                        {dosen.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hari *
                  </label>
                  <select
                    value={itemFormData.hari}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, hari: e.target.value })
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
                    Ruangan *
                  </label>
                  <select
                    value={itemFormData.ruanganId}
                    onChange={(e) => {
                      const selectedRoomId = e.target.value;
                      const selectedRoom = availableRooms.find(
                        (room) => room.id === parseInt(selectedRoomId)
                      );
                      
                      setItemFormData({
                        ...itemFormData,
                        ruanganId: selectedRoomId,
                        // Auto-fill kapasitas dari ruangan yang dipilih
                        kapasitasMahasiswa: selectedRoom
                          ? selectedRoom.kapasitas.toString()
                          : "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Ruangan</option>
                    {availableRooms.length === 0 ? (
                      <option value="" disabled>
                        {loading
                          ? "Memuat ruangan..."
                          : "Tidak ada ruangan tersedia"}
                      </option>
                    ) : (
                      availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.nama} (Kapasitas: {room.kapasitas})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Ruangan dapat dipilih manual atau otomatis terisi saat menginput kelas yang cocok
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    value={itemFormData.jamMulai}
                    onChange={(e) =>
                      setItemFormData({
                        ...itemFormData,
                        jamMulai: e.target.value,
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
                    value={itemFormData.jamSelesai}
                    onChange={(e) =>
                      setItemFormData({
                        ...itemFormData,
                        jamSelesai: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kelas
                  </label>
                  <input
                    type="text"
                    value={itemFormData.kelas}
                    onChange={(e) => {
                      const kelasValue = e.target.value.trim();
                      
                      // Auto-fill ruangan dan kapasitas berdasarkan kelas
                      let matchedRoom = null;
                      
                      if (kelasValue.length > 0) {
                        // Cari ruangan yang cocok dengan kelas yang diinput
                        // Priority: 1. Exact match, 2. Ruangan mengandung kelas, 3. Kelas mengandung ruangan
                        const kelasUpper = kelasValue.toUpperCase();
                        
                        // Coba exact match dulu
                        matchedRoom = availableRooms.find((room) => {
                          const roomName = room.nama.trim().toUpperCase();
                          return roomName === kelasUpper;
                        });
                        
                        // Jika tidak ada exact match, coba contains match
                        if (!matchedRoom) {
                          matchedRoom = availableRooms.find((room) => {
                            const roomName = room.nama.trim().toUpperCase();
                            // Hanya match jika kelas cukup panjang (minimal 3 karakter) untuk menghindari false positive
                            return kelasUpper.length >= 3 && 
                                   (roomName.includes(kelasUpper) || kelasUpper.includes(roomName));
                          });
                        }
                      }
                      
                      setItemFormData({
                        ...itemFormData,
                        kelas: kelasValue,
                        // Auto-fill ruangan jika ditemukan match
                        ruanganId: matchedRoom ? matchedRoom.id.toString() : itemFormData.ruanganId,
                        // Auto-fill kapasitas jika ruangan ditemukan
                        kapasitasMahasiswa: matchedRoom 
                          ? matchedRoom.kapasitas.toString() 
                          : itemFormData.kapasitasMahasiswa,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: A101, B201"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ruangan dan kapasitas akan otomatis terisi jika kelas cocok dengan nama ruangan
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kapasitas Mahasiswa
                  </label>
                  <input
                    type="number"
                    value={itemFormData.kapasitasMahasiswa}
                    onChange={(e) =>
                      setItemFormData({
                        ...itemFormData,
                        kapasitasMahasiswa: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    placeholder="Otomatis terisi dari kelas atau ruangan"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Kapasitas otomatis terisi saat memilih kelas yang cocok dengan ruangan atau saat memilih ruangan. Dapat diubah manual jika diperlukan.
                  </p>
                </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddItemModal(false);
                      setEditingItem(null);
                      setItemFormData({
                        mataKuliahId: "",
                        dosenId: "",
                        hari: "",
                        jamMulai: "",
                        jamSelesai: "",
                        ruanganId: "",
                        kelas: "",
                        kapasitasMahasiswa: "",
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-sm text-white ${getButtonPrimaryClass(currentUser)}`}
                  >
                    {editingItem ? "Update" : "Tambah"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Edit Schedule Modal */}
      {typeof window !== 'undefined' && showEditScheduleModal && editingSchedule && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="edit-schedule-modal"
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditScheduleModal(false);
                setEditingSchedule(null);
                setCreateFormData({ timetablePeriodId: "" });
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
              <form onSubmit={handleUpdateSchedule}>
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">Edit Periode Jadwal</h2>
                      <p className="text-sm text-blue-100">Ubah periode untuk jadwal ini</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditScheduleModal(false);
                        setEditingSchedule(null);
                        setCreateFormData({ timetablePeriodId: "" });
                      }}
                      className="p-2 hover:bg-blue-800 rounded-lg transition-colors text-white"
                      aria-label="Close modal"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Periode Timetable *
                    </label>
                    <select
                      value={createFormData.timetablePeriodId}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          timetablePeriodId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    >
                      <option value="">Pilih Periode</option>
                      {periods
                        .filter(
                          (p) =>
                            p.status === "ACTIVE" ||
                            p.id === editingSchedule.timetablePeriodId,
                        )
                        .map((period) => (
                          <option key={period.id} value={period.id}>
                            {period.semester} {period.tahunAkademik}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditScheduleModal(false);
                      setEditingSchedule(null);
                      setCreateFormData({ timetablePeriodId: "" });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-sm text-white ${getButtonPrimaryClass(currentUser)}`}
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

      {/* Request Detail Modal untuk Approve/Reject */}
      {typeof window !== 'undefined' && showRequestDetailModal && selectedRequest && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="request-detail-modal"
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowRequestDetailModal(false);
                setSelectedRequest(null);
                setRequestActionNotes("");
                setRequestSelectedPeriodId("");
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
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">Detail Request</h2>
                    <p className="text-sm text-blue-100">{selectedRequest.mataKuliah?.nama || "N/A"}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRequestDetailModal(false);
                      setSelectedRequest(null);
                      setRequestActionNotes("");
                      setRequestSelectedPeriodId("");
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Informasi Request
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-700">
                      <strong>Dosen:</strong> {selectedRequest.dosen?.nama || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Book className="w-4 h-4 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-700">
                      <strong>Mata Kuliah:</strong> {selectedRequest.mataKuliah?.nama || "N/A"} ({selectedRequest.mataKuliah?.sks || 0} SKS)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-700">
                      <strong>Waktu:</strong> {selectedRequest.preferredHari}, {selectedRequest.preferredJamMulai} - {selectedRequest.preferredJamSelesai}
                    </span>
                  </div>
                  {selectedRequest.preferredRuangan && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-600 mr-2" />
                      <span className="text-sm text-gray-700">
                        <strong>Ruangan:</strong> {selectedRequest.preferredRuangan.nama} (Kapasitas: {selectedRequest.preferredRuangan.kapasitas})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.alasanRequest && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Alasan Request
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {selectedRequest.alasanRequest}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periode Jadwal (Opsional, akan menggunakan periode aktif jika dikosongkan)
                </label>
                <select
                  value={requestSelectedPeriodId}
                  onChange={(e) => setRequestSelectedPeriodId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Gunakan Periode Aktif</option>
                  {periods
                    .filter((p) => p.status === "ACTIVE")
                    .map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.semester} {period.tahunAkademik}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Jadwal akan otomatis ditambahkan ke jadwal prodi setelah disetujui
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional untuk Approve, Wajib untuk Reject)
                </label>
                <textarea
                  value={requestActionNotes}
                  onChange={(e) => setRequestActionNotes(e.target.value)}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowRequestDetailModal(false);
                    setSelectedRequest(null);
                    setRequestActionNotes("");
                    setRequestSelectedPeriodId("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleRejectRequest(selectedRequest.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4 inline mr-2" />
                  Tolak
                </button>
                <button
                  onClick={() => handleApproveRequest(selectedRequest.id)}
                  className={`px-4 py-2 rounded-md text-white ${getButtonPrimaryClass(currentUser)}`}
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Setujui
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

export default KaprodiScheduleManager;
