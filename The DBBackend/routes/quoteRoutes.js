const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const authMiddleware = require('../middleware/auth');

// Public route to create a quote
router.post('/', quoteController.createQuote);

// Protected routes for admins
router.get('/', authMiddleware, quoteController.getQuotes);
router.put('/:id/approve', authMiddleware, quoteController.approveQuote);
router.put('/:id/reject', authMiddleware, quoteController.rejectQuote);

module.exports = router;
