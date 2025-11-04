import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { usePasswordChange } from '../../hooks/usePasswordChange';

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
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
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

  // Animation variants for Framer Motion
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.15,
        ease: "easeOut"
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    }
  };

  const menuItemVariants = {
    hidden: { 
      opacity: 0, 
      x: -10,
      transition: { duration: 0.1 }
    },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.15,
        ease: "easeOut"
      }
    }),
    exit: {
      opacity: 0,
      x: -10,
      transition: { duration: 0.1 }
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  // Enhanced scroll detection with smooth transitions
  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.querySelector('main') || 
                         document.querySelector('.main-content') ||
                         document.querySelector('[data-main-content]') ||
                         window;
      
      let currentScrollY = 0;
      
      if (mainContent === window) {
        currentScrollY = window.scrollY || window.pageYOffset;
      } else if (mainContent) {
        currentScrollY = mainContent.scrollTop;
      }
      
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 20);
    };

    const scrollContainers = [
      document.querySelector('main'),
      document.querySelector('.main-content'),
      document.querySelector('[data-main-content]'),
      window
    ].filter(Boolean);

    scrollContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll);
    });

    handleScroll();

    return () => {
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
    };
  }, []);

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

  // Calculate dynamic opacity and blur based on scroll
  const getHeaderStyles = () => {
    const maxScroll = 100;
    const scrollProgress = Math.min(scrollY / maxScroll, 1);
    const baseOpacity = 0.1;
    const opacity = isScrolled ? baseOpacity + (0.9 * (1 - scrollProgress)) : 1;
    
    return {
      backgroundColor: isScrolled 
        ? `rgba(255, 255, 255, ${opacity})` 
        : 'rgba(255, 255, 255, 1)',
      backdropFilter: isScrolled ? 'blur(12px) saturate(150%)' : 'none',
      WebkitBackdropFilter: isScrolled ? 'blur(12px) saturate(150%)' : 'none',
    };
  };

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

    // Debug: Log the current user data to see the structure
    console.log('=== PROFILE DEBUG ===');
    console.log('Current User:', currentUser);
    console.log('User Role:', userRole);
    console.log('Normalized Role:', normalizedRole);
    console.log('Jurusan:', currentUser.jurusan);
    console.log('JurusanId:', currentUser.jurusanId);
    console.log('NIP:', currentUser.nip);
    console.log('NIM:', currentUser.nim);
    console.log('NoTelp:', currentUser.noTelp);
    console.log('Alamat:', currentUser.alamat);
    console.log('ProgramStudi:', currentUser.programStudi);
    console.log('Prodi:', currentUser.prodi);
    console.log('=====================');

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
        <div key="jurusan" className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <Building2 className="w-5 h-5 text-purple-600" />
          <div>
            <span className="text-sm font-medium text-purple-900">Jurusan</span>
            <p className="text-sm text-purple-700">{currentUser.jurusan?.nama || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="access" className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
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
        <div key="nim" className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <IdCard className="w-5 h-5 text-blue-600" />
          <div>
            <span className="text-sm font-medium text-blue-900">NIM</span>
            <p className="text-sm text-blue-700">{currentUser.nim || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="prodi" className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <Building className="w-5 h-5 text-purple-600" />
          <div>
            <span className="text-sm font-medium text-purple-900">Program Studi</span>
            <p className="text-sm text-purple-700">{currentUser.programStudi?.nama || currentUser.prodi?.nama || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="jurusan" className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <div>
            <span className="text-sm font-medium text-indigo-900">Jurusan</span>
            <p className="text-sm text-indigo-700">
              {currentUser.programStudi?.jurusan?.nama || currentUser.prodi?.jurusan?.nama || 'Tidak tersedia'}
            </p>
          </div>
        </div>,
        <div key="angkatan" className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <Calendar className="w-5 h-5 text-orange-600" />
          <div>
            <span className="text-sm font-medium text-orange-900">Angkatan</span>
            <p className="text-sm text-orange-700">{currentUser.angkatan || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="semester" className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
          <GraduationCap className="w-5 h-5 text-cyan-600" />
          <div>
            <span className="text-sm font-medium text-cyan-900">Semester</span>
            <p className="text-sm text-cyan-700">{currentUser.semester || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="phone" className="flex items-center space-x-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
          <Phone className="w-5 h-5 text-teal-600" />
          <div>
            <span className="text-sm font-medium text-teal-900">No. Telepon</span>
            <p className="text-sm text-teal-700">{currentUser.noTelp || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="address" className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
          <MapPin className="w-5 h-5 text-pink-600" />
          <div>
            <span className="text-sm font-medium text-pink-900">Alamat</span>
            <p className="text-sm text-pink-700">{currentUser.alamat || 'Tidak tersedia'}</p>
          </div>
        </div>
      ].filter(Boolean);
    } else if (normalizedRole === 'DOSEN' || normalizedRole === 'KAPRODI') {
      return [
        <div key="nip" className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <IdCard className="w-5 h-5 text-blue-600" />
          <div>
            <span className="text-sm font-medium text-blue-900">NIP</span>
            <p className="text-sm text-blue-700">{currentUser.nip || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="prodi" className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <Building className="w-5 h-5 text-purple-600" />
          <div>
            <span className="text-sm font-medium text-purple-900">Program Studi</span>
            <p className="text-sm text-purple-700">{currentUser.prodi?.nama || currentUser.programStudi?.nama || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="jurusan" className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <div>
            <span className="text-sm font-medium text-indigo-900">Jurusan</span>
            <p className="text-sm text-indigo-700">
              {currentUser.prodi?.jurusan?.nama || currentUser.programStudi?.jurusan?.nama || 'Tidak tersedia'}
            </p>
          </div>
        </div>,
        ...(normalizedRole === 'KAPRODI' ? [
          <div key="kaprodi-status" className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <Users className="w-5 h-5 text-amber-600" />
            <div>
              <span className="text-sm font-medium text-amber-900">Status</span>
              <p className="text-sm text-amber-700">
                {currentUser.isKaprodi ? 'Ketua Program Studi' : 'Dosen'}
              </p>
            </div>
          </div>
        ] : []),
        <div key="phone" className="flex items-center space-x-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
          <Phone className="w-5 h-5 text-teal-600" />
          <div>
            <span className="text-sm font-medium text-teal-900">No. Telepon</span>
            <p className="text-sm text-teal-700">{currentUser.noTelp || 'Tidak tersedia'}</p>
          </div>
        </div>,
        <div key="address" className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
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
    <header 
      className={`fixed top-0 right-0 left-0 z-30 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-white'
      }`}
      style={getHeaderStyles()}
    >
      <div className={`h-16 flex items-center justify-between border-b border-gray-200 transition-all duration-300 ${
      sidebarCollapsed ? 'pl-20' : 'pl-72'  // Sesuaikan dengan lebar sidebar: 16 (collapsed) + 4 (margin) = 20, 64 (expanded) + 8 (margin) = 72
    }`}>
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Toggle sidebar"
        >
            <Menu className="w-6 h-6" />
        </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {/* ✅ UPDATED: Dynamic subtitle berdasarkan role dan jurusan */}
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
      </div>

      {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* User Menu */}
          <div className="relative mr-7">
            <motion.button
              ref={toggleButtonRef}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                {/* ✅ UPDATED: Dynamic avatar gradient berdasarkan role */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                  currentUser.role === 'SEKJUR' ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800' :
                  currentUser.role === 'KAPRODI' ? 'bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-800' :
                  currentUser.role === 'DOSEN' ? 'bg-gradient-to-br from-green-600 via-green-700 to-green-800' :
                  currentUser.role === 'MAHASISWA' ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800' :
                  'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800'
                }`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="hidden md:block text-left">
                {/* ✅ UPDATED: Display name dan role yang lebih akurat */}
                <span className="text-sm font-semibold text-gray-900 block">{displayName}</span>
                <span className="text-xs text-gray-500">{roleLabel}</span>
              </div>
              <motion.div
                animate={{ rotate: showUserMenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
          >
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </motion.div>
            </motion.button>

            {/* Enhanced User Menu Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  ref={dropdownRef}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 user-menu-dropdown"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* User Info Header */}
                  <div className={`p-6 text-center relative ${
                    currentUser.role === 'SEKJUR' ? 'bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50' :
                    currentUser.role === 'KAPRODI' ? 'bg-gradient-to-br from-yellow-50 via-yellow-50 to-amber-50' :
                    currentUser.role === 'DOSEN' ? 'bg-gradient-to-br from-green-50 via-green-50 to-emerald-50' :
                    currentUser.role === 'MAHASISWA' ? 'bg-gradient-to-br from-purple-50 via-purple-50 to-violet-50' :
                    'bg-gradient-to-br from-gray-50 via-gray-50 to-slate-50'
                  } border-b border-gray-200`}>
                    <div className="absolute top-0 left-0 w-full h-full bg-black/5"></div>
                    <div className="relative flex items-center space-x-4">
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                          currentUser.role === 'SEKJUR' ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800' :
                          currentUser.role === 'KAPRODI' ? 'bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-800' :
                          currentUser.role === 'DOSEN' ? 'bg-gradient-to-br from-green-600 via-green-700 to-green-800' :
                          currentUser.role === 'MAHASISWA' ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800' :
                          'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800'
                        }`}>
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-gray-900 text-lg">{displayName}</h3>
                        <p className={`text-sm font-medium ${
                          currentUser.role === 'SEKJUR' ? 'text-blue-600' :
                          currentUser.role === 'KAPRODI' ? 'text-yellow-600' :
                          currentUser.role === 'DOSEN' ? 'text-green-600' :
                          currentUser.role === 'MAHASISWA' ? 'text-purple-600' :
                          'text-gray-600'
                        }`}>{roleLabel}</p>
                        {/* ✅ ADDED: Show jurusan for SEKJUR */}
                        {currentUser.role === 'SEKJUR' && currentUser.jurusan && (
                          <p className="text-xs text-gray-500 mt-1">Jurusan {currentUser.jurusan.nama}</p>
                        )}
                  </div>
                </div>
              </div>

                  {/* Menu Items */}
                  <div className="p-3">
                    <motion.button 
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowProfile(true);
                      }}
                      className="w-full flex items-center space-x-4 px-4 py-3.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all duration-200 group"
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={0}
                      whileHover={{ x: 4 }}
                      >
                      <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                        <UserCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Profil Saya</div>
                        <div className="text-xs text-gray-500">Lihat dan kelola profil</div>
                          </div>
                    </motion.button>
                    
                    <motion.button 
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowSystemSettings(true);
                      }}
                      className="w-full flex items-center space-x-4 px-4 py-3.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-all duration-200 group"
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={1}
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-10 h-10 bg-amber-100 group-hover:bg-amber-200 rounded-lg flex items-center justify-center transition-colors">
                        <KeyRound className="w-5 h-5 text-amber-600" />
                            </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Pengaturan Password</div>
                        <div className="text-xs text-gray-500">Ubah kata sandi akun</div>
                          </div>
                    </motion.button>
                    
                    <div className="my-3 border-t border-gray-100"></div>
                    
                    <motion.button 
                      onClick={handleLogoutClick}
                      className="w-full flex items-center space-x-4 px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 group"
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={2}
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors">
                        <LogOut className="w-5 h-5 text-red-600" />
                        </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Keluar dari Sistem</div>
                        <div className="text-xs text-red-400">Akhiri sesi saat ini</div>
                      </div>
                    </motion.button>
              </div>

              {/* Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Online</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>Sistem Aman</span>
              </div>
            </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
                  </div>
                </div>
              </div>
              
      {/* Profile Popup - Enhanced with Framer Motion */}
      <AnimatePresence>
          {showProfile && (
          <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowProfile(false);
                }
              }}
            >
            <motion.div 
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ✅ UPDATED: Header dengan gradient yang dinamis berdasarkan role */}
                <div className={`relative p-8 text-white ${
                  currentUser.role === 'SEKJUR' ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800' :
                  currentUser.role === 'KAPRODI' ? 'bg-gradient-to-br from-yellow-600 via-yellow-700 to-amber-800' :
                  currentUser.role === 'DOSEN' ? 'bg-gradient-to-br from-green-600 via-green-700 to-emerald-800' :
                  currentUser.role === 'MAHASISWA' ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-violet-800' :
                  'bg-gradient-to-br from-gray-600 via-gray-700 to-slate-800'
                }`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                          <User className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-3 border-white rounded-full shadow-lg"></div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{displayName}</h2>
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/30">
                            {roleLabel}
                          </span>
                          <span className="px-3 py-1 bg-green-500/20 backdrop-blur-sm text-green-100 text-sm font-medium rounded-full border border-green-400/30">
                            Aktif
                          </span>
                          {/* ✅ ADDED: Jurusan badge untuk SEKJUR */}
                          {currentUser.role === 'SEKJUR' && currentUser.jurusan && (
                            <span className="px-3 py-1 bg-blue-500/20 backdrop-blur-sm text-blue-100 text-sm font-medium rounded-full border border-blue-400/30">
                              {currentUser.jurusan.nama}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setShowProfile(false)}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/80 hover:text-white"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Close profile"
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>

                {/* Content dengan layout yang lebih clean */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-8">
                    {/* Profile Information Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      {/* Personal Info */}
                      <motion.div 
                        className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <UserCircle className="w-5 h-5 mr-2 text-blue-600" />
                          Informasi Pribadi
                        </h3>
                        <div className="space-y-4">
                          {renderProfileFields()}
                        </div>
                      </motion.div>

                      {/* System Info */}
                      <motion.div 
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Shield className="w-5 h-5 mr-2 text-blue-600" />
                          Informasi Sistem
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">Status Akun</span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">Aktif dan Terverifikasi</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <UserCircle className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">Role Sistem</span>
                            </div>
                            <span className="text-sm font-semibold text-blue-600">{roleLabel}</span>
                          </div>

                          {/* ✅ ADDED: Access level info untuk SEKJUR */}
                          {currentUser.role === 'SEKJUR' && (
                            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                  <Building2 className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Level Akses</span>
                              </div>
                              <span className="text-sm font-semibold text-purple-600">
                                {currentUser.jurusan?.nama ? `Jurusan ${currentUser.jurusan.nama}` : 'Terbatas'}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                <Clock className="w-4 h-4 text-orange-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">Terakhir Login</span>
                            </div>
                            <span className="text-sm font-semibold text-orange-600">
                              {new Date().toLocaleString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Footer dengan tombol Tutup di kanan */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex justify-end rounded-b-3xl">
                  <motion.button
                    onClick={() => setShowProfile(false)}
                    className="px-6 py-3 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200 flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Tutup
                  </motion.button>
                </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Settings Popup - Enhanced with Framer Motion */}
      <AnimatePresence>
        {showSystemSettings && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSystemSettings(false);
                resetMessages();
              }
            }}
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">Pengaturan Password</h2>
                <motion.button
                  onClick={() => {
                    setShowSystemSettings(false);
                    resetMessages();
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </motion.button>
                  </div>

              {/* Content */}
                  <div className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-6">
                      {error && (
                    <motion.div 
                      className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                          {error}
                    </motion.div>
                      )}
                      {success && (
                    <motion.div 
                      className="bg-green-50 text-green-600 p-4 rounded-lg text-sm border border-green-200"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                          {success}
                    </motion.div>
                      )}
                      
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Saat Ini
                          </label>
                          <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            required
                          />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password Baru
                          </label>
                          <input
                            type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        required
                          />
                    </motion.div>
                        
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Konfirmasi Password Baru
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        required
                          />
                    </motion.div>
                      </div>
                    </form>
                  </div>

                {/* Footer */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex justify-end space-x-3 rounded-b-2xl">
                <motion.button
                    onClick={() => {
                    setShowSystemSettings(false);
                    resetMessages();
                    }}
                  className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Batal
                </motion.button>
                <motion.button
                  onClick={handlePasswordChange}
                      disabled={isLoading}
                  className={`px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  whileHover={!isLoading ? { scale: 1.05 } : {}}
                  whileTap={!isLoading ? { scale: 0.95 } : {}}
                    >
                      {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
          )}
      </AnimatePresence>
    </header>
  );
};

export default Header;