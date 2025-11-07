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
} from "lucide-react";
import MainLayout from "./komponen/layout/MainLayouts";
import LoginPage from "./halaman/masuk/HalamanMasuk";

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
const TeachingPicker = lazy(
  () => import("./komponen/fitur/dosen/PilihPenugasan"),
);
const TeachingAssignmentManager = lazy(
  () => import("./komponen/fitur/penugasan-mengajar/KelolaPenugasan"),
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
    ["token", "userData", "userType", "activeTab"].forEach((key) =>
      localStorage.removeItem(key),
    );
    window.authToken = null;
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserType(null);
    setAuthToken(null);
    setCurrentView("login");
    setActiveTab("prodi");
  };

  // Define menu items with proper role-based access control
  const menuCategories = [
    {
      id: "akademik",
      label: "Data Akademik",
      icon: GraduationCap,
      allowedRoles: ["sekjur", "dosen", "kaprodi"],
      items: [
        {
          id: "prodi",
          label: "Program Studi",
          icon: ClipboardList,
          component: ProdiList,
          description: "Kelola data program studi",
          allowedRoles: ["sekjur"],
        },
        {
          id: "mahasiswa",
          label: "Mahasiswa",
          icon: Users,
          component: MahasiswaList,
          description: "Kelola data mahasiswa",
          allowedRoles: ["sekjur", "dosen", "kaprodi"],
        },
        {
          id: "dosen",
          label: "Dosen",
          icon: GraduationCap,
          component: DosenList,
          description: "Kelola data dosen",
          allowedRoles: ["sekjur"],
        },
      ],
    },
    {
      id: "jadwal",
      label: "Manajemen Jadwal",
      icon: Calendar,
      allowedRoles: ["sekjur", "kaprodi", "dosen"],
      items: [
        {
          id: "periode-jadwal",
          label: "Periode Jadwal",
          icon: Calendar,
          component: TimetablePeriodManager,
          description: "Kelola periode timetable",
          allowedRoles: ["sekjur"],
        },
        {
          id: "review-jadwal",
          label: "Review Jadwal",
          icon: FileText,
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
          icon: FileText,
          component: DosenScheduleRequestManager,
          description: "Ajukan request mengajar mata kuliah",
          allowedRoles: ["dosen"],
        },
      ],
    },
    {
      id: "pengajaran",
      label: "Penugasan Mengajar",
      icon: BookOpen,
      allowedRoles: ["dosen", "kaprodi"],
      items: [
        {
          id: "penugasan-mengajar",
          label: "Penugasan Mengajar",
          icon: BookOpen,
          component: TeachingPicker,
          description: "Lihat dan ajukan mata kuliah yang akan diajarkan",
          allowedRoles: ["dosen"],
        },
        {
          id: "kelola-penugasan",
          label: "Kelola Penugasan",
          icon: BookOpen,
          component: TeachingAssignmentManager,
          description: "Kelola dan setujui penugasan mengajar dosen",
          allowedRoles: ["kaprodi"],
        },
      ],
    },
    {
      id: "semester-antara",
      label: "Semester Antara (SA)",
      icon: FileText,
      allowedRoles: ["sekjur", "dosen", "mahasiswa", "kaprodi"],
      items: [
        {
          id: "pengajuan-sa",
          label: "Pengajuan SA",
          icon: FileText,
          component: PengajuanSAList,
          description: "Kelola pengajuan SA",
          allowedRoles: ["sekjur", "dosen", "mahasiswa", "kaprodi"],
        },
      ],
    },
    {
      id: "sistem",
      label: "Sistem",
      icon: Users,
      allowedRoles: ["sekjur"],
      items: [
        {
          id: "users",
          label: "Daftar Akun",
          icon: Users,
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
          const parsedUserType = userType; // userType from localStorage
          if (savedActiveTab) {
            const availableMenuItems = menuItems.filter((item) =>
              item.allowedRoles.includes(parsedUserType),
            );
            if (availableMenuItems.some((item) => item.id === savedActiveTab)) {
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
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          // Token invalid or backend not reachable, clear everything and show login
          handleLogout();
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        // If anything goes wrong, clear auth and show login
        handleLogout();
      } finally {
        // Always set checking to false, even if there's an error
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

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

    // Set initial active tab and expand its category
    const defaultTab = defaultTabMapping[mappedUserType];
    if (defaultTab) {
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

    // Set default active tab based on user type and available menu items
    const availableMenuItems = menuItems.filter((item) =>
      item.allowedRoles.includes(mappedUserType),
    );

    if (availableMenuItems.length > 0) {
      const defaultTab =
        defaultTabMapping[mappedUserType] || availableMenuItems[0].id;
      setActiveTab(defaultTab);
      localStorage.setItem("activeTab", defaultTab);
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

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-[3px] border-blue-200 border-t-blue-600 rounded-full"
            style={{ animation: "spin 0.6s linear infinite" }}
          ></div>
          <div className="text-sm text-gray-500 font-medium">
            Memeriksa autentikasi...
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
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
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-10 h-10 border-[3px] border-blue-200 border-t-blue-600 rounded-full"
                  style={{ animation: "spin 0.6s linear infinite" }}
                ></div>
                <div className="text-sm text-gray-500 font-medium">
                  Memuat...
                </div>
              </div>
              <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
            </div>
          }
        >
          <ActiveComponent
            authToken={authToken}
            currentUser={currentUser}
            userType={userType}
          />
        </Suspense>
      )}
    </MainLayout>
  );
}
