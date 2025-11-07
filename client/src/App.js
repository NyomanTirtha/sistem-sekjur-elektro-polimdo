import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Users,
  GraduationCap,
  FileText,
  ClipboardList,
  Home,
  LogOut,
  BookOpen,
  Calendar,
  Building2,
  UserCheck,
  School,
  Clock,
  CheckSquare,
  CalendarDays,
  Send,
  FolderOpen,
  Settings,
  UserCog,
} from "lucide-react";
import MainLayout from "./komponen/layout/MainLayouts";
import LoginPage from "./halaman/masuk/HalamanMasuk";
import WelcomePopup from "./komponen/layout/WelcomePopup";
import ErrorBoundary from "./komponen/error/ErrorBoundary";
import NetworkError from "./komponen/error/NetworkError";
import LoadingPage from "./komponen/error/LoadingPage";
import NetworkStatus from "./komponen/error/NetworkStatus";
import { setupOnlineListener, isOffline, isNetworkError } from "./utilitas/network/networkUtils";

// Lazy load heavy components
const MahasiswaList = lazy(
  () => import("./komponen/fitur/mahasiswa/DaftarMahasiswa"),
);
const DosenList = lazy(() => import("./komponen/fitur/dosen/DaftarDosen"));
const PengajuanSAList = lazy(
  () => import("./komponen/fitur/pengajuan-sa/DaftarPengajuanSA"),
);
const ProdiList = lazy(
  () => import("./komponen/fitur/program-studi/DaftarProgramStudi"),
);
const UsersList = lazy(
  () => import("./komponen/fitur/pengguna/DaftarPengguna"),
);
const TimetablePeriodManager = lazy(
  () => import("./komponen/fitur/jadwal/TimetablePeriodManager"),
);
const KaprodiScheduleManager = lazy(
  () => import("./komponen/fitur/jadwal/KaprodiScheduleManager"),
);
const DosenScheduleRequestManager = lazy(
  () => import("./komponen/fitur/jadwal/DosenScheduleRequestManager"),
);
const SekjurScheduleReview = lazy(
  () => import("./komponen/fitur/jadwal/SekjurScheduleReview"),
);

export default function App() {
  const [currentView, setCurrentView] = useState("login");
  const [activeTab, setActiveTab] = useState("prodi");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Loading state saat check auth
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(() => {
    // Load expanded categories from localStorage
    const saved = localStorage.getItem("expandedCategories");
    return saved ? JSON.parse(saved) : {};
  });

  const roleMapping = {
    SEKJUR: "sekjur",
    MAHASISWA: "mahasiswa",
    DOSEN: "dosen",
    KAPRODI: "kaprodi",
  };

  const defaultTabMapping = {
    sekjur: "prodi",
    dosen: "mahasiswa",
    kaprodi: "jadwal-prodi",
    mahasiswa: "pengajuan-sa",
  };

  const getRoleMapping = (backendRole) =>
    roleMapping[backendRole] || backendRole.toLowerCase();

  const setAuthState = (userData, mappedUserType, token) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setUserType(mappedUserType);
    setAuthToken(token);
    setCurrentView("system");
    window.authToken = token;
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("userType", mappedUserType);
    localStorage.setItem("token", token);
  };

  const handleLogout = () => {
    // Jangan hapus activeTab - biarkan tetap tersimpan untuk remember last tab
    ["token", "userData", "userType"].forEach((key) =>
      localStorage.removeItem(key),
    );
    window.authToken = null;
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserType(null);
    setAuthToken(null);
    setCurrentView("login");
    // Jangan reset activeTab, biarkan tetap di state (akan di-restore saat login)
  };

  // Define menu items with proper role-based access control
  const menuCategories = [
    {
      id: "akademik",
      label: "Data Akademik",
      icon: BookOpen,
      allowedRoles: ["sekjur", "dosen", "kaprodi"],
      items: [
        {
          id: "prodi",
          label: "Program Studi",
          icon: Building2,
          component: ProdiList,
          description: "Kelola data program studi",
          allowedRoles: ["sekjur"],
        },
        {
          id: "mahasiswa",
          label: "Mahasiswa",
          icon: GraduationCap,
          component: MahasiswaList,
          description: "Kelola data mahasiswa",
          allowedRoles: ["sekjur", "dosen", "kaprodi"],
        },
        {
          id: "dosen",
          label: "Dosen",
          icon: UserCheck,
          component: DosenList,
          description: "Kelola data dosen",
          allowedRoles: ["sekjur"],
        },
      ],
    },
    {
      id: "jadwal",
      label: "Manajemen Jadwal",
      icon: CalendarDays,
      allowedRoles: ["sekjur", "kaprodi", "dosen"],
      items: [
        {
          id: "periode-jadwal",
          label: "Periode Jadwal",
          icon: Clock,
          component: TimetablePeriodManager,
          description: "Kelola periode timetable",
          allowedRoles: ["sekjur"],
        },
        {
          id: "review-jadwal",
          label: "Review Jadwal",
          icon: CheckSquare,
          component: SekjurScheduleReview,
          description: "Review dan setujui jadwal dari Kaprodi",
          allowedRoles: ["sekjur"],
        },
        {
          id: "jadwal-prodi",
          label: "Jadwal Prodi",
          icon: Calendar,
          component: KaprodiScheduleManager,
          description: "Buat dan kelola jadwal kuliah prodi",
          allowedRoles: ["kaprodi"],
        },
        {
          id: "request-jadwal",
          label: "Request Jadwal",
          icon: Send,
          component: DosenScheduleRequestManager,
          description: "Ajukan request mengajar mata kuliah",
          allowedRoles: ["dosen"],
        },
      ],
    },
    {
      id: "semester-antara",
      label: "Semester Antara (SA)",
      icon: School,
      allowedRoles: ["sekjur", "dosen", "mahasiswa", "kaprodi"],
      items: [
        {
          id: "pengajuan-sa",
          label: "Pengajuan SA",
          icon: FolderOpen,
          component: PengajuanSAList,
          description: "Kelola pengajuan SA",
          allowedRoles: ["sekjur", "dosen", "mahasiswa", "kaprodi"],
        },
      ],
    },
    {
      id: "sistem",
      label: "Sistem",
      icon: Settings,
      allowedRoles: ["sekjur"],
      items: [
        {
          id: "users",
          label: "Daftar Akun",
          icon: UserCog,
          component: UsersList,
          description: "Kelola akun yang terdaftar di sistem",
          allowedRoles: ["sekjur"],
        },
      ],
    },
  ];

  // Flatten menu items for backward compatibility
  const menuItems = menuCategories.flatMap((category) => category.items);

  // Function to verify token with backend
  const verifyTokenWithBackend = async (token) => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch("http://localhost:5000/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 429 Too Many Requests - don't throw, just log and let it fail gracefully
      if (response.status === 429) {
        console.warn(
          "Rate limit reached during token verification. Will retry on next page load.",
        );
        throw new Error("Rate limit reached");
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const userData = result.data;
          const mappedUserType = getRoleMapping(userData.role);
          setAuthState(userData, mappedUserType, token);
        } else {
          throw new Error("Token verification failed");
        }
      } else {
        throw new Error("Token verification failed");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error(
          "Token verification timeout - backend may not be running",
        );
      } else if (error.message === "Rate limit reached") {
        console.warn("Rate limit reached during token verification");
      } else {
        console.error("Token verification failed:", error);
      }
      throw error;
    }
  };

  // Check for existing authentication and active tab on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("userData");
        const userType = localStorage.getItem("userType");
        const savedActiveTab = localStorage.getItem("activeTab");

        // If no token, show login immediately without waiting
        if (!token || !userData || !userType) {
          handleLogout();
          setIsCheckingAuth(false);
          return;
        }

        // If token exists, verify with backend
        try {
          await verifyTokenWithBackend(token);

          // Restore active tab if it exists and is valid for the user type
          // userType sudah di-set oleh verifyTokenWithBackend melalui setAuthState
          // Tapi kita perlu menggunakan userType dari localStorage karena state belum update
          const parsedUserData = JSON.parse(userData);
          const parsedUserType = getRoleMapping(parsedUserData.role);

          if (parsedUserType && savedActiveTab) {
            const availableMenuItems = menuItems.filter((item) =>
              item.allowedRoles.includes(parsedUserType),
            );
            const isValidTab = availableMenuItems.some(
              (item) => item.id === savedActiveTab
            );

            if (isValidTab) {
              setActiveTab(savedActiveTab);

              // Find and expand the category containing this menu
              const category = menuCategories.find((cat) =>
                cat.items.some((item) => item.id === savedActiveTab),
              );

              if (category) {
                // Expand only the category containing the active menu
                const newExpandedCategories = { [category.id]: true };
                setExpandedCategories(newExpandedCategories);
                localStorage.setItem(
                  "expandedCategories",
                  JSON.stringify(newExpandedCategories),
                );
              }
            } else {
              // Tab tidak valid untuk user type ini, set ke default
              const defaultTab = defaultTabMapping[parsedUserType];
              if (defaultTab) {
                setActiveTab(defaultTab);
                localStorage.setItem("activeTab", defaultTab);

                const category = menuCategories.find((cat) =>
                  cat.items.some((item) => item.id === defaultTab),
                );
                if (category) {
                  const newExpandedCategories = { [category.id]: true };
                  setExpandedCategories(newExpandedCategories);
                  localStorage.setItem(
                    "expandedCategories",
                    JSON.stringify(newExpandedCategories),
                  );
                }
              }
            }
          } else if (parsedUserType) {
            // Tidak ada saved tab, set ke default
            const defaultTab = defaultTabMapping[parsedUserType];
            if (defaultTab) {
              setActiveTab(defaultTab);
              localStorage.setItem("activeTab", defaultTab);

              const category = menuCategories.find((cat) =>
                cat.items.some((item) => item.id === defaultTab),
              );
              if (category) {
                const newExpandedCategories = { [category.id]: true };
                setExpandedCategories(newExpandedCategories);
                localStorage.setItem(
                  "expandedCategories",
                  JSON.stringify(newExpandedCategories),
                );
              }
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          // Check if it's a network error
          if (isNetworkError(error) || error.isNetworkError || error.message?.includes('fetch') || error.message?.includes('Network')) {
            setNetworkError(error);
          } else {
            // Token invalid or backend not reachable, clear everything and show login
            handleLogout();
          }
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        // Check if it's a network error
        if (error.isNetworkError || error.message?.includes('fetch') || error.message?.includes('Network')) {
          setNetworkError(error);
        } else {
          // If anything goes wrong, clear auth and show login
          handleLogout();
        }
      } finally {
        // Always set checking to false, even if there's an error
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Setup online/offline listener
    const cleanup = setupOnlineListener((online) => {
      setIsOnline(online);
      if (online && networkError) {
        setNetworkError(null);
      }
    });

    return () => {
      cleanup();
    };
  }, [networkError]);

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    if (!userType) return [];

    return menuItems.filter((item) => item.allowedRoles.includes(userType));
  };

  // Get filtered menu categories for sidebar
  const getSidebarMenuItems = () => {
    if (!userType) return [];

    // Filter categories that have at least one accessible item
    return menuCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) =>
          item.allowedRoles.includes(userType),
        ),
      }))
      .filter((category) => category.items.length > 0);
  };

  // Handle menu change and persist state
  const handleMenuChange = (menuId) => {
    // Handle special menu items
    if (menuId === "landing") {
      setCurrentView("landing");
      return;
    } else if (menuId === "logout") {
      handleLogout();
      return;
    }

    // Check if user has access to this menu
    const hasAccess = getFilteredMenuItems().some((item) => item.id === menuId);

    if (!hasAccess) {
      return;
    }

    // Set active tab and persist
    setActiveTab(menuId);
    localStorage.setItem("activeTab", menuId);

    // Find which category this menu belongs to and expand it
    const category = menuCategories.find((cat) =>
      cat.items.some((item) => item.id === menuId),
    );

    if (category) {
      const newExpandedCategories = { [category.id]: true };
      setExpandedCategories(newExpandedCategories);
      localStorage.setItem(
        "expandedCategories",
        JSON.stringify(newExpandedCategories),
      );
    }
  };

  // Handle category toggle
  const handleCategoryToggle = (categoryId) => {
    setExpandedCategories((prev) => {
      const newState = {
        ...prev,
        [categoryId]: !prev[categoryId],
      };
      localStorage.setItem("expandedCategories", JSON.stringify(newState));
      return newState;
    });
  };

  // Add navigation items for MainLayout
  const getAllMenuItems = () => {
    const filteredItems = getFilteredMenuItems();

    return [
      {
        id: "landing",
        label: "Beranda",
        icon: Home,
        description: "Kembali ke halaman utama",
      },
      ...filteredItems,
      {
        id: "logout",
        label: "Keluar",
        icon: LogOut,
        description: "Keluar dari sistem",
      },
    ];
  };

  const currentMenuItem = getFilteredMenuItems().find(
    (item) => item.id === activeTab,
  );
  const ActiveComponent = currentMenuItem?.component;

  // Handle successful login
  const handleLoginSuccess = (userData, loginUserType, authData) => {
    const mappedUserType = getRoleMapping(loginUserType);

    setAuthState(userData, mappedUserType, authData.token);

    // Cek apakah ada saved activeTab yang valid untuk user type ini
    const savedActiveTab = localStorage.getItem("activeTab");
    const availableMenuItems = menuItems.filter((item) =>
      item.allowedRoles.includes(mappedUserType),
    );

    let tabToUse = null;
    let categoryToExpand = null;

    // Jika ada saved tab dan valid untuk user type ini, gunakan itu
    if (savedActiveTab) {
      const isValidTab = availableMenuItems.some(
        (item) => item.id === savedActiveTab
      );
      if (isValidTab) {
        tabToUse = savedActiveTab;
        // Find category untuk tab ini
        categoryToExpand = menuCategories.find((cat) =>
          cat.items.some((item) => item.id === savedActiveTab),
        );
      }
    }

    // Jika tidak ada saved tab yang valid, gunakan default tab
    if (!tabToUse && availableMenuItems.length > 0) {
      tabToUse =
        defaultTabMapping[mappedUserType] || availableMenuItems[0].id;
      // Find category untuk default tab
      categoryToExpand = menuCategories.find((cat) =>
        cat.items.some((item) => item.id === tabToUse),
      );
    }

    // Set active tab
    if (tabToUse) {
      setActiveTab(tabToUse);
      localStorage.setItem("activeTab", tabToUse);

      // Expand category yang sesuai
      if (categoryToExpand) {
        const newExpandedCategories = { [categoryToExpand.id]: true };
        setExpandedCategories(newExpandedCategories);
        localStorage.setItem(
          "expandedCategories",
          JSON.stringify(newExpandedCategories),
        );
      }
    }
  };

  // Handle entering system from landing page
  const handleEnterSystem = (directMenu = null) => {
    if (!isAuthenticated) {
      setCurrentView("login");
      return;
    }

    setCurrentView("system");
    const filteredItems = getFilteredMenuItems();

    if (directMenu && filteredItems.find((item) => item.id === directMenu)) {
      setActiveTab(directMenu);
    } else if (filteredItems.length > 0) {
      const defaultTab = defaultTabMapping[userType] || filteredItems[0].id;
      setActiveTab(defaultTab);
    }
  };

  // Show loading page while checking auth
  if (isCheckingAuth) {
    return <LoadingPage message="Memeriksa autentikasi..." />;
  }

  // Show network error if offline and authenticated
  if (!isOnline && isAuthenticated && networkError) {
    return (
      <NetworkError
        message={networkError.message || "Koneksi internet terputus. Pastikan perangkat Anda terhubung ke internet."}
        onRetry={() => {
          setNetworkError(null);
          window.location.reload();
        }}
      />
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Show landing page
  if (currentView === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Sistem Akademik
          </h1>
          <p className="text-gray-600 mb-2">
            Selamat datang, {currentUser?.nama || currentUser?.username}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Role: {currentUser?.role}
          </p>

          {/* Show available features based on role */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4">
              Fitur yang tersedia untuk Anda:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {getFilteredMenuItems().map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-lg shadow-md"
                  >
                    <Icon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800">
                      {item.label}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {item.description}
                    </p>
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
    <>
      {/* Welcome Popup - muncul saat pertama kali login */}
      {isAuthenticated && userType && currentUser && (
        <WelcomePopup
          userType={userType}
          currentUser={currentUser}
        />
      )}

      <MainLayout
        title={currentMenuItem?.label || "Dashboard"}
        activeMenu={activeTab}
        onMenuChange={handleMenuChange}
        menuItems={getSidebarMenuItems()} // Only pass filtered sidebar items
        expandedCategories={expandedCategories}
        onCategoryToggle={handleCategoryToggle}
        showBackToLanding={true}
        currentUser={currentUser}
        userType={userType}
        onLogout={handleLogout}
        authToken={authToken} // Pass token to child components if needed
      >
        {ActiveComponent && (
          <Suspense fallback={<LoadingPage message="Memuat halaman..." />}>
            <ActiveComponent
              authToken={authToken}
              currentUser={currentUser}
              userType={userType}
            />
          </Suspense>
        )}
      </MainLayout>
      <NetworkStatus />
    </>
  );
}
