require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET is not set. Token generation will fail!');
}

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config for decorations
let decorationStorage;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinaryConfig = require('./config/cloudinary');
  decorationStorage = cloudinaryConfig.decorationStorage;
} else {
  decorationStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads/decorations'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}
const uploadDecorations = multer({ storage: decorationStorage });
app.set('uploadDecorations', uploadDecorations);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/chapel-logs', chapelLogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/quotes', quoteRoutes);

// Health check
app.get('/', (req, res) => {
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

(async () => {
  try {
    await ensureMaterialsLocationColumn();
    await ensureMaterialLocationsTable();
    await ensureEventDecorationsColumns();

    app.listen(PORT, () => {
      console.log(`\n🚀 DecoVentory API Server running on port ${PORT}`);
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

module.exports = app;
