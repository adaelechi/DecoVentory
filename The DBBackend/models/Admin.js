const { db, query, isPostgres } = require('../database/database');

class Admin {
  static async getAllActive() {
    const sql = isPostgres 
      ? 'SELECT * FROM admins WHERE active = true' 
      : 'SELECT * FROM admins WHERE active = 1';
    return await query(sql);
  }

  static async updatePasscode(id, passcode_hash) {
    const sql = 'UPDATE admins SET passcode_hash = ? WHERE id = ?';
    return await query(sql, [passcode_hash, id]);
  }

  static async updateByRole(role, passcode_hash) {
    const sql = 'UPDATE admins SET passcode_hash = ? WHERE role = ?';
    return await query(sql, [passcode_hash, role]);
  }

  static async getActiveByRole(role) {
    const sql = isPostgres
      ? 'SELECT * FROM admins WHERE role = ? AND active = true'
      : 'SELECT * FROM admins WHERE role = ? AND active = 1';
    const rows = await query(sql, [role]);
    return rows[0];
  }
}

module.exports = Admin;
