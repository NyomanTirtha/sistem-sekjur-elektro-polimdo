import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Phone,
  MapPin,
  X,
  User,
  Building
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../../utilitas/notifikasi/alertUtils';
import Loading from '../../umum/Loading';
import { getTheme } from '../../../utilitas/theme';
import { TABLE, BUTTON, BADGE } from '../../../constants/colors';

const API_BASE = 'http://localhost:5000/api';

export default function DosenList({ authToken, currentUser }) {
  const [dosen, setDosen] = useState([]);
  const [programStudi, setProgramStudi] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    prodiId: '',
    noTelp: '',
    alamat: ''
  });

  // Pagination options
  const itemsPerPageOptions = [
    { value: 10, label: '10 per halaman' },
    { value: 25, label: '25 per halaman' },
    { value: 50, label: '50 per halaman' },
    { value: 100, label: '100 per halaman' }
  ];

  // Get current user role for permission checks
  const userRole = currentUser?.role?.toLowerCase();

  // Check if user has permission to add/edit
  const canAddEdit = () => {
    return ['sekjur', 'kaprodi'].includes(userRole);
  };

  // Check if user has permission to delete
  const canDelete = () => {
    return ['sekjur'].includes(userRole);
  };

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterProdi, itemsPerPage]);

  // Helper function to make authenticated API calls
  const apiCall = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    };

    return fetch(url, {
      ...options,
      headers
    });
  };

  // Fetch all data
  const fetchDosen = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(`${API_BASE}/dosen`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDosen(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching dosen:', error);
      setError('Gagal mengambil data dosen');
      setDosen([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramStudi = async () => {
    try {
      const response = await apiCall(`${API_BASE}/prodi`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Handle both formats: direct array or { success: true, data: [...] }
      if (data && data.success && Array.isArray(data.data)) {
        setProgramStudi(data.data);
      } else if (Array.isArray(data)) {
        setProgramStudi(data);
      } else {
        setProgramStudi([]);
      }
    } catch (error) {
      console.error('Error fetching program studi:', error);
      setProgramStudi([]);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchDosen();
      fetchProgramStudi();
    }
  }, [authToken]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAddEdit()) {
      showWarningAlert('Anda tidak memiliki izin untuk melakukan tindakan ini.');
      return;
    }

    // Validate required fields
    if (!formData.nama || !formData.nip || !formData.prodiId) {
      showWarningAlert('Nama, NIP, dan Program Studi wajib diisi');
      return;
    }

    const confirmMessage = editData
      ? `Apakah Anda yakin ingin memperbarui data dosen "${formData.nama}" (NIP: ${formData.nip})?\n\nData yang sudah diperbarui tidak dapat dikembalikan.`
      : `Apakah Anda yakin ingin menambahkan dosen baru dengan nama "${formData.nama}" (NIP: ${formData.nip})?`;

    showConfirm(
      confirmMessage,
      async () => {
        try {
          const url = editData
            ? `${API_BASE}/dosen/${editData.nip}`
            : `${API_BASE}/dosen`;

          const method = editData ? 'PUT' : 'POST';

          const submitData = {
            ...formData,
            prodiId: parseInt(formData.prodiId)
          };

          const response = await apiCall(url, {
            method,
            body: JSON.stringify(submitData),
          });

          if (response.ok) {
            setShowModal(false);
            resetForm();
            fetchDosen();
            showSuccessAlert(editData ? 'Data dosen berhasil diperbarui!' : 'Data dosen berhasil ditambahkan!');
          } else {
            const errorData = await response.json();
            showErrorAlert(errorData.error || 'Terjadi kesalahan');
          }
        } catch (error) {
          console.error('Error submitting form:', error);
          showErrorAlert('Terjadi kesalahan saat menyimpan data');
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
      'Apakah Anda yakin ingin menghapus data dosen ini?',
      async () => {
        try {
          const response = await fetch(`${API_BASE}/dosen/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            showSuccessAlert('Dosen berhasil dihapus!');
            fetchDosen();
          } else {
            const errorData = await response.json();
            showErrorAlert(errorData.error || 'Gagal menghapus dosen');
          }
        } catch (error) {
          console.error('Error deleting dosen:', error);
          showErrorAlert('Terjadi kesalahan saat menghapus dosen');
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Hapus Dosen',
      'danger',
      'Hapus',
      'Batal'
    );
  };

  const openModal = (data = null) => {
    if (!canAddEdit()) {
      showWarningAlert('Anda tidak memiliki izin untuk melakukan tindakan ini.');
      return;
    }

    setEditData(data);
    if (data) {
      setFormData({
        nama: data.nama || '',
        nip: data.nip || '',
        prodiId: data.prodiId ? data.prodiId.toString() : '',
        noTelp: data.noTelp || '',
        alamat: data.alamat || ''
      });
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      nip: '',
      prodiId: '',
      noTelp: '',
      alamat: ''
    });
    setEditData(null);
  };

  // Filter and search functionality - Optimized with useMemo
  const filteredDosen = useMemo(() => {
    return Array.isArray(dosen) ? dosen.filter(dsn => {
      const matchesSearch = dsn.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dsn.nip.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProdi = filterProdi === '' ||
                          (dsn.prodi && dsn.prodi.id === parseInt(filterProdi));

      return matchesSearch && matchesProdi;
    }) : [];
  }, [dosen, searchTerm, filterProdi]);

  // Calculate program studi count - show total available program studi
  const prodiCount = useMemo(() => {
    return programStudi.length;
  }, [programStudi]);

  // Calculate pagination - Optimized with useMemo
  const paginationData = useMemo(() => {
    const totalItems = filteredDosen.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDosen = filteredDosen.slice(startIndex, endIndex);

    // Generate page numbers
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftOffset = Math.floor(maxVisiblePages / 2);
      const rightOffset = maxVisiblePages - leftOffset - 1;

      let start = Math.max(1, currentPage - leftOffset);
      let end = Math.min(totalPages, currentPage + rightOffset);

      if (end - start + 1 < maxVisiblePages) {
        if (start === 1) {
          end = Math.min(totalPages, start + maxVisiblePages - 1);
        } else {
          start = Math.max(1, end - maxVisiblePages + 1);
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return { totalItems, totalPages, startIndex, endIndex, currentDosen, pages };
  }, [filteredDosen, currentPage, itemsPerPage]);

  const { totalItems, totalPages, startIndex, endIndex, currentDosen, pages: pageNumbers } = paginationData;

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // Show loading if no auth token
  if (!authToken) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading message="Memuat..." size="md" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Terjadi Kesalahan</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setError(null);
            fetchDosen();
            fetchProgramStudi();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Program Studi */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Semua Program Studi</option>
              {Array.isArray(programStudi) && programStudi.map(prodi => (
                <option key={prodi.id} value={prodi.id}>{prodi.nama}</option>
              ))}
            </select>
          </div>

          {/* Items per page */}
          <div>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canAddEdit() && (
          <button
            onClick={() => openModal()}
            className={`${BUTTON.primary} flex items-center justify-center whitespace-nowrap min-w-[200px]`}
          >
            <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
            Tambah Dosen
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">Total Dosen</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">{dosen.length}</p>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">Program Studi</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">{prodiCount}</p>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <Filter className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">Hasil Filter</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">{totalItems}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Table Header Info */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">
              Data Dosen ({totalItems} total, menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)})
            </h3>
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loading message="Memuat data..." size="md" />
            </div>
          ) : (
            <>
              <table className="w-full">
                  <thead className={TABLE.header}>
                    <tr>
                      <th className={`${TABLE.headerText} text-left px-4 py-3 w-16`}>No</th>
                      <th className={`${TABLE.headerText} text-left px-4 py-3`}>Nama</th>
                      <th className={`${TABLE.headerText} text-left px-4 py-3`}>NIP</th>
                      <th className={`${TABLE.headerText} text-left px-4 py-3`}>Program Studi</th>
                      <th className={`${TABLE.headerText} text-left px-4 py-3`}>No. Telp</th>
                      <th className={`${TABLE.headerText} text-left px-4 py-3`}>Alamat</th>
                      {(canAddEdit() || canDelete()) && (
                        <th className={`${TABLE.headerText} text-center px-4 py-3 w-24`}>Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                  {currentDosen.map((dsn, index) => {
                    const globalIndex = startIndex + index;

                    return (
                      <tr key={dsn.nip} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700">{globalIndex + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="truncate" title={dsn.nama}>{dsn.nama}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                          <div className="truncate" title={dsn.nip}>{dsn.nip}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="truncate" title={dsn.prodi ? dsn.prodi.nama : '-'}>{dsn.prodi ? dsn.prodi.nama : '-'}</div>
                        </td>
                        <td className="p-3 text-sm text-gray-900">
                          <div className="truncate" title={dsn.noTelp || '-'}>{dsn.noTelp || '-'}</div>
                        </td>
                        <td className="p-3 text-sm text-gray-900">
                          <div className="truncate" title={dsn.alamat || '-'}>{dsn.alamat || '-'}</div>
                        </td>
                        {(canAddEdit() || canDelete()) && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center items-center gap-2">
                              {canAddEdit() && (
                                <button
                                  onClick={() => openModal(dsn)}
                                  className={BUTTON.iconPrimary}
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete() && (
                                <button
                                  onClick={() => handleDelete(dsn.nip)}
                                  className={BUTTON.iconDanger}
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  </tbody>
                </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      Menampilkan <span className="font-medium">{startIndex + 1}</span> sampai{' '}
                      <span className="font-medium">{Math.min(endIndex, totalItems)}</span> dari{' '}
                      <span className="font-medium">{totalItems}</span> dosen
                    </div>

                    <div className="flex items-center gap-2">
                      {/* First Page */}
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="Halaman pertama"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>

                      {/* Previous Page */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="Halaman sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Page Numbers */}
                      <div className="flex gap-1">
                        {pageNumbers.map(page => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm rounded ${
                              page === currentPage
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      {/* Next Page */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="Halaman selanjutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Last Page */}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="Halaman terakhir"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && currentDosen.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Users className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tidak ada data dosen</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterProdi ? 'Coba ubah filter atau kata kunci pencarian' : 'Mulai dengan menambahkan dosen baru'}
              </p>
              {!searchTerm && !filterProdi && canAddEdit() && (
                <button
                  onClick={() => openModal()}
                  className={`${BUTTON.primary} inline-flex items-center justify-center whitespace-nowrap min-w-[200px]`}
                >
                  <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
                  Tambah Dosen Pertama
                </button>
              )}
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
                      {editData ? 'Edit Data Dosen' : 'Tambah Dosen Baru'}
                    </h2>
                    <p className="text-sm text-gray-200">
                      {editData ? 'Perbarui informasi dosen' : 'Lengkapi informasi dosen baru'}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.nama}
                            onChange={(e) => setFormData({...formData, nama: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Masukkan nama lengkap"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          NIP <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.nip}
                            onChange={(e) => setFormData({...formData, nip: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Masukkan NIP"
                            required
                            disabled={editData}
                          />
                        </div>
                        {editData && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <span className="mr-1">ℹ️</span>
                            NIP tidak dapat diubah
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Program Studi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          value={formData.prodiId}
                          onChange={(e) => setFormData({...formData, prodiId: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                          required
                        >
                          <option value="">Pilih Program Studi</option>
                          {Array.isArray(programStudi) && programStudi.map(prodi => (
                            <option key={prodi.id} value={prodi.id}>{prodi.nama}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No. Telepon
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.noTelp}
                          onChange={(e) => setFormData({...formData, noTelp: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alamat
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <textarea
                          value={formData.alamat}
                          onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows="3"
                          placeholder="Alamat lengkap"
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
}
