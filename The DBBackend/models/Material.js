const { db } = require('../database/database');

class Material {
  static getAll(callback) {
    db.all('SELECT * FROM materials ORDER BY created_at DESC', (err, materials) => {
      if (err) return callback(err);
      
      db.all('SELECT * FROM material_locations', (locErr, locations) => {
        if (locErr) return callback(locErr);
        
        const materialsWithLocs = materials.map(mat => {
          mat.locations = locations.filter(l => l.material_id === mat.id).map(l => ({
            id: l.id,
            name: l.location_name,
            quantity: l.quantity
          }));
          return mat;
        });
        callback(null, materialsWithLocs);
      });
    });
  }

  static getById(id, callback) {
    db.get('SELECT * FROM materials WHERE id = ?', [id], (err, material) => {
      if (err) return callback(err);
      if (!material) return callback(null, null);

      db.all('SELECT * FROM material_locations WHERE material_id = ?', [id], (locErr, locations) => {
        if (locErr) return callback(locErr);
        
        material.locations = locations.map(l => ({
          id: l.id,
          name: l.location_name,
          quantity: l.quantity
        }));
        callback(null, material);
      });
    });
  }

  static create(data, callback) {
    console.log('DB Create Material:', data);
    const { name, category, total_quantity, available_quantity, condition, location, size, colour, image_url } = data;
    db.run(
      `INSERT INTO materials (name, category, total_quantity, available_quantity, condition, location, size, colour, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, total_quantity, available_quantity || total_quantity, condition || 'Good', location || 'office store', size || null, colour || null, image_url || null],
      function (err) {
        callback(err, { id: this.lastID });
      }
    );
  }

  static update(id, data, callback) {
    console.log(`DB Update Material ${id}:`, data);
    const { name, category, total_quantity, available_quantity, condition, location, size, colour, image_url } = data;
    db.run(
      `UPDATE materials 
       SET name = ?, category = ?, total_quantity = ?, available_quantity = ?, condition = ?, location = ?, size = ?, colour = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, total_quantity, available_quantity, condition, location, size, colour, image_url, id],
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

  static getByIdPromise(id) {
    return new Promise((resolve, reject) => {
      this.getById(id, (err, material) => {
        if (err) return reject(err);
        resolve(material);
      });
    });
  }

  static updateAvailableQuantityPromise(id, available_quantity) {
    return new Promise((resolve, reject) => {
      this.updateQuantity(id, available_quantity, (err) => {
        if (err) return reject(err);
        resolve({ success: true });
      });
    });
  }

  static getByCategory(category, callback) {
    db.all('SELECT * FROM materials WHERE category = ?', [category], callback);
  }
}

module.exports = Material;
