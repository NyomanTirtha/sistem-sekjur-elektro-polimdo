import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, BookOpen, Users, GraduationCap, X, Building, User } from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../../utils/notifikasi/alertUtils';
import Loading from '../../common/Loading';
import { getTheme } from '../../../utils/theme';
import { TABLE, BUTTON, BADGE } from '../../../constants/colors';

const API_BASE = 'http://localhost:5000/api';

const ProdiContent = ({ authToken, currentUser }) => {
  const [prodi, setProdi] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    ketuaProdi: ''
  });

  // Headers untuk API calls
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  });

  // Fetch program studi data
  const fetchProdi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/prodi`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Pastikan data adalah array
      if (data && data.success && Array.isArray(data.data)) {
        setProdi(data.data);
      } else {
        console.error('Data prodi bukan array:', data);
        setProdi([]);
        setError('Format data tidak valid');
      }
    } catch (error) {
      console.error('Error fetching program studi:', error);
      setError(`Gagal mengambil data program studi: ${error.message}`);
      setProdi([]); // Set ke array kosong jika error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchProdi();
    }
  }, [authToken]);

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const confirmMessage = editData
      ? `Apakah Anda yakin ingin memperbarui program studi "${formData.nama}"?\n\nData yang sudah diperbarui tidak dapat dikembalikan.`
      : `Apakah Anda yakin ingin menambahkan program studi baru dengan nama "${formData.nama}"?`;

    showConfirm(
      confirmMessage,
      async () => {
        try {
          const url = editData
            ? `${API_BASE}/prodi/${editData.id}`
            : `${API_BASE}/prodi`;

          const method = editData ? 'PUT' : 'POST';

          const submitData = editData
            ? { ...formData }
            : { ...formData, jurusanId: currentUser?.jurusanId };

          const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(submitData),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log('Success:', result);

          setShowModal(false);
          resetForm();
          fetchProdi();
          showSuccessAlert(editData ? 'Program studi berhasil diperbarui!' : 'Program studi berhasil ditambahkan!');
        } catch (error) {
          console.error('Error submitting form:', error);
          showErrorAlert(`Gagal menyimpan data: ${error.message}`);
          setError(`Gagal menyimpan data: ${error.message}`);
        }
      },
      () => {
        // User cancelled
      },
      editData ? 'Konfirmasi Perbarui Data' : 'Konfirmasi Tambah Data',
      'warning',
      editData ? 'Perbarui' : 'Tambah',
      'Batal'
    );
  };

  // Handle delete
  const handleDelete = async (id) => {
    showConfirm(
      'Apakah Anda yakin ingin menghapus data program studi ini?',
      async () => {
        try {
          const response = await fetch(`${API_BASE}/prodi/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
          });

          if (response.ok) {
            showSuccessAlert('Program studi berhasil dihapus!');
            fetchProdi();
          } else {
            const errorData = await response.json();
            showErrorAlert(errorData.error || 'Gagal menghapus program studi');
          }
        } catch (error) {
          console.error('Error deleting prodi:', error);
          showErrorAlert('Terjadi kesalahan saat menghapus program studi');
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Hapus Program Studi',
      'danger',
      'Hapus',
      'Batal'
    );
  };

  const openModal = (data = null) => {
    setEditData(data);
    if (data) {
      setFormData({
        nama: data.nama || '',
        ketuaProdi: data.ketuaProdi || ''
      });
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      ketuaProdi: ''
    });
    setEditData(null);
  };

  // Filter and search functionality - pastikan prodi adalah array
  const filteredProdi = Array.isArray(prodi) ? prodi.filter(prd => {
    const matchesSearch = (prd.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prd.ketuaProdi || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama prodi atau ketua prodi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
        </div>

        <button
          onClick={() => openModal()}
          className={`${BUTTON.primary} flex items-center justify-center whitespace-nowrap min-w-[200px]`}
        >
          <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
          Tambah Program Studi
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">Total Program Studi</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {Array.isArray(prodi) ? prodi.length : 0}
          </p>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">Total Dosen</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {Array.isArray(prodi) ? prodi.reduce((total, p) => total + (p._count?.dosen || 0), 0) : 0}
          </p>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">Total Mahasiswa</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {Array.isArray(prodi) ? prodi.reduce((total, p) => total + (p._count?.mahasiswa || 0), 0) : 0}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Table Header Info */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">
              Data Program Studi ({filteredProdi.length} total)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loading message="Memuat data program studi..." size="md" />
            </div>
          ) : (
              <table className="w-full">
                  <thead className={TABLE.header}>
                    <tr>
                      <th className={`${TABLE.headerText} text-left px-4 py-3 w-16`}>No</th>
                      <th className={`${TABLE.headerText} text-left px-4 py-3`}>Nama Program Studi</th>
                      <th className={`${TABLE.headerText} text-left px-4 py-3`}>Ketua Program Studi</th>
                      <th className={`${TABLE.headerText} text-center px-4 py-3 w-32`}>Jumlah Dosen</th>
                      <th className={`${TABLE.headerText} text-center px-4 py-3 w-40`}>Jumlah Mahasiswa</th>
                      <th className={`${TABLE.headerText} text-center px-4 py-3 w-24`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                  {filteredProdi.map((prd, index) => (
                    <tr key={prd.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate" title={prd.nama || '-'}>{prd.nama || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 truncate" title={prd.ketuaProdi || '-'}>{prd.ketuaProdi || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">{prd._count?.dosen || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">{prd._count?.mahasiswa || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => openModal(prd)}
                            className={BUTTON.iconPrimary}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prd.id)}
                            className={BUTTON.iconDanger}
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
          )}

          {!loading && filteredProdi.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <BookOpen className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tidak ada data program studi</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan menambahkan program studi baru'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowModal(false);
                  resetForm();
                }
              }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                style={{ zIndex: 10000 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className={`p-6 ${TABLE.header} border-b border-gray-800`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">
                        {editData ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}
                      </h2>
                      <p className="text-sm text-gray-200">
                        {editData ? 'Perbarui informasi program studi' : 'Lengkapi informasi program studi baru'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Program Studi <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.nama}
                            onChange={(e) => setFormData({...formData, nama: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Masukkan nama program studi"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ketua Program Studi <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.ketuaProdi}
                            onChange={(e) => setFormData({...formData, ketuaProdi: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Masukkan nama ketua program studi"
                            required
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className={BUTTON.secondary}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className={BUTTON.primary}
                  >
                    {editData ? 'Perbarui Data' : 'Simpan Data'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ProdiContent;
