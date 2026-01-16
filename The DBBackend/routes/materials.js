const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', materialController.getAllMaterials);
router.get('/category/:category', materialController.getMaterialsByCategory);
router.get('/:id', materialController.getMaterialById);

// Protected routes - with image upload
router.post('/', authMiddleware, upload.single('image'), materialController.createMaterial);
router.put('/:id', authMiddleware, upload.single('image'), materialController.updateMaterial);
router.delete('/:id', authMiddleware, materialController.deleteMaterial);

module.exports = router;
