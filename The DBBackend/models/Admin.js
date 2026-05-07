const { db } = require('../database/database');

class Admin {
  static getAllActive(callback) {
    // In Postgres, active is BOOLEAN (true/false), in SQLite it's INTEGER (1/0)
    // Using a comparison that works for both or checking db type
    const { isPostgres } = require('../database/database');
    const sql = isPostgres 
      ? 'SELECT * FROM admins WHERE active = true' 
      : 'SELECT * FROM admins WHERE active = 1';
    db.all(sql, callback);
  }

  static updatePasscode(id, passcode_hash, callback) {
    db.run('UPDATE admins SET passcode_hash = ? WHERE id = ?', [passcode_hash, id], callback);
  }

  static updateByRole(role, passcode_hash, callback) {
    db.run('UPDATE admins SET passcode_hash = ? WHERE role = ?', [passcode_hash, role], callback);
  }
}

module.exports = Admin;
