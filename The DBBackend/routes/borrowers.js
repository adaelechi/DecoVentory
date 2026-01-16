const express = require('express');
const router = express.Router();
const borrowerController = require('../controllers/borrowerController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/', borrowerController.getAllBorrowers);
router.get('/:id', borrowerController.getBorrowerById);

// Protected routes
router.post('/', authMiddleware, borrowerController.createBorrower);
router.put('/:id/return', authMiddleware, borrowerController.markBorrowerReturned);
router.delete('/:id', authMiddleware, borrowerController.deleteBorrower);

module.exports = router;
