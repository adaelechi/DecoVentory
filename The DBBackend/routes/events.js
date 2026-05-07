const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

const multer = require('multer');
const path = require('path');

// Protected routes
let storage;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinaryConfig = require('../config/cloudinary');
  storage = cloudinaryConfig.decorationStorage;
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads/decorations'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}
const uploadDecorations = multer({ storage });

// Protected routes
router.post('/', authMiddleware, uploadDecorations.array('images', 10), eventController.createEvent);
router.put('/:id/return', authMiddleware, eventController.markEventReturned);
router.delete('/:id', authMiddleware, eventController.deleteEvent);

module.exports = router;
