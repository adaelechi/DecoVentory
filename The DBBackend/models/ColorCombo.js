const { db } = require('../database/database');

class ColorCombo {
    static async getAll() {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM color_combos ORDER BY created_at DESC`, [], (err, rows) => {
                if (err) return reject(err);
                
                const formattedRows = (rows || []).map(row => {
                    try {
                        row.colors = typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors;
                    } catch (e) {
                        row.colors = [];
                    }
                    return row;
                });
                
                resolve(formattedRows);
            });
        });
    }

    static async getById(id) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM color_combos WHERE id = ?`, [id], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                
                try {
                    row.colors = typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors;
                } catch (e) {
                    row.colors = [];
                }
                
                resolve(row);
            });
        });
    }

    static async create(comboData) {
        return new Promise((resolve, reject) => {
            const { title, colors } = comboData;
            
            const query = `
                INSERT INTO color_combos (title, colors)
                VALUES (?, ?)
            `;
            
            const colorsJson = typeof colors === 'string' ? colors : JSON.stringify(colors || []);
            
            db.run(query, [title, colorsJson], function(err) {
                if (err) return reject(err);
                resolve({ id: this.lastID, title, colors: typeof colors === 'string' ? JSON.parse(colors) : colors });
            });
        });
    }

    static async update(id, comboData) {
        return new Promise((resolve, reject) => {
            const { title, colors } = comboData;
            const colorsJson = typeof colors === 'string' ? colors : JSON.stringify(colors || []);
            
            const query = `
                UPDATE color_combos 
                SET title = ?, colors = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            db.run(query, [title, colorsJson, id], function(err) {
                if (err) return reject(err);
                resolve({ success: true, id: Number(id), title, colors: typeof colors === 'string' ? JSON.parse(colors) : colors });
            });
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM color_combos WHERE id = ?`, [id], function(err) {
                if (err) return reject(err);
                resolve({ success: true, changes: this.changes });
            });
        });
    }
}

module.exports = ColorCombo;
