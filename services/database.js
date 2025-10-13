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
  addBook(bookData, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO books (
          title, author, isbn, publisher, published_date, description,
          page_count, categories, language, cover_image, thumbnail_image,
          google_books_id, rating, status, added_by_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        bookData.status || 'available',
        userId
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...bookData, added_by_user_id: userId });
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

  /**
   * Get books added by a specific user
   */
  getBooksByUser(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM books
        WHERE added_by_user_id = ?
        ORDER BY added_date DESC
      `;

      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Borrow a book
   */
  borrowBook(bookId, userId, dueDays = 14) {
    return new Promise((resolve, reject) => {
      // First check if book is available
      const checkSql = `
        SELECT status FROM books WHERE id = ?
      `;

      this.db.get(checkSql, [bookId], (err, book) => {
        if (err) {
          reject(err);
          return;
        }

        if (!book) {
          reject(new Error('Book not found'));
          return;
        }

        if (book.status !== 'available') {
          reject(new Error('Book is not available'));
          return;
        }

        // Calculate due date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);

        // Create borrowing record and update book status
        const insertSql = `
          INSERT INTO borrowing_records (book_id, user_id, due_date, status)
          VALUES (?, ?, ?, 'borrowed')
        `;

        this.db.run(insertSql, [bookId, userId, dueDate.toISOString()], function(err) {
          if (err) {
            reject(err);
            return;
          }

          const borrowId = this.lastID;

          // Update book status
          const updateSql = `UPDATE books SET status = 'borrowed' WHERE id = ?`;

          this.db.run(updateSql, [bookId], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: borrowId,
                book_id: bookId,
                user_id: userId,
                due_date: dueDate.toISOString(),
                status: 'borrowed'
              });
            }
          });
        });
      });
    });
  }

  /**
   * Return a borrowed book
   */
  returnBook(bookId, userId) {
    return new Promise((resolve, reject) => {
      // Find active borrowing record
      const findSql = `
        SELECT id FROM borrowing_records
        WHERE book_id = ? AND user_id = ? AND status = 'borrowed'
        ORDER BY borrow_date DESC
        LIMIT 1
      `;

      this.db.get(findSql, [bookId, userId], (err, record) => {
        if (err) {
          reject(err);
          return;
        }

        if (!record) {
          reject(new Error('No active borrowing record found'));
          return;
        }

        // Update borrowing record
        const updateBorrowSql = `
          UPDATE borrowing_records
          SET return_date = CURRENT_TIMESTAMP, status = 'returned'
          WHERE id = ?
        `;

        this.db.run(updateBorrowSql, [record.id], (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Update book status
          const updateBookSql = `UPDATE books SET status = 'available' WHERE id = ?`;

          this.db.run(updateBookSql, [bookId], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({ success: true, message: 'Book returned successfully' });
            }
          });
        });
      });
    });
  }

  /**
   * Get borrowing records for a user
   */
  getUserBorrowings(userId, includeReturned = false) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT br.*, b.title, b.author, b.cover_image
        FROM borrowing_records br
        JOIN books b ON br.book_id = b.id
        WHERE br.user_id = ?
      `;

      if (!includeReturned) {
        sql += ` AND br.status = 'borrowed'`;
      }

      sql += ` ORDER BY br.borrow_date DESC`;

      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get all borrowing records for a book
   */
  getBookBorrowings(bookId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT br.*, u.name as user_name, u.email as user_email
        FROM borrowing_records br
        JOIN users u ON br.user_id = u.id
        WHERE br.book_id = ?
        ORDER BY br.borrow_date DESC
      `;

      this.db.all(sql, [bookId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Check if a book is currently borrowed by a user
   */
  isBookBorrowedByUser(bookId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id FROM borrowing_records
        WHERE book_id = ? AND user_id = ? AND status = 'borrowed'
      `;

      this.db.get(sql, [bookId, userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? true : false);
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
