const db = require('../database/database');

class Admin {
  static getActive(callback) {
    db.get('SELECT * FROM admins WHERE active = 1 LIMIT 1', callback);
  }

  static updatePasscode(id, passcode_hash, callback) {
    db.run('UPDATE admins SET passcode_hash = ? WHERE id = ?', [passcode_hash, id], callback);
  }
}

module.exports = Admin;
