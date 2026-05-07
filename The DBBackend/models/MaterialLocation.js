const { db } = require('../database/database');

class MaterialLocation {
  static getByMaterialId(materialId, callback) {
    db.all('SELECT * FROM material_locations WHERE material_id = ? ORDER BY location_name ASC', [materialId], callback);
  }

  static create(materialId, locationName, quantity, callback) {
    db.run(
      'INSERT INTO material_locations (material_id, location_name, quantity) VALUES (?, ?, ?)',
      [materialId, locationName, quantity],
      function (err) {
        callback(err, { id: this ? this.lastID : null });
      }
    );
  }

  static updateQuantity(id, quantity, callback) {
    db.run(
      'UPDATE material_locations SET quantity = ? WHERE id = ?',
      [quantity, id],
      callback
    );
  }

  static deleteByMaterialId(materialId, callback) {
    db.run('DELETE FROM material_locations WHERE material_id = ?', [materialId], callback);
  }
}

module.exports = MaterialLocation;
