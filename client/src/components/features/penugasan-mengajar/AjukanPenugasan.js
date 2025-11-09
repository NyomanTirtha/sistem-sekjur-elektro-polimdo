import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Send, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirm,
} from "../../../utils/notifikasi/alertUtils";
import Loading from "../../common/Loading";
import { BADGE, BUTTON } from "../../../constants/colors";

const AjukanPenugasan = ({ authToken }) => {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, assignmentsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/auth/mata-kuliah", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get("http://localhost:5000/api/penugasan/my-requests", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (coursesRes.data.success) {
        setAvailableCourses(coursesRes.data.data);
      }
      if (assignmentsRes.data.success) {
        setMyAssignments(assignmentsRes.data.data);
      }
    } catch (error) {
      showErrorAlert("Gagal memuat data.");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handlePropose = async (mataKuliahId) => {
    showConfirm(
      "Apakah Anda yakin ingin mengajukan diri untuk mengajar mata kuliah ini?",
      async () => {
        try {
          const response = await axios.post(
            "http://localhost:5000/api/penugasan/request",
            { mataKuliahId },
            { headers: { Authorization: `Bearer ${authToken}` } },
          );
          if (response.data.success) {
            showSuccessAlert("Pengajuan berhasil dikirim!");
            fetchAllData(); // Refresh data
          }
        } catch (error) {
          showErrorAlert(
            error.response?.data?.message || "Gagal mengajukan mata kuliah.",
          );
          console.error("Error proposing course:", error);
        }
      },
      "Konfirmasi Pengajuan",
    );
  };

  const getAssignmentStatus = (courseId) => {
    const assignment = myAssignments.find((a) => a.mataKuliahId === courseId);
    return assignment ? assignment.status : null;
  };

  const StatusBadge = ({ status }) => {
    const statusMap = {
      PENDING_APPROVAL: {
        label: "Menunggu",
        icon: <Clock size={14} />,
        color: BADGE.warning,
      },
      ACTIVE: {
        label: "Disetujui",
        icon: <CheckCircle size={14} />,
        color: BADGE.success,
      },
      REJECTED: {
        label: "Ditolak",
        icon: <XCircle size={14} />,
        color: BADGE.danger,
      },
    };
    const currentStatus = statusMap[status];
    if (!currentStatus) return null;

    return (
      <span
        className={`${currentStatus.color} inline-flex items-center gap-1.5`}
      >
        {currentStatus.icon}
        {currentStatus.label}
      </span>
    );
  };

  if (loading) {
    return <Loading message="Memuat data mata kuliah..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ajukan Penugasan Mengajar
        </h1>
        <p className="text-gray-600 mt-1">
          Ajukan diri Anda untuk mengajar mata kuliah yang tersedia pada periode
          akademik aktif.
        </p>
      </div>

      {availableCourses.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border">
          <AlertTriangle className="mx-auto h-10 w-10 text-yellow-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-800">
            Tidak Ada Mata Kuliah
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Saat ini tidak ada mata kuliah yang tersedia untuk diajukan.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <ul className="divide-y divide-gray-200">
            {availableCourses.map((course) => {
              const status = getAssignmentStatus(course.id);
              return (
                <li
                  key={course.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-700 truncate">
                      {course.nama}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{course.sks} SKS</span>
                      <span>•</span>
                      <span>Semester {course.semester}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {status ? (
                      <StatusBadge status={status} />
                    ) : (
                      <button
                        onClick={() => handlePropose(course.id)}
                        className={`${BUTTON.primary} inline-flex items-center gap-2 text-xs`}
                      >
                        <Send size={14} />
                        Ajukan
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AjukanPenugasan;
