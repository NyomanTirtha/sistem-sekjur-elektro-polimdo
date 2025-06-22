import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Shield,
  GraduationCap,
  User,
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../utils/alertUtils';

const UsersList = ({ authToken, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [showPassword, setShowPassword] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    password: '',
    confirmPassword: '',
    role: 'MAHASISWA'
  });

  const [formErrors, setFormErrors] = useState({});

  const roles = [
    { value: 'ADMIN', label: 'Admin', icon: Shield, color: 'text-red-600' },
    { value: 'KAPRODI', label: 'Kaprodi', icon: Crown, color: 'text-purple-600' },
    { value: 'DOSEN', label: 'Dosen', icon: GraduationCap, color: 'text-blue-600' },
    { value: 'MAHASISWA', label: 'Mahasiswa', icon: User, color: 'text-green-600' }
  ];

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
    return ['admin'].includes(userRole); // Only admin can add/edit users
  };

  // Check if user has permission to delete
  const canDelete = () => {
    return ['admin'].includes(userRole); // Only admin can delete users
  };

  useEffect(() => {
    fetchUsers();
  }, [authToken]);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, itemsPerPage]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch users:', errorData.error);
        showErrorAlert(errorData.error || 'Gagal mengambil data users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showErrorAlert('Terjadi kesalahan saat mengambil data users');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      nama: '',
      password: '',
      confirmPassword: '',
      role: 'MAHASISWA'
    });
    setFormErrors({});
    setEditingUser(null);
    setShowForm(false);
    setShowPassword(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username wajib diisi';
    } else if (formData.username.length < 3) {
      errors.username = 'Username minimal 3 karakter';
    }

    if (!formData.nama.trim()) {
      errors.nama = 'Nama wajib diisi';
    } else if (formData.nama.length < 2) {
      errors.nama = 'Nama minimal 2 karakter';
    }

    if (!editingUser) { // Only validate password for new users
      if (!formData.password) {
        errors.password = 'Password wajib diisi';
      } else if (formData.password.length < 3) {
        errors.password = 'Password minimal 3 karakter';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Konfirmasi password tidak cocok';
      }
    } else { // For editing, password is optional
      if (formData.password && formData.password.length < 3) {
        errors.password = 'Password minimal 3 karakter';
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Konfirmasi password tidak cocok';
      }
    }

    if (!formData.role) {
      errors.role = 'Role wajib dipilih';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const isEditing = !!editingUser;
    const action = isEditing ? 'mengedit' : 'membuat';
    
    const confirmMessage = isEditing 
      ? `Apakah Anda yakin ingin mengupdate akun "${formData.nama}" (${formData.username})?`
      : `Apakah Anda yakin ingin membuat akun baru untuk "${formData.nama}" dengan role ${formData.role}?`;

    if (!showConfirm(
      confirmMessage,
      async () => {
        try {
          const submitData = {
            username: formData.username,
            nama: formData.nama,
            role: formData.role
          };

          // Only include password if it's provided
          if (formData.password) {
            submitData.password = formData.password;
          }

          const url = isEditing 
            ? `http://localhost:5000/api/users/${editingUser.id}`
            : 'http://localhost:5000/api/users';
          
          const method = isEditing ? 'PUT' : 'POST';

          const response = await fetch(url, {
            method: method,
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(submitData)
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              showSuccessAlert(`Akun berhasil ${isEditing ? 'diupdate' : 'dibuat'}!`);
              resetForm();
              fetchUsers();
            } else {
              const errorData = await response.json();
              showErrorAlert(errorData.error || 'Terjadi kesalahan');
            }
          } else {
            const errorData = await response.json();
            showErrorAlert(errorData.error || 'Terjadi kesalahan');
          }
        } catch (error) {
          console.error(`Error ${action} user:`, error);
          showErrorAlert(`Terjadi kesalahan saat ${action} akun`);
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Perubahan Akun',
      'warning',
      'Simpan',
      'Batal'
    )) {
      return;
    }
  };

  const handleEdit = (user) => {
    if (!canAddEdit()) {
      showWarningAlert('Anda tidak memiliki izin untuk melakukan tindakan ini.');
      return;
    }

    setEditingUser(user);
    setFormData({
      username: user.username,
      nama: user.nama,
      password: '',
      confirmPassword: '',
      role: user.role
    });
    setShowForm(true);
    setFormErrors({});
  };

  const handleDelete = async (user) => {
    if (!canDelete()) {
      showWarningAlert('Anda tidak memiliki izin untuk menghapus data.');
      return;
    }

    // Prevent self-deletion
    if (user.id === currentUser?.id) {
      showWarningAlert('Anda tidak dapat menghapus akun sendiri!');
      return;
    }

    const confirmMessage = `Apakah Anda yakin ingin menghapus akun "${user.nama}" (${user.username})?\n\nTindakan ini tidak dapat dibatalkan.`;
    
    showConfirm(
      confirmMessage,
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              showSuccessAlert('Akun berhasil dihapus!');
              fetchUsers();
            } else {
              const errorData = await response.json();
              showErrorAlert(errorData.error || 'Gagal menghapus akun');
            }
          } else {
            const errorData = await response.json();
            showErrorAlert(errorData.error || 'Gagal menghapus akun');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          showErrorAlert('Terjadi kesalahan saat menghapus akun');
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Hapus Akun',
      'danger',
      'Hapus',
      'Batal'
    );
  };

  const getRoleInfo = (role) => {
    const roleInfo = roles.find(r => r.value === role);
    return roleInfo || { label: role, icon: User, color: 'text-gray-600' };
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Calculate pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Users className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar - Updated to match MahasiswaList style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Role */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="ALL">Semua Role</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
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
              {itemsPerPageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {canAddEdit() && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Akun
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {roles.map(role => {
          const Icon = role.icon;
          const roleCount = users.filter(user => user.role === role.value).length;
          
          return (
            <div key={role.value} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  role.value === 'ADMIN' ? 'bg-red-100' :
                  role.value === 'KAPRODI' ? 'bg-purple-100' :
                  role.value === 'DOSEN' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <Icon className={`w-6 h-6 ${role.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{role.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{roleCount}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Create/Edit User */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {editingUser ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {editingUser ? 'Edit Akun' : 'Tambah Akun Baru'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className={`w-full border rounded-lg px-3 py-2 ${formErrors.username ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Masukkan username (NIM/NIP)"
                  disabled={!!editingUser} // Disable editing username
                />
                {formErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className={`w-full border rounded-lg px-3 py-2 ${formErrors.nama ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Masukkan nama lengkap"
                />
                {formErrors.nama && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.nama}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {editingUser ? '(Kosongkan jika tidak ingin mengubah)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`w-full border rounded-lg px-3 py-2 pr-10 ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Masukkan password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password {editingUser ? '' : '*'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full border rounded-lg px-3 py-2 ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Konfirmasi password"
                />
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {roles.map(role => {
                  const Icon = role.icon;
                  return (
                    <label
                      key={role.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.role === role.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="sr-only"
                      />
                      <Icon className={`w-5 h-5 mr-2 ${role.color}`} />
                      <span className="text-sm font-medium">{role.label}</span>
                    </label>
                  );
                })}
              </div>
              {formErrors.role && (
                <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editingUser ? 'Update Akun' : 'Buat Akun'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">
              Daftar Akun ({totalItems} total, menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)})
            </h3>
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
          </div>
        </div>

        {currentUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>
              {searchTerm || filterRole !== 'ALL' 
                ? 'Tidak ada akun yang sesuai dengan filter' 
                : 'Belum ada akun terdaftar'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Username</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nama</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                    {(canAddEdit() || canDelete()) && (
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    const Icon = roleInfo.icon;
                    const isCurrentUser = user.username === currentUser.username || 
                                         (currentUser.id && user.id === currentUser.id);
                    
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          #{user.id}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Anda
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {user.username}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {user.nama}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleInfo.color} bg-gray-50`}>
                            <Icon className="w-4 h-4 mr-1" />
                            {roleInfo.label}
                          </span>
                        </td>
                        {(canAddEdit() || canDelete()) && (
                          <td className="px-4 py-3">
                            <div className="flex justify-center space-x-2">
                              {canAddEdit() && (
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete() && (
                                <button
                                  onClick={() => handleDelete(user)}
                                  disabled={isCurrentUser}
                                  className={`p-1 rounded transition-colors ${
                                    isCurrentUser 
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-red-500 hover:text-red-700'
                                  }`}
                                  title={isCurrentUser ? "Tidak dapat menghapus akun sendiri" : "Hapus"}
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Menampilkan <span className="font-medium">{startIndex + 1}</span> sampai{' '}
                    <span className="font-medium">{Math.min(endIndex, totalItems)}</span> dari{' '}
                    <span className="font-medium">{totalItems}</span> akun
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
      </div>

      {/* Info Panel */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <strong>Panduan Manajemen Akun:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Admin:</strong> Akses penuh ke sistem, dapat mengelola semua fitur</li>
              <li><strong>Kaprodi:</strong> Mengelola pengajuan SA dan penugasan dosen</li>
              <li><strong>Dosen:</strong> Mengajar SA dan memberikan nilai kepada mahasiswa</li>
              <li><strong>Mahasiswa:</strong> Mengajukan SA dan melihat status pengajuan</li>
            </ul>
            <div className="mt-3 p-2 bg-yellow-100 rounded border border-yellow-300">
              <strong>⚠️ Peringatan:</strong> Penghapusan akun bersifat permanen dan akan menghapus semua data terkait.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersList;