import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Users, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  GraduationCap,
  Phone,
  MapPin,
  Calendar,
  X,
  Building,
  IdCard
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../../utilitas/notifikasi/alertUtils';
import { getProgramStudiName } from '../../../utilitas/helper/programStudiUtils';

const API_BASE = 'http://localhost:5000/api';

// Skeleton Loading Component
const TableSkeleton = ({ rows = 5, columns = 8 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-4 font-medium text-gray-900">No</th>
            <th className="text-left p-4 font-medium text-gray-900">Nama</th>
            <th className="text-left p-4 font-medium text-gray-900">NIM</th>
            <th className="text-left p-4 font-medium text-gray-900">Program Studi</th>
            <th className="text-left p-4 font-medium text-gray-900">Angkatan</th>
            <th className="text-left p-4 font-medium text-gray-900">Semester</th>
            <th className="text-left p-4 font-medium text-gray-900">No. Telp</th>
            <th className="text-left p-4 font-medium text-gray-900">Alamat</th>
            <th className="text-center p-4 font-medium text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Statistics Skeleton
const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-gray-200 rounded-lg animate-pulse">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
            </div>
            <div className="ml-4 flex-1">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function MahasiswaList({ authToken, currentUser }) {
  const [mahasiswa, setMahasiswa] = useState([]);
  const [programStudi, setProgramStudi] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    nama: '',
    nim: '',
    programStudiId: '',
    angkatan: '',
    semester: '',
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

  // Get current user role from currentUser prop
  const userRole = currentUser?.role?.toLowerCase();

  // Helper function to create headers with auth token
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  });

  // Check if user has permission to perform certain actions
  const canAddEdit = () => {
    return ['sekjur', 'dosen', 'kaprodi'].includes(userRole);
  };

  const canDelete = () => {
    return ['sekjur'].includes(userRole);
  };

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterProdi, itemsPerPage]);

  // Fetch data functions with authentication
  const fetchProgramStudi = async () => {
    try {
      const response = await fetch(`${API_BASE}/prodi`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        // ✅ FIXED: Handle 403 error dengan lebih baik
        if (response.status === 403) {
          console.warn('Tidak memiliki akses untuk melihat program studi. Ini normal untuk beberapa role.');
          setProgramStudi([]);
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // ✅ FIXED: Handle response format dari backend (success: true, data: [...])
      const prodiList = data.success && data.data ? data.data : (Array.isArray(data) ? data : []);
      setProgramStudi(prodiList);
      return prodiList;
    } catch (error) {
      console.error('Error fetching program studi:', error);
      if (error.message.includes('401')) {
        showWarningAlert('Sesi telah berakhir. Silakan login kembali.');
      } else if (error.message.includes('403')) {
        // ✅ FIXED: 403 adalah expected untuk beberapa role, tidak perlu alert
        console.warn('Akses ditolak untuk melihat program studi');
      }
      setProgramStudi([]);
      return [];
    }
  };

  const fetchMahasiswa = async (prodiData = []) => {
    if (!initialLoad) {
    setLoading(true);
    }
    
    try {
      const response = await fetch(`${API_BASE}/mahasiswa`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Pastikan data mahasiswa memiliki relasi prodi
      const mahasiswaWithRelations = data.map(mhs => {
        const selectedProdi = mhs.programStudi || prodiData.find(p => p.id === mhs.programStudiId);
        
        return {
          ...mhs,
          programStudi: selectedProdi || null
        };
      });
      
      setMahasiswa(mahasiswaWithRelations);
    } catch (error) {
      console.error('Error fetching mahasiswa:', error);
      if (error.message.includes('401')) {
        showWarningAlert('Sesi telah berakhir. Silakan login kembali.');
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    // Only fetch data if authToken is available
    if (authToken) {
      const loadData = async () => {
        const prodiData = await fetchProgramStudi();
        await fetchMahasiswa(prodiData);
      };
      loadData();
    }
  }, [authToken]);

  // Handle form submission with authentication
  const handleSubmit = async () => {
    if (!canAddEdit()) {
      showWarningAlert('Anda tidak memiliki izin untuk melakukan tindakan ini.');
      return;
    }

    // Validate required fields
    if (!formData.nama || !formData.nim || !formData.programStudiId || 
        !formData.angkatan || !formData.semester || !formData.noTelp || !formData.alamat) {
      showWarningAlert('Semua field yang bertanda * wajib diisi');
      return;
    }

    const action = editData ? 'memperbarui' : 'menambahkan';
    const confirmMessage = editData 
      ? `Apakah Anda yakin ingin memperbarui data mahasiswa "${formData.nama}" (NIM: ${formData.nim})?\n\nData yang sudah diperbarui tidak dapat dikembalikan.`
      : `Apakah Anda yakin ingin menambahkan mahasiswa baru dengan nama "${formData.nama}" (NIM: ${formData.nim})?`;

    showConfirm(
      confirmMessage,
      async () => {
        try {
          const submitData = {
            ...formData,
            programStudiId: parseInt(formData.programStudiId),
            semester: parseInt(formData.semester)
          };

          const url = editData 
            ? `${API_BASE}/mahasiswa/${editData.nim}`
            : `${API_BASE}/mahasiswa`;
          
          const method = editData ? 'PUT' : 'POST';
          
          console.log('Submitting data:', {
            url,
            method,
            data: submitData
          });

          const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(submitData),
          });

          if (response.ok) {
            setShowModal(false);
            resetForm();
            await fetchMahasiswa();
            showSuccessAlert(editData ? 'Data mahasiswa berhasil diperbarui!' : 'Data mahasiswa berhasil ditambahkan!');
          } else {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            if (response.status === 401) {
              showWarningAlert('Sesi telah berakhir. Silakan login kembali.');
            } else {
              showErrorAlert(errorData.message || 'Terjadi kesalahan saat menyimpan data');
            }
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

  // Handle delete with authentication
  const handleDelete = async (id) => {
    showConfirm(
      'Apakah Anda yakin ingin menghapus data mahasiswa ini?',
      async () => {
        try {
          const response = await fetch(`${API_BASE}/mahasiswa/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            showSuccessAlert('Mahasiswa berhasil dihapus!');
            fetchMahasiswa();
          } else {
            const errorData = await response.json();
            showErrorAlert(errorData.error || 'Gagal menghapus mahasiswa');
          }
        } catch (error) {
          console.error('Error deleting mahasiswa:', error);
          showErrorAlert('Terjadi kesalahan saat menghapus mahasiswa');
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Hapus Mahasiswa',
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
        nama: data.nama,
        nim: data.nim,
        programStudiId: data.programStudiId.toString(),
        angkatan: data.angkatan,
        semester: data.semester.toString(),
        noTelp: data.noTelp,
        alamat: data.alamat
      });
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      nim: '',
      programStudiId: '',
      angkatan: '',
      semester: '',
      noTelp: '',
      alamat: ''
    });
    setEditData(null);
  };

  // Filter and search functionality - Optimized with useMemo
  const filteredMahasiswa = React.useMemo(() => {
    return mahasiswa.filter(mhs => {
      const matchesSearch = mhs.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mhs.nim.toLowerCase().includes(searchTerm.toLowerCase());
      
      const prodiData = mhs.programStudi || programStudi.find(p => p.id === mhs.programStudiId);
      const prodiName = prodiData?.nama || getProgramStudiName(mhs.programStudiId);
      const matchesProdi = filterProdi === '' || prodiName === filterProdi;
      
      return matchesSearch && matchesProdi;
    });
  }, [mahasiswa, searchTerm, filterProdi, programStudi]);

  // Calculate pagination - Optimized with useMemo
  const paginationData = React.useMemo(() => {
    const totalItems = filteredMahasiswa.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentMahasiswa = filteredMahasiswa.slice(startIndex, endIndex);
    
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
    
    return { totalItems, totalPages, startIndex, endIndex, currentMahasiswa, pages };
  }, [filteredMahasiswa, currentPage, itemsPerPage]);

  const { totalItems, totalPages, startIndex, endIndex, currentMahasiswa, pages: pageNumbers } = paginationData;

  const handlePageChange = React.useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = React.useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // Get unique program studi for filter
  const uniqueProdi = [...new Set(
    mahasiswa.map(mhs => {
      const prodiData = mhs.programStudi || programStudi.find(p => p.id === mhs.programStudiId);
      return prodiData?.nama || getProgramStudiName(mhs.programStudiId);
    }).filter(Boolean)
  )];

  // Show loading if no auth token
  if (!authToken) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Memuat...</span>
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
              placeholder="Cari nama atau NIM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Semua Program Studi</option>
              {uniqueProdi.map(prodi => (
                <option key={prodi} value={prodi}>{prodi}</option>
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
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Mahasiswa
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      {loading && initialLoad ? (
        <StatsSkeleton />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4 text-blue-500 opacity-70" />
            <p className="text-xs text-gray-500">Total Mahasiswa</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">{mahasiswa.length}</p>
        </div>
        
        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-green-500 opacity-70" />
            <p className="text-xs text-gray-500">Program Studi</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">{programStudi.length}</p>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <Filter className="w-4 h-4 text-purple-500 opacity-70" />
            <p className="text-xs text-gray-500">Hasil Filter</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">{totalItems}</p>
        </div>
      </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Table Header Info */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">
              Data Mahasiswa ({totalItems} total, menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)})
            </h3>
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="transition-opacity duration-300 ease-in-out">
              <TableSkeleton />
            </div>
          ) : (
            <div className="transition-opacity duration-300 ease-in-out opacity-100">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">No</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Nama</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">NIM</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Program Studi</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Angkatan</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Semester</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">No. Telp</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Alamat</th>
                    {(canAddEdit() || canDelete()) && (
                      <th className="text-center p-3 text-sm font-semibold text-gray-700">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentMahasiswa.map((mhs, index) => {
                    const prodiData = mhs.programStudi || programStudi.find(p => p.id === mhs.programStudiId);
                    const prodiName = prodiData?.nama || getProgramStudiName(mhs.programStudiId);
                    const globalIndex = startIndex + index;
                    
                    return (
                      <tr 
                        key={mhs.nim} 
                        className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="p-3 text-sm text-gray-900">{globalIndex + 1}</td>
                        <td className="p-3 text-sm text-gray-900">{mhs.nama}</td>
                        <td className="p-3 text-sm text-gray-900">{mhs.nim}</td>
                        <td className="p-3 text-sm text-gray-900">{prodiName}</td>
                        <td className="p-3 text-sm text-gray-900">{mhs.angkatan || '-'}</td>
                        <td className="p-3 text-sm text-gray-900">{mhs.semester || '-'}</td>
                        <td className="p-3 text-sm text-gray-900">{mhs.noTelp || '-'}</td>
                        <td className="p-3 text-sm text-gray-900 max-w-xs truncate" title={mhs.alamat}>{mhs.alamat || '-'}</td>
                        {(canAddEdit() || canDelete()) && (
                          <td className="p-3 text-center">
                            <div className="flex justify-center space-x-2">
                              {canAddEdit() && (
                                <button
                                  onClick={() => openModal(mhs)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete() && (
                                <button
                                  onClick={() => handleDelete(mhs.nim)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
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
                      <span className="font-medium">{totalItems}</span> mahasiswa
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
            </div>
          )}
          
          {!loading && currentMahasiswa.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Users className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tidak ada data mahasiswa</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterProdi ? 'Coba ubah filter atau kata kunci pencarian' : 'Mulai dengan menambahkan mahasiswa baru'}
              </p>
              {!searchTerm && !filterProdi && canAddEdit() && (
                <button
                  onClick={() => openModal()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Tambah Mahasiswa Pertama
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
              <div className="p-6 text-white bg-blue-600 border-b border-blue-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      {editData ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}
                    </h2>
                    <p className="text-sm text-blue-100">
                      {editData ? 'Perbarui informasi mahasiswa' : 'Lengkapi informasi mahasiswa baru'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-blue-700 rounded transition-colors text-white"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="space-y-4">
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
                          NIM <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.nim}
                            onChange={(e) => setFormData({...formData, nim: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Masukkan NIM"
                            disabled={editData}
                            required
                          />
                        </div>
                        {editData && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <span className="mr-1">ℹ️</span>
                            NIM tidak dapat diubah
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
                          value={formData.programStudiId}
                          onChange={(e) => setFormData({...formData, programStudiId: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                          required
                        >
                          <option value="">Pilih Program Studi</option>
                          {programStudi.map(prodi => (
                            <option key={prodi.id} value={prodi.id}>{prodi.nama}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Angkatan <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.angkatan}
                            onChange={(e) => setFormData({...formData, angkatan: e.target.value})}
                            placeholder="2023"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Semester <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="number"
                            min="1"
                            max="14"
                            value={formData.semester}
                            onChange={(e) => setFormData({...formData, semester: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No. Telepon <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.noTelp}
                          onChange={(e) => setFormData({...formData, noTelp: e.target.value})}
                          placeholder="08xxxxxxxxxx"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alamat <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <textarea
                          value={formData.alamat}
                          onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                          placeholder="Alamat lengkap"
                          rows="3"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
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