import React from 'react';
import {
  BookOpen,
  Users,
  GraduationCap,
  Building,
  School,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
// ✨ IMPORT LOGO POLIMDO
import polimdoLogo from '../../assets/images/xyz-logo.png';

const Sidebar = ({ 
  activeMenu = 'prodi', 
  onMenuChange, 
  isCollapsed = false, 
  onToggleCollapse, 
  menuItems = [] // Accept menu items as props
}) => {
  // Default menu items (fallback if no menuItems provided)
  const defaultMenuItems = [
    { id: 'jurusan', label: 'Jurusan', icon: Building },
    { id: 'prodi', label: 'Program Studi', icon: BookOpen },
    { id: 'dosen', label: 'Dosen', icon: Users },
    { id: 'mahasiswa', label: 'Mahasiswa', icon: GraduationCap },
    { id: 'pengajuan-sa', label: 'Pengajuan SA', icon: FileText },
    { id: 'penugasan-mengajar', label: 'Penugasan Mengajar', icon: School },
  ];

  // Use provided menuItems or fallback to default
  const displayMenuItems = menuItems.length > 0 ? menuItems : defaultMenuItems;

  return (
    <div className={`bg-white border-r border-gray-200 shadow-lg transition-all duration-300 h-full flex flex-col relative z-10 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Sidebar Header */}
      <div className={`p-4 flex-shrink-0 bg-gradient-to-br from-blue-800 via-blue-600 to-blue-400 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            {/* ✨ GANTI DENGAN LOGO POLIMDO */}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md p-1">
              <img 
                src={polimdoLogo} 
                alt="Politeknik Negeri Manado Logo" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-lg truncate">P3M POLIMDO</div>
                <div className="text-blue-100 text-xs truncate">Sistem Akademik</div>
              </div>
            )}
          </div>
          
          {/* Collapse Toggle */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
        
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full mt-3 p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200 flex justify-center"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto bg-gray-50">
        <div className="space-y-2">
          {displayMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => onMenuChange && onMenuChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white hover:shadow-md hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                    }`} />
                    
                    {!isCollapsed && (
                      <span className="ml-3 font-medium text-sm truncate">
                        {item.label}
                      </span>
                    )}
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && !isCollapsed && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm"></div>
                  )}
                </button>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Show message if no menu items available */}
        {displayMenuItems.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Tidak ada menu yang tersedia</p>
          </div>
        )}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 flex-shrink-0 bg-gray-50">
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-xl p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center space-x-3">
              {/* ✨ LOGO POLIMDO JUGA DI FOOTER */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md p-1">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1">
                  <img 
                    src={polimdoLogo} 
                    alt="Politeknik Negeri Manado Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">POLIMDO</p>
                <p className="text-xs text-gray-600 truncate">Sistem Akademik v2.0</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;