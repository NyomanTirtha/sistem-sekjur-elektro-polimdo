import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Plus, 
  Trash2, 
  Calculator,
  Send,
  FileText,
  CreditCard,
  BookOpen,
  MessageSquare,
  DollarSign,
  Clock,
  X
} from 'lucide-react';
import { calculateMaxSKS, calculateTotalSKS, canAddMataKuliah } from '../../utils/pengajuanSAUtils';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirm } from '../../utils/alertUtils';

const FormPengajuanSA = ({ 
  showForm, 
  setShowForm, 
  authToken, 
  currentUser, 
  mataKuliahList, 
  onSubmitSuccess 
}) => {
  const [formData, setFormData] = useState({
    nominal: '',
    keterangan: '',
    selectedMataKuliah: [],
    buktiPembayaran: null
  });
  
  const [searchMataKuliah, setSearchMataKuliah] = useState('');
  const [showMataKuliahDropdown, setShowMataKuliahDropdown] = useState(false);
  const [filteredMataKuliah, setFilteredMataKuliah] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxSKS, setMaxSKS] = useState(0);
  
  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => {
    if (mataKuliahList) {
      const filtered = mataKuliahList.filter(mk =>
        mk.nama.toLowerCase().includes(searchMataKuliah.toLowerCase())
      );
      setFilteredMataKuliah(filtered);
      setShowMataKuliahDropdown(searchMataKuliah.length > 0);
    }
  }, [searchMataKuliah, mataKuliahList]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      showWarningAlert('File harus berformat PDF atau JPG/PNG');
      return;
    }
    
    if (file.size > maxSize) {
      showWarningAlert('Ukuran file maksimal 10MB');
      return;
    }
    
    setFormData(prev => ({ ...prev, buktiPembayaran: file }));
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, buktiPembayaran: null }));
  };

  const handleNominalChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, nominal: value }));
    
    // Recalculate max SKS when nominal changes
    const nominal = parseFloat(value) || 0;
    const maxSKS = Math.floor(nominal / 300000); // 300k per SKS
    setMaxSKS(maxSKS);
    
    // Check if current selection exceeds new max SKS
    const currentTotalSKS = formData.selectedMataKuliah.reduce((total, mk) => total + mk.sks, 0);
    if (currentTotalSKS > maxSKS && maxSKS > 0) {
      showWarningAlert(`Nominal terlalu kecil untuk mata kuliah yang sudah dipilih!\n\nNominal baru: Rp ${nominal.toLocaleString()}\nMaksimal SKS: ${maxSKS}\nTotal SKS yang sudah dipilih: ${currentTotalSKS}\n\nMata kuliah yang melebihi batas akan dihapus otomatis.`);
      
      // Remove mata kuliah that exceed the new limit
      const newSelectedMataKuliah = [];
      let currentSKS = 0;
      
      for (const mk of formData.selectedMataKuliah) {
        if (currentSKS + mk.sks <= maxSKS) {
          newSelectedMataKuliah.push(mk);
          currentSKS += mk.sks;
        } else {
          break;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        selectedMataKuliah: newSelectedMataKuliah
      }));
    }
  };

  const handleSelectMataKuliah = (mataKuliah) => {
    const isAlreadySelected = formData.selectedMataKuliah.some(mk => mk.id === mataKuliah.id);
    if (isAlreadySelected) {
      showWarningAlert('Mata kuliah ini sudah dipilih!');
      return;
    }

    if (!canAddMataKuliah(formData.selectedMataKuliah, formData.nominal, mataKuliah.sks)) {
      const maxSKS = calculateMaxSKS(formData.nominal);
      const currentTotalSKS = calculateTotalSKS(formData.selectedMataKuliah);
      const sisaSKS = maxSKS - currentTotalSKS;
      showWarningAlert(`Tidak dapat menambah mata kuliah ini!\n\nNominal Anda: Rp ${parseFloat(formData.nominal).toLocaleString()}\nMaksimal SKS: ${maxSKS}\nSisa SKS yang bisa diambil: ${sisaSKS}\nSKS mata kuliah ini: ${mataKuliah.sks}`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      selectedMataKuliah: [...prev.selectedMataKuliah, mataKuliah]
    }));

    setSearchMataKuliah('');
    setShowMataKuliahDropdown(false);
  };

  const handleRemoveMataKuliah = (mataKuliahId) => {
    setFormData(prev => ({
      ...prev,
      selectedMataKuliah: prev.selectedMataKuliah.filter(mk => mk.id !== mataKuliahId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi
    if (!formData.buktiPembayaran) {
      showWarningAlert('Harap upload bukti pembayaran');
      return;
    }

    if (!formData.nominal || parseFloat(formData.nominal) <= 0) {
      showWarningAlert('Harap masukkan nominal pembayaran yang valid');
      return;
    }

    if (formData.selectedMataKuliah.length === 0) {
      showWarningAlert('Harap pilih minimal 1 mata kuliah');
      return;
    }

    if (!formData.keterangan.trim()) {
      showWarningAlert('Harap isi keterangan pengajuan');
      return;
    }

    // Konfirmasi
    const totalSKS = calculateTotalSKS(formData.selectedMataKuliah);
    const totalBiaya = totalSKS * 300000;
    const mataKuliahNames = formData.selectedMataKuliah.map(mk => `${mk.nama} (${mk.sks} SKS)`).join(', ');
    
    showConfirm(
      `Konfirmasi Pengajuan SA:\n\n` +
      `Mata Kuliah: ${mataKuliahNames}\n` +
      `Total SKS: ${totalSKS}\n` +
      `Total Biaya: Rp ${totalBiaya.toLocaleString()}\n` +
      `Nominal Bayar: Rp ${parseFloat(formData.nominal).toLocaleString()}\n` +
      `Keterangan: ${formData.keterangan}\n\n` +
      `Apakah Anda yakin ingin mengajukan SA?`,
      async () => {
        setIsSubmitting(true);

        const submitData = new FormData();
        submitData.append('mahasiswaId', currentUser.username);
        submitData.append('buktiPembayaran', formData.buktiPembayaran);
        submitData.append('nominal', formData.nominal);
        submitData.append('keterangan', formData.keterangan);
        submitData.append('mataKuliahIds', JSON.stringify(formData.selectedMataKuliah.map(mk => mk.id)));

        try {
          const response = await fetch('http://localhost:5000/api/pengajuan-sa', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: submitData
          });

          if (response.ok) {
            showSuccessAlert('Pengajuan SA berhasil disubmit!\nPengajuan Anda akan diproses oleh admin.');
            resetForm();
            onSubmitSuccess();
          } else {
            const errorData = await response.json();
            showErrorAlert(errorData.error);
          }
        } catch (error) {
          console.error('Error submitting pengajuan:', error);
          showErrorAlert('❌ Terjadi kesalahan saat submit pengajuan');
        } finally {
          setIsSubmitting(false);
        }
      },
      () => {
        // User cancelled
      },
      'Konfirmasi Pengajuan SA',
      'warning',
      'Submit',
      'Batal'
    );
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({
      nominal: '',
      keterangan: '',
      selectedMataKuliah: [],
      buktiPembayaran: null
    });
    setSearchMataKuliah('');
    setIsSubmitting(false);
    setIsDragOver(false);
    setDragCounter(0);
  };

  if (!showForm) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 mb-6 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600"></div>
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Form Pengajuan SA</h2>
              <p className="text-sm text-gray-500">Silakan lengkapi formulir di bawah ini</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={resetForm}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Informasi Penting</h3>
              <p className="text-blue-700 leading-relaxed">
                Biaya per SKS adalah <span className="font-semibold">Rp 300.000</span>. 
                Pastikan nominal pembayaran sesuai dengan total SKS mata kuliah yang dipilih.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-5 h-5 text-gray-600" />
                <label className="text-lg font-semibold text-gray-800">
                  Bukti Pembayaran *
                </label>
              </div>
              
              {/* Drag and Drop Area */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : formData.buktiPembayaran 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                
                <div className="p-8 text-center">
                  {formData.buktiPembayaran ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center">
                        <div>
                          <p className="font-medium text-green-800">{formData.buktiPembayaran.name}</p>
                          <p className="text-sm text-green-600">
                            {(formData.buktiPembayaran.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className={`w-12 h-12 mx-auto ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div>
                        <p className={`font-medium ${isDragOver ? 'text-blue-800' : 'text-gray-700'}`}>
                          {isDragOver ? 'Lepaskan file di sini' : 'Drag & drop file atau klik untuk upload'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Format: PDF, JPG, PNG (Maks. 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Nominal Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <label className="text-lg font-semibold text-gray-800">
                  Nominal Pembayaran *
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="300000"
                  step="1000"
                  value={formData.nominal}
                  onChange={handleNominalChange}
                  placeholder="Contoh: 900000"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                  required
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Calculator className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <AnimatePresence>
                {formData.nominal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-amber-800">Maksimal SKS:</span>
                      <span className="font-semibold text-amber-900">
                        {maxSKS} SKS
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Mata Kuliah Search */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="relative"
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <label className="text-lg font-semibold text-gray-800">
                  Pilih Mata Kuliah *
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchMataKuliah}
                  onChange={(e) => setSearchMataKuliah(e.target.value)}
                  placeholder="Cari mata kuliah..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  disabled={!formData.nominal || maxSKS === 0}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {showMataKuliahDropdown && filteredMataKuliah.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                  >
                    {filteredMataKuliah.map((mataKuliah) => {
                      const isSelected = formData.selectedMataKuliah.some(mk => mk.id === mataKuliah.id);
                      const canAdd = canAddMataKuliah(formData.selectedMataKuliah, formData.nominal, mataKuliah.sks);
                      
                      return (
                        <motion.div
                          key={mataKuliah.id}
                          whileHover={{ backgroundColor: !isSelected && canAdd ? '#f8fafc' : undefined }}
                          onClick={() => !isSelected && canAdd && handleSelectMataKuliah(mataKuliah)}
                          className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                            isSelected ? 'bg-green-50 cursor-not-allowed' : 
                            !canAdd ? 'bg-red-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{mataKuliah.nama}</p>
                              <p className="text-sm text-gray-500">
                                {mataKuliah.sks} SKS • Rp {(mataKuliah.sks * 300000).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              {isSelected && (
                                <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                  Dipilih
                                </span>
                              )}
                              {!isSelected && !canAdd && (
                                <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                                  SKS Habis
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Keterangan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <label className="text-lg font-semibold text-gray-800">
                  Keterangan *
                </label>
              </div>
              <textarea
                value={formData.keterangan}
                onChange={(e) => setFormData(prev => ({...prev, keterangan: e.target.value}))}
                placeholder="Jelaskan alasan pengajuan SA..."
                rows="4"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                required
              />
            </motion.div>
          </div>
        </div>

        {/* Selected Mata Kuliah */}
        <AnimatePresence>
          {formData.selectedMataKuliah.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Mata Kuliah Dipilih</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.selectedMataKuliah.map((mataKuliah, index) => (
                  <motion.div
                    key={mataKuliah.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-blue-900">{index + 1}. {mataKuliah.nama}</p>
                      <p className="text-sm text-blue-700">
                        {mataKuliah.sks} SKS • Rp {(mataKuliah.sks * 300000).toLocaleString()}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveMataKuliah(mataKuliah.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
              
              {/* Summary */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-6 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl"
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total Ringkasan:</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {calculateTotalSKS(formData.selectedMataKuliah)} SKS
                    </p>
                    <p className="text-lg text-gray-600">
                      Rp {(calculateTotalSKS(formData.selectedMataKuliah) * 300000).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mengirim...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <span>Submit Pengajuan SA</span>
              </div>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FormPengajuanSA;