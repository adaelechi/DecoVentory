require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const https = require('https');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const materialRoutes = require('./routes/materials');
const chapelLogRoutes = require('./routes/chapelLogs');
const eventRoutes = require('./routes/events');
const borrowerRoutes = require('./routes/borrowers');
const activityLogRoutes = require('./routes/activityLogs');
const quoteRoutes = require('./routes/quoteRoutes');
const { db, isPostgres } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Sets various security-related HTTP headers
app.use(compression()); // gzip all responses — reduces payload size ~70%
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://cudecorationunit.com.ng', 
    'https://www.cudecorationunit.com.ng', 
    'https://cudecorationunit.com', 
    'https://www.cudecorationunit.com', 
    /\.vercel\.app$/, 
    /\.onrender\.com$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting — prevents brute-force on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to auth routes
app.use('/api/auth', authLimiter);
// Skip body-parsing for multipart/form-data so Multer can read the stream cleanly
const isNotMultipart = (req) => !(req.headers['content-type'] || '').includes('multipart/form-data');
app.use((req, res, next) => { if (isNotMultipart(req)) express.json()(req, res, next); else next(); });
app.use((req, res, next) => { if (isNotMultipart(req)) express.urlencoded({ extended: true })(req, res, next); else next(); });
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET is not set. Token generation will fail!');
}

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/chapel-logs', chapelLogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/quotes', quoteRoutes);

// ── Cache helper — sets Cache-Control on public read-only responses ──
// 120s = browsers/CDN cache the response for 2 minutes
// stale-while-revalidate=60 = serve stale for 60s while fetching fresh in background
function setPublicCache(res, maxAgeSeconds = 120) {
  res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, stale-while-revalidate=60`);
}

// Health check
app.get('/', (req, res) => {
  setPublicCache(res, 30);
  res.json({
    message: 'DecoVentory API',
    version: '1.0.0',
    status: 'running'
  });
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

function ensureMaterialsLocationColumn() {
  if (isPostgres) return Promise.resolve();
  return new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(materials)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const hasLocationColumn = columns.some((column) => column.name === 'location');

      if (hasLocationColumn) {
        resolve();
        return;
      }

      db.run("ALTER TABLE materials ADD COLUMN location TEXT DEFAULT 'office store'", (alterError) => {
        if (alterError) {
          reject(alterError);
          return;
        }

        console.log('✅ materials.location migration applied');
        resolve();
      });
    });
  });
}

function ensureMaterialLocationsTable() {
  const createTableSql = isPostgres 
    ? `CREATE TABLE IF NOT EXISTS material_locations (
        id SERIAL PRIMARY KEY,
        material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
        location_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    : `CREATE TABLE IF NOT EXISTS material_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_id INTEGER NOT NULL,
        location_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
      )`;

  return new Promise((resolve, reject) => {
    db.run(createTableSql, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Migrate existing materials that don't have location entries yet
      db.all('SELECT count(*) as count FROM material_locations', (countErr, rows) => {
        if (countErr) return reject(countErr);
        
        const count = rows[0] ? (rows[0].count || 0) : 0;
        if (Number(count) === 0) {
          // Empty table, do initial migration from materials
          const migrateSql = `
            INSERT INTO material_locations (material_id, location_name, quantity)
            SELECT id, location, total_quantity FROM materials
            WHERE location IS NOT NULL AND location != ''
          `;
          db.run(migrateSql, function(insertErr) {
            if (insertErr) return reject(insertErr);
            console.log(`✅ Migrated existing material locations`);
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  });
}

function ensureEventDecorationsColumns() {
  if (isPostgres) return Promise.resolve();
  return new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(event_decorations)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const hasImagesColumn = columns.some((column) => column.name === 'images');
      const hasInstagramColumn = columns.some((column) => column.name === 'instagram_link');
      const hasNotesColumn = columns.some((column) => column.name === 'notes');

      const migrations = [];

      if (!hasImagesColumn) {
        migrations.push(new Promise((res, rej) => {
          db.run("ALTER TABLE event_decorations ADD COLUMN images TEXT", (e) => e ? rej(e) : res());
        }));
      }

      if (!hasInstagramColumn) {
        migrations.push(new Promise((res, rej) => {
          db.run("ALTER TABLE event_decorations ADD COLUMN instagram_link TEXT", (e) => e ? rej(e) : res());
        }));
      }

      if (!hasNotesColumn) {
        migrations.push(new Promise((res, rej) => {
          db.run("ALTER TABLE event_decorations ADD COLUMN notes TEXT", (e) => e ? rej(e) : res());
        }));
      }

      if (migrations.length === 0) {
        resolve();
        return;
      }

      Promise.all(migrations)
        .then(() => {
          console.log('✅ event_decorations columns migration applied');
          resolve();
        })
        .catch(reject);
    });
  });
}

// Fix any image_url values that were incorrectly stored as local /uploads/ paths
// instead of full Cloudinary HTTPS URLs (caused by a previous bug in materialController)
async function fixCloudinaryImageUrls() {
  if (!isPostgres || !process.env.CLOUDINARY_CLOUD_NAME) return;

  const { query } = require('./database/database');
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/`;

  try {
    // /uploads/ is 9 characters, so substring from position 10 strips it
    const result = await query(
      `UPDATE materials
       SET image_url = $1 || substring(image_url from 10)
       WHERE image_url LIKE '/uploads/%'`,
      [baseUrl]
    );
    if (result.rowCount > 0) {
      console.log(`✅ Fixed ${result.rowCount} broken Cloudinary image URL(s) in materials table`);
    }
  } catch (err) {
    console.error('⚠️  Failed to fix Cloudinary image URLs:', err.message);
  }
}

function ensureQuoteRequestsTable() {
  const createTableSql = isPostgres 
    ? `CREATE TABLE IF NOT EXISTS quote_requests (
        id SERIAL PRIMARY KEY,
        recipient_name TEXT NOT NULL,
        location TEXT NOT NULL,
        event_date DATE NOT NULL,
        items TEXT NOT NULL,
        services TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    : `CREATE TABLE IF NOT EXISTS quote_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_name TEXT NOT NULL,
        location TEXT NOT NULL,
        event_date TEXT NOT NULL,
        items TEXT NOT NULL,
        services TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`;

  return new Promise((resolve, reject) => {
    db.run(createTableSql, (err) => {
      if (err) {
        console.error('❌ Error ensuring quote_requests table:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function ensureAdminsTable() {
  const createTableSql = isPostgres 
    ? `CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        passcode_hash TEXT NOT NULL,
        role TEXT DEFAULT 'executive',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    : `CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        passcode_hash TEXT NOT NULL,
        role TEXT DEFAULT 'executive',
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`;

  return new Promise((resolve, reject) => {
    db.run(createTableSql, (err) => {
      if (err) {
        console.error('❌ Error ensuring admins table:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function ensureActivityLogsTable() {
  const createTableSql = isPostgres 
    ? `CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        material_id INTEGER NOT NULL REFERENCES materials(id),
        action_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reference_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    : `CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reference_id INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials(id)
      )`;

  return new Promise((resolve, reject) => {
    db.run(createTableSql, (err) => {
      if (err) {
        console.error('❌ Error ensuring activity_logs table:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function ensureChapelLogsTable() {
  const createTableSql = isPostgres 
    ? `CREATE TABLE IF NOT EXISTS chapel_logs (
        id SERIAL PRIMARY KEY,
        service_date DATE NOT NULL,
        service_type TEXT NOT NULL,
        materials_used TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    : `CREATE TABLE IF NOT EXISTS chapel_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_date TEXT NOT NULL,
        service_type TEXT NOT NULL,
        materials_used TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`;

  return new Promise((resolve, reject) => {
    db.run(createTableSql, (err) => {
      if (err) {
        console.error('❌ Error ensuring chapel_logs table:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

(async () => {
  try {
    await ensureMaterialsLocationColumn();
    await ensureMaterialLocationsTable();
    await ensureEventDecorationsColumns();
    await ensureQuoteRequestsTable();
    await ensureAdminsTable();
    await ensureActivityLogsTable();
    await ensureChapelLogsTable();
    await fixCloudinaryImageUrls();

    app.listen(PORT, () => {
      console.log(`\n🚀 DecoVentory API Server running on port ${PORT}`);
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);

      // ── Keep-alive self-ping (Render free tier spins down after 15 min idle) ──
      // The RENDER env var is automatically set by Render on all deployments.
      if (process.env.RENDER) {
        const PING_URL = 'https://decoventory.onrender.com/';
        const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

        const ping = () => {
          https.get(PING_URL, (res) => {
            console.log(`[keep-alive] Pinged ${PING_URL} → ${res.statusCode}`);
          }).on('error', (err) => {
            console.warn(`[keep-alive] Ping failed: ${err.message}`);
          });
        };

        setInterval(ping, INTERVAL_MS);
        console.log(`⏰ Keep-alive cron active — pinging every 14 min to prevent Render sleep.\n`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

module.exports = app;
