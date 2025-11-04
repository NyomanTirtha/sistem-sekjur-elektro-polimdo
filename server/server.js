require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

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