require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = process.env.DB_PATH || './database.db';
const ADMIN_EMAIL = 'biblioteca@casalmunic.de';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('❌ Error: ADMIN_PASSWORD environment variable is not set');
  console.error('Please set ADMIN_PASSWORD in your .env file or environment');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

db.serialize(async () => {
  // Add is_admin column if it doesn't exist
  db.run(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding is_admin column:', err);
    } else {
      console.log('✓ is_admin column added or already exists');
    }
  });

  // Add is_enabled column if it doesn't exist
  db.run(`ALTER TABLE users ADD COLUMN is_enabled INTEGER DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding is_enabled column:', err);
    } else {
      console.log('✓ is_enabled column added or already exists');
    }
  });

  // Wait a bit for the ALTER TABLE operations to complete
  setTimeout(async () => {
    // Check if admin user already exists
    db.get(`SELECT id FROM users WHERE email = ?`, [ADMIN_EMAIL], async (err, row) => {
      if (err) {
        console.error('Error checking for admin user:', err);
        db.close();
        return;
      }

      if (row) {
        console.log('ℹ️  Admin user already exists');
        console.log('  Email:', ADMIN_EMAIL);
        db.close();
        return;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

      const insertSql = `
        INSERT INTO users (name, email, password, postal_address, telephone, is_admin, is_enabled)
        VALUES (?, ?, ?, ?, ?, 1, 1)
      `;

      db.run(insertSql, [
        'Administrator',
        ADMIN_EMAIL,
        hashedPassword,
        'Casal Catalá de Munic',
        '+49 000000000'
      ], function(err) {
        if (err) {
          console.error('❌ Error creating admin user:', err);
        } else {
          console.log('✓ Admin user created successfully');
          console.log('  Email:', ADMIN_EMAIL);
          console.log('  Password: (set from ADMIN_PASSWORD environment variable)');
        }
        db.close();
      });
    });
  }, 500);
});
