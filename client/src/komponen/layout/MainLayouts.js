import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({
  children,
  title = "Dashboard",
  activeMenu = 'dashboard',
  onMenuChange,
  menuItems = [],
  currentUser,
  userType,
  onLogout,
  authToken
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleMenuChange = (menuId) => {
    if (onMenuChange) {
      onMenuChange(menuId);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Layout Container */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`sidebar-container ${sidebarCollapsed ? 'w-16' : 'w-64'
          } transition-all duration-300 flex-shrink-0 relative z-20`}>
          <Sidebar
            activeMenu={activeMenu}
            onMenuChange={handleMenuChange}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            menuItems={menuItems}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          {/* Header */}
          <div className="header-container">
            <Header
              title={title}
              user={currentUser?.nama || currentUser?.name || "User"}
              role={userType === 'sekjur' ? 'Sekretaris Jurusan' : userType === 'dosen' ? 'Dosen' : userType === 'kaprodi' ? 'Kaprodi' : 'Mahasiswa'}
              onToggleSidebar={toggleSidebar}
              sidebarCollapsed={sidebarCollapsed}
              onLogout={onLogout}
              currentUser={currentUser}
            />
          </div>

          {/* Content Area */}
          <main className="flex-1 overflow-auto pt-16">
            <div className="p-4 sm:p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-full">
                <div className="p-6">
                  {/* Title */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                      {title}
                    </h1>
                    <div className="h-px bg-gray-200"></div>
                  </div>

                  {/* Content */}
                  <div>
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-15"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default MainLayout;