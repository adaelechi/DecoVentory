const Material = require('../models/Material');
const ActivityLog = require('../models/ActivityLog');

exports.getAllMaterials = (req, res) => {
  Material.getAll((err, materials) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch materials' });
    }
    res.json(materials);
  });
};

exports.getMaterialById = (req, res) => {
  Material.getById(req.params.id, (err, material) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch material' });
    }
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  });
};

exports.createMaterial = (req, res) => {
  const { name, category, total_quantity, available_quantity, condition } = req.body;

  if (!name || !category || total_quantity === undefined) {
    return res.status(400).json({ error: 'Name, category, and total_quantity are required' });
  }

  const materialData = {
    name,
    category,
    total_quantity,
    available_quantity: available_quantity !== undefined ? available_quantity : total_quantity,
    condition: condition || 'Good',
    image_url: req.file ? `/uploads/${req.file.filename}` : null
  };

  Material.create(materialData, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create material' });
    }

    // Log activity
    ActivityLog.create(
      result.id,
      'MATERIAL_ADDED',
      total_quantity,
      null,
      `New material added: ${name}`,
      () => {}
    );

    res.status(201).json({
      success: true,
      id: result.id,
      message: 'Material created successfully'
    });
  });
};

exports.updateMaterial = (req, res) => {
  const { name, category, total_quantity, available_quantity, condition } = req.body;

  if (!name || !category || total_quantity === undefined || available_quantity === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (available_quantity > total_quantity) {
    return res.status(400).json({ error: 'Available quantity cannot exceed total quantity' });
  }

  const materialData = {
    name,
    category,
    total_quantity,
    available_quantity,
    condition,
    image_url: req.file ? `/uploads/${req.file.filename}` : undefined
  };

  // If no new image, don't update image_url field
  if (!req.file) {
    delete materialData.image_url;
  }

  Material.update(req.params.id, materialData, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update material' });
    }

    res.json({ success: true, message: 'Material updated successfully' });
  });
};

exports.deleteMaterial = (req, res) => {
  Material.delete(req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete material' });
    }

    res.json({ success: true, message: 'Material deleted successfully' });
  });
};

exports.getMaterialsByCategory = (req, res) => {
  Material.getByCategory(req.params.category, (err, materials) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch materials' });
    }
    res.json(materials);
  });
};
