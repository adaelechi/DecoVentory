const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;
let isPostgres = false;

if (process.env.DATABASE_URL) {
  console.log('Using PostgreSQL database');
  isPostgres = true;
  
  // Force SSL unauthorized rejection to false for cloud databases
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000 // 5 second timeout
  });

  // Wrapper to make pg behave like sqlite3 for the models
  db = {
    query: (text, params) => pool.query(text, params),
    all: (text, params, callback) => {
      // Handle optional params
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      // Replace ? with $1, $2, etc.
      let count = 1;
      const formattedText = text.replace(/\?/g, () => `$${count++}`);
      pool.query(formattedText, params)
        .then(res => callback(null, res.rows))
        .catch(err => callback(err));
    },
    get: (text, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      let count = 1;
      const formattedText = text.replace(/\?/g, () => `$${count++}`);
      pool.query(formattedText, params)
        .then(res => callback(null, res.rows[0]))
        .catch(err => callback(err));
    },
    run: (text, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      let count = 1;
      const formattedText = text.replace(/\?/g, () => `$${count++}`);
      
      // Special handling for RETURNING id in Postgres
      let queryToRun = formattedText;
      if (formattedText.toUpperCase().includes('INSERT INTO')) {
        queryToRun += ' RETURNING id';
      }

      pool.query(queryToRun, params)
        .then(res => {
          const result = {
            lastID: res.rows[0] ? res.rows[0].id : null,
            changes: res.rowCount
          };
          callback.call(result, null);
        })
        .catch(err => callback(err));
    }
  };
} else {
  console.log('Using SQLite database');
  const dbPath = path.join(__dirname, 'decoventory.db');
  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database');
    }
  });

  // Wrapper to make SQLite behave a bit more like pg for consistency
  db = {
    query: (text, params) => {
      return new Promise((resolve, reject) => {
        // Handle different SQLite methods based on command
        const command = text.trim().split(' ')[0].toUpperCase();
        if (command === 'SELECT') {
          sqliteDb.all(text, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows });
          });
        } else {
          sqliteDb.run(text, params, function(err) {
            if (err) reject(err);
            else resolve({ rows: [], lastID: this.lastID, changes: this.changes });
          });
        }
      });
    },
    // Backwards compatibility methods
    all: (sql, params, callback) => sqliteDb.all(sql, params, callback),
    get: (sql, params, callback) => sqliteDb.get(sql, params, callback),
    run: (sql, params, callback) => sqliteDb.run(sql, params, callback)
  };
}

// Unified query method that works for both
const query = async (text, params) => {
  if (isPostgres) {
    return await db.query(text, params);
  } else {
    return await db.query(text, params);
  }
};

module.exports = {
  db,
  query,
  isPostgres
};
