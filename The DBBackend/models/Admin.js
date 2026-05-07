const db = require('../database/database');

class Admin {
  static getAllActive(callback) {
    db.all('SELECT * FROM admins WHERE active = 1', callback);
  }

  static updatePasscode(id, passcode_hash, callback) {
    db.run('UPDATE admins SET passcode_hash = ? WHERE id = ?', [passcode_hash, id], callback);
  }

  static updateByRole(role, passcode_hash, callback) {
    db.run('UPDATE admins SET passcode_hash = ? WHERE role = ?', [passcode_hash, role], callback);
  }
}

module.exports = Admin;
