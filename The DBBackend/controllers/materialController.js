const Material = require('../models/Material');
const MaterialLocation = require('../models/MaterialLocation');
const ActivityLog = require('../models/ActivityLog');

exports.getAllMaterials = (req, res) => {
  Material.getAll((err, materials) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch materials' });
    }
    // Disable aggressive caching — ensures updates are reflected immediately
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
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
  console.log('Create Material Body:', req.body);
  const { name, category, total_quantity, available_quantity, condition, location, locations, size, colour } = req.body;

  if (!name || !category || total_quantity === undefined) {
    return res.status(400).json({ error: 'Name, category, and total_quantity are required' });
  }

  let parsedLocations = [];
  if (locations) {
    try {
      parsedLocations = JSON.parse(locations);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid locations format' });
    }
  } else if (location) {
    parsedLocations = [{ name: location, quantity: total_quantity }];
  } else {
    parsedLocations = [{ name: 'office store', quantity: total_quantity }];
  }

  // Recalculate available_quantity based on locations
  let calculatedAvailableQuantity = 0;
  parsedLocations.forEach(loc => {
    const locName = loc.name.toLowerCase();
    if (!locName.includes('chapel') && !locName.includes('rented')) {
      calculatedAvailableQuantity += (Number(loc.quantity) || 0);
    }
  });

  const materialData = {
    name,
    category,
    total_quantity,
    available_quantity: calculatedAvailableQuantity,
    condition: condition || 'Good',
    location: parsedLocations[0].name, // keep for backwards compatibility if needed
    size: size || null,
    colour: colour || null,
    image_url: req.file ? req.file.path : null
  };
 
  Material.create(materialData, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create material' });
    }

    const materialId = result.id;

    // Insert locations
    parsedLocations.forEach(loc => {
      MaterialLocation.create(materialId, loc.name, loc.quantity, () => {});
    });

    // Log activity
    ActivityLog.create(
      materialId,
      'MATERIAL_ADDED',
      total_quantity,
      null,
      `New material added: ${name}`,
      () => {}
    );

    res.status(201).json({
      success: true,
      id: materialId,
      message: 'Material created successfully'
    });
  });
};

exports.updateMaterial = (req, res) => {
  const materialId = req.params.id;
  console.log('Update Material Body:', req.body);
  const { name, category, total_quantity, available_quantity, condition, location, locations, size, colour } = req.body;

  Material.getById(materialId, (fetchError, existingMaterial) => {
    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch material' });
    }

    if (!existingMaterial) {
      return res.status(404).json({ error: 'Material not found' });
    }

    let parsedLocations = null;
    let calculatedTotalQuantity = total_quantity !== undefined ? Number(total_quantity) : existingMaterial.total_quantity;

    if (locations) {
      try {
        parsedLocations = JSON.parse(locations);
        calculatedTotalQuantity = parsedLocations.reduce((sum, loc) => sum + (Number(loc.quantity) || 0), 0);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid locations format' });
      }
    }

    // Recalculate available_quantity based on locations
    let calculatedAvailableQuantity = 0;
    const locationsToUse = parsedLocations || existingMaterial.locations;
    if (locationsToUse) {
      locationsToUse.forEach(loc => {
        const locName = (loc.name || loc.location_name || '').toLowerCase();
        if (!locName.includes('chapel') && !locName.includes('rented')) {
          calculatedAvailableQuantity += (Number(loc.quantity) || 0);
        }
      });
    } else {
      calculatedAvailableQuantity = calculatedTotalQuantity;
    }

    const materialData = {
      name: name !== undefined ? name : existingMaterial.name,
      category: category !== undefined ? category : existingMaterial.category,
      total_quantity: calculatedTotalQuantity,
      available_quantity: calculatedAvailableQuantity,
      condition: condition !== undefined ? condition : existingMaterial.condition,
      location: parsedLocations ? parsedLocations[0].name : (location !== undefined ? location : existingMaterial.location),
      size: size !== undefined ? size : existingMaterial.size,
      colour: colour !== undefined ? colour : existingMaterial.colour,
      image_url: req.file ? req.file.path : existingMaterial.image_url
    };

    Material.update(materialId, materialData, (updateError) => {
      if (updateError) {
        return res.status(500).json({ error: 'Failed to update material' });
      }

      if (parsedLocations) {
        // Replace locations
        MaterialLocation.deleteByMaterialId(materialId, (delErr) => {
          if (delErr) console.error('Failed to delete old locations', delErr);
          
          parsedLocations.forEach(loc => {
            MaterialLocation.create(materialId, loc.name, loc.quantity, () => {});
          });
          
          res.json({ success: true, message: 'Material updated successfully' });
        });
      } else {
        res.json({ success: true, message: 'Material updated successfully' });
      }
    });
  });
};

exports.deleteMaterial = (req, res) => {
  const materialId = req.params.id;

  // 1. Fetch the material first to get image URL for Cloudinary cleanup
  Material.getById(materialId, (err, material) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch material for deletion' });
    }
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // 2. Delete image from Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME && material.image_url && material.image_url.includes('cloudinary.com')) {
      const cloudinary = require('../config/cloudinary').cloudinary;
      
      // Extract public_id from URL
      // Example: https://res.cloudinary.com/dbnuegesq/image/upload/v123/decoventory/materials/123-456.jpg
      const parts = material.image_url.split('/');
      const filenameWithExt = parts.pop();
      const filename = filenameWithExt.split('.')[0];
      
      // Reconstruct path: decoventory/materials/filename
      const publicId = `decoventory/materials/${filename}`;
      
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) console.error(`[Cloudinary] Failed to delete image ${publicId}:`, error);
        else console.log(`[Cloudinary] Deleted image: ${publicId}`);
      });
    }

    // 3. Delete from database
    Material.delete(materialId, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete material from database' });
      }

      res.json({ success: true, message: 'Material and associated image deleted successfully' });
    });
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
