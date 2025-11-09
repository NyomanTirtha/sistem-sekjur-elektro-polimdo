import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  Star,
  Trash2,
  Plus,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import Loading from "../../common/Loading";
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirm,
} from "../../../utils/notifikasi/alertUtils";

const DosenPreferenceManager = () => {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [formData, setFormData] = useState({
    preferredDays: [],
    avoidedDays: [],
    preferredTimeSlot: "BOTH",
    maxDaysPerWeek: 5,
    unavailableSlots: [],
    priority: "NORMAL",
  });

  const authToken = localStorage.getItem("token");

  const daysOfWeek = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

  const timeSlotOptions = [
    { value: "PAGI", label: "Pagi (08:00 - 12:00)" },
    { value: "SORE", label: "Sore (13:00 - 17:00)" },
    { value: "BOTH", label: "Pagi & Sore" },
  ];

  const priorityOptions = [
    {
      value: "LOW",
      label: "Low - Opsional",
      color: "blue",
      description: "Bonus jika bisa dipenuhi",
    },
    {
      value: "NORMAL",
      label: "Normal - Diusahakan",
      color: "green",
      description: "Diusahakan untuk dipenuhi",
    },
    {
      value: "HIGH",
      label: "High - Prioritas",
      color: "orange",
      description: "Sangat diutamakan",
    },
    {
      value: "MANDATORY",
      label: "Mandatory - Wajib",
      color: "red",
      description: "WAJIB dipenuhi",
    },
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/dosen-preferences/my-preferences",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      showErrorAlert(
        error.response?.data?.message || "Gagal memuat preferensi",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      formData.preferredDays.length === 0 &&
      formData.avoidedDays.length === 0
    ) {
      showErrorAlert(
        "Pilih minimal satu hari favorit atau hari yang dihindari",
      );
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        preferredDays: formData.preferredDays.join(","),
        avoidedDays: formData.avoidedDays.join(","),
      };

      if (editingId) {
        // Update
        const response = await axios.put(
          `http://localhost:5000/api/dosen-preferences/${editingId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );

        if (response.data.success) {
          showSuccessAlert("Preferensi berhasil diupdate");
          fetchPreferences();
          resetForm();
        }
      } else {
        // Create
        const response = await axios.post(
          "http://localhost:5000/api/dosen-preferences",
          payload,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );

        if (response.data.success) {
          showSuccessAlert("Preferensi berhasil ditambahkan");
          fetchPreferences();
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error saving preference:", error);
      showErrorAlert(
        error.response?.data?.message || "Gagal menyimpan preferensi",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (preference) => {
    setEditingId(preference.id);
    setFormData({
      preferredDays: preference.preferredDays
        ? preference.preferredDays.split(",")
        : [],
      avoidedDays: preference.avoidedDays
        ? preference.avoidedDays.split(",")
        : [],
      preferredTimeSlot: preference.preferredTimeSlot || "BOTH",
      maxDaysPerWeek: preference.maxDaysPerWeek || 5,
      unavailableSlots: [],
      priority: preference.priority || "NORMAL",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      "Hapus Preferensi",
      "Apakah Anda yakin ingin menghapus preferensi ini?",
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await axios.delete(
        `http://localhost:5000/api/dosen-preferences/${id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.data.success) {
        showSuccessAlert("Preferensi berhasil dihapus");
        fetchPreferences();
      }
    } catch (error) {
      console.error("Error deleting preference:", error);
      showErrorAlert(
        error.response?.data?.message || "Gagal menghapus preferensi",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      preferredDays: [],
      avoidedDays: [],
      preferredTimeSlot: "BOTH",
      maxDaysPerWeek: 5,
      unavailableSlots: [],
      priority: "NORMAL",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleDay = (day, field) => {
    setFormData((prev) => {
      const currentArray = prev[field];
      const newArray = currentArray.includes(day)
        ? currentArray.filter((d) => d !== day)
        : [...currentArray, day];
      return { ...prev, [field]: newArray };
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-blue-100 text-blue-700 border-blue-300",
      NORMAL: "bg-green-100 text-green-700 border-green-300",
      HIGH: "bg-orange-100 text-orange-700 border-orange-300",
      MANDATORY: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[priority] || colors.NORMAL;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      LOW: "Low",
      NORMAL: "Normal",
      HIGH: "High",
      MANDATORY: "Mandatory",
    };
    return labels[priority] || priority;
  };

  if (loading && preferences.length === 0) {
    return <Loading message="Memuat preferensi..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-7 h-7 text-yellow-500" />
                Preferensi Jadwal Mengajar
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Atur preferensi jadwal mengajar Anda untuk semester mendatang
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInfoModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                title="Cara Kerja Preferensi"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Panduan</span>
              </button>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Preferensi
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Preferensi" : "Tambah Preferensi Baru"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hari Favorit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hari Favorit
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day, "preferredDays")}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        formData.preferredDays.includes(day)
                          ? "bg-green-100 border-green-500 text-green-700 font-medium"
                          : "bg-white border-gray-300 text-gray-700 hover:border-green-300"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pilih hari-hari yang Anda sukai untuk mengajar
                </p>
              </div>

              {/* Hari Dihindari */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hari yang Dihindari
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day, "avoidedDays")}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        formData.avoidedDays.includes(day)
                          ? "bg-red-100 border-red-500 text-red-700 font-medium"
                          : "bg-white border-gray-300 text-gray-700 hover:border-red-300"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pilih hari-hari yang ingin Anda hindari
                </p>
              </div>

              {/* Waktu Preferensi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Preferensi
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlotOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          preferredTimeSlot: option.value,
                        })
                      }
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        formData.preferredTimeSlot === option.value
                          ? "bg-blue-100 border-blue-500 text-blue-700 font-medium"
                          : "bg-white border-gray-300 text-gray-700 hover:border-blue-300"
                      }`}
                    >
                      <Clock className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Days per Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maksimal Hari per Minggu: {formData.maxDaysPerWeek} hari
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={formData.maxDaysPerWeek}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDaysPerWeek: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 hari</span>
                  <span>6 hari</span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <div className="space-y-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, priority: option.value })
                      }
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        formData.priority === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              formData.priority === option.value
                                ? `border-${option.color}-500 bg-${option.color}-500`
                                : "border-gray-300"
                            }`}
                          >
                            {formData.priority === option.value && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-600">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? "Update Preferensi" : "Simpan Preferensi"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preferences List */}
        <div className="space-y-4">
          {preferences.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum Ada Preferensi
              </h3>
              <p className="text-gray-600 mb-4">
                Tambahkan preferensi jadwal mengajar Anda untuk semester
                mendatang
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Tambah Preferensi
              </button>
            </div>
          ) : (
            preferences.map((preference) => (
              <div
                key={preference.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Preferensi Jadwal
                      </h3>
                      <p className="text-sm text-gray-500">
                        Dibuat:{" "}
                        {new Date(preference.createdAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        preference.priority,
                      )}`}
                    >
                      {getPriorityLabel(preference.priority)}
                    </span>
                    <button
                      onClick={() => handleEdit(preference)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(preference.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hari Favorit */}
                  {preference.preferredDays && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Hari Favorit
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {preference.preferredDays.split(",").map((day) => (
                          <span
                            key={day}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hari Dihindari */}
                  {preference.avoidedDays && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        Hari Dihindari
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {preference.avoidedDays.split(",").map((day) => (
                          <span
                            key={day}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Waktu Preferensi */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Waktu Preferensi
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                      {preference.preferredTimeSlot === "PAGI"
                        ? "Pagi (08:00 - 12:00)"
                        : preference.preferredTimeSlot === "SORE"
                          ? "Sore (13:00 - 17:00)"
                          : "Pagi & Sore"}
                    </span>
                  </div>

                  {/* Max Days */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      Maksimal Hari per Minggu
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                      {preference.maxDaysPerWeek} hari
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Modal */}
        {typeof window !== "undefined" &&
          showInfoModal &&
          ReactDOM.createPortal(
            <AnimatePresence>
              <motion.div
                key="info-modal"
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowInfoModal(false);
                  }
                }}
              >
                <motion.div
                  className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.3, type: "spring" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-lg">
                          <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold mb-1">
                            Cara Kerja Preferensi
                          </h2>
                          <p className="text-blue-100 text-sm">
                            Panduan menggunakan sistem preferensi jadwal
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowInfoModal(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="space-y-6">
                      {/* Main Steps */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                            1
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-green-900 mb-1">
                              Set Preferensi Sekali di Awal Semester
                            </h3>
                            <p className="text-sm text-green-800">
                              Anda cukup mengatur preferensi jadwal satu kali
                              saja. Tidak perlu request manual setiap kali.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                            2
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 mb-1">
                              Otomatis Diterapkan Saat Generate
                            </h3>
                            <p className="text-sm text-blue-800">
                              Saat Kaprodi generate jadwal, preferensi Anda akan
                              otomatis dipertimbangkan oleh sistem.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                            3
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-purple-900 mb-1">
                              Update Kapan Saja
                            </h3>
                            <p className="text-sm text-purple-800">
                              Jika ada perubahan, Anda bisa mengupdate
                              preferensi kapan saja sebelum jadwal digenerate.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Priority Levels */}
                      <div className="bg-gray-50 rounded-lg p-5">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          Priority Level Explained
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-red-700">
                                MANDATORY
                              </span>
                              <span className="text-gray-600 text-sm ml-2">
                                - WAJIB dipenuhi. Sistem akan error jika tidak
                                bisa dipenuhi.
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Contoh: "Saya tidak bisa mengajar hari Jumat
                                karena ada tugas tetap"
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-orange-500 rounded-full mt-1 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-orange-700">
                                HIGH
                              </span>
                              <span className="text-gray-600 text-sm ml-2">
                                - Sangat diutamakan. Sistem akan berusaha
                                maksimal untuk memenuhi.
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Contoh: "Saya sangat tidak suka mengajar di hari
                                Sabtu"
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-green-700">
                                NORMAL
                              </span>
                              <span className="text-gray-600 text-sm ml-2">
                                - Diusahakan untuk dipenuhi jika memungkinkan.
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Contoh: "Saya lebih suka mengajar di pagi hari"
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-blue-700">
                                LOW
                              </span>
                              <span className="text-gray-600 text-sm ml-2">
                                - Opsional, bonus jika bisa dipenuhi.
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Contoh: "Lebih baik Senin-Rabu jika bisa"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-yellow-900 mb-2">
                              💡 Tips Penting
                            </h4>
                            <ul className="text-sm text-yellow-800 space-y-1">
                              <li>
                                • Gunakan MANDATORY hanya untuk hal yang
                                benar-benar tidak bisa ditawar
                              </li>
                              <li>
                                • Semakin fleksibel preferensi Anda, semakin
                                mudah sistem membuat jadwal optimal
                              </li>
                              <li>
                                • Jika preferensi tidak dipenuhi, hubungi
                                Kaprodi untuk diskusi
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
                    <button
                      onClick={() => setShowInfoModal(false)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Mengerti
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>,
            document.body,
          )}
      </div>
    </div>
  );
};

export default DosenPreferenceManager;
