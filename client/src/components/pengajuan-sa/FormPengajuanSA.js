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
  MessageSquare
} from 'lucide-react';
import { calculateMaxSKS, calculateTotalSKS, canAddMataKuliah } from '../../utils/pengajuanSAUtils';

const FormPengajuanSA = ({ 
  showForm, 
  setShowForm, 
  authToken, 
  currentUser, 
  mataKuliahList, 
  onSubmitSuccess 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    nominal: '',
    keterangan: '',
    selectedMataKuliah: [],
  });
  const [searchMataKuliah, setSearchMataKuliah] = useState('');
  const [showMataKuliahDropdown, setShowMataKuliahDropdown] = useState(false);
  const [filteredMataKuliah, setFilteredMataKuliah] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchMataKuliah.trim() === '') {
      setFilteredMataKuliah([]);
      setShowMataKuliahDropdown(false);
    } else {
      const filtered = mataKuliahList.filter(mk => 
        mk.nama.toLowerCase().includes(searchMataKuliah.toLowerCase())
      );
      setFilteredMataKuliah(filtered);
      setShowMataKuliahDropdown(true);
    }
  }, [searchMataKuliah, mataKuliahList]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setSelectedFile(file);
    } else {
      alert('File harus berformat PDF atau JPG/PNG');
    }
  };

  const handleNominalChange = (value) => {
    const nominal = parseFloat(value) || 0;
    const maxSKS = calculateMaxSKS(nominal);
    const currentTotalSKS = calculateTotalSKS(formData.selectedMataKuliah);
    
    if (currentTotalSKS > maxSKS) {
      alert(`Nominal terlalu kecil untuk mata kuliah yang sudah dipilih!\n\nNominal baru: Rp ${nominal.toLocaleString()}\nMaksimal SKS: ${maxSKS}\nTotal SKS yang sudah dipilih: ${currentTotalSKS}\n\nMata kuliah yang dipilih akan direset.`);
      
      setFormData(prev => ({
        ...prev,
        nominal: value,
        selectedMataKuliah: []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        nominal: value
      }));
    }
  };

  const handleSelectMataKuliah = (mataKuliah) => {
    const isAlreadySelected = formData.selectedMataKuliah.some(mk => mk.id === mataKuliah.id);
    if (isAlreadySelected) {
      alert('Mata kuliah ini sudah dipilih!');
      return;
    }

    if (!canAddMataKuliah(formData.selectedMataKuliah, formData.nominal, mataKuliah.sks)) {
      const maxSKS = calculateMaxSKS(formData.nominal);
      const currentTotalSKS = calculateTotalSKS(formData.selectedMataKuliah);
      const sisaSKS = maxSKS - currentTotalSKS;
      alert(`Tidak dapat menambah mata kuliah ini!\n\nNominal Anda: Rp ${parseFloat(formData.nominal).toLocaleString()}\nMaksimal SKS: ${maxSKS}\nSisa SKS yang bisa diambil: ${sisaSKS}\nSKS mata kuliah ini: ${mataKuliah.sks}`);
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

  const handleSubmit = async () => {
    // Validasi
    if (!selectedFile) {
      alert('Harap upload bukti pembayaran');
      return;
    }

    if (!formData.nominal || parseFloat(formData.nominal) <= 0) {
      alert('Harap masukkan nominal pembayaran yang valid');
      return;
    }

    if (formData.selectedMataKuliah.length === 0) {
      alert('Harap pilih minimal 1 mata kuliah');
      return;
    }

    if (formData.selectedMataKuliah.length > 3) {
      alert('Maksimal 3 mata kuliah per pengajuan');
      return;
    }

    if (!formData.keterangan.trim()) {
      alert('Harap isi keterangan pengajuan');
      return;
    }

    // Konfirmasi
    const totalSKS = calculateTotalSKS(formData.selectedMataKuliah);
    const totalBiaya = totalSKS * 300000;
    const mataKuliahNames = formData.selectedMataKuliah.map(mk => `${mk.nama} (${mk.sks} SKS)`).join(', ');
    
    const isConfirmed = window.confirm(
      `Konfirmasi Pengajuan SA:\n\n` +
      `Mata Kuliah: ${mataKuliahNames}\n` +
      `Total SKS: ${totalSKS}\n` +
      `Total Biaya: Rp ${totalBiaya.toLocaleString()}\n` +
      `Nominal Bayar: Rp ${parseFloat(formData.nominal).toLocaleString()}\n` +
      `Keterangan: ${formData.keterangan}\n\n` +
      `Apakah Anda yakin ingin mengajukan SA?`
    );

    if (!isConfirmed) {
      return;
    }

    setIsSubmitting(true);

    const submitData = new FormData();
    submitData.append('mahasiswaId', currentUser.username);
    submitData.append('buktiPembayaran', selectedFile);
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
        alert('✅ Pengajuan SA berhasil disubmit!\nPengajuan Anda akan diproses oleh admin.');
        resetForm();
        onSubmitSuccess();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error submitting pengajuan:', error);
      alert('❌ Terjadi kesalahan saat submit pengajuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedFile(null);
    setFormData({
      nominal: '',
      keterangan: '',
      selectedMataKuliah: []
    });
    setSearchMataKuliah('');
    setIsSubmitting(false);
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
            <XCircle className="w-6 h-6" />
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
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer hover:border-gray-400"
                  required
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {selectedFile ? selectedFile.name : 'Klik untuk upload file'}
                    </p>
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                        <p className="text-xs text-green-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <p className="text-xs text-gray-500 mt-2">
                Format: PDF, JPG, PNG (Maks. 10MB)
              </p>
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
                  onChange={(e) => handleNominalChange(e.target.value)}
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
                        {calculateMaxSKS(formData.nominal)} SKS
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
                  disabled={!formData.nominal || calculateMaxSKS(formData.nominal) === 0}
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

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4 mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || !formData.nominal || formData.selectedMataKuliah.length === 0 || !formData.keterangan.trim() || isSubmitting}
            className={`flex-1 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all text-lg ${
              selectedFile && formData.nominal && formData.selectedMataKuliah.length > 0 && formData.keterangan.trim() && !isSubmitting
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Pengajuan SA
              </>
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className="px-8 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 font-semibold transition-all text-lg disabled:opacity-50"
          >
            Batal
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FormPengajuanSA;