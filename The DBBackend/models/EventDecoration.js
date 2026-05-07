const { db } = require('../database/database');

class EventDecoration {
  static getAll(callback) {
    db.all('SELECT * FROM event_decorations ORDER BY event_date DESC', callback);
  }

  static getById(id, callback) {
    db.get('SELECT * FROM event_decorations WHERE id = ?', [id], callback);
  }

  static create(data, callback) {
    const { event_name, venue, event_date, materials_used, images, instagram_link, notes } = data;
    db.run(
      `INSERT INTO event_decorations (event_name, venue, event_date, materials_used, returned, images, instagram_link, notes) 
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      [event_name, venue, event_date, JSON.stringify(materials_used), JSON.stringify(images || []), instagram_link, notes],
      function (err) {
        callback(err, { id: this.lastID });
      }
    );
  }

  static markReturned(id, lostItems, damagedItems, callback) {
    db.run(
      `UPDATE event_decorations 
       SET returned = 1, lost_items = ?, damaged_items = ?
       WHERE id = ?`,
      [JSON.stringify(lostItems || []), JSON.stringify(damagedItems || []), id],
      callback
    );
  }

  static update(id, data, callback) {
    const { event_name, venue, event_date, materials_used, images, instagram_link, notes } = data;
    db.run(
      `UPDATE event_decorations 
       SET event_name = ?, venue = ?, event_date = ?, materials_used = ?, images = ?, instagram_link = ?, notes = ?
       WHERE id = ?`,
      [event_name, venue, event_date, JSON.stringify(materials_used), JSON.stringify(images || []), instagram_link, notes, id],
      callback
    );
  }

  static delete(id, callback) {
    db.run('DELETE FROM event_decorations WHERE id = ?', [id], callback);
  }

  static getUnreturned(callback) {
    db.all('SELECT * FROM event_decorations WHERE returned = 0', callback);
  }
}

module.exports = EventDecoration;
