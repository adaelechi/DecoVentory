const db = require('../database/database');

class ChapelLog {
  static getAll(callback) {
    db.all('SELECT * FROM chapel_logs ORDER BY service_date DESC', callback);
  }

  static getById(id, callback) {
    db.get('SELECT * FROM chapel_logs WHERE id = ?', [id], callback);
  }

  static create(data, callback) {
    const { service_date, service_type, materials_used, notes } = data;
    db.run(
      `INSERT INTO chapel_logs (service_date, service_type, materials_used, notes) 
       VALUES (?, ?, ?, ?)`,
      [service_date, service_type, JSON.stringify(materials_used), notes],
      function (err) {
        callback(err, { id: this.lastID });
      }
    );
  }

  static update(id, data, callback) {
    const { service_date, service_type, materials_used, notes } = data;
    db.run(
      `UPDATE chapel_logs 
       SET service_date = ?, service_type = ?, materials_used = ?, notes = ?
       WHERE id = ?`,
      [service_date, service_type, JSON.stringify(materials_used), notes, id],
      callback
    );
  }

  static delete(id, callback) {
    db.run('DELETE FROM chapel_logs WHERE id = ?', [id], callback);
  }

  static getByDateRange(startDate, endDate, callback) {
    db.all(
      'SELECT * FROM chapel_logs WHERE service_date BETWEEN ? AND ? ORDER BY service_date DESC',
      [startDate, endDate],
      callback
    );
  }
}

module.exports = ChapelLog;
