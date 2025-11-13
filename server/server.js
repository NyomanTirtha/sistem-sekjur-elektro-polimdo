require("dotenv").config();

const express = require("express");
const cors = require("cors");
const {
  helmetConfig,
  apiLimiter,
  authLimiter,
} = require("./middleware/security");
const { setCacheHeaders } = require("./middleware/cache");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmetConfig);

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Register cache middleware to set ETag / Cache-Control headers for GET responses.
// Should run before route handlers so headers are applied consistently.
app.use(setCacheHeaders);

app.use("/api/auth", authLimiter);
app.use("/api/", apiLimiter);

app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: (res) => {
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Content-Disposition", "inline");
    },
  }),
);

const { router: authRoutes, authenticateToken } = require("./routes/auth");

const protectedRoutes = [
  { path: "/api/mahasiswa", router: require("./routes/mahasiswa") },
  { path: "/api/dosen", router: require("./routes/dosen") },
  {
    path: "/api/dosen-preferences",
    router: require("./routes/dosenPreferences"),
  },
  { path: "/api/pengajuan-sa", router: require("./routes/pengajuanSA") },
  { path: "/api/prodi", router: require("./routes/prodi") },
  { path: "/api/users", router: require("./routes/users") },
  { path: "/api/mata-kuliah", router: require("./routes/mataKuliah") },
  { path: "/api/timetable", router: require("./routes/timetable") },
  { path: "/api/ruangan", router: require("./routes/ruangan") },
  { path: "/api/prodi-schedules", router: require("./routes/prodiSchedules") },
  { path: "/api/dosen-requests", router: require("./routes/dosenRequests") },
  { path: "/api/penugasan", router: require("./routes/penugasanMengajar") },
  {
    path: "/api/sekjur-schedules",
    router: require("./routes/sekjurSchedules"),
  },
  {
    path: "/api/schedule-validation",
    router: require("./routes/scheduleValidation"),
  },
];

app.use("/api/auth", authRoutes);

protectedRoutes.forEach(({ path, router }) => {
  app.use(path, authenticateToken, router);
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Auth endpoints: http://localhost:${PORT}/api/auth/login`);
});
