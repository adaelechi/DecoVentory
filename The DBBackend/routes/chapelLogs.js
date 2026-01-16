const express = require('express');
const router = express.Router();
const chapelLogController = require('../controllers/chapelLogController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/', chapelLogController.getAllChapelLogs);
router.get('/:id', chapelLogController.getChapelLogById);

// Protected routes
router.post('/', authMiddleware, chapelLogController.createChapelLog);
router.put('/:id', authMiddleware, chapelLogController.updateChapelLog);
router.delete('/:id', authMiddleware, chapelLogController.deleteChapelLog);

module.exports = router;
