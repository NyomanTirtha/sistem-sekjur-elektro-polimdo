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
} from "lucide-react";
import axios from "axios";

const KaprodiScheduleManager = ({ authToken }) => {
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
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Buat Jadwal Baru
        </button>
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
                        className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
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
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Buat Jadwal Baru
          </button>
        </div>
      )}

      {/* Schedule Detail Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Jadwal {selectedSchedule.timetablePeriod.semester}{" "}
                  {selectedSchedule.timetablePeriod.tahunAkademik}
                </h3>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSchedule.status)}`}
                >
                  {getStatusLabel(selectedSchedule.status)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {["DRAFT", "REJECTED"].includes(selectedSchedule.status) && (
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah Mata Kuliah
                  </button>
                )}
                {!["DRAFT", "REJECTED"].includes(selectedSchedule.status) && (
                  <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
                    {selectedSchedule.status === "APPROVED" ||
                    selectedSchedule.status === "PUBLISHED" ? (
                      <>
                        ℹ️ Jadwal yang sudah disetujui tidak dapat diedit atau
                        dihapus.
                      </>
                    ) : (
                      <>
                        ℹ️ Jadwal yang sudah disubmit tidak dapat diedit.
                        Kembali ke halaman utama dan klik tombol "Batalkan
                        Pengajuan" untuk mengedit.
                      </>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedSchedule(null);
                    setScheduleItems([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Timetable View */}
              {scheduleItems.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Belum ada item jadwal
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {["DRAFT", "REJECTED"].includes(selectedSchedule.status)
                      ? "Klik tombol 'Tambah Mata Kuliah' di atas untuk menambahkan jadwal"
                      : "Jadwal ini masih kosong"}
                  </p>
                  {["DRAFT", "REJECTED"].includes(selectedSchedule.status) && (
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah Mata Kuliah Pertama
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupItemsByDay(scheduleItems)).map(
                    ([day, items]) => (
                      <div
                        key={day}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h4 className="font-medium text-gray-900">{day}</h4>
                        </div>
                        {items.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="p-4 hover:bg-gray-50"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 mb-1">
                                      {item.mataKuliah.nama}
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                      <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {item.jamMulai} - {item.jamSelesai}
                                      </div>
                                      <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        {item.ruangan.nama}
                                      </div>
                                      <div className="flex items-center">
                                        <User className="w-4 h-4 mr-1" />
                                        {item.dosen.nama}
                                      </div>
                                      <div className="flex items-center">
                                        <Book className="w-4 h-4 mr-1" />
                                        {item.mataKuliah.sks} SKS
                                      </div>
                                    </div>
                                    {item.kelas && (
                                      <div className="mt-1 text-sm text-gray-600">
                                        Kelas: {item.kelas}
                                      </div>
                                    )}
                                  </div>
                                  {["DRAFT", "REJECTED"].includes(
                                    selectedSchedule.status,
                                  ) && (
                                    <div className="flex space-x-2 ml-4">
                                      <button
                                        onClick={() => openEditItemModal(item)}
                                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 bg-blue-50 rounded-md text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                                        title="Edit item jadwal"
                                      >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteScheduleItem(item.id)
                                        }
                                        className="inline-flex items-center px-3 py-1.5 border border-red-300 bg-red-50 rounded-md text-sm text-red-700 hover:bg-red-100 transition-colors"
                                        title="Hapus item jadwal"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Hapus
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            Belum ada mata kuliah pada {day}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <form onSubmit={handleCreateSchedule}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Buat Jadwal Baru
                </h3>
              </div>

              <div className="px-6 py-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({ timetablePeriodId: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Buat Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Schedule Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <form onSubmit={handleAddScheduleItem}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
                </h3>
              </div>

              <div className="px-6 py-4 grid grid-cols-2 gap-4">
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
                    onChange={(e) =>
                      setItemFormData({
                        ...itemFormData,
                        ruanganId: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setItemFormData({
                        ...itemFormData,
                        kelas: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: A1, B2"
                  />
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
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingItem ? "Update" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditScheduleModal && editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <form onSubmit={handleUpdateSchedule}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Periode Jadwal
                </h3>
              </div>

              <div className="px-6 py-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditScheduleModal(false);
                    setEditingSchedule(null);
                    setCreateFormData({ timetablePeriodId: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KaprodiScheduleManager;
