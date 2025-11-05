const express = require('express');
const { authenticateToken } = require('./auth');
const {
  listAvailableByDosen,
  assign,
  myAssignments,
  unassign
} = require('../controllers/teachingAssignmentController');
const {
  getPendingApprovals,
  getAllAssignments,
  approveAssignment,
  rejectAssignment,
  reassignToDosen,
  assignDirectly,
  cancelAssignment
} = require('../controllers/teachingAssignmentKaprodiController');

const router = express.Router();

// Routes untuk Dosen
router.get('/available', authenticateToken, listAvailableByDosen);
router.post('/', authenticateToken, assign);
router.get('/me', authenticateToken, myAssignments);
router.delete('/:id', authenticateToken, unassign);

// Routes untuk Kaprodi
router.get('/kaprodi/pending', authenticateToken, getPendingApprovals);
router.get('/kaprodi/all', authenticateToken, getAllAssignments);
router.post('/kaprodi/assign', authenticateToken, assignDirectly);
router.put('/kaprodi/:id/approve', authenticateToken, approveAssignment);
router.put('/kaprodi/:id/reject', authenticateToken, rejectAssignment);
router.put('/kaprodi/:id/reassign', authenticateToken, reassignToDosen);
router.put('/kaprodi/:id/cancel', authenticateToken, cancelAssignment);

module.exports = router;





