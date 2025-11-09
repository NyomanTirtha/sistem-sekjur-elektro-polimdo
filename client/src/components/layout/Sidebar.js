import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import polimdoLogo from "../../assets/gambar/xyz-logo.png";
import { getSidebarHeaderClass, getActiveMenuClass, getTheme } from "../../utils/theme";

const Sidebar = ({
  activeMenu = "prodi",
  onMenuChange,
  isCollapsed = false,
  onToggleCollapse,
  menuItems = [],
  expandedCategories = {},
  onCategoryToggle,
  currentUser = null,
}) => {
  const toggleCategory = (categoryId) => {
    if (onCategoryToggle) {
      onCategoryToggle(categoryId);
    }
  };

  // Check if menuItems is an array of categories or flat items
  const isCategories = menuItems.length > 0 && menuItems[0].items !== undefined;
  const Logo = () => (
    <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0 p-1">
      <img
        src={polimdoLogo}
        alt="Politeknik Negeri Manado Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );

  const theme = getTheme(currentUser);
  const sidebarHeaderClass = getSidebarHeaderClass(currentUser);
  const activeMenuClass = getActiveMenuClass(currentUser);
  const hoverClass = theme.sidebar.hover;

  return (
    <div
      className={`bg-white border-r border-gray-200 h-full flex flex-col ${isCollapsed ? "w-16" : "w-64"}`}
    >
      <div
        className={`p-4 flex-shrink-0 ${sidebarHeaderClass} ${isCollapsed ? "px-3" : "px-4"}`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center ${isCollapsed ? "justify-center w-full" : "space-x-3"}`}
          >
            <Logo />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white text-sm truncate">
                  POLIMDO
                </div>
                <div className="text-gray-300 text-xs truncate">
                  Sistem Akademik
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className={`p-1 ${hoverClass} rounded flex-shrink-0`}
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className={`w-full mt-3 p-1 ${hoverClass} rounded flex justify-center`}
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto bg-white">
        {isCategories ? (
          <div className="space-y-1">
            {menuItems.map((category) => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories[category.id] === true;
              const hasMultipleItems = category.items && category.items.length > 1;

              // Jika hanya ada 1 item, render sebagai flat menu item (tanpa kategori)
              if (!hasMultipleItems && category.items && category.items.length === 1) {
                const item = category.items[0];
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onMenuChange?.(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded transition-colors ${
                      isActive
                        ? activeMenuClass
                        : "text-gray-700 hover:bg-gray-100"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? "text-white" : "text-gray-600"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="ml-3 text-sm">{item.label}</span>
                    )}
                  </button>
                );
              }

              // Jika ada 2 atau lebih item, render sebagai kategori dengan collapse
              return (
                <div key={category.id} className="space-y-1">
                  {/* Category Header - hanya muncul jika ada 2+ items */}
                  {!isCollapsed && hasMultipleItems && (
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left rounded hover:bg-gray-100 group"
                    >
                      <div className="flex items-center">
                        <CategoryIcon className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {category.label}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}

                  {/* Category Items */}
                  {(isExpanded || isCollapsed || !hasMultipleItems) && (
                    <div className={`space-y-1 ${!isCollapsed && hasMultipleItems ? "pl-2" : ""}`}>
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeMenu === item.id;
                        return (
                            <button
                              key={item.id}
                              onClick={() => onMenuChange?.(item.id)}
                              className={`w-full flex items-center px-3 py-2 text-left rounded transition-colors ${
                                isActive
                                  ? activeMenuClass
                                  : "text-gray-700 hover:bg-gray-100"
                              } ${isCollapsed ? "justify-center" : ""}`}
                              title={isCollapsed ? item.label : ""}
                            >
                              <Icon
                                className={`w-5 h-5 flex-shrink-0 ${
                                  isActive ? "text-white" : "text-gray-600"
                                }`}
                              />
                            {!isCollapsed && (
                              <span className="ml-3 text-sm">{item.label}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback to flat menu structure */
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                  <button
                    key={item.id}
                    onClick={() => onMenuChange?.(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded ${
                      isActive
                        ? activeMenuClass
                        : "text-gray-700 hover:bg-gray-100"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? "text-white" : "text-gray-600"
                      }`}
                    />
                  {!isCollapsed && (
                    <span className="ml-3 text-sm">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {menuItems.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Tidak ada menu yang tersedia</p>
          </div>
        )}
      </nav>

      {!isCollapsed && (
        <div className="p-4 flex-shrink-0 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Logo />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 truncate">
                POLIMDO
              </p>
              <p className="text-xs text-gray-500 truncate">Sistem Akademik</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
