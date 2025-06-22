import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, BookOpen, Users, GraduationCap } from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../utils/alertUtils';

const API_BASE = 'http://localhost:5000/api';

const ProdiContent = ({ authToken }) => {
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
      if (Array.isArray(data)) {
        setProdi(data);
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
    e.preventDefault();
    
    try {
      const url = editData 
        ? `${API_BASE}/prodi/${editData.id}`
        : `${API_BASE}/prodi`;
      
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Success:', result);
      
      setShowModal(false);
      resetForm();
      fetchProdi();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(`Gagal menyimpan data: ${error.message}`);
    }
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
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Program Studi
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Program Studi</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(prodi) ? prodi.length : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Dosen</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(prodi) ? prodi.reduce((total, p) => total + (p.dosen?.length || 0), 0) : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Mahasiswa</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(prodi) ? prodi.reduce((total, p) => total + (p.mahasiswa?.length || 0), 0) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-900">No</th>
                  <th className="text-left p-4 font-medium text-gray-900">Nama Program Studi</th>
                  <th className="text-left p-4 font-medium text-gray-900">Ketua Prodi</th>
                  <th className="text-left p-4 font-medium text-gray-900">Jumlah Dosen</th>
                  <th className="text-left p-4 font-medium text-gray-900">Jumlah Mahasiswa</th>
                  <th className="text-left p-4 font-medium text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProdi.map((prd, index) => (
                  <tr key={prd.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4">{prd.nama || '-'}</td>
                    <td className="p-4">{prd.ketuaProdi || '-'}</td>
                    <td className="p-4">{prd.dosen?.length || 0}</td>
                    <td className="p-4">{prd.mahasiswa?.length || 0}</td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(prd)}
                          className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prd.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
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
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editData ? 'Edit Program Studi' : 'Tambah Program Studi'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Program Studi</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Ketua Program Studi</label>
                <input
                  type="text"
                  value={formData.ketuaProdi}
                  onChange={(e) => setFormData({...formData, ketuaProdi: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  {editData ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
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
};

export default ProdiContent;