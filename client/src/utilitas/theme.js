// Theme utility untuk menentukan warna berdasarkan jurusan

/**
 * Mendapatkan nama jurusan dari user data
 */
export const getJurusanName = (user) => {
  if (!user) return null;

  // Untuk SEKJUR
  if (user.jurusan?.nama) {
    return user.jurusan.nama;
  }

  // Untuk DOSEN/KAPRODI - cek dari prodi
  if (user.prodi?.jurusan?.nama) {
    return user.prodi.jurusan.nama;
  }

  // Untuk KAPRODI - cek dari programStudi (fallback)
  if (user.programStudi?.jurusan?.nama) {
    return user.programStudi.jurusan.nama;
  }

  // Untuk MAHASISWA
  if (user.programStudi?.jurusan?.nama) {
    return user.programStudi.jurusan.nama;
  }

  return null;
};

/**
 * Tema warna berdasarkan jurusan
 */
export const getTheme = (user) => {
  const jurusanName = getJurusanName(user);

  // Teknik Elektro - Biru dongker
  if (jurusanName && jurusanName.toLowerCase().includes('elektro')) {
    return {
      primary: {
        bg: 'bg-blue-900',           // Biru dongker
        hover: 'hover:bg-blue-800',
        text: 'text-blue-900',
        border: 'border-blue-900',
        light: 'bg-blue-800',        // Sedikit lebih terang untuk header
        dark: 'bg-blue-950',         // Lebih gelap untuk accent
      },
      accent: {
        bg: 'bg-blue-800',
        hover: 'hover:bg-blue-700',
        text: 'text-blue-800',
      },
      sidebar: {
        header: 'bg-blue-900',       // Header sidebar biru dongker
        hover: 'hover:bg-blue-800',
        active: 'bg-blue-900 text-white',
      },
      header: {
        accent: 'text-blue-700',     // Warna accent untuk subtitle
        border: 'border-blue-200',    // Border subtle
      },
      avatar: {
        border: 'border-blue-600',    // Border avatar
      },
    };
  }

  // Teknik Sipil - Cokelat dongker
  if (jurusanName && jurusanName.toLowerCase().includes('sipil')) {
    return {
      primary: {
        bg: 'bg-amber-900',          // Cokelat dongker
        hover: 'hover:bg-amber-800',
        text: 'text-amber-900',
        border: 'border-amber-900',
        light: 'bg-amber-800',       // Sedikit lebih terang untuk header
        dark: 'bg-amber-950',        // Lebih gelap untuk accent
      },
      accent: {
        bg: 'bg-amber-800',
        hover: 'hover:bg-amber-700',
        text: 'text-amber-800',
      },
      sidebar: {
        header: 'bg-amber-900',      // Header sidebar cokelat dongker
        hover: 'hover:bg-amber-800',
        active: 'bg-amber-900 text-white',
      },
      header: {
        accent: 'text-amber-700',   // Warna accent untuk subtitle
        border: 'border-amber-200',  // Border subtle
      },
      avatar: {
        border: 'border-amber-600',  // Border avatar
      },
    };
  }

  // Teknik Informatika - Hijau dongker
  if (jurusanName && (jurusanName.toLowerCase().includes('informatika') || jurusanName.toLowerCase().includes('ti'))) {
    return {
      primary: {
        bg: 'bg-emerald-900',         // Hijau dongker
        hover: 'hover:bg-emerald-800',
        text: 'text-emerald-900',
        border: 'border-emerald-900',
        light: 'bg-emerald-800',
        dark: 'bg-emerald-950',
      },
      accent: {
        bg: 'bg-emerald-800',
        hover: 'hover:bg-emerald-700',
        text: 'text-emerald-800',
      },
      sidebar: {
        header: 'bg-emerald-900',
        hover: 'hover:bg-emerald-800',
        active: 'bg-emerald-900 text-white',
      },
      header: {
        accent: 'text-emerald-700',
        border: 'border-emerald-200',
      },
      avatar: {
        border: 'border-emerald-600',
      },
    };
  }

  // Teknik Mesin - Merah dongker
  if (jurusanName && jurusanName.toLowerCase().includes('mesin')) {
    return {
      primary: {
        bg: 'bg-red-900',             // Merah dongker
        hover: 'hover:bg-red-800',
        text: 'text-red-900',
        border: 'border-red-900',
        light: 'bg-red-800',
        dark: 'bg-red-950',
      },
      accent: {
        bg: 'bg-red-800',
        hover: 'hover:bg-red-700',
        text: 'text-red-800',
      },
      sidebar: {
        header: 'bg-red-900',
        hover: 'hover:bg-red-800',
        active: 'bg-red-900 text-white',
      },
      header: {
        accent: 'text-red-700',
        border: 'border-red-200',
      },
      avatar: {
        border: 'border-red-600',
      },
    };
  }

  // Teknik Sipil - Cokelat dongker (sudah ada di atas)
  // Teknik Arsitektur - Ungu dongker
  if (jurusanName && jurusanName.toLowerCase().includes('arsitektur')) {
    return {
      primary: {
        bg: 'bg-purple-900',          // Ungu dongker
        hover: 'hover:bg-purple-800',
        text: 'text-purple-900',
        border: 'border-purple-900',
        light: 'bg-purple-800',
        dark: 'bg-purple-950',
      },
      accent: {
        bg: 'bg-purple-800',
        hover: 'hover:bg-purple-700',
        text: 'text-purple-800',
      },
      sidebar: {
        header: 'bg-purple-900',
        hover: 'hover:bg-purple-800',
        active: 'bg-purple-900 text-white',
      },
      header: {
        accent: 'text-purple-700',
        border: 'border-purple-200',
      },
      avatar: {
        border: 'border-purple-600',
      },
    };
  }

  // Default (jika tidak ada jurusan atau jurusan lain)
  return {
    primary: {
      bg: 'bg-gradient-to-r from-gray-600 to-gray-700',
      hover: 'hover:bg-gray-700',
      text: 'text-gray-800',
      border: 'border-gray-800',
      light: 'bg-gray-700',
      dark: 'bg-gray-900',
    },
    accent: {
      bg: 'bg-gray-700',
      hover: 'hover:bg-gray-600',
      text: 'text-gray-700',
    },
    sidebar: {
      header: 'bg-gray-800',
      hover: 'hover:bg-gray-700',
      active: 'bg-gray-800 text-white',
    },
    header: {
      accent: 'text-gray-200',
      border: 'border-gray-800',
    },
    avatar: {
      border: 'border-gray-500',
    },
  };
};

/**
 * Mendapatkan class untuk sidebar header berdasarkan tema
 */
export const getSidebarHeaderClass = (user) => {
  const theme = getTheme(user);
  return theme.sidebar.header;
};

/**
 * Mendapatkan class untuk active menu item berdasarkan tema
 */
export const getActiveMenuClass = (user) => {
  const theme = getTheme(user);
  return theme.sidebar.active;
};

/**
 * Mendapatkan class untuk button dengan base style (untuk button dengan layout inline-flex)
 */
export const getButtonPrimaryClass = (user) => {
  const theme = getTheme(user);
  return `${theme.primary.bg} ${theme.primary.hover} text-white`;
};

/**
 * Mendapatkan class untuk button secondary
 */
export const getButtonSecondaryClass = (user) => {
  const theme = getTheme(user);
  return `inline-flex items-center px-4 py-2 ${theme.accent.bg} text-white rounded-lg ${theme.accent.hover}`;
};

/**
 * Mendapatkan class untuk header accent (subtitle, dll)
 */
export const getHeaderAccentClass = (user) => {
  const theme = getTheme(user);
  return theme.header?.accent || 'text-gray-600';
};

/**
 * Mendapatkan class untuk avatar border
 */
export const getAvatarBorderClass = (user) => {
  const theme = getTheme(user);
  return theme.avatar?.border || 'border-gray-500';
};
