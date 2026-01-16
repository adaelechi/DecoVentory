const db = require('../database/database');

class ExternalBorrowItem {
  static create(borrow_id, material_id, quantity, callback) {
    db.run(
      `INSERT INTO external_borrow_items (borrow_id, material_id, quantity) 
       VALUES (?, ?, ?)`,
      [borrow_id, material_id, quantity],
      function (err) {
        callback(err, { id: this.lastID });
      }
    );
  }

  static getByBorrowId(borrow_id, callback) {
    db.all(
      `SELECT ebi.*, m.name as material_name, m.category
       FROM external_borrow_items ebi
       JOIN materials m ON ebi.material_id = m.id
       WHERE ebi.borrow_id = ?`,
      [borrow_id],
      callback
    );
  }

  static updateReturn(id, returned_quantity, lost_quantity, damaged_quantity, callback) {
    db.run(
      `UPDATE external_borrow_items 
       SET returned_quantity = ?, lost_quantity = ?, damaged_quantity = ?
       WHERE id = ?`,
      [returned_quantity, lost_quantity, damaged_quantity, id],
      callback
    );
  }

  static deleteByBorrowId(borrow_id, callback) {
    db.run('DELETE FROM external_borrow_items WHERE borrow_id = ?', [borrow_id], callback);
  }
}

module.exports = ExternalBorrowItem;
