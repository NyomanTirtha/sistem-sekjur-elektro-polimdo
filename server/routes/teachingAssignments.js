const express = require('express');
const { authenticateToken } = require('./auth');
const {
  listAvailableByDosen,
  assign,
  myAssignments,
  unassign
} = require('../controllers/teachingAssignmentController');

const router = express.Router();

router.get('/available', authenticateToken, listAvailableByDosen);
router.post('/', authenticateToken, assign);
router.get('/me', authenticateToken, myAssignments);
router.delete('/:id', authenticateToken, unassign);

module.exports = router;





