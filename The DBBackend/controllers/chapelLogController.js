const ChapelLog = require('../models/ChapelLog');
const ActivityLog = require('../models/ActivityLog');

exports.getAllChapelLogs = (req, res) => {
  ChapelLog.getAll((err, logs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch chapel logs' });
    }
    
    // Parse JSON strings
    const parsedLogs = logs.map(log => ({
      ...log,
      materials_used: JSON.parse(log.materials_used)
    }));
    
    res.json(parsedLogs);
  });
};

exports.getChapelLogById = (req, res) => {
  ChapelLog.getById(req.params.id, (err, log) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch chapel log' });
    }
    if (!log) {
      return res.status(404).json({ error: 'Chapel log not found' });
    }
    
    res.json({
      ...log,
      materials_used: JSON.parse(log.materials_used)
    });
  });
};

exports.createChapelLog = (req, res) => {
  const { service_date, service_type, materials_used, notes } = req.body;

  if (!service_date || !service_type || !materials_used) {
    return res.status(400).json({ error: 'Service date, type, and materials are required' });
  }

  const logData = {
    service_date,
    service_type,
    materials_used,
    notes
  };

  ChapelLog.create(logData, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create chapel log' });
    }

    // Log activity for each material used
    materials_used.forEach(item => {
      ActivityLog.create(
        item.material_id,
        'CHAPEL_USE',
        item.quantity,
        result.id,
        `Used for ${service_type} service`,
        () => {}
      );
    });

    res.status(201).json({
      success: true,
      id: result.id,
      message: 'Chapel log created successfully'
    });
  });
};

exports.updateChapelLog = (req, res) => {
  const { service_date, service_type, materials_used, notes } = req.body;

  if (!service_date || !service_type || !materials_used) {
    return res.status(400).json({ error: 'Service date, type, and materials are required' });
  }

  const logData = {
    service_date,
    service_type,
    materials_used,
    notes
  };

  ChapelLog.update(req.params.id, logData, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update chapel log' });
    }

    res.json({ success: true, message: 'Chapel log updated successfully' });
  });
};

exports.deleteChapelLog = (req, res) => {
  ChapelLog.delete(req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete chapel log' });
    }

    res.json({ success: true, message: 'Chapel log deleted successfully' });
  });
};
