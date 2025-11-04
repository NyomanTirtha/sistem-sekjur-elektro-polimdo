import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({
  children,
  title = "Dashboard",
  activeMenu = 'dashboard',
  onMenuChange,
  menuItems = [], // Accept filtered menu items
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
    console.log('Menu changed to:', menuId);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Layout Container */}
      <div className="flex h-screen">
        {/* Sidebar - Fixed position with proper z-index */}
        <motion.div 
          className={`sidebar-container ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } transition-all duration-300 flex-shrink-0 relative z-20`}
          variants={itemVariants}
        >
          <Sidebar 
            activeMenu={activeMenu}
            onMenuChange={handleMenuChange}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            menuItems={menuItems}
          />
        </motion.div>

        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          {/* Header - Fixed at top with consistent height */}
          <motion.div className="header-container" variants={itemVariants}>
            <Header 
              title={title}
              user={currentUser?.nama || currentUser?.name || "User"}
              role={userType === 'sekjur' ? 'Sekretaris Jurusan' : userType === 'dosen' ? 'Dosen' : userType === 'kaprodi' ? 'Kaprodi' : 'Mahasiswa'}
              onToggleSidebar={toggleSidebar}
              sidebarCollapsed={sidebarCollapsed}
              onLogout={onLogout}
              currentUser={currentUser}
            />
          </motion.div>

          {/* Enhanced Content Area */}
          <main className="flex-1 overflow-auto relative pt-16">
            {/* Background Pattern */}
            <motion.div 
              className="absolute inset-0 opacity-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.05 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-800 via-blue-600 to-blue-400"></div>
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="politeknik-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.1"/>
                    <path d="M10,5 L15,15 L5,15 Z" fill="currentColor" opacity="0.05"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#politeknik-pattern)"/>
              </svg>
            </motion.div>

            {/* Content Container */}
            <div className="relative z-10 h-full">
              <motion.div
                className="p-4 sm:p-6 min-h-full"
                variants={itemVariants}
              >
                {/* Enhanced Content Wrapper */}
                <div className="max-w-full h-full">
                  {/* Content Card with University Branding */}
                  <motion.div 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 min-h-full overflow-hidden"
                    variants={cardVariants}
                  >
                    {/* Header Accent */}
                    <motion.div 
                      className="h-1 bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      style={{ transformOrigin: 'left' }}
                    />
                    
                    {/* Content Area */}
                    <motion.div 
                      className="p-6 sm:p-8"
                      variants={itemVariants}
                    >
                      {/* Title Section with University Branding */}
                      <motion.div 
                        className="mb-8"
                        variants={itemVariants}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-1">
                            <motion.h1 
                              className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.4 }}
                            >
                              {title}
                            </motion.h1>
                            <motion.p 
                              className="text-gray-600 text-sm font-medium"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.5 }}
                            >
                              Politeknik Negeri Manado
                            </motion.p>
                            {/* Show current user role */}
                            <motion.p 
                              className="text-gray-500 text-xs mt-1"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.6 }}
                            >
                              {userType === 'sekjur' ? 'Sekretaris Jurusan' :
                               userType === 'dosen' ? 'Dosen' : 
                               userType === 'kaprodi' ? 'Kepala Program Studi' : 
                               'Mahasiswa'} - {currentUser?.nama || currentUser?.username}
                            </motion.p>
                          </div>
                        </div>

                        {/* Decorative Line */}
                        <motion.div
                          className="h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-400"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.6, delay: 0.7 }}
                          style={{ transformOrigin: 'left' }}
                        />
                      </motion.div>

                      {/* Main Content Area */}
                      <motion.div 
                        className="relative"
                        variants={itemVariants}
                      >
                        {/* Content Background */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-br from-white/50 to-blue-50/30 rounded-xl -z-10"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                        />
                        
                        {/* Actual Content */}
                        <motion.div 
                          className="relative z-10 min-h-96"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeMenu}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                            >
                              {children}
                            </motion.div>
                          </AnimatePresence>
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    {/* Footer Accent */}
                    <motion.div
                      className="mt-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1 }}
                    >
                      <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                      <div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-50/30 to-blue-100/30 text-center">
                        <p className="text-xs text-gray-500 font-medium">
                          © 2025 Politeknik Negeri Manado - Excellence in Technical Education
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
             
      {/* Mobile overlay */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-15"
            onClick={toggleSidebar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MainLayout;