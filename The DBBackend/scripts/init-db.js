require('dotenv').config();
const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');

const pgUrl = process.env.DATABASE_URL;

if (!pgUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const pgPool = new Pool({
  connectionString: pgUrl,
  ssl: { rejectUnauthorized: false }
});

async function initDb() {
  console.log('🚀 Initializing PostgreSQL Database Schema...');
  
  try {
    const schemaPath = path.join(__dirname, '../database/schema.pg.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing schema.pg.sql...');
    await pgPool.query(schemaSql);
    
    console.log('\n🎉 Database schema initialized successfully!');
  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
  } finally {
    await pgPool.end();
  }
}

initDb();
