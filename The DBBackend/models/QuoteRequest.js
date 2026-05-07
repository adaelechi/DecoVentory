const { db } = require('../database/database');

class QuoteRequest {
    static async getAll() {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM quote_requests ORDER BY created_at DESC`, [], (err, rows) => {
                if (err) return reject(err);
                
                // Parse JSON fields
                const formattedRows = rows.map(row => {
                    try {
                        row.items = JSON.parse(row.items);
                        row.services = JSON.parse(row.services);
                    } catch(e) {
                        console.error('Failed to parse quote JSON', e);
                    }
                    return row;
                });
                
                resolve(formattedRows);
            });
        });
    }

    static async create(quoteData) {
        return new Promise((resolve, reject) => {
            const { recipient, location, date, items, services, status } = quoteData;
            
            const query = `
                INSERT INTO quote_requests (recipient_name, location, event_date, items, services, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            db.run(query, [
                recipient,
                location,
                date,
                JSON.stringify(items || []),
                JSON.stringify(services || []),
                status || 'pending'
            ], function(err) {
                if (err) return reject(err);
                resolve({ id: this.lastID });
            });
        });
    }

    static async updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE quote_requests SET status = ? WHERE id = ?`;
            
            db.run(query, [status, id], function(err) {
                if (err) return reject(err);
                resolve({ success: true, changes: this.changes });
            });
        });
    }
    
    static async getById(id) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM quote_requests WHERE id = ?`, [id], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                
                try {
                    row.items = JSON.parse(row.items);
                    row.services = JSON.parse(row.services);
                } catch(e) {}
                
                resolve(row);
            });
        });
    }
}

module.exports = QuoteRequest;
