import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Check, X, User, Book, AlertTriangle } from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showConfirm, showPrompt } from '../../../utilitas/notifikasi/alertUtils';
import Loading from '../../umum/Loading';
import { BUTTON } from '../../../constants/colors';

const ReviewPenugasan = ({ authToken }) => {
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/penugasan/for-kaprodi', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        setPendingAssignments(response.data.data);
      }
    } catch (error) {
      showErrorAlert('Gagal memuat data pengajuan.');
      console.error('Error fetching pending assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchPendingAssignments();
  }, [fetchPendingAssignments]);

  const handleApprove = async (assignmentId) => {
    showConfirm(
      'Apakah Anda yakin ingin menyetujui pengajuan ini?',
      async () => {
        try {
          const response = await axios.post(
            `http://localhost:5000/api/penugasan/${assignmentId}/approve`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          if (response.data.success) {
            showSuccessAlert('Pengajuan berhasil disetujui!');
            fetchPendingAssignments(); // Refresh data
          }
        } catch (error) {
          showErrorAlert(error.response?.data?.message || 'Gagal menyetujui pengajuan.');
          console.error('Error approving assignment:', error);
        }
      },
      'Konfirmasi Persetujuan'
    );
  };

  const handleReject = async (assignmentId) => {
    showPrompt(
      'Alasan Penolakan',
      'Masukkan alasan mengapa pengajuan ini ditolak (opsional).',
      async (reason) => {
        try {
          const response = await axios.post(
            `http://localhost:5000/api/penugasan/${assignmentId}/reject`,
            { reason: reason || 'Ditolak oleh Kaprodi' },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          if (response.data.success) {
            showSuccessAlert('Pengajuan telah ditolak.');
            fetchPendingAssignments(); // Refresh data
          }
        } catch (error) {
          showErrorAlert(error.response?.data?.message || 'Gagal menolak pengajuan.');
          console.error('Error rejecting assignment:', error);
        }
      },
      'Tolak Pengajuan'
    );
  };

  if (loading) {
    return <Loading message="Memuat data pengajuan dari dosen..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Penugasan Mengajar</h1>
        <p className="text-gray-600 mt-1">
          Verifikasi pengajuan tugas mengajar dari dosen di program studi Anda.
        </p>
      </div>

      {pendingAssignments.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border">
            <AlertTriangle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-800">Tidak Ada Pengajuan</h3>
            <p className="text-sm text-gray-600 mt-1">Saat ini tidak ada pengajuan penugasan mengajar yang perlu direview.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <ul className="divide-y divide-gray-200">
            {pendingAssignments.map(assignment => (
              <li key={assignment.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                      <User size={16} className="text-gray-500"/>
                      <p className="text-sm font-semibold text-gray-800 truncate">{assignment.dosen.nama}</p>
                  </div>
                   <div className="flex items-center gap-2">
                      <Book size={16} className="text-gray-500"/>
                      <p className="text-sm text-gray-600 truncate">Ingin mengajar: <span className="font-medium text-blue-700">{assignment.mataKuliah.nama}</span></p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex gap-2">
                  <button
                    onClick={() => handleReject(assignment.id)}
                    className={`${BUTTON.danger} inline-flex items-center gap-1.5 text-xs`}
                  >
                    <X size={14} />
                    Tolak
                  </button>
                  <button
                    onClick={() => handleApprove(assignment.id)}
                    className={`${BUTTON.success} inline-flex items-center gap-1.5 text-xs`}
                  >
                    <Check size={14} />
                    Setujui
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReviewPenugasan;
