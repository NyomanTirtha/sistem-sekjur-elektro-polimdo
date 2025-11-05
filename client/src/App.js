import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, FileText, ClipboardList, Home, LogOut, BookOpen } from 'lucide-react';
import MainLayout from './komponen/layout/MainLayouts';
import MahasiswaList from './komponen/fitur/mahasiswa/DaftarMahasiswa';
import DosenList from './komponen/fitur/dosen/DaftarDosen';
import PengajuanSAList from './komponen/fitur/pengajuan-sa/DaftarPengajuanSA';
import ProdiList from './komponen/fitur/program-studi/DaftarProgramStudi';
import UsersList from './komponen/fitur/pengguna/DaftarPengguna';
import TeachingPicker from './komponen/fitur/dosen/PilihPenugasan';
import TeachingAssignmentManager from './komponen/fitur/penugasan-mengajar/KelolaPenugasan';
import LoginPage from './halaman/masuk/HalamanMasuk';

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [activeTab, setActiveTab] = useState('prodi');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Check for existing authentication and active tab on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    const userType = localStorage.getItem('userType');
    const savedActiveTab = localStorage.getItem('activeTab');

    if (token && userData && userType) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(userData));
      setUserType(userType);
      setAuthToken(token);
      setCurrentView('system');
      window.authToken = token;

      // Restore active tab if it exists and is valid for the user type
      if (savedActiveTab) {
        const availableMenuItems = menuItems.filter(item => 
          item.allowedRoles.includes(userType)
        );
        if (availableMenuItems.some(item => item.id === savedActiveTab)) {
          setActiveTab(savedActiveTab);
        }
      }
    }
  }, []);

  // Function to verify token with backend
  const verifyTokenWithBackend = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const userData = result.data;
          const mappedUserType = getRoleMapping(userData.role);
          
          // Store updated user data in localStorage
          localStorage.setItem('userData', JSON.stringify(userData));
          localStorage.setItem('userType', mappedUserType);
          
          setIsAuthenticated(true);
          setCurrentUser(userData);
          setUserType(mappedUserType);
          setAuthToken(token);
          setCurrentView('system');
        } else {
          handleLogout();
        }
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      handleLogout();
    }
  };

  // Helper function to map backend roles to frontend userTypes  
  const getRoleMapping = (backendRole) => {
    const roleMapping = {
      'SEKJUR': 'sekjur',
      'MAHASISWA': 'mahasiswa', 
      'DOSEN': 'dosen',
      'KAPRODI': 'kaprodi'
    };
    return roleMapping[backendRole] || backendRole.toLowerCase();
  };

  // Define menu items with proper role-based access control
  const menuItems = [
    {
      id: 'prodi',
      label: 'Program Studi',
      icon: ClipboardList,
      component: ProdiList,
      description: 'Kelola data program studi',
      allowedRoles: ['sekjur'] // Only sekjur can access
    },
    {
      id: 'dosen',
      label: 'Dosen',
      icon: GraduationCap,
      component: DosenList,
      description: 'Kelola data dosen',
      allowedRoles: ['sekjur'] // Only sekjur can access
    },
    {
      id: 'mahasiswa',
      label: 'Mahasiswa',
      icon: Users,
      component: MahasiswaList,
      description: 'Kelola data mahasiswa',
      allowedRoles: ['sekjur', 'dosen', 'kaprodi'] // Sekjur, Dosen, and Kaprodi can access
    },
    {
      id: 'pengajuan-sa',
      label: 'Pengajuan SA',
      icon: FileText,
      component: PengajuanSAList,
      description: 'Kelola pengajuan SA',
      allowedRoles: ['sekjur', 'dosen', 'mahasiswa', 'kaprodi'] // All roles can access
    },
    {
      id: 'penugasan-mengajar',
      label: 'Penugasan Mengajar',
      icon: BookOpen,
      component: TeachingPicker,
      description: 'Lihat dan ajukan mata kuliah yang akan diajarkan',
      allowedRoles: ['dosen'] // Only dosen can access
    },
    {
      id: 'kelola-penugasan',
      label: 'Kelola Penugasan Mengajar',
      icon: BookOpen,
      component: TeachingAssignmentManager,
      description: 'Kelola dan setujui penugasan mengajar dosen',
      allowedRoles: ['kaprodi'] // Only kaprodi can access
    },
    {
      id: 'users',
      label: 'Daftar Akun',
      icon: Users,
      component: UsersList,
      description: 'Kelola akun yang terdaftar di sistem',
      allowedRoles: ['sekjur']
    }
  ];

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    if (!userType) return [];
    
    return menuItems.filter(item => 
      item.allowedRoles.includes(userType)
    );
  };

  // Get menu items for sidebar (without navigation items like Home and Logout)
  const getSidebarMenuItems = () => {
    return getFilteredMenuItems().map(item => ({
      id: item.id,
      label: item.label,
      icon: item.icon
    }));
  };

  // Add navigation items for MainLayout
  const getAllMenuItems = () => {
    const filteredItems = getFilteredMenuItems();
    
    return [
      {
        id: 'landing',
        label: 'Beranda',
        icon: Home,
        description: 'Kembali ke halaman utama'
      },
      ...filteredItems,
      {
        id: 'logout',
        label: 'Keluar',
        icon: LogOut,
        description: 'Keluar dari sistem'
      }
    ];
  };

  const currentMenuItem = getFilteredMenuItems().find(item => item.id === activeTab);
  const ActiveComponent = currentMenuItem?.component;

  // Handle successful login
  const handleLoginSuccess = (userData, loginUserType, authData) => {
    const mappedUserType = getRoleMapping(loginUserType);
    
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setUserType(mappedUserType);
    setAuthToken(authData.token);
    setCurrentView('system');
    
    // Store token in memory for subsequent API calls
    window.authToken = authData.token;
    
    // Store auth data in localStorage
    localStorage.setItem('token', authData.token);
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userType', mappedUserType);
    
    // Set default active tab based on user type and available menu items
    const availableMenuItems = menuItems.filter(item => 
      item.allowedRoles.includes(mappedUserType)
    );
    
    if (availableMenuItems.length > 0) {
      // Set default tab based on role priority
      let defaultTab;
      
      switch(mappedUserType) {
        case 'sekjur':
          defaultTab = 'prodi';
          break;
        case 'dosen':
        case 'kaprodi':
          defaultTab = 'mahasiswa';
          break;
        case 'mahasiswa':
          defaultTab = 'pengajuan-sa';
          break;
        default:
          defaultTab = availableMenuItems[0].id;
      }
      
      setActiveTab(defaultTab);
      localStorage.setItem('activeTab', defaultTab);
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear all authentication data
    window.authToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    localStorage.removeItem('activeTab');
    
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserType(null);
    setAuthToken(null);
    setCurrentView('login'); 
    setActiveTab('prodi');
  };

  // Handle entering system from landing page
  const handleEnterSystem = (directMenu = null) => {
    if (!isAuthenticated) {
      setCurrentView('login');
      return;
    }
    
    setCurrentView('system');
    const filteredItems = getFilteredMenuItems();
    
    if (directMenu && filteredItems.find(item => item.id === directMenu)) {
      setActiveTab(directMenu);
    } else if (filteredItems.length > 0) {
      // Set appropriate default based on user role
      let defaultTab;
      
      switch(userType) {
        case 'sekjur':
          defaultTab = 'prodi';
          break;
        case 'dosen':
        case 'kaprodi':
          defaultTab = 'mahasiswa';
          break;
        case 'mahasiswa':
          defaultTab = 'pengajuan-sa';
          break;
        default:
          defaultTab = filteredItems[0].id;
      }
      
      setActiveTab(defaultTab);
    }
  };

  // Handle menu navigation within system
  const handleMenuChange = (menuId) => {
    if (menuId === 'landing') {
      setCurrentView('landing');
    } else if (menuId === 'logout') {
      handleLogout();
    } else {
      // Check if user has access to this menu
      const hasAccess = getFilteredMenuItems().some(item => item.id === menuId);
      if (hasAccess) {
        setActiveTab(menuId);
        localStorage.setItem('activeTab', menuId);
      }
    }
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginPage onLoginSuccess={handleLoginSuccess} />
    );
  }

  // Show landing page
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Sistem Akademik</h1>
          <p className="text-gray-600 mb-2">Selamat datang, {currentUser?.nama || currentUser?.username}</p>
          <p className="text-sm text-gray-500 mb-4">Role: {currentUser?.role}</p>
          
          {/* Show available features based on role */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4">Fitur yang tersedia untuk Anda:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {getFilteredMenuItems().map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow-md">
                    <Icon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800">{item.label}</h3>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
          
          <button
            onClick={() => handleEnterSystem()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Masuk ke Sistem
          </button>
        </div>
      </div>
    );
  }

  // Show main system
  return (
    <MainLayout 
      title={currentMenuItem?.label || 'Dashboard'}
      activeMenu={activeTab}
      onMenuChange={handleMenuChange}
      menuItems={getSidebarMenuItems()} // Only pass filtered sidebar items
      showBackToLanding={true}
      currentUser={currentUser}
      userType={userType}
      onLogout={handleLogout}
      authToken={authToken} // Pass token to child components if needed
    >
      {ActiveComponent && <ActiveComponent authToken={authToken} currentUser={currentUser} userType={userType} />}
    </MainLayout>
  );
}