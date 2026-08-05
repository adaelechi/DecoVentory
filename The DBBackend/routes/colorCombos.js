const express = require('express');
const router = express.Router();
const colorComboController = require('../controllers/colorComboController');
const authMiddleware = require('../middleware/auth');

// Public route to fetch color combos
router.get('/', colorComboController.getColorCombos);

// Protected routes for managing color combos
router.post('/', authMiddleware, colorComboController.createColorCombo);
router.put('/:id', authMiddleware, colorComboController.updateColorCombo);
router.delete('/:id', authMiddleware, colorComboController.deleteColorCombo);

module.exports = router;
