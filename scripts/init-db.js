const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './database.db';
const uploadsDir = process.env.UPLOAD_DIR || './uploads';

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

db.serialize(() => {
  // Create books table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      isbn TEXT,
      publisher TEXT,
      published_date TEXT,
      description TEXT,
      page_count INTEGER,
      categories TEXT,
      language TEXT,
      cover_image TEXT,
      thumbnail_image TEXT,
      added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      google_books_id TEXT,
      rating REAL,
      status TEXT DEFAULT 'available'
    )
  `, (err) => {
    if (err) {
      console.error('Error creating books table:', err);
    } else {
      console.log('Books table created successfully');
    }
  });

  // Create users table (for future extension)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created successfully');
    }
  });

  // Create borrowing records table (for future extension)
  db.run(`
    CREATE TABLE IF NOT EXISTS borrowing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      return_date DATETIME,
      due_date DATETIME,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating borrowing_records table:', err);
    } else {
      console.log('Borrowing records table created successfully');
    }
  });

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)`);
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database initialization completed');
  }
});
