const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    this.db = null;
  }

  connect() {
    const dbPath = process.env.DB_PATH || './database.db';
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to database:', err);
        throw err;
      }
      console.log('Connected to SQLite database');
    });
  }

  /**
   * Add a new book to the database
   */
  addBook(bookData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO books (
          title, author, isbn, publisher, published_date, description,
          page_count, categories, language, cover_image, thumbnail_image,
          google_books_id, rating, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        bookData.title,
        bookData.author,
        bookData.isbn,
        bookData.publisher,
        bookData.published_date,
        bookData.description,
        bookData.page_count,
        bookData.categories,
        bookData.language,
        bookData.cover_image,
        bookData.thumbnail_image,
        bookData.google_books_id,
        bookData.rating,
        bookData.status || 'available'
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...bookData });
        }
      });
    });
  }

  /**
   * Get all books
   */
  getAllBooks(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM books
        ORDER BY added_date DESC
        LIMIT ? OFFSET ?
      `;

      this.db.all(sql, [limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get book by ID
   */
  getBookById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM books WHERE id = ?';

      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Search books by query (title, author, ISBN)
   */
  searchBooks(query) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM books
        WHERE title LIKE ?
           OR author LIKE ?
           OR isbn LIKE ?
           OR categories LIKE ?
        ORDER BY added_date DESC
      `;

      const searchTerm = `%${query}%`;

      this.db.all(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Update book information
   */
  updateBook(id, bookData) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const params = [];

      Object.keys(bookData).forEach(key => {
        if (bookData[key] !== undefined) {
          fields.push(`${key} = ?`);
          params.push(bookData[key]);
        }
      });

      params.push(id);

      const sql = `UPDATE books SET ${fields.join(', ')} WHERE id = ?`;

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  /**
   * Delete book by ID
   */
  deleteBook(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM books WHERE id = ?';

      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  /**
   * Check if book exists by ISBN
   */
  bookExistsByISBN(isbn) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id FROM books WHERE isbn = ?';

      this.db.get(sql, [isbn], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? true : false);
        }
      });
    });
  }

  /**
   * Get books count
   */
  getBooksCount() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as count FROM books';

      this.db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  /**
   * Get books by category
   */
  getBooksByCategory(category) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM books
        WHERE categories LIKE ?
        ORDER BY added_date DESC
      `;

      this.db.all(sql, [`%${category}%`], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = new DatabaseService();
