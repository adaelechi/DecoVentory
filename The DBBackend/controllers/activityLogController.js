const ActivityLog = require('../models/ActivityLog');

exports.getAllActivityLogs = (req, res) => {
  ActivityLog.getAll((err, logs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
    res.json(logs);
  });
};

exports.getLogsByMaterial = (req, res) => {
  ActivityLog.getByMaterialId(req.params.materialId, (err, logs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
    res.json(logs);
  });
};

exports.getLogsByActionType = (req, res) => {
  ActivityLog.getByActionType(req.params.actionType, (err, logs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
    res.json(logs);
  });
};
