// components/LaporanSA.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Users,
  FileText,
  Filter
} from 'lucide-react';

const LaporanSA = ({ authToken, currentUser, userType, pengajuanList, dosenList, onBack }) => {
  // State untuk filter laporan
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, thisMonth, lastMonth, thisYear
  const [selectedDosen, setSelectedDosen] = useState('all');

  // State untuk data yang difilter
  const [filteredData, setFilteredData] = useState([]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Periode options
  const periodOptions = [
    { value: 'all', label: 'Semua Periode' },
    { value: 'thisMonth', label: 'Bulan Ini' },
    { value: 'lastMonth', label: 'Bulan Lalu' },
    { value: 'thisYear', label: 'Tahun Ini' },
    { value: 'custom', label: 'Rentang Tanggal' }
  ];

  // Filter data berdasarkan kriteria yang dipilih
  useEffect(() => {
    // Filter hanya data yang sudah selesai
    let filtered = pengajuanList.filter(item => {
      // Handle both grouped and detailed data
      if (item.isGrouped) {
        // For grouped data, check if all details are completed
        return item.status === 'SELESAI';
      } else {
        // For detailed data, check individual status
        return item.status === 'SELESAI' && item.nilaiAkhir;
      }
    });

    // Transform data untuk laporan
    let transformedData = [];
    
    filtered.forEach(item => {
      if (item.isGrouped) {
        // Handle grouped data - create entries for each detail
        if (item.details && item.details.length > 0) {
          item.details.forEach(detail => {
            if (detail.nilaiAkhir) {
              transformedData.push({
                id: detail.id,
                nama_mahasiswa: item.mahasiswa?.nama || 'N/A',
                nim: item.mahasiswa?.nim || item.mahasiswaId || 'N/A',
                nama_matakuliah: detail.mataKuliah?.nama || 'N/A',
                dosen_nip: detail.dosen?.nip || detail.dosenId || 'N/A',
                dosen_nama: detail.dosen?.nama || 'N/A',
                nilai: detail.nilaiAkhir,
                status: item.status,
                tanggal_pengajuan: item.tanggalPengajuan,
                created_at: item.tanggalPengajuan
              });
            }
          });
        }
      } else {
        // Handle detailed data
        transformedData.push({
          id: item.id,
          nama_mahasiswa: item.mahasiswa?.nama || 'N/A',
          nim: item.mahasiswa?.nim || item.mahasiswaId || 'N/A',
          nama_matakuliah: item.mataKuliah?.nama || 'N/A',
          dosen_nip: item.dosen?.nip || item.dosenId || 'N/A',
          dosen_nama: item.dosen?.nama || 'N/A',
          nilai: item.nilaiAkhir,
          status: item.status,
          tanggal_pengajuan: item.tanggalPengajuan,
          created_at: item.tanggalPengajuan
        });
      }
    });

    // Filter berdasarkan periode
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate, endDate;

      switch (selectedPeriod) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'custom':
          if (dateRange.startDate && dateRange.endDate) {
            startDate = new Date(dateRange.startDate);
            endDate = new Date(dateRange.endDate);
          }
          break;
        default:
          break;
      }

      if (startDate && endDate) {
        transformedData = transformedData.filter(item => {
          const itemDate = new Date(item.tanggal_pengajuan || item.created_at);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
    }

    // Filter berdasarkan dosen (jika dipilih)
    if (selectedDosen !== 'all') {
      transformedData = transformedData.filter(item => item.dosen_nip === selectedDosen);
    }

    setFilteredData(transformedData);
  }, [pengajuanList, selectedPeriod, dateRange, selectedDosen, dosenList]);

  // Kalkulasi statistik per dosen - hanya yang selesai
  const getDosenStatistics = () => {
    const dosenStats = {};
    
    filteredData.forEach(item => {
      if (item.dosen_nip && item.nilai) {
        const dosenNip = item.dosen_nip;
        if (!dosenStats[dosenNip]) {
          dosenStats[dosenNip] = {
            nama: item.dosen_nama || 
                  dosenList.find(d => (d.nip === dosenNip || d.id === dosenNip))?.nama ||
                  dosenList.find(d => (d.nip === dosenNip || d.id === dosenNip))?.name ||
                  dosenNip,
            total: 0,
            total_nilai: 0,
            mahasiswa_lulus: 0,
            mahasiswa_tidak_lulus: 0
          };
        }
        
        dosenStats[dosenNip].total++;
        if (item.nilai) {
          dosenStats[dosenNip].total_nilai += parseFloat(item.nilai);
          if (parseFloat(item.nilai) >= 60) {
            dosenStats[dosenNip].mahasiswa_lulus++;
          } else {
            dosenStats[dosenNip].mahasiswa_tidak_lulus++;
          }
        }
      }
    });

    // Hitung rata-rata nilai per dosen
    Object.values(dosenStats).forEach(dosen => {
      dosen.rata_rata_nilai = dosen.total > 0 ? (dosen.total_nilai / dosen.total).toFixed(2) : 0;
      dosen.tingkat_kelulusan = dosen.total > 0 ? ((dosen.mahasiswa_lulus / dosen.total) * 100).toFixed(1) : 0;
    });

    return Object.values(dosenStats).sort((a, b) => b.total - a.total);
  };

  // Kalkulasi tren per bulan - hanya yang selesai
  const getMonthlyTrend = () => {
    const monthlyData = {};
    
    filteredData.forEach(item => {
      const date = new Date(item.tanggal_pengajuan || item.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          total: 0,
          total_nilai: 0,
          mahasiswa_lulus: 0,
          mahasiswa_tidak_lulus: 0
        };
      }
      
      monthlyData[monthKey].total++;
      if (item.nilai) {
        monthlyData[monthKey].total_nilai += parseFloat(item.nilai);
        if (parseFloat(item.nilai) >= 60) {
          monthlyData[monthKey].mahasiswa_lulus++;
        } else {
          monthlyData[monthKey].mahasiswa_tidak_lulus++;
        }
      }
    });

    // Hitung rata-rata per bulan
    Object.values(monthlyData).forEach(month => {
      month.rata_rata_nilai = month.total > 0 ? (month.total_nilai / month.total).toFixed(2) : 0;
      month.tingkat_kelulusan = month.total > 0 ? ((month.mahasiswa_lulus / month.total) * 100).toFixed(1) : 0;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const dosenStats = getDosenStatistics();
  const monthlyTrend = getMonthlyTrend();

  // Handler untuk export data
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama Mahasiswa',
      'NIM',
      'Mata Kuliah',
      'Dosen Pengampu',
      'Nilai'
    ];

    const csvData = filteredData.map((item, index) => [
      index + 1,
      item.nama_mahasiswa,
      item.nim,
      item.nama_matakuliah,
      item.dosen_nama || 
      dosenList.find(d => (d.nip === item.dosen_nip || d.id === item.dosen_nip))?.nama ||
      dosenList.find(d => (d.nip === item.dosen_nip || d.id === item.dosen_nip))?.name ||
      item.dosen_nip || '-',
      item.nilai || '-'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-studi-akademik-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Handler untuk print - hanya data dalam format yang rapi
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Studi Akademik Selesai</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 18px; 
            color: #333;
          }
          .header p { 
            margin: 5px 0; 
            color: #666;
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          .text-center { text-align: center; }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            margin: 30px 0 15px 0; 
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .footer { 
            margin-top: 50px; 
            text-align: right; 
            font-size: 11px; 
            color: #666;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LAPORAN STUDI AKADEMIK (SA) SELESAI</h1>
          <p>Periode: ${selectedPeriod === 'all' ? 'Semua Periode' : 
                      selectedPeriod === 'thisMonth' ? 'Bulan Ini' :
                      selectedPeriod === 'lastMonth' ? 'Bulan Lalu' :
                      selectedPeriod === 'thisYear' ? 'Tahun Ini' :
                      selectedPeriod === 'custom' && dateRange.startDate && dateRange.endDate ? 
                      `${dateRange.startDate} s/d ${dateRange.endDate}` : 'Custom'}</p>
          <p>Dosen: ${selectedDosen === 'all' ? 'Semua Dosen' : 
                     dosenList.find(d => (d.nip === selectedDosen || d.id === selectedDosen))?.nama ||
                     dosenList.find(d => (d.nip === selectedDosen || d.id === selectedDosen))?.name ||
                     selectedDosen}</p>
          <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}</p>
        </div>

        ${monthlyTrend.length > 0 ? `
        <div class="section-title">TREN BULANAN</div>
        <table>
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Total Studi Akademik</th>
              <th>Rata-rata Nilai</th>
              <th>Mahasiswa Lulus</th>
              <th>Tingkat Kelulusan</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyTrend.map(trend => `
              <tr>
                <td>${trend.month}</td>
                <td class="text-center">${trend.total}</td>
                <td class="text-center">${trend.rata_rata_nilai}</td>
                <td class="text-center">${trend.mahasiswa_lulus}</td>
                <td class="text-center">${trend.tingkat_kelulusan}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="section-title">DATA DETAIL MAHASISWA STUDI AKADEMIK</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Mahasiswa</th>
              <th>NIM</th>
              <th>Mata Kuliah</th>
              <th>Dosen Pengampu</th>
              <th>Nilai</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.nama_mahasiswa}</td>
                <td class="text-center">${item.nim}</td>
                <td>${item.nama_matakuliah}</td>
                <td>
                  ${item.dosen_nama || 
                   dosenList.find(d => (d.nip === item.dosen_nip || d.id === item.dosen_nip))?.nama ||
                   dosenList.find(d => (d.nip === item.dosen_nip || d.id === item.dosen_nip))?.name ||
                   item.dosen_nip || '-'}
                </td>
                <td class="text-center">${item.nilai || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
          <p>Sistem Informasi Studi Akademik - Politeknik Negeri Manado</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        variants={itemVariants}
      >
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">Kembali</span>
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan Studi Akademik (SA)</h1>
            <p className="text-gray-600">
              {userType === 'admin' ? 'Laporan Verifikasi Pembayaran' : 'Laporan Verifikasi & Penugasan'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <motion.button
            onClick={handleExportCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </motion.button>
          <motion.button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FileText className="w-4 h-4" />
            Print
          </motion.button>
        </div>
      </motion.div>

      {/* Filter Section */}
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-sm border"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filter Laporan</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Periode Filter */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Custom Date Range */}
          <AnimatePresence>
            {selectedPeriod === 'custom' && (
              <>
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Dosen Filter */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosen Pengampu
            </label>
            <select
              value={selectedDosen}
              onChange={(e) => setSelectedDosen(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Dosen</option>
              {dosenList && dosenList.length > 0 ? (
                dosenList.map(dosen => {
                  return (
                    <option key={dosen.nip || dosen.id} value={dosen.nip || dosen.id}>
                      {dosen.nama || dosen.name || 'Nama tidak tersedia'}
                    </option>
                  );
                })
              ) : (
                <option value="" disabled>Loading dosen...</option>
              )}
            </select>
            {dosenList && dosenList.length === 0 && (
              <p className="text-sm text-red-500 mt-1">Tidak ada data dosen tersedia</p>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Detailed Data Table */}
      <motion.div 
        className="bg-white rounded-lg shadow-sm border"
        variants={itemVariants}
      >
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Data Detail Studi Akademik Selesai ({filteredData.length} mahasiswa)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">No</th>
                <th className="text-left py-3 px-4">Mahasiswa</th>
                <th className="text-left py-3 px-4">NIM</th>
                <th className="text-left py-3 px-4">Mata Kuliah</th>
                <th className="text-left py-3 px-4">Dosen Pengampu</th>
                <th className="text-center py-3 px-4">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <motion.tr 
                  key={item.id || index} 
                  className="border-b hover:bg-gray-50"
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ 
                    backgroundColor: "#f9fafb",
                    transition: { duration: 0.2 }
                  }}
                >
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">{item.nama_mahasiswa}</td>
                  <td className="py-3 px-4">{item.nim}</td>
                  <td className="py-3 px-4">{item.nama_matakuliah}</td>
                  <td className="py-3 px-4">
                    {item.dosen_nama || 
                     dosenList.find(d => (d.nip === item.dosen_nip || d.id === item.dosen_nip))?.nama ||
                     dosenList.find(d => (d.nip === item.dosen_nip || d.id === item.dosen_nip))?.name ||
                     item.dosen_nip || '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">
                    {item.nilai || '-'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <AnimatePresence>
          {filteredData.length === 0 && (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data Studi Akademik selesai</h3>
              <p className="text-gray-500">Tidak ada Studi Akademik yang sudah selesai sesuai dengan filter yang dipilih</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default LaporanSA;