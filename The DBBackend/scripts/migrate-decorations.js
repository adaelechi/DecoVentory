require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

const sqliteDbPath = path.join(__dirname, '../database/decoventory.db');
const pgUrl = process.env.DATABASE_URL;

if (!pgUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const sqliteDb = new sqlite3.Database(sqliteDbPath);
const pgPool = new Pool({
  connectionString: pgUrl,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🚀 Starting migration of Event Decorations...');
  
  try {
    // 1. Get data from SQLite
    const decorations = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM event_decorations', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📦 Found ${decorations.length} decorations in SQLite.`);

    // 2. Migrate Admins
    console.log('👥 Migrating Admins...');
    const admins = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM admins', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const admin of admins) {
      await pgPool.query(
        'INSERT INTO admins (passcode_hash, role, active, created_at) VALUES ($1, $2, $3, $4)',
        [admin.passcode_hash, admin.role, admin.active === 1, admin.created_at]
      );
      console.log(`✅ Migrated Admin: ${admin.role}`);
    }

    // 3. Insert into PostgreSQL
    console.log('🖼️ Migrating Event Decorations...');
    for (const dec of decorations) {
      const query = `
        INSERT INTO event_decorations 
        (event_name, venue, event_date, materials_used, returned, lost_items, damaged_items, images, instagram_link, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      const values = [
        dec.event_name,
        dec.venue,
        dec.event_date,
        dec.materials_used,
        dec.returned === 1,
        dec.lost_items,
        dec.damaged_items,
        dec.images,
        dec.instagram_link,
        dec.notes,
        dec.created_at
      ];

      await pgPool.query(query, values);
      console.log(`✅ Migrated: ${dec.event_name}`);
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

migrate();
