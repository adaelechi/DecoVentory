const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');

// All routes are public (read-only)
router.get('/', activityLogController.getAllActivityLogs);
router.get('/material/:materialId', activityLogController.getLogsByMaterial);
router.get('/action/:actionType', activityLogController.getLogsByActionType);

module.exports = router;
