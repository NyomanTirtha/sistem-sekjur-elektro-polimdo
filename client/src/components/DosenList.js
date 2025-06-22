import React, { useState, useEffect } from 'react';
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
  MapPin
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../utils/alertUtils';

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
    return ['admin', 'kaprodi'].includes(userRole);
  };

  // Check if user has permission to delete
  const canDelete = () => {
    return ['admin'].includes(userRole);
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
      setProgramStudi(Array.isArray(data) ? data : []);
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
      alert('Anda tidak memiliki izin untuk melakukan tindakan ini.');
      return;
    }
    
    // Validate required fields
    if (!formData.nama || !formData.nip || !formData.prodiId) {
      alert('Nama, NIP, dan Program Studi wajib diisi');
      return;
    }
    
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
        alert(editData ? 'Data dosen berhasil diperbarui!' : 'Data dosen berhasil ditambahkan!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    }
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
      alert('Anda tidak memiliki izin untuk melakukan tindakan ini.');
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

  // Filter and search functionality
  const filteredDosen = Array.isArray(dosen) ? dosen.filter(dsn => {
    const matchesSearch = dsn.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dsn.nip.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProdi = filterProdi === '' || 
                        (dsn.prodi && dsn.prodi.id === parseInt(filterProdi));
    
    return matchesSearch && matchesProdi;
  }) : [];

  // Calculate pagination
  const totalItems = filteredDosen.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDosen = filteredDosen.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
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
    
    return pages;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Show loading if no auth token
  if (!authToken) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Memuat...</span>
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
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Dosen
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Dosen</p>
              <p className="text-2xl font-bold text-gray-900">{dosen.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Program Studi</p>
              <p className="text-2xl font-bold text-gray-900">{programStudi.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Filter className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hasil Filter</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-900">No</th>
                    <th className="text-left p-4 font-medium text-gray-900">Nama</th>
                    <th className="text-left p-4 font-medium text-gray-900">NIP</th>
                    <th className="text-left p-4 font-medium text-gray-900">Program Studi</th>
                    <th className="text-left p-4 font-medium text-gray-900">No. Telp</th>
                    <th className="text-left p-4 font-medium text-gray-900">Alamat</th>
                    {(canAddEdit() || canDelete()) && (
                      <th className="text-center p-4 font-medium text-gray-900">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentDosen.map((dsn, index) => {
                    const globalIndex = startIndex + index;
                    
                    return (
                      <tr key={dsn.nip} className={`border-b hover:bg-gray-50 ${globalIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="p-4">{globalIndex + 1}</td>
                        <td className="p-4">{dsn.nama}</td>
                        <td className="p-4">{dsn.nip}</td>
                        <td className="p-4">{dsn.prodi ? dsn.prodi.nama : '-'}</td>
                        <td className="p-4">{dsn.noTelp || '-'}</td>
                        <td className="p-4 max-w-xs truncate" title={dsn.alamat}>{dsn.alamat || '-'}</td>
                        {(canAddEdit() || canDelete()) && (
                          <td className="p-4">
                            <div className="flex justify-center space-x-2">
                              {canAddEdit() && (
                                <button
                                  onClick={() => openModal(dsn)}
                                  className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete() && (
                                <button
                                  onClick={() => handleDelete(dsn.nip)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
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
                        {getPageNumbers().map(page => (
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Tambah Dosen Pertama
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editData ? 'Edit Dosen' : 'Tambah Dosen'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nip}
                  onChange={(e) => setFormData({...formData, nip: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Masukkan NIP"
                  required
                  disabled={editData} // NIP tidak bisa diubah saat edit
                />
                {editData && (
                  <p className="text-xs text-gray-500 mt-1">NIP tidak dapat diubah</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Studi <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.prodiId}
                  onChange={(e) => setFormData({...formData, prodiId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Pilih Program Studi</option>
                  {Array.isArray(programStudi) && programStudi.map(prodi => (
                    <option key={prodi.id} value={prodi.id}>{prodi.nama}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telepon
                </label>
                <input
                  type="text"
                  value={formData.noTelp}
                  onChange={(e) => setFormData({...formData, noTelp: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                  placeholder="Alamat lengkap"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editData ? 'Perbarui Data' : 'Simpan Data'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}