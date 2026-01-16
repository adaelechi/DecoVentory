const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// Protected routes
router.post('/', authMiddleware, eventController.createEvent);
router.put('/:id/return', authMiddleware, eventController.markEventReturned);
router.delete('/:id', authMiddleware, eventController.deleteEvent);

module.exports = router;
