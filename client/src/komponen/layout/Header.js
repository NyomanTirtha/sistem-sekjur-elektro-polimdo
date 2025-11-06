import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, 
  X, 
  LogOut, 
  Menu,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Building,
  ChevronDown,
  KeyRound,
  UserCircle,
  Shield,
  Clock,
  IdCard,
  CheckCircle,
  Settings,
  Building2, // ✅ ADDED: Icon untuk jurusan
  Users      // ✅ ADDED: Icon untuk program studi
} from 'lucide-react';
import axios from 'axios';
import { usePasswordChange } from '../../kait/usePasswordChange';

const Header = ({ 
  title = "Dashboard", 
  user = "Sekretaris Jurusan", 
  role = "SEKJUR", // ✅ CHANGED: Default role
  onNotificationUpdate = () => {},
  onToggleSidebar,
  sidebarCollapsed = false,
  onLogout = () => {},
  currentUser = {},
  authToken
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  // Use the password change hook
  const { changePassword, isLoading, success, resetMessages } = usePasswordChange(authToken, currentUser);

  // ✅ ADDED: Get display name dan role label
  const getDisplayInfo = () => {
    const normalizedRole = currentUser.role?.toUpperCase() || role.toUpperCase();
    
    let displayName = currentUser.nama || currentUser.name || user;
    let roleLabel = '';
    let subtitle = '';

    switch (normalizedRole) {
      case 'SEKJUR':
        roleLabel = 'Sekretaris Jurusan';
        subtitle = currentUser.jurusan?.nama ? `Jurusan ${currentUser.jurusan.nama}` : 'Sekretaris Jurusan';
        break;
      case 'KAPRODI':
        roleLabel = 'Ketua Program Studi';
        subtitle = currentUser.prodi?.nama || currentUser.programStudi?.nama || 'Ketua Program Studi';
        break;
      case 'DOSEN':
        roleLabel = 'Dosen';
        subtitle = currentUser.prodi?.nama || currentUser.programStudi?.nama || 'Dosen';
        break;
      case 'MAHASISWA':
        roleLabel = 'Mahasiswa';
        subtitle = currentUser.programStudi?.nama || currentUser.prodi?.nama || 'Mahasiswa';
        break;
      default:
        roleLabel = role;
        subtitle = 'Politeknik Negeri Manado';
    }

    return { displayName, roleLabel, subtitle };
  };

  const { displayName, roleLabel, subtitle } = getDisplayInfo();



  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  // Close dropdowns when clicking outside
  const toggleButtonRef = useRef(null);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-dropdown')) {
         setShowNotifications(false);
      }
      if (!(toggleButtonRef.current && toggleButtonRef.current.contains(event.target)) && !(dropdownRef.current && dropdownRef.current.contains(event.target))) {
         setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleLogoutClick = () => {
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Semua field harus diisi');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('Password baru tidak boleh sama dengan password lama');
      return;
      }

    const result = await changePassword(passwordData);

    if (result.success) {
      // Reset form on success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      // Close the settings modal after a delay
      setTimeout(() => {
        setShowSystemSettings(false);
      }, 2000);
      }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset messages when user starts typing
    resetMessages();
  };

  // ✅ UPDATED: Function to render profile fields based on role
  const renderProfileFields = () => {
    const userRole = currentUser.role || role;
    const normalizedRole = userRole?.toUpperCase();

    // Debug logs removed for production performance

    // ✅ ADDED: SEKJUR role handling
    if (normalizedRole === 'SEKJUR') {
      return [
        <div key="username" className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <IdCard className="w-5 h-5 text-blue-600" />
          <div>
            <span className="text-sm font-medium text-blue-900">Username</span>
            <p className="text-sm text-blue-700">{currentUser.username || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="jurusan" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <Building2 className="w-5 h-5 text-purple-600" />
          <div>
            <span className="text-sm font-medium text-purple-900">Jurusan</span>
            <p className="text-sm text-purple-700">{currentUser.jurusan?.nama || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="access" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <Shield className="w-5 h-5 text-green-600" />
          <div>
            <span className="text-sm font-medium text-green-900">Akses Data</span>
            <p className="text-sm text-green-700">
              {currentUser.jurusan?.nama ? `Data Jurusan ${currentUser.jurusan.nama}` : 'Terbatas'}
            </p>
          </div>
        </div>
      ].filter(Boolean);
    }

    // Role-specific fields untuk role lainnya
    if (normalizedRole === 'MAHASISWA') {
      return [
        <div key="nim" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <IdCard className="w-5 h-5 text-blue-600" />
          <div>
            <span className="text-sm font-medium text-blue-900">NIM</span>
            <p className="text-sm text-blue-700">{currentUser.nim || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="prodi" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <Building className="w-5 h-5 text-purple-600" />
          <div>
            <span className="text-sm font-medium text-purple-900">Program Studi</span>
            <p className="text-sm text-purple-700">{currentUser.programStudi?.nama || currentUser.prodi?.nama || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="jurusan" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <div>
            <span className="text-sm font-medium text-indigo-900">Jurusan</span>
            <p className="text-sm text-indigo-700">
              {currentUser.programStudi?.jurusan?.nama || currentUser.prodi?.jurusan?.nama || 'Tidak tersedia'}
            </p>
          </div>
        </div>,
        <div key="angkatan" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <Calendar className="w-5 h-5 text-orange-600" />
          <div>
            <span className="text-sm font-medium text-orange-900">Angkatan</span>
            <p className="text-sm text-orange-700">{currentUser.angkatan || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="semester" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <GraduationCap className="w-5 h-5 text-cyan-600" />
          <div>
            <span className="text-sm font-medium text-cyan-900">Semester</span>
            <p className="text-sm text-cyan-700">{currentUser.semester || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="phone" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <Phone className="w-5 h-5 text-teal-600" />
          <div>
            <span className="text-sm font-medium text-teal-900">No. Telepon</span>
            <p className="text-sm text-teal-700">{currentUser.noTelp || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="address" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <MapPin className="w-5 h-5 text-pink-600" />
          <div>
            <span className="text-sm font-medium text-pink-900">Alamat</span>
            <p className="text-sm text-pink-700">{currentUser.alamat || 'Tidak tersedia'}</p>
          </div>
        </div>
      ].filter(Boolean);
    } else if (normalizedRole === 'DOSEN' || normalizedRole === 'KAPRODI') {
      return [
        <div key="nip" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <IdCard className="w-5 h-5 text-blue-600" />
          <div>
            <span className="text-sm font-medium text-blue-900">NIP</span>
            <p className="text-sm text-blue-700">{currentUser.nip || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="prodi" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <Building className="w-5 h-5 text-purple-600" />
          <div>
            <span className="text-sm font-medium text-purple-900">Program Studi</span>
            <p className="text-sm text-purple-700">{currentUser.prodi?.nama || currentUser.programStudi?.nama || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="jurusan" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <div>
            <span className="text-sm font-medium text-indigo-900">Jurusan</span>
            <p className="text-sm text-indigo-700">
              {currentUser.prodi?.jurusan?.nama || currentUser.programStudi?.jurusan?.nama || 'Tidak tersedia'}
            </p>
          </div>
        </div>,
        ...(normalizedRole === 'KAPRODI' ? [
          <div key="kaprodi-status" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
            <Users className="w-5 h-5 text-amber-600" />
            <div>
              <span className="text-sm font-medium text-amber-900">Status</span>
              <p className="text-sm text-amber-700">
                {currentUser.isKaprodi ? 'Ketua Program Studi' : 'Dosen'}
              </p>
            </div>
          </div>
        ] : []),
        <div key="phone" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <Phone className="w-5 h-5 text-teal-600" />
          <div>
            <span className="text-sm font-medium text-teal-900">No. Telepon</span>
            <p className="text-sm text-teal-700">{currentUser.noTelp || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="address" className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200">
          <MapPin className="w-5 h-5 text-pink-600" />
          <div>
            <span className="text-sm font-medium text-pink-900">Alamat</span>
            <p className="text-sm text-pink-700">{currentUser.alamat || 'Tidak tersedia'}</p>
          </div>
        </div>
      ].filter(Boolean);
    }

    return [];
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-30 bg-white border-b border-gray-200">
      <div className={`h-16 flex items-center justify-between ${
        sidebarCollapsed ? 'pl-20' : 'pl-72'
      }`}>
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* User Menu */}
          <div className="relative mr-7">
            <button
              ref={toggleButtonRef}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded"
            >
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <span className="text-sm font-semibold text-gray-900 block">{displayName}</span>
                <span className="text-xs text-gray-500">{roleLabel}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div 
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-64 bg-white rounded shadow-lg border border-gray-200 overflow-hidden z-50"
              >
                {/* User Info Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{displayName}</h3>
                      <p className="text-xs text-gray-600">{roleLabel}</p>
                      {currentUser.role === 'SEKJUR' && currentUser.jurusan && (
                        <p className="text-xs text-gray-500 mt-1">Jurusan {currentUser.jurusan.nama}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowProfile(true);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    <UserCircle className="w-5 h-5 text-gray-600" />
                    <span>Profil Saya</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSystemSettings(true);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    <KeyRound className="w-5 h-5 text-gray-600" />
                    <span>Pengaturan Password</span>
                  </button>
                  
                  <div className="my-2 border-t border-gray-200"></div>
                  
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    <LogOut className="w-5 h-5 text-red-600" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            )}
                  </div>
                </div>
              </div>
              
      {/* Profile Popup */}
      {typeof window !== 'undefined' && createPortal(
        showProfile && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowProfile(false);
              }
            }}
          >
            <div 
              className="bg-white rounded shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 bg-gray-800 text-white border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{displayName}</h2>
                      <p className="text-sm text-gray-300">{roleLabel}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="p-2 hover:bg-gray-700 rounded text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

                {/* Content dengan layout yang lebih clean */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-8">
                    {/* Profile Information Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      {/* Personal Info */}
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                          <UserCircle className="w-5 h-5 mr-2 text-gray-600" />
                          Informasi Pribadi
                        </h3>
                        <div className="space-y-3">
                          {renderProfileFields()}
                        </div>
                      </div>

                      {/* System Info */}
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-gray-600" />
                        Informasi Sistem
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <span className="text-sm text-gray-700">Status Akun</span>
                          <span className="text-sm font-semibold text-green-600">Aktif</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <span className="text-sm text-gray-700">Role Sistem</span>
                          <span className="text-sm font-semibold text-gray-800">{roleLabel}</span>
                        </div>

                        {currentUser.role === 'SEKJUR' && (
                          <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                            <span className="text-sm text-gray-700">Level Akses</span>
                            <span className="text-sm font-semibold text-gray-800">
                              {currentUser.jurusan?.nama ? `Jurusan ${currentUser.jurusan.nama}` : 'Terbatas'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowProfile(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded border border-gray-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {/* System Settings Popup */}
      {typeof window !== 'undefined' && createPortal(
        showSystemSettings && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSystemSettings(false);
                resetMessages();
              }
            }}
          >
            <div 
              className="bg-white rounded shadow-lg w-full max-w-md max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 bg-gray-800 text-white border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Pengaturan Password</h2>
                <button
                  onClick={() => {
                    setShowSystemSettings(false);
                    resetMessages();
                  }}
                  className="p-1 hover:bg-gray-700 rounded text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-50 text-green-600 p-3 rounded text-sm border border-green-200">
                      {success}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Saat Ini
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                        
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSystemSettings(false);
                    resetMessages();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded border border-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </header>
  );
};

export default Header;