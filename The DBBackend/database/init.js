const db = require('./database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const initializeDatabase = async () => {
  try {
    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      await new Promise((resolve, reject) => {
        db.run(statement, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log('✅ Database schema created successfully');

    // Check if users already exist
    const adminsCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    const execPasscode = process.env.DEFAULT_PASSCODE || '200026';
    const adminPasscode = process.env.ADMIN_PASSCODE || '111111';
    const hashedExecPasscode = await bcrypt.hash(execPasscode, 10);
    const hashedAdminPasscode = await bcrypt.hash(adminPasscode, 10);

    if (adminsCount === 0) {
      // Create default executive and admin with hashed passcodes
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO admins (passcode_hash, role, active) VALUES (?, 'executive', 1), (?, 'admin', 1)",
          [hashedExecPasscode, hashedAdminPasscode],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log('✅ Default executive and admin passcodes created');
      console.log(`   Use executive passcode: ${execPasscode}`);
      console.log(`   Use admin passcode: ${adminPasscode}`);
    } else {
      // For existing DBs, ensure we have an admin role
      const adminExists = await new Promise((resolve, reject) => {
        db.get("SELECT id FROM admins WHERE role = 'admin'", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!adminExists) {
        await new Promise((resolve, reject) => {
          db.run(
            "INSERT INTO admins (passcode_hash, role, active) VALUES (?, 'admin', 1)",
            [hashedAdminPasscode],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        console.log('✅ Admin passcode added to existing database');
        console.log(`   Use admin passcode: ${adminPasscode}`);
      }
    }

    // Add some sample data (optional)
    const materialsCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM materials', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (materialsCount === 0) {
      const sampleMaterials = [
        { name: 'White Drape', category: 'Fabrics', total_quantity: 50, available_quantity: 50 },
        { name: 'Blue Ribbon', category: 'Fabrics', total_quantity: 100, available_quantity: 100 },
        { name: 'Scissors', category: 'Tools', total_quantity: 10, available_quantity: 10 },
        { name: 'Clips', category: 'Tools', total_quantity: 200, available_quantity: 200 },
        { name: 'LED Lights', category: 'Lights', total_quantity: 20, available_quantity: 20 }
      ];

      for (const material of sampleMaterials) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO materials (name, category, total_quantity, available_quantity) VALUES (?, ?, ?, ?)',
            [material.name, material.category, material.total_quantity, material.available_quantity],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      console.log('✅ Sample materials added');
    }

    console.log('\n🎉 Database initialization complete!');
    console.log('   Run "npm start" to start the server\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

const runMigrations = async () => {
  const hasLocationColumn = await new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(materials)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(columns.some((column) => column.name === 'location'));
    });
  });

  if (!hasLocationColumn) {
    await new Promise((resolve, reject) => {
      db.run("ALTER TABLE materials ADD COLUMN location TEXT DEFAULT 'office store'", (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });

    console.log('✅ materials.location migration applied');
  }
};

// Load environment variables
require('dotenv').config();

if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase,
  runMigrations
};
