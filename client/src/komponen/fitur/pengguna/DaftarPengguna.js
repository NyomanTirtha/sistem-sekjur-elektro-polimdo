import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ChevronsRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../../utilitas/notifikasi/alertUtils';
import Loading from '../../umum/Loading';
import { TABLE, BUTTON, ALERT } from '../../../constants/colors';

const UsersList = ({ authToken, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [showPassword, setShowPassword] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

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
    { value: 'SEKJUR', label: 'Sekjur', icon: Shield, color: 'text-red-600' },
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
    return ['sekjur'].includes(userRole); // Only sekjur can add/edit users
  };

  // Check if user has permission to delete
  const canDelete = () => {
    return ['sekjur'].includes(userRole); // Only sekjur can delete users
  };

  useEffect(() => {
    fetchUsers();

    // Cek apakah user sudah melihat info popup untuk tab Daftar Akun
    const storageKey = `info_popup_daftar_akun_${currentUser?.username || currentUser?.id}`;
    const hasSeenPopup = localStorage.getItem(storageKey);

    if (!hasSeenPopup) {
      // Delay sedikit agar halaman sudah ter-render
      setTimeout(() => {
        setShowInfoPopup(true);
      }, 500);
    }
  }, [authToken, currentUser]);

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

      // Read response body only once
      const data = await response.json();

      if (response.ok) {
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch users:', data.error || data.message);
        showErrorAlert(data.error || data.message || 'Gagal mengambil data users');
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

    showConfirm(
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

          // Read response body only once
          const result = await response.json();

          if (response.ok) {
            // Handle both old format (direct user object) and new format (with success field)
            if (result.success !== false) {
              // Success case - either result.success === true or result is user object directly
              showSuccessAlert(result.message || `Akun berhasil ${isEditing ? 'diupdate' : 'dibuat'}!`);
              resetForm();
              // Refresh users list after a short delay to ensure backend has processed
              setTimeout(() => {
              fetchUsers();
              }, 100);
            } else {
              // Error case with success: false
              showErrorAlert(result.error || result.message || 'Terjadi kesalahan');
            }
          } else {
            // HTTP error status
            const errorMessage = result.error || result.message || `Terjadi kesalahan saat ${action} akun`;
            showErrorAlert(errorMessage);
            // Don't refresh on error - keep form data so user can fix and retry
          }
        } catch (error) {
          console.error(`Error ${action} user:`, error);
          showErrorAlert(`Terjadi kesalahan saat ${action} akun: ${error.message}`);
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Perubahan Akun',
      'warning',
      'Simpan',
      'Batal'
    );
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

          // Read response body only once
          const result = await response.json();

          if (response.ok) {
            if (result.success) {
              showSuccessAlert('Akun berhasil dihapus!');
              fetchUsers();
            } else {
              showErrorAlert(result.error || result.message || 'Gagal menghapus akun');
            }
          } else {
            showErrorAlert(result.error || result.message || 'Gagal menghapus akun');
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

  // Filter users based on search and role - Optimized with useMemo
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filterRole === 'ALL' || user.role === filterRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  // Calculate pagination - Optimized with useMemo
  const paginationData = useMemo(() => {
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

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

    return { totalItems, totalPages, startIndex, endIndex, currentUsers, pages };
  }, [filteredUsers, currentPage, itemsPerPage]);

  const { totalItems, totalPages, startIndex, endIndex, currentUsers, pages: pageNumbers } = paginationData;

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading message="Memuat data pengguna..." size="md" />
      </div>
    );
  }

  const handleCloseInfoPopup = () => {
    const storageKey = `info_popup_daftar_akun_${currentUser?.username || currentUser?.id}`;
    localStorage.setItem(storageKey, 'true');
    setShowInfoPopup(false);
  };

  return (
    <div className="space-y-6">
      {/* Info Popup - muncul saat pertama kali buka tab Daftar Akun */}
      <AnimatePresence>
        {showInfoPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseInfoPopup}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
              {/* Popup */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className={`${TABLE.header} p-6 rounded-t-lg border-b border-gray-800`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Panduan Manajemen Akun</h2>
                        <p className="text-gray-200 text-sm mt-1">Informasi penting tentang manajemen akun</p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseInfoPopup}
                      className="text-white hover:bg-gray-800 rounded-lg p-2 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-gray-50">
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="font-semibold text-base text-gray-800 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gray-600" />
                        Hak Akses Berdasarkan Role:
                      </h3>
                      <ul className="space-y-3 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span><strong className="text-gray-900">Sekjur:</strong> Akses penuh ke sistem, dapat mengelola semua fitur</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span><strong className="text-gray-900">Kaprodi:</strong> Mengelola pengajuan SA dan penugasan dosen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span><strong className="text-gray-900">Dosen:</strong> Mengajar SA dan memberikan nilai kepada mahasiswa</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span><strong className="text-gray-900">Mahasiswa:</strong> Mengajukan SA dan melihat status pengajuan</span>
                        </li>
                      </ul>
                    </div>

                    <div className={`${ALERT.warning} flex items-start gap-3`}>
                      <AlertCircle className={`${ALERT.warningIcon} mt-0.5 flex-shrink-0`} />
                      <div>
                        <p className={`${ALERT.warningText} font-semibold text-sm mb-1`}>⚠️ Peringatan Penting:</p>
                        <p className={`${ALERT.warningText} text-sm`}>
                          Penghapusan akun bersifat permanen dan akan menghapus semua data terkait. Pastikan Anda yakin sebelum menghapus akun.
                        </p>
                      </div>
                    </div>

                    <div className={`${ALERT.info} flex items-start gap-3`}>
                      <Info className={`${ALERT.infoIcon} mt-0.5 flex-shrink-0`} />
                      <div>
                        <p className={`${ALERT.infoText} font-semibold text-sm mb-1`}>💡 Catatan:</p>
                        <p className={`${ALERT.infoText} text-sm`}>
                          Role Mahasiswa tidak dapat diubah untuk menjaga integritas data akademik.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-white flex justify-center">
                  <button
                    onClick={handleCloseInfoPopup}
                    className={`${BUTTON.primary} flex items-center gap-2 min-w-[180px] justify-center`}
                  >
                    <Check className="w-5 h-5" />
                    Saya Mengerti
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {roles.map(role => {
          const Icon = role.icon;
          const roleCount = users.filter(user => user.role === role.value).length;

          // Get subtle color for icon
          const iconColor = role.value === 'SEKJUR' ? 'text-red-500' :
                           role.value === 'KAPRODI' ? 'text-purple-500' :
                           role.value === 'DOSEN' ? 'text-blue-500' : 'text-green-500';

          return (
            <div key={role.value} className="bg-white p-3 rounded border border-gray-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${iconColor} opacity-70`} />
                <p className="text-xs text-gray-500">{role.label}</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{roleCount}</p>
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
                {editingUser && editingUser.role === 'MAHASISWA' && (
                  <span className="ml-2 text-xs text-yellow-600 font-normal">
                    (Role Mahasiswa tidak dapat diubah)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {roles.map(role => {
                  const Icon = role.icon;
                  // Disable role selection if editing MAHASISWA
                  const isDisabled = editingUser && editingUser.role === 'MAHASISWA';
                  const isSelected = formData.role === role.value;

                  return (
                    <label
                      key={role.value}
                      className={`flex items-center p-3 border rounded-lg transition-colors ${
                        isDisabled
                          ? 'cursor-not-allowed opacity-50 bg-gray-100'
                          : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={isSelected}
                        onChange={(e) => {
                          if (!isDisabled) {
                            setFormData({...formData, role: e.target.value});
                          }
                        }}
                        disabled={isDisabled}
                        className="sr-only"
                      />
                      <Icon className={`w-5 h-5 mr-2 ${role.color}`} />
                      <span className="text-sm font-medium">{role.label}</span>
                    </label>
                  );
                })}
              </div>
              {editingUser && editingUser.role === 'MAHASISWA' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  <strong>Info:</strong> Role Mahasiswa tidak dapat diubah untuk menjaga integritas data akademik.
                </div>
              )}
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
      </div>

    </div>
  );
};

export default UsersList;
