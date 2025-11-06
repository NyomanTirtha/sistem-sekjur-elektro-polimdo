// components/LaporanSA.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Users,
  FileText,
  Filter
} from 'lucide-react';
import { getSemesterFromDate } from '../../../utilitas/helper/pengajuanSAUtils';

const LaporanSA = ({ authToken, currentUser, userType, pengajuanList, dosenList, onBack }) => {
  // State untuk filter laporan
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, thisMonth, lastMonth, thisYear
  const [selectedDosen, setSelectedDosen] = useState('all');

  // State untuk data yang difilter - removed, using useMemo instead

  const [periodeDari, setPeriodeDari] = useState('');
  const [periodeSampai, setPeriodeSampai] = useState('');

  // Generate daftar tahun ajaran - Optimized with useMemo
  const tahunAjaranOptions = useMemo(() => {
    const set = new Set();
    pengajuanList.forEach(item => {
      const periode = getSemesterFromDate(item.tanggalPengajuan);
      if (periode) set.add(periode);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [pengajuanList]);

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

  // Filter data berdasarkan kriteria yang dipilih - Optimized with useMemo
  const filteredData = useMemo(() => {
    // Filter hanya data yang sudah selesai
    let filtered = pengajuanList.filter(item => {
      if (item.isGrouped) {
        return item.status === 'SELESAI';
      } else {
        return item.status === 'SELESAI' && item.nilaiAkhir;
      }
    });
    let transformedData = [];
    filtered.forEach(item => {
      if (item.isGrouped) {
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
                created_at: item.tanggalPengajuan,
                tahun_ajaran: getSemesterFromDate(item.tanggalPengajuan)
              });
            }
          });
        }
      } else {
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
          created_at: item.tanggalPengajuan,
          tahun_ajaran: getSemesterFromDate(item.tanggalPengajuan)
        });
      }
    });
    // Filter berdasarkan tahun ajaran (periode dari & sampai)
    if (periodeDari && periodeSampai) {
      const idxDari = tahunAjaranOptions.indexOf(periodeDari);
      const idxSampai = tahunAjaranOptions.indexOf(periodeSampai);
      if (idxDari !== -1 && idxSampai !== -1) {
        const [start, end] = idxDari <= idxSampai ? [idxDari, idxSampai] : [idxSampai, idxDari];
        const allowed = tahunAjaranOptions.slice(start, end + 1);
        transformedData = transformedData.filter(item => allowed.includes(item.tahun_ajaran));
      }
    }
    // Filter berdasarkan dosen (jika dipilih)
    if (selectedDosen !== 'all') {
      transformedData = transformedData.filter(item => item.dosen_nip === selectedDosen);
    }
    return transformedData;
  }, [pengajuanList, periodeDari, periodeSampai, selectedDosen, tahunAjaranOptions]);

  // Kalkulasi statistik per dosen - Optimized with useMemo
  const dosenStats = useMemo(() => {
    const dosenStatsMap = {};
    
    filteredData.forEach(item => {
      if (item.dosen_nip && item.nilai) {
        const dosenNip = item.dosen_nip;
        if (!dosenStatsMap[dosenNip]) {
          dosenStatsMap[dosenNip] = {
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
        
        dosenStatsMap[dosenNip].total++;
        if (item.nilai) {
          dosenStatsMap[dosenNip].total_nilai += parseFloat(item.nilai);
          if (parseFloat(item.nilai) >= 60) {
            dosenStatsMap[dosenNip].mahasiswa_lulus++;
          } else {
            dosenStatsMap[dosenNip].mahasiswa_tidak_lulus++;
          }
        }
      }
    });

    // Hitung rata-rata nilai per dosen
    Object.values(dosenStatsMap).forEach(dosen => {
      dosen.rata_rata_nilai = dosen.total > 0 ? (dosen.total_nilai / dosen.total).toFixed(2) : 0;
      dosen.tingkat_kelulusan = dosen.total > 0 ? ((dosen.mahasiswa_lulus / dosen.total) * 100).toFixed(1) : 0;
    });

    return Object.values(dosenStatsMap).sort((a, b) => b.total - a.total);
  }, [filteredData, dosenList]);

  // Kalkulasi tren per bulan - Optimized with useMemo
  const monthlyTrend = useMemo(() => {
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
  }, [filteredData]);

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
          <p>Periode: ${periodeDari && periodeSampai ? `${periodeDari} s/d ${periodeSampai}` : 'Semua Periode'}</p>
          <p>Dosen: ${selectedDosen === 'all' ? 'Semua Dosen' : 
                     dosenList.find(d => (d.nip === selectedDosen || d.id === selectedDosen))?.nama ||
                     dosenList.find(d => (d.nip === selectedDosen || d.id === selectedDosen))?.name ||
                     selectedDosen}</p>
          <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}</p>
        </div>

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
              {userType === 'admin' ? 'Laporan Verifikasi Pembayaran Sekjur' : 'Laporan Verifikasi & Penugasan'}
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
          {/* Periode Tahun Ajaran Dari */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode Dari
            </label>
            <select
              value={periodeDari}
              onChange={e => setPeriodeDari(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Pilih Periode</option>
              {tahunAjaranOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </motion.div>
          {/* Periode Tahun Ajaran Sampai */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode Sampai
            </label>
            <select
              value={periodeSampai}
              onChange={e => setPeriodeSampai(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Pilih Periode</option>
              {tahunAjaranOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </motion.div>

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