/**
 * ========================================
 * COLOR SYSTEM CONSTANTS
 * ========================================
 * Standardized color palette untuk konsistensi UI
 * Menggunakan Tailwind CSS classes
 */

// ========================================
// PRIMARY COLORS (Blue - Main Brand)
// ========================================
export const PRIMARY = {
  // Buttons, Links, Active states
  main: 'bg-blue-600 text-white hover:bg-blue-700',
  light: 'bg-blue-50 text-blue-700',
  border: 'border-blue-600',
  text: 'text-blue-600',
  hover: 'hover:bg-blue-50',

  // Gradient untuk headers
  gradient: 'bg-gradient-to-r from-blue-600 to-blue-700',
  gradientLight: 'bg-gradient-to-r from-blue-50 to-blue-100',
};

// ========================================
// SEMANTIC COLORS
// ========================================
export const SUCCESS = {
  main: 'bg-green-600 text-white hover:bg-green-700',
  light: 'bg-green-50 text-green-700 border-green-200',
  text: 'text-green-600',
  border: 'border-green-600',
};

export const WARNING = {
  main: 'bg-yellow-600 text-white hover:bg-yellow-700',
  light: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  text: 'text-yellow-600',
  border: 'border-yellow-600',
};

export const DANGER = {
  main: 'bg-red-600 text-white hover:bg-red-700',
  light: 'bg-red-50 text-red-700 border-red-200',
  text: 'text-red-600',
  border: 'border-red-600',
};

export const INFO = {
  main: 'bg-blue-600 text-white hover:bg-blue-700',
  light: 'bg-blue-50 text-blue-700 border-blue-200',
  text: 'text-blue-600',
  border: 'border-blue-600',
};

// ========================================
// NEUTRAL COLORS
// ========================================
export const NEUTRAL = {
  white: 'bg-white text-gray-900',
  light: 'bg-gray-50 text-gray-700',
  medium: 'bg-gray-100 text-gray-800',
  dark: 'bg-gray-800 text-white',

  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-500',
  },

  border: {
    light: 'border-gray-200',
    medium: 'border-gray-300',
  },
};

// ========================================
// STATUS BADGE COLORS
// ========================================
export const STATUS = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
  approved: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

// ========================================
// TABLE STYLES
// ========================================
export const TABLE = {
  // Header dengan gradient gray (konsisten dengan popup modal)
  header: 'bg-gradient-to-r from-gray-600 to-gray-700',
  headerText: 'text-xs font-semibold text-white uppercase tracking-wider',

  // Body
  row: 'hover:bg-blue-50 transition-colors',
  cell: 'px-4 py-3 text-sm text-gray-700',
  cellBold: 'px-4 py-3 text-sm font-medium text-gray-900',

  // Borders
  border: 'divide-y divide-gray-200',
  container: 'bg-white rounded-lg shadow overflow-hidden',
};

// ========================================
// BUTTON STYLES
// ========================================
export const BUTTON = {
  // Primary button (Blue)
  primary: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium',

  // Secondary button (Gray)
  secondary: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium',

  // Success button (Green)
  success: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium',

  // Danger button (Red)
  danger: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium',

  // Outline button
  outline: 'px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium',

  // Icon button
  icon: 'p-2 rounded-lg transition-colors',
  iconPrimary: 'p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors',
  iconDanger: 'p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors',
  iconSuccess: 'p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors',
};

// ========================================
// CARD STYLES
// ========================================
export const CARD = {
  base: 'bg-white rounded-lg shadow-md p-4',
  hover: 'bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow',
  bordered: 'bg-white rounded-lg border border-gray-200 p-4',

  header: 'bg-white rounded-t-lg shadow-md p-4 border-b border-gray-200',
  body: 'bg-white p-4',
  footer: 'bg-gray-50 rounded-b-lg p-4 border-t border-gray-200',
};

// ========================================
// ALERT/NOTIFICATION STYLES
// ========================================
export const ALERT = {
  success: 'bg-green-50 border border-green-200 rounded-lg p-4',
  successText: 'text-green-800',
  successIcon: 'text-green-600',

  error: 'bg-red-50 border border-red-200 rounded-lg p-4',
  errorText: 'text-red-800',
  errorIcon: 'text-red-600',

  warning: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4',
  warningText: 'text-yellow-800',
  warningIcon: 'text-yellow-600',

  info: 'bg-blue-50 border border-blue-200 rounded-lg p-4',
  infoText: 'text-blue-800',
  infoIcon: 'text-blue-600',
};

// ========================================
// INPUT STYLES
// ========================================
export const INPUT = {
  base: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  error: 'w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
  disabled: 'w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed',

  label: 'block text-sm font-medium text-gray-700 mb-2',
  errorText: 'text-sm text-red-600 mt-1',
  helperText: 'text-sm text-gray-500 mt-1',
};

// ========================================
// BADGE STYLES
// ========================================
export const BADGE = {
  blue: 'px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium',
  green: 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium',
  yellow: 'px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium',
  red: 'px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium',
  gray: 'px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium',
  purple: 'px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium',
};

// ========================================
// TIME SLOT COLORS (untuk jadwal)
// ========================================
export const TIME_SLOT = {
  morning: 'bg-blue-100 text-blue-800',    // 07:00-10:00
  midday: 'bg-green-100 text-green-800',   // 10:00-13:00
  afternoon: 'bg-yellow-100 text-yellow-800', // 13:00-16:00
  evening: 'bg-purple-100 text-purple-800',   // 16:00-18:00
};

// ========================================
// DAY COLORS (untuk kalender/jadwal)
// ========================================
export const DAY_COLORS = {
  SENIN: 'border-l-4 border-l-blue-500',
  SELASA: 'border-l-4 border-l-green-500',
  RABU: 'border-l-4 border-l-yellow-500',
  KAMIS: 'border-l-4 border-l-red-500',
  JUMAT: 'border-l-4 border-l-purple-500',
  SABTU: 'border-l-4 border-l-pink-500',
};

// ========================================
// LOADING/SKELETON STYLES
// ========================================
export const LOADING = {
  spinner: 'animate-spin rounded-full border-b-2 border-blue-600',
  skeleton: 'animate-pulse bg-gray-200 rounded',
  overlay: 'bg-black/50',
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get button style by variant
 */
export const getButtonStyle = (variant = 'primary', size = 'md') => {
  const baseStyle = BUTTON[variant] || BUTTON.primary;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return `${baseStyle} ${sizeClasses[size]}`;
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const statusMap = {
    'PROSES_PENGAJUAN': STATUS.pending,
    'MENUNGGU_VERIFIKASI_KAPRODI': STATUS.pending,
    'DALAM_PROSES_SA': STATUS.active,
    'SELESAI': STATUS.completed,
    'DITOLAK': STATUS.rejected,
    'APPROVED': STATUS.approved,
    'PENDING': STATUS.pending,
    'ACTIVE': STATUS.active,
    'INACTIVE': STATUS.inactive,
  };

  return statusMap[status] || STATUS.pending;
};

/**
 * Get alert style by type
 */
export const getAlertStyle = (type = 'info') => {
  const styles = {
    success: { container: ALERT.success, text: ALERT.successText, icon: ALERT.successIcon },
    error: { container: ALERT.error, text: ALERT.errorText, icon: ALERT.errorIcon },
    warning: { container: ALERT.warning, text: ALERT.warningText, icon: ALERT.warningIcon },
    info: { container: ALERT.info, text: ALERT.infoText, icon: ALERT.infoIcon },
  };

  return styles[type] || styles.info;
};

export default {
  PRIMARY,
  SUCCESS,
  WARNING,
  DANGER,
  INFO,
  NEUTRAL,
  STATUS,
  TABLE,
  BUTTON,
  CARD,
  ALERT,
  INPUT,
  BADGE,
  TIME_SLOT,
  DAY_COLORS,
  LOADING,
  getButtonStyle,
  getStatusColor,
  getAlertStyle,
};
