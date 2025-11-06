require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { helmetConfig, apiLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ SECURITY: Helmet.js - Security Headers (PRIORITY 1)
app.use(helmetConfig);

// ✅ SECURITY: CORS Configuration - Restrict Origins (PRIORITY 2)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:3001']; // Development defaults

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ SECURITY: Body Parser - Limit size
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ SECURITY: Rate Limiting untuk semua API (PRIORITY 1)
app.use('/api/', apiLimiter);

// ✅ SECURITY: Static File Serving dengan restrictions
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Set security headers untuk file uploads
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Disposition', 'inline'); // Jangan auto-download
  }
}));

// Import routes
const { router: authRoutes, authenticateToken } = require('./routes/auth');
const mahasiswaRoutes = require('./routes/mahasiswa');
const dosenRoutes = require('./routes/dosen');
const pengajuanSARoutes = require('./routes/pengajuanSA');
const programStudiRoutes = require('./routes/prodi');
const userRoutes = require('./routes/users'); // Import user routes
const mataKuliahRoutes = require('./routes/mataKuliah');
const teachingAssignmentsRoutes = require('./routes/teachingAssignments');
// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/mahasiswa', authenticateToken, mahasiswaRoutes);
app.use('/api/dosen', authenticateToken, dosenRoutes);
app.use('/api/pengajuan-sa', authenticateToken, pengajuanSARoutes);
app.use('/api/prodi', authenticateToken, programStudiRoutes);
app.use('/api/users', authenticateToken, userRoutes); // Add user routes
app.use('/api/mata-kuliah', authenticateToken, mataKuliahRoutes);
app.use('/api/teaching-assignments', authenticateToken, teachingAssignmentsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Auth endpoints: http://localhost:${PORT}/api/auth/login`);
  console.log(`Users management: http://localhost:${PORT}/api/users`); // Add info log
});