const db = require('../database/database');

class Material {
  static getAll(callback) {
    db.all('SELECT * FROM materials ORDER BY created_at DESC', callback);
  }

  static getById(id, callback) {
    db.get('SELECT * FROM materials WHERE id = ?', [id], callback);
  }

  static create(data, callback) {
    const { name, category, total_quantity, available_quantity, condition, image_url } = data;
    db.run(
      `INSERT INTO materials (name, category, total_quantity, available_quantity, condition, image_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, category, total_quantity, available_quantity || total_quantity, condition || 'Good', image_url || null],
      function (err) {
        callback(err, { id: this.lastID });
      }
    );
  }

  static update(id, data, callback) {
    const { name, category, total_quantity, available_quantity, condition, image_url } = data;
    db.run(
      `UPDATE materials 
       SET name = ?, category = ?, total_quantity = ?, available_quantity = ?, condition = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, total_quantity, available_quantity, condition, image_url, id],
      callback
    );
  }

  static updateQuantity(id, available_quantity, callback) {
    db.run(
      'UPDATE materials SET available_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [available_quantity, id],
      callback
    );
  }

  static delete(id, callback) {
    db.run('DELETE FROM materials WHERE id = ?', [id], callback);
  }

  static getByCategory(category, callback) {
    db.all('SELECT * FROM materials WHERE category = ?', [category], callback);
  }
}

module.exports = Material;
