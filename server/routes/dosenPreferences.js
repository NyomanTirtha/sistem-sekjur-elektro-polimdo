const express = require('express');
const router = express.Router();
const dosenPreferencesController = require('../controllers/dosenPreferencesController');

// Route untuk mendapatkan preferensi milik dosen yang sedang login
router.get('/my-preferences', dosenPreferencesController.getMyPreferences);

// Route untuk mendapatkan semua preferensi (untuk admin/kaprodi)
router.get('/all', dosenPreferencesController.getAllPreferences);

// Route untuk mendapatkan preferensi berdasarkan ID
router.get('/:id', dosenPreferencesController.getPreferenceById);

// Route untuk membuat preferensi baru
router.post('/', dosenPreferencesController.createPreference);

// Route untuk mengupdate preferensi
router.put('/:id', dosenPreferencesController.updatePreference);

// Route untuk menghapus preferensi
router.delete('/:id', dosenPreferencesController.deletePreference);

module.exports = router;
