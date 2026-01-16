const db = require('../database/database');

class ExternalBorrower {
  static getAll(callback) {
    db.all(
      `SELECT eb.*, 
       GROUP_CONCAT(json_object('material_id', ebi.material_id, 'quantity', ebi.quantity, 
       'returned_quantity', ebi.returned_quantity, 'lost_quantity', ebi.lost_quantity, 
       'damaged_quantity', ebi.damaged_quantity)) as items
       FROM external_borrowers eb
       LEFT JOIN external_borrow_items ebi ON eb.id = ebi.borrow_id
       GROUP BY eb.id
       ORDER BY eb.borrow_date DESC`,
      callback
    );
  }

  static getById(id, callback) {
    db.get(
      `SELECT eb.*, 
       GROUP_CONCAT(json_object('id', ebi.id, 'material_id', ebi.material_id, 'quantity', ebi.quantity, 
       'returned_quantity', ebi.returned_quantity, 'lost_quantity', ebi.lost_quantity, 
       'damaged_quantity', ebi.damaged_quantity)) as items
       FROM external_borrowers eb
       LEFT JOIN external_borrow_items ebi ON eb.id = ebi.borrow_id
       WHERE eb.id = ?
       GROUP BY eb.id`,
      [id],
      callback
    );
  }

  static create(data, callback) {
    const { borrower_name, borrower_contact, purpose, borrow_date, expected_return_date } = data;
    db.run(
      `INSERT INTO external_borrowers (borrower_name, borrower_contact, purpose, borrow_date, expected_return_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [borrower_name, borrower_contact, purpose, borrow_date, expected_return_date],
      function (err) {
        callback(err, { id: this.lastID });
      }
    );
  }

  static markReturned(id, callback) {
    db.run('UPDATE external_borrowers SET returned = 1 WHERE id = ?', [id], callback);
  }

  static delete(id, callback) {
    db.run('DELETE FROM external_borrowers WHERE id = ?', [id], callback);
  }

  static getUnreturned(callback) {
    db.all('SELECT * FROM external_borrowers WHERE returned = 0', callback);
  }
}

module.exports = ExternalBorrower;
