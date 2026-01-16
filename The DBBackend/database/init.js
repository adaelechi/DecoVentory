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

    // Check if admin already exists
    const adminExists = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM admins WHERE active = 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const defaultPasscode = process.env.DEFAULT_PASSCODE || '200026';
    const hashedPasscode = await bcrypt.hash(defaultPasscode, 10);

    if (!adminExists) {
      // Create default admin with hashed passcode
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO admins (passcode_hash, active) VALUES (?, 1)',
          [hashedPasscode],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log('✅ Default admin passcode created');
      console.log(`   Use passcode: ${defaultPasscode}`);
    } else {
      // Update existing admin passcode
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE admins SET passcode_hash = ? WHERE active = 1',
          [hashedPasscode],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log('✅ Admin passcode updated');
      console.log(`   Use passcode: ${defaultPasscode}`);
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

// Load environment variables
require('dotenv').config();

// Run initialization
initializeDatabase();
