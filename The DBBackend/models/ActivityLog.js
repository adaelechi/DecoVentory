const { db } = require('../database/database');

class ActivityLog {
  static create(material_id, action_type, quantity, reference_id, notes, callback) {
    db.run(
      `INSERT INTO activity_logs (material_id, action_type, quantity, reference_id, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [material_id, action_type, quantity, reference_id, notes],
      function (err) {
        callback(err, { id: this.lastID });
      }
    );
  }

  static getAll(callback) {
    db.all(
      `SELECT al.*, m.name as material_name, m.category
       FROM activity_logs al
       JOIN materials m ON al.material_id = m.id
       ORDER BY al.created_at DESC`,
      callback
    );
  }

  static getByMaterialId(material_id, callback) {
    db.all(
      `SELECT * FROM activity_logs WHERE material_id = ? ORDER BY created_at DESC`,
      [material_id],
      callback
    );
  }

  static getByActionType(action_type, callback) {
    db.all(
      `SELECT al.*, m.name as material_name, m.category
       FROM activity_logs al
       JOIN materials m ON al.material_id = m.id
       WHERE al.action_type = ?
       ORDER BY al.created_at DESC`,
      [action_type],
      callback
    );
  }
}

module.exports = ActivityLog;
