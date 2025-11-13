// routes/auth.js - COMPLETE VERSION dengan filtering jurusan
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// JWT Secret (WAJIB disimpan di environment variable)
const JWT_SECRET = process.env.JWT_SECRET;

// Security check: JWT_SECRET harus diset di .env file
if (!JWT_SECRET) {
  console.error(
    "❌ FATAL ERROR: JWT_SECRET tidak ditemukan di environment variable!",
  );
  console.error("👉 Silakan buat file .env di folder server/ dan tambahkan:");
  console.error("   JWT_SECRET=your-secure-random-string-here");
  console.error("\n💡 Generate secure secret dengan command:");
  console.error(
    "   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
  );
  process.exit(1);
}

// ✅ ENHANCED Authentication middleware dengan context filtering
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token autentikasi diperlukan",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        jurusan: true,
        programStudi: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    let dosenData = null;
    if (user.role === "DOSEN") {
      dosenData = await prisma.dosen.findUnique({
        where: { nip: user.username },
        include: {
          prodi: {
            include: {
              jurusan: true,
            },
          },
        },
      });
    }

    // ✅ FIXED: Untuk MAHASISWA, ambil data mahasiswa untuk mendapatkan programStudiId
    let mahasiswaData = null;
    if (user.role === "MAHASISWA") {
      mahasiswaData = await prisma.mahasiswa.findUnique({
        where: { nim: user.username },
        include: {
          programStudi: {
            include: {
              jurusan: true,
            },
          },
        },
      });
    }

    // Tambahkan user info ke request
    req.user = user;
    req.userContext = getUserContext(user, dosenData, mahasiswaData);

    next();
  } catch (error) {
    console.error("Token verification error:", error);

    // Tangani token yang kadaluarsa secara eksplisit agar klien mendapatkan
    // informasi yang jelas dan status code yang sesuai.
    if (error && error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token telah kadaluarsa. Silakan login kembali.",
        expiredAt: error.expiredAt ? error.expiredAt.toISOString() : undefined,
      });
    }

    // Untuk kesalahan verifikasi lain, kembalikan 403 (forbidden) dengan pesan generik.
    return res.status(403).json({
      success: false,
      message: "Token tidak valid",
    });
  }
};

// ✅ NEW: Fungsi untuk mendapatkan context filter berdasarkan role user
const getUserContext = (user, dosenData = null, mahasiswaData = null) => {
  const context = {
    userId: user.id,
    role: user.role,
    canAccessAll: false,
    jurusanId: null,
    programStudiIds: [],
  };

  switch (user.role) {
    case "SEKJUR":
      // Sekretaris Jurusan hanya bisa akses data jurusannya
      if (user.jurusanId) {
        context.jurusanId = user.jurusanId;
        context.canAccessAll = false;
      }
      break;

    case "KAPRODI":
      if (user.programStudiId) {
        context.programStudiIds = [user.programStudiId];
        if (user.programStudi && user.programStudi.jurusanId) {
          context.jurusanId = user.programStudi.jurusanId;
        }
      }
      context.canAccessAll = false;
      break;

    case "DOSEN":
      // ✅ FIXED: Dosen hanya bisa akses data program studinya
      if (dosenData && dosenData.prodiId) {
        context.programStudiIds = [dosenData.prodiId];
        // Ambil jurusanId dari prodi untuk filtering
        if (dosenData.prodi && dosenData.prodi.jurusanId) {
          context.jurusanId = dosenData.prodi.jurusanId;
        }
      }
      context.canAccessAll = false;
      break;

    case "MAHASISWA":
      // ✅ FIXED: Mahasiswa hanya bisa akses data dirinya sendiri
      if (mahasiswaData && mahasiswaData.programStudiId) {
        context.programStudiIds = [mahasiswaData.programStudiId];
        // Ambil jurusanId dari prodi untuk filtering
        if (
          mahasiswaData.programStudi &&
          mahasiswaData.programStudi.jurusanId
        ) {
          context.jurusanId = mahasiswaData.programStudi.jurusanId;
        }
      }
      context.canAccessAll = false;
      break;

    default:
      context.canAccessAll = false;
  }

  return context;
};

// ✅ NEW: Helper functions untuk filtering
const createJurusanFilter = (userContext) => {
  if (userContext.jurusanId) {
    return { id: userContext.jurusanId };
  }
  return null;
};

const createProdiFilter = (userContext) => {
  // ✅ FIXED: Prioritaskan jurusanId jika ada (untuk SEKJUR)
  if (userContext.jurusanId) {
    return { jurusanId: userContext.jurusanId };
  }
  // ✅ FIXED: Jika ada programStudiIds (untuk DOSEN/KAPRODI/MAHASISWA), filter berdasarkan ID
  if (userContext.programStudiIds && userContext.programStudiIds.length > 0) {
    return { id: { in: userContext.programStudiIds } };
  }
  return null;
};

const createMahasiswaFilter = (userContext) => {
  if (userContext.programStudiIds && userContext.programStudiIds.length > 0) {
    return { programStudiId: { in: userContext.programStudiIds } };
  }
  if (userContext.jurusanId) {
    return { programStudi: { jurusanId: userContext.jurusanId } };
  }
  return null;
};

const createDosenFilter = (userContext) => {
  if (userContext.programStudiIds && userContext.programStudiIds.length > 0) {
    return { prodiId: { in: userContext.programStudiIds } };
  }
  if (userContext.jurusanId) {
    return {
      prodi: { jurusanId: userContext.jurusanId },
    };
  }
  return null;
};

const createMataKuliahFilter = (userContext) => {
  if (userContext.programStudiIds && userContext.programStudiIds.length > 0) {
    return { programStudiId: { in: userContext.programStudiIds } };
  }
  if (userContext.jurusanId) {
    return { programStudi: { jurusanId: userContext.jurusanId } };
  }
  return null;
};
// Login endpoint - UPDATED untuk mendukung relasi jurusan
router.post("/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Log minimal: do NOT log password content or derived info.
    console.log("🔑 Login attempt:", { username, role });

    // Validasi input
    if (!username || !password) {
      return res

        .status(400)

        .json({
          success: false,
          message: "Username dan password harus diisi",
        });
    }

    // Cari user berdasarkan username dengan include jurusan
    const user = await prisma.user.findFirst({
      where: { username: username },
      include: { jurusan: true },
    });

    // Avoid logging sensitive password-derived properties.
    console.log(
      "👤 User found:",
      user
        ? {
            id: user.id,
            username: user.username,
            role: user.role,
            jurusanId: user.jurusanId,
            jurusanNama: user.jurusan?.nama,
          }
        : "Not found",
    );

    if (!user) {
      return res

        .status(401)

        .json({
          success: false,
          message: "Username atau password salah",
        });
    }

    // Verifikasi password
    let isPasswordValid = false;

    if (user.password.startsWith("$2")) {
      console.log("🔒 Comparing hashed password");
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("🔒 Password comparison result:", isPasswordValid);
    } else {
      console.log("⚠️ WARNING: Password stored as plain text!");
      isPasswordValid = password === user.password;

      if (isPasswordValid) {
        console.log("🔄 Hashing plain text password");
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
          where: { id: user.id },

          data: { password: hashedPassword },
        });
        console.log("✅ Password hashed and updated");
      }
    }

    if (!isPasswordValid) {
      return res

        .status(401)

        .json({
          success: false,
          message: "Username atau password salah",
        });
    }

    // Verifikasi role jika diberikan
    if (role && user.role !== role.toUpperCase()) {
      return res

        .status(401)

        .json({
          success: false,
          message: "Role tidak sesuai",
        });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    let userData = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      jurusanId: user.jurusanId,
      programStudiId: user.programStudiId,
      jurusan: user.jurusan,
      programStudi: user.programStudi,
    };

    // ✅ UPDATED: Fetch additional data with proper include relations and debug logging
    if (user.role === "MAHASISWA") {
      console.log("🎓 Searching for mahasiswa data:", {
        searchNim: user.username,
        userRole: user.role,
      });

      const mahasiswa = await prisma.mahasiswa.findUnique({
        where: { nim: user.username },
        include: {
          programStudi: {
            include: {
              jurusan: true,
            },
          },
        },
      });

      console.log("🎓 Mahasiswa query result:", {
        found: !!mahasiswa,
        nim: mahasiswa?.nim,
        nama: mahasiswa?.nama,
        angkatan: mahasiswa?.angkatan,
        semester: mahasiswa?.semester,
        noTelp: mahasiswa?.noTelp,
        alamat: mahasiswa?.alamat,
        programStudiId: mahasiswa?.programStudiId,
        hasProgramStudi: !!mahasiswa?.programStudi,
        programStudiData: mahasiswa?.programStudi,
      });

      if (mahasiswa) {
        userData = {
          ...userData,
          nim: mahasiswa.nim,
          nama: mahasiswa.nama,
          programStudiId: mahasiswa.programStudiId,
          programStudi: mahasiswa.programStudi,
          angkatan: mahasiswa.angkatan,
          semester: mahasiswa.semester,
          noTelp: mahasiswa.noTelp,
          alamat: mahasiswa.alamat,
        };

        console.log("📊 Final userData for mahasiswa:", {
          username: userData.username,
          role: userData.role,
          hasProgramStudi: !!userData.programStudi,
          programStudiNama: userData.programStudi?.nama,
          hasAlamat: !!userData.alamat,
          hasNoTelp: !!userData.noTelp,
        });
      } else {
        console.log("❌ No mahasiswa data found for NIM:", user.username);
      }
    } else if (user.role === "DOSEN" || user.role === "KAPRODI") {
      console.log("🔍 Searching for dosen data:", {
        searchNip: user.username,
        userRole: user.role,
      });

      const dosen = await prisma.dosen.findUnique({
        where: { nip: user.username },
        include: {
          prodi: {
            include: {
              jurusan: true,
            },
          },
        },
      });

      console.log("👨‍🏫 Dosen query result:", {
        found: !!dosen,
        nip: dosen?.nip,
        nama: dosen?.nama,
        prodiId: dosen?.prodiId,
        isKaprodi: dosen?.isKaprodi,
        noTelp: dosen?.noTelp,
        alamat: dosen?.alamat,
        hasProdi: !!dosen?.prodi,
        prodiData: dosen?.prodi,
      });

      if (dosen) {
        userData = {
          ...userData,
          nip: dosen.nip,
          nama: dosen.nama,
          prodiId: dosen.prodiId,
          prodi: dosen.prodi,
          isKaprodi: dosen.isKaprodi,
          noTelp: dosen.noTelp,
          alamat: dosen.alamat,
        };
      } else if (user.role === "KAPRODI" && user.programStudi) {
        userData = {
          ...userData,
          programStudiId: user.programStudiId,
          programStudi: user.programStudi,
        };

        console.log("📊 Final userData for dosen:", {
          username: userData.username,
          role: userData.role,
          hasProdi: !!userData.prodi,
          prodiNama: userData.prodi?.nama,
          hasAlamat: !!userData.alamat,
          hasNoTelp: !!userData.noTelp,
          isKaprodi: userData.isKaprodi,
        });
      } else {
        console.log("❌ No dosen data found for NIP:", user.username);

        // Debug: Cek apakah data dosen ada dengan query manual
        console.log("🔍 Debug: Checking if dosen exists in database...");
        const allDosen = await prisma.dosen.findMany({
          select: { nip: true, nama: true },
          take: 5,
        });
        console.log("📋 Sample dosen in database:", allDosen);

        // Cek apakah ada dosen dengan NIP yang mirip
        const similarDosen = await prisma.dosen.findMany({
          where: {
            nip: {
              contains: user.username.substring(0, 5),
            },
          },
          select: { nip: true, nama: true },
        });
        console.log("🔍 Similar NIP found:", similarDosen);
      }
    }
    // ✅ SEKJUR sudah memiliki data jurusan dari user table

    console.log("✅ Login successful:", {
      username: user.username,
      role: user.role,
      jurusan: user.jurusan?.nama,
      tokenLength: token.length,
      hasRelationData: !!(userData.programStudi || userData.prodi),
      finalUserDataKeys: Object.keys(userData),
    });

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: userData,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,

      message: "Terjadi kesalahan pada server: " + error.message,
    });
  }
});

// Test endpoint untuk cek user di database
router.get("/test-users", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  try {
    // Do NOT return password or password-derived values to clients.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        jurusanId: true,
        jurusan: { select: { id: true, nama: true } },
      },
    });

    const userInfo = users.map((user) => ({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      jurusanId: user.jurusanId,
      jurusanNama: user.jurusan?.nama,
    }));

    res.json({
      success: true,
      users: userInfo,
    });
  } catch (error) {
    console.error("Test users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users: " + error.message,
    });
  }
});

// Debug endpoint untuk cek data mahasiswa dan dosen
router.get("/debug-data", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  try {
    const mahasiswaCount = await prisma.mahasiswa.count();
    const dosenCount = await prisma.dosen.count();
    const jurusanCount = await prisma.jurusan.count();
    const prodiCount = await prisma.programStudi.count();

    const sampleMahasiswa = await prisma.mahasiswa.findMany({
      take: 3,
      include: {
        programStudi: {
          include: {
            jurusan: true,
          },
        },
      },
    });

    const sampleDosen = await prisma.dosen.findMany({
      take: 3,
      include: {
        prodi: {
          include: {
            jurusan: true,
          },
        },
      },
    });

    const sampleJurusan = await prisma.jurusan.findMany({
      include: {
        _count: {
          select: {
            programStudi: true,
            users: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        counts: {
          jurusan: jurusanCount,
          programStudi: prodiCount,
          mahasiswa: mahasiswaCount,
          dosen: dosenCount,
        },
        sampleJurusan,
        sampleMahasiswa,
        sampleDosen,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error: " + error.message,
    });
  }
});

// ✅ NEW: Endpoint untuk test filtering
router.get("/test-filter", authenticateToken, async (req, res) => {
  try {
    const prodiFilter = createProdiFilter(req.userContext);
    const mahasiswaFilter = createMahasiswaFilter(req.userContext);

    if (!prodiFilter || !mahasiswaFilter) {
      return res.json({
        success: true,
        message: "User tidak memiliki akses filter",
        userContext: req.userContext,
        user: {
          username: req.user.username,
          role: req.user.role,
          jurusan: req.user.jurusan?.nama,
        },
      });
    }

    const [programStudi, mahasiswa] = await Promise.all([
      prisma.programStudi.findMany({
        where: prodiFilter,
        include: { jurusan: true },
      }),
      prisma.mahasiswa.findMany({
        where: mahasiswaFilter,
        take: 5, // Limit untuk testing
        include: { programStudi: { include: { jurusan: true } } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        userInfo: {
          username: req.user.username,
          role: req.user.role,
          jurusan: req.user.jurusan?.nama,
        },
        userContext: req.userContext,
        filters: { prodiFilter, mahasiswaFilter },
        results: {
          programStudiCount: programStudi.length,
          mahasiswaCount: mahasiswa.length,
          sampleProgramStudi: programStudi,
          sampleMahasiswa: mahasiswa,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error testing filter: " + error.message,
    });
  }
});

// Register endpoint - SIMPLIFIED
router.post("/register", async (req, res) => {
  try {
    const { username, nama, password, role, jurusanId } = req.body;

    if (!username || !nama || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, nama, password, dan role harus diisi",
      });
    }

    // Cek username sudah ada
    const existingUser = await prisma.user.findFirst({
      where: { username: username },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        username,
        nama,
        password: hashedPassword,
        role: role.toUpperCase(),
        jurusanId: jurusanId || null,
      },
      include: {
        jurusan: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: {
        id: newUser.id,
        username: newUser.username,
        nama: newUser.nama,
        role: newUser.role,
        jurusanId: newUser.jurusanId,
        jurusan: newUser.jurusan,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server: " + error.message,
    });
  }
});

// ✅ UPDATED: Get current user info with proper structure and jurusan support
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { jurusan: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    console.log("🔍 /me endpoint called for user:", {
      id: user.id,
      username: user.username,
      role: user.role,
      jurusan: user.jurusan?.nama,
    });

    let userData = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      jurusanId: user.jurusanId,
      programStudiId: user.programStudiId,
      jurusan: user.jurusan,
      programStudi: user.programStudi,
      permissions: {
        canAccessAll: req.userContext.canAccessAll,
        jurusanId: req.userContext.jurusanId,
        programStudiIds: req.userContext.programStudiIds,
      },
    };

    // ✅ UPDATED: Fetch related data with proper include and structure
    try {
      if (user.role === "MAHASISWA") {
        console.log("🎓 /me endpoint - Searching for mahasiswa data:", {
          searchNim: user.username,
          userRole: user.role,
        });

        const mahasiswaData = await prisma.mahasiswa.findUnique({
          where: { nim: user.username },
          include: {
            programStudi: {
              include: {
                jurusan: true,
              },
            },
          },
        });

        console.log("🎓 /me endpoint - Mahasiswa query result:", {
          found: !!mahasiswaData,
          nim: mahasiswaData?.nim,
          nama: mahasiswaData?.nama,
          angkatan: mahasiswaData?.angkatan,
          semester: mahasiswaData?.semester,
          noTelp: mahasiswaData?.noTelp,
          alamat: mahasiswaData?.alamat,
          programStudiId: mahasiswaData?.programStudiId,
          hasProgramStudi: !!mahasiswaData?.programStudi,
          programStudiData: mahasiswaData?.programStudi,
        });

        if (mahasiswaData) {
          userData = {
            ...userData,
            nim: mahasiswaData.nim,
            nama: mahasiswaData.nama,
            programStudiId: mahasiswaData.programStudiId,
            programStudi: mahasiswaData.programStudi,
            angkatan: mahasiswaData.angkatan,
            semester: mahasiswaData.semester,
            noTelp: mahasiswaData.noTelp,
            alamat: mahasiswaData.alamat,
          };

          console.log("📊 /me endpoint - Final userData for mahasiswa:", {
            username: userData.username,
            role: userData.role,
            hasProgramStudi: !!userData.programStudi,
            programStudiNama: userData.programStudi?.nama,
            hasAlamat: !!userData.alamat,
            hasNoTelp: !!userData.noTelp,
          });
        } else {
          console.log(
            "❌ /me endpoint - No mahasiswa data found for NIM:",
            user.username,
          );
        }
      } else if (user.role === "DOSEN" || user.role === "KAPRODI") {
        console.log("🔍 /me endpoint - Searching for dosen data:", {
          searchNip: user.username,
          userRole: user.role,
        });

        const dosenData = await prisma.dosen.findUnique({
          where: { nip: user.username },
          include: {
            prodi: {
              include: {
                jurusan: true,
              },
            },
          },
        });

        console.log("👨‍🏫 /me endpoint - Dosen query result:", {
          found: !!dosenData,
          nip: dosenData?.nip,
          nama: dosenData?.nama,
          prodiId: dosenData?.prodiId,
          isKaprodi: dosenData?.isKaprodi,
          noTelp: dosenData?.noTelp,
          alamat: dosenData?.alamat,
          hasProdi: !!dosenData?.prodi,
          prodiData: dosenData?.prodi,
        });

        if (dosenData) {
          userData = {
            ...userData,
            nip: dosenData.nip,
            nama: dosenData.nama,
            prodiId: dosenData.prodiId,
            prodi: dosenData.prodi,
            isKaprodi: dosenData.isKaprodi,
            noTelp: dosenData.noTelp,
            alamat: dosenData.alamat,
          };
        } else if (user.role === "KAPRODI" && user.programStudi) {
          userData = {
            ...userData,
            programStudiId: user.programStudiId,
            programStudi: user.programStudi,
          };

          console.log("📊 /me endpoint - Final userData for dosen:", {
            username: userData.username,
            role: userData.role,
            hasProdi: !!userData.prodi,
            prodiNama: userData.prodi?.nama,
            hasAlamat: !!userData.alamat,
            hasNoTelp: !!userData.noTelp,
            isKaprodi: userData.isKaprodi,
          });
        } else {
          console.log(
            "❌ /me endpoint - No dosen data found for NIP:",
            user.username,
          );

          // Debug untuk /me endpoint juga
          console.log("🔍 /me Debug: Checking if dosen exists in database...");
          const allDosen = await prisma.dosen.findMany({
            select: { nip: true, nama: true },
            take: 5,
          });
          console.log("📋 /me Sample dosen in database:", allDosen);
        }
      }
      // ✅ SEKJUR sudah memiliki data jurusan dari user table
    } catch (relationError) {
      console.log(
        "❌ /me endpoint - Could not fetch related data:",
        relationError.message,
      );
      console.error("Full relation error:", relationError);
    }

    console.log("✅ /me endpoint response:", {
      username: userData.username,
      role: userData.role,
      jurusan: userData.jurusan?.nama,
      hasRelationData: !!(userData.programStudi || userData.prodi),
      programStudi: userData.programStudi?.nama,
      prodi: userData.prodi?.nama,
      finalUserDataKeys: Object.keys(userData),
    });

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("❌ /me endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server: " + error.message,
    });
  }
});

// Hash existing passwords utility
router.post("/hash-passwords", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        password: {
          not: {
            startsWith: "$2",
          },
        },
      },
    });

    console.log(`Found ${users.length} users with plain text passwords`);

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log(`Hashed password for user: ${user.username}`);
    }

    res.json({
      success: true,
      message: `Successfully hashed passwords for ${users.length} users`,
    });
  } catch (error) {
    console.error("Hash passwords error:", error);
    res.status(500).json({
      success: false,
      message: "Error hashing passwords: " + error.message,
    });
  }
});

// Change password endpoint
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, userId, userType } = req.body;

    // Minimal logging for password change requests. Never log password contents or derived fragments.
    console.log("🔍 Change Password Request:", {
      userId,
      userType,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      tokenUser: {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      },
    });

    // Validate input
    if (!currentPassword || !newPassword || !userId || !userType) {
      return res.status(400).json({
        success: false,
        message: "Semua field harus diisi",
      });
    }

    // Ensure userId is a string
    const userIdStr = String(userId);

    console.log("🔍 Searching for user:", {
      userId: userIdStr,
      userType: userType,
      tokenUsername: req.user?.username,
    });

    // Find user in users table first - be more lenient with role check
    const user = await prisma.user.findFirst({
      where: {
        username: userIdStr,
      },
    });

    // Don't include password-derived fields in logs.
    console.log(
      "👤 User found:",
      user
        ? {
            id: user.id,
            username: user.username,
            hasPassword: !!user.password,
            name: user.nama,
            role: user.role,
          }
        : "Not found",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // If user has no password, set it to the current password
    if (!user.password) {
      console.log("⚠️ User has no password, setting initial password");
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        // Now hash and set the new password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHashedPassword },
        });

        console.log(
          "✅ Initial password set and updated successfully for user:",
          user.username,
        );

        res.json({
          success: true,
          message: "Password berhasil diubah",
        });
        return;
      } catch (updateError) {
        console.error("❌ Error setting initial password:", updateError);
        res.status(500).json({
          success: false,
          message: "Gagal mengatur password awal: " + updateError.message,
        });
        return;
      }
    }

    // Verify current password
    let isPasswordValid = false;
    try {
      console.log("🔒 Attempting password comparison");
      // Log minimal verification info; do NOT expose password hash fragments.
      console.log("🔒 Password verification attempt for user:", {
        username: user.username,
        bcryptVersion: user.password ? bcrypt.getRounds(user.password) : null,
      });

      // If password is not hashed, hash it first
      if (!user.password.startsWith("$2")) {
        console.log("⚠️ Password not hashed, hashing it now");
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        console.log("✅ Password hashed and updated");
        user.password = hashedPassword;
      }

      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      console.log("🔒 Password verification result:", isPasswordValid);
    } catch (error) {
      console.error("🔒 Password comparison error:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memverifikasi password",
      });
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Password saat ini tidak sesuai",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in users table
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      console.log("✅ Password updated successfully for user:", user.username);

      res.json({
        success: true,
        message: "Password berhasil diubah",
      });
    } catch (updateError) {
      console.error("❌ Error updating password:", updateError);
      res.status(500).json({
        success: false,
        message: "Gagal mengubah password: " + updateError.message,
      });
    }
  } catch (error) {
    console.error("❌ Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server: " + error.message,
    });
  }
});

// Simple test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes working with jurusan filtering support",
    timestamp: new Date().toISOString(),
    features: [
      "Login with jurusan context",
      "Role-based filtering",
      "SEKJUR access control",
      "Enhanced debugging",
    ],
  });
});
// ✅ NEW: Endpoint untuk get statistik dashboard berdasarkan akses user
router.get("/dashboard-stats", authenticateToken, async (req, res) => {
  try {
    const { userContext } = req;
    let stats = {};

    if (userContext.jurusanId) {
      // Sekretaris Jurusan - statistik jurusan saja
      const [programStudi, mahasiswa, dosen, mataKuliah, pengajuanSA] =
        await prisma.$transaction([
          prisma.programStudi.count({
            where: { jurusanId: userContext.jurusanId },
          }),
          prisma.mahasiswa.count({
            where: {
              programStudi: { jurusanId: userContext.jurusanId },
            },
          }),
          prisma.dosen.count({
            where: {
              prodi: { jurusanId: userContext.jurusanId },
            },
          }),
          prisma.mataKuliah.count({
            where: {
              programStudi: { jurusanId: userContext.jurusanId },
            },
          }),
          prisma.pengajuanSA.count({
            where: {
              mahasiswa: {
                programStudi: { jurusanId: userContext.jurusanId },
              },
            },
          }),
        ]);
      stats = {
        totalProgramStudi: programStudi,
        totalMahasiswa: mahasiswa,
        totalDosen: dosen,
        totalMataKuliah: mataKuliah,
        totalPengajuanSA: pengajuanSA,
      };
    } else {
      // Jika tidak ada akses jurusan, return stats kosong
      stats = {
        totalProgramStudi: 0,
        totalMahasiswa: 0,
        totalDosen: 0,
        totalMataKuliah: 0,
        totalPengajuanSA: 0,
      };
    }
    res.json({
      success: true,
      data: stats,
      userInfo: {
        role: req.user.role,
        jurusan: req.user.jurusan?.nama || null,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik dashboard",
    });
  }
});

// ✅ NEW: Endpoint untuk get data yang difilter berdasarkan jurusan
router.get("/program-studi", authenticateToken, async (req, res) => {
  try {
    const filter = createProdiFilter(req.userContext);

    if (filter === null) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk melihat data program studi",
      });
    }

    const programStudi = await prisma.programStudi.findMany({
      where: filter,
      include: {
        jurusan: true,
        _count: {
          select: {
            mahasiswa: true,
            dosen: true,
            mataKuliah: true,
          },
        },
      },
      orderBy: {
        nama: "asc",
      },
    });

    res.json({
      success: true,
      data: programStudi,
      userInfo: {
        role: req.user.role,
        jurusan: req.user.jurusan?.nama || null,
      },
    });
  } catch (error) {
    console.error("Error getting program studi:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data program studi",
    });
  }
});

// ✅ NEW: Endpoint untuk get mahasiswa berdasarkan akses user
router.get("/mahasiswa", authenticateToken, async (req, res) => {
  try {
    const filter = createMahasiswaFilter(req.userContext);

    if (filter === null) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk melihat data mahasiswa",
      });
    }

    const mahasiswa = await prisma.mahasiswa.findMany({
      where: filter,
      include: {
        programStudi: {
          include: {
            jurusan: true,
          },
        },
      },
      orderBy: [{ programStudi: { nama: "asc" } }, { nama: "asc" }],
    });

    res.json({
      success: true,
      data: mahasiswa,
      userInfo: {
        role: req.user.role,
        jurusan: req.user.jurusan?.nama || null,
        totalMahasiswa: mahasiswa.length,
      },
    });
  } catch (error) {
    console.error("Error getting mahasiswa:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data mahasiswa",
    });
  }
});

// ✅ NEW: Endpoint untuk get dosen berdasarkan akses user
router.get("/dosen", authenticateToken, async (req, res) => {
  try {
    const filter = createDosenFilter(req.userContext);

    if (filter === null) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk melihat data dosen",
      });
    }

    const dosen = await prisma.dosen.findMany({
      where: filter,
      include: {
        prodi: {
          include: {
            jurusan: true,
          },
        },
      },
      orderBy: [{ prodi: { nama: "asc" } }, { nama: "asc" }],
    });

    res.json({
      success: true,
      data: dosen,
      userInfo: {
        role: req.user.role,
        jurusan: req.user.jurusan?.nama || null,
        totalDosen: dosen.length,
      },
    });
  } catch (error) {
    console.error("Error getting dosen:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data dosen",
    });
  }
});

// ✅ NEW: Endpoint untuk get mata kuliah berdasarkan akses user
router.get("/mata-kuliah", authenticateToken, async (req, res) => {
  try {
    const filter = createMataKuliahFilter(req.userContext);

    if (filter === null) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses untuk melihat data mata kuliah",
      });
    }

    const mataKuliah = await prisma.mataKuliah.findMany({
      where: filter,
      include: {
        programStudi: {
          include: {
            jurusan: true,
          },
        },
      },
      orderBy: [
        { programStudi: { nama: "asc" } },
        { semester: "asc" },
        { nama: "asc" },
      ],
    });

    res.json({
      success: true,
      data: mataKuliah,
      userInfo: {
        role: req.user.role,
        jurusan: req.user.jurusan?.nama || null,
        totalMataKuliah: mataKuliah.length,
      },
    });
  } catch (error) {
    console.error("Error getting mata kuliah:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data mata kuliah",
    });
  }
});

// ✅ NEW: Endpoint untuk get jurusan (hanya untuk sekjur)
router.get("/jurusan", authenticateToken, async (req, res) => {
  try {
    let filter = {};

    // Jika bukan sekjur atau tidak punya akses jurusan, filter berdasarkan jurusan user
    if (!req.userContext.canAccessAll) {
      if (req.userContext.jurusanId) {
        filter = { id: req.userContext.jurusanId };
      } else {
        return res.status(403).json({
          success: false,
          message: "Tidak memiliki akses untuk melihat data jurusan",
        });
      }
    }

    const jurusan = await prisma.jurusan.findMany({
      where: filter,
      include: {
        _count: {
          select: {
            programStudi: true,
            users: true,
          },
        },
      },
      orderBy: {
        nama: "asc",
      },
    });

    res.json({
      success: true,
      data: jurusan,
      userInfo: {
        role: req.user.role,
        canViewAll: req.userContext.canAccessAll,
      },
    });
  } catch (error) {
    console.error("Error getting jurusan:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data jurusan",
    });
  }
});

module.exports = {
  router,
  authenticateToken,
  // Export helper functions untuk digunakan di controller lain
  createJurusanFilter,
  createProdiFilter,
  createMahasiswaFilter,
  createDosenFilter,
  createMataKuliahFilter,
  getUserContext,
};
