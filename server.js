require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { body, validationResult } = require('express-validator');

const db = require('./services/database');
const bookRecognition = require('./services/bookRecognition');
const authService = require('./services/auth');
const { requireAuth, requireAdmin, attachUser } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Attach user to all requests
app.use(attachUser);

app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Initialize database connection
db.connect();

// ==================== Authentication Routes ====================

/**
 * POST /api/auth/register - Register a new user
 */
app.post('/api/auth/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('postal_address').trim().notEmpty().withMessage('Postal address is required'),
  body('telephone').trim().notEmpty().withMessage('Telephone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await authService.register(req.body);

    // Set session
    req.session.userId = user.id;
    req.session.userName = user.name;

    res.status(201).json({
      success: true,
      data: user,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login - Login user
 */
app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await authService.login(req.body.email, req.body.password);

    // Set session
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.isAdmin = user.is_admin === 1;

    res.json({
      success: true,
      data: user,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout - Logout user
 */
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

/**
 * GET /api/auth/me - Get current user
 */
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await authService.getUserById(req.userId);
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/auth/profile - Update user profile
 */
app.put('/api/auth/profile', requireAuth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('postal_address').optional().trim().notEmpty().withMessage('Postal address cannot be empty'),
  body('telephone').optional().trim().notEmpty().withMessage('Telephone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await authService.updateUser(req.userId, req.body);

    if (result.changes > 0) {
      const updatedUser = await authService.getUserById(req.userId);
      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'No changes made'
      });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/change-password - Change password
 */
app.post('/api/auth/change-password', requireAuth, [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    await authService.changePassword(
      req.userId,
      req.body.oldPassword,
      req.body.newPassword
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/profile-picture - Upload profile picture
 */
app.post('/api/auth/profile-picture', requireAuth, upload.single('picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Optimize profile picture
    const optimizedPath = path.join(UPLOAD_DIR, 'profile-' + Date.now() + '.jpg');
    await sharp(req.file.path)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Delete original upload
    fs.unlinkSync(req.file.path);

    const profilePicturePath = '/uploads/' + path.basename(optimizedPath);

    // Delete old profile picture if exists
    const user = await authService.getUserById(req.userId);
    if (user.profile_picture && user.profile_picture.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, user.profile_picture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user profile
    await authService.updateUser(req.userId, {
      profile_picture: profilePicturePath
    });

    res.json({
      success: true,
      data: { profile_picture: profilePicturePath },
      message: 'Profile picture updated successfully'
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/my-books - Get books added by current user
 */
app.get('/api/auth/my-books', requireAuth, async (req, res) => {
  try {
    const books = await db.getBooksByUser(req.userId);
    res.json({
      success: true,
      data: books
    });
  } catch (error) {
    console.error('Error fetching user books:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== Book Routes ====================

/**
 * GET /api/books - Get all books
 */
app.get('/api/books', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const books = await db.getAllBooks(limit, offset);
    res.json({ success: true, data: books });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/books/search - Search books
 */
app.get('/api/books/search', requireAuth, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const books = await db.searchBooks(query);
    res.json({ success: true, data: books });
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/books/:id - Get book by ID
 */
app.get('/api/books/:id', requireAuth, async (req, res) => {
  try {
    const book = await db.getBookById(req.params.id);
    if (book) {
      res.json({ success: true, data: book });
    } else {
      res.status(404).json({ success: false, error: 'Book not found' });
    }
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/books/search-isbn/:isbn - Search book by ISBN
 */
app.get('/api/books/search-isbn/:isbn', requireAuth, async (req, res) => {
  try {
    const isbn = req.params.isbn;
    console.log('Searching for book with ISBN:', isbn);

    // Use book recognition service to search by ISBN
    const bookData = await bookRecognition.searchByISBN(isbn);

    if (bookData) {
      console.log('Book found for ISBN:', isbn);
      res.json({ success: true, data: bookData });
    } else {
      console.log('No book found for ISBN:', isbn);
      res.status(404).json({ success: false, error: 'Book not found' });
    }
  } catch (error) {
    console.error('Error searching by ISBN:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/books/upload - Upload book cover and recognize
 */
app.post('/api/books/upload', requireAuth, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file.filename);

    // Optimize and resize the image
    const optimizedPath = path.join(UPLOAD_DIR, 'opt-' + req.file.filename);
    await sharp(req.file.path)
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Try to recognize the book from the cover
    let bookData = null;
    try {
      bookData = await bookRecognition.recognizeBook(req.file.path);
    } catch (error) {
      console.error('Book recognition failed:', error.message);
    }

    if (bookData) {
      // Update cover image path to use the uploaded image
      bookData.cover_image = '/uploads/' + req.file.filename;
      bookData.thumbnail_image = '/uploads/' + req.file.filename;

      // Check if book already exists
      if (bookData.isbn) {
        const exists = await db.bookExistsByISBN(bookData.isbn);
        if (exists) {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);
          if (fs.existsSync(optimizedPath)) fs.unlinkSync(optimizedPath);

          return res.status(409).json({
            success: false,
            error: 'Book already exists in the library',
            data: bookData
          });
        }
      }

      res.json({
        success: true,
        recognized: true,
        data: bookData,
        message: 'Book recognized successfully'
      });
    } else {
      // Return the uploaded image for manual entry
      res.json({
        success: true,
        recognized: false,
        data: {
          cover_image: '/uploads/' + req.file.filename,
          thumbnail_image: '/uploads/' + req.file.filename
        },
        message: 'Could not recognize book. Please enter details manually.'
      });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/books - Add a new book (requires authentication)
 */
app.post('/api/books', requireAuth, async (req, res) => {
  try {
    const bookData = req.body;

    // Validate required fields
    if (!bookData.title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    // Check if book with ISBN already exists
    if (bookData.isbn) {
      const exists = await db.bookExistsByISBN(bookData.isbn);
      if (exists) {
        return res.status(409).json({
          success: false,
          error: 'Book with this ISBN already exists'
        });
      }
    }

    const newBook = await db.addBook(bookData, req.userId);
    res.status(201).json({
      success: true,
      data: newBook,
      message: 'Book added successfully'
    });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/books/:id - Update book
 */
app.put('/api/books/:id', async (req, res) => {
  try {
    const result = await db.updateBook(req.params.id, req.body);
    if (result.changes > 0) {
      const updatedBook = await db.getBookById(req.params.id);
      res.json({
        success: true,
        data: updatedBook,
        message: 'Book updated successfully'
      });
    } else {
      res.status(404).json({ success: false, error: 'Book not found' });
    }
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/books/:id - Delete book (only owner can delete)
 */
app.delete('/api/books/:id', requireAuth, async (req, res) => {
  try {
    // Get book details to check ownership
    const book = await db.getBookById(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Check if user owns this book
    if (book.added_by_user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete books you added'
      });
    }

    const result = await db.deleteBook(req.params.id);

    if (result.changes > 0) {
      // Delete associated image file if it's a local upload
      if (book && book.cover_image && book.cover_image.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, book.cover_image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      res.json({
        success: true,
        message: 'Book deleted successfully'
      });
    } else {
      res.status(404).json({ success: false, error: 'Book not found' });
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/books/complete - Complete partial book data
 */
app.post('/api/books/complete', async (req, res) => {
  try {
    const partialData = req.body;

    if (!partialData || Object.keys(partialData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Partial book data is required'
      });
    }

    console.log('Completing partial book data:', partialData);

    // Try to complete the book data
    const completedData = await bookRecognition.completeBookData(partialData);

    if (completedData && completedData.title) {
      res.json({
        success: true,
        data: completedData,
        message: 'Book data completed successfully'
      });
    } else {
      res.json({
        success: false,
        data: partialData,
        message: 'Could not find additional book information'
      });
    }
  } catch (error) {
    console.error('Error completing book data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stats - Get library statistics
 */
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const totalBooks = await db.getBooksCount();
    res.json({
      success: true,
      data: {
        totalBooks
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Borrowing Routes ====================

/**
 * POST /api/borrowings - Borrow a book
 */
app.post('/api/borrowings', requireAuth, async (req, res) => {
  try {
    const { book_id, due_days } = req.body;

    if (!book_id) {
      return res.status(400).json({
        success: false,
        error: 'Book ID is required'
      });
    }

    const borrowing = await db.borrowBook(book_id, req.userId, due_days || 14);

    res.status(201).json({
      success: true,
      data: borrowing,
      message: 'Book borrowed successfully'
    });
  } catch (error) {
    console.error('Error borrowing book:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/borrowings/return - Return a borrowed book
 */
app.post('/api/borrowings/return', requireAuth, async (req, res) => {
  try {
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({
        success: false,
        error: 'Book ID is required'
      });
    }

    const result = await db.returnBook(book_id, req.userId);

    res.json({
      success: true,
      data: result,
      message: 'Book returned successfully'
    });
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/borrowings/my - Get current user's borrowing history
 */
app.get('/api/borrowings/my', requireAuth, async (req, res) => {
  try {
    const includeReturned = req.query.include_returned === 'true';
    const borrowings = await db.getUserBorrowings(req.userId, includeReturned);

    res.json({
      success: true,
      data: borrowings
    });
  } catch (error) {
    console.error('Error fetching borrowings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/books/:id/borrowings - Get borrowing history for a book
 */
app.get('/api/books/:id/borrowings', async (req, res) => {
  try {
    const borrowings = await db.getBookBorrowings(req.params.id);

    res.json({
      success: true,
      data: borrowings
    });
  } catch (error) {
    console.error('Error fetching book borrowings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ============================================================================
 * ADMIN ROUTES
 * ============================================================================
 */

/**
 * GET /api/admin/users - Get all users (admin only)
 */
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await authService.getAllUsers();

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/users/:id/toggle-status - Enable/Disable user (admin only)
 */
app.put('/api/admin/users/:id/toggle-status', requireAdmin, async (req, res) => {
  try {
    const { is_enabled } = req.body;

    if (is_enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'is_enabled field is required'
      });
    }

    // Prevent admin from disabling themselves
    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot disable your own account'
      });
    }

    await authService.toggleUserStatus(req.params.id, is_enabled);

    res.json({
      success: true,
      message: `User ${is_enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/books - Get all books (admin only)
 */
app.get('/api/admin/books', requireAdmin, async (req, res) => {
  try {
    const books = await db.getAllBooks();

    res.json({
      success: true,
      data: books
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/books/:id - Update book details (admin only)
 */
app.put('/api/admin/books/:id', requireAdmin, async (req, res) => {
  try {
    const bookId = req.params.id;
    const bookData = req.body;

    await db.updateBook(bookId, bookData);

    // Fetch updated book
    const updatedBook = await db.getBookById(bookId);

    res.json({
      success: true,
      data: updatedBook,
      message: 'Book updated successfully'
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/books/:id/owner - Change book owner (admin only)
 */
app.put('/api/admin/books/:id/owner', requireAdmin, [
  body('new_owner_id').isInt().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { new_owner_id } = req.body;

    await db.changeBookOwner(req.params.id, new_owner_id);

    res.json({
      success: true,
      message: 'Book owner changed successfully'
    });
  } catch (error) {
    console.error('Error changing book owner:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/books/:id/borrower - Change book borrower (admin only)
 */
app.put('/api/admin/books/:id/borrower', requireAdmin, [
  body('new_borrower_id').isInt().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { new_borrower_id } = req.body;

    await db.changeBookBorrower(req.params.id, new_borrower_id);

    res.json({
      success: true,
      message: 'Book borrower changed successfully'
    });
  } catch (error) {
    console.error('Error changing book borrower:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/books/:id/cover - Update book cover (admin only)
 */
app.put('/api/admin/books/:id/cover', requireAdmin, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const bookId = req.params.id;
    const coverPath = `/uploads/${req.file.filename}`;

    // Optimize image
    const optimizedPath = path.join(UPLOAD_DIR, 'opt-' + req.file.filename);
    await sharp(req.file.path)
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Update book cover in database
    await db.updateBook(bookId, {
      cover_image: `/uploads/opt-${req.file.filename}`,
      thumbnail_image: coverPath
    });

    const updatedBook = await db.getBookById(bookId);

    res.json({
      success: true,
      data: updatedBook,
      message: 'Cover updated successfully'
    });
  } catch (error) {
    console.error('Error updating cover:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/books/:id - Update book details (owner only)
 */
app.put('/api/books/:id', requireAuth, async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await db.getBookById(bookId);

    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Check if user is owner
    if (book.added_by_user_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only book owner can edit' });
    }

    await db.updateBook(bookId, req.body);
    const updatedBook = await db.getBookById(bookId);

    res.json({
      success: true,
      data: updatedBook,
      message: 'Book updated successfully'
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/books/:id/cover - Update book cover (owner only)
 */
app.put('/api/books/:id/cover', requireAuth, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const bookId = req.params.id;
    const book = await db.getBookById(bookId);

    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Check if user is owner
    if (book.added_by_user_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only book owner can update cover' });
    }

    const coverPath = `/uploads/${req.file.filename}`;

    // Optimize image
    const optimizedPath = path.join(UPLOAD_DIR, 'opt-' + req.file.filename);
    await sharp(req.file.path)
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Update book cover in database
    await db.updateBook(bookId, {
      cover_image: `/uploads/opt-${req.file.filename}`,
      thumbnail_image: coverPath
    });

    const updatedBook = await db.getBookById(bookId);

    res.json({
      success: true,
      data: updatedBook,
      message: 'Cover updated successfully'
    });
  } catch (error) {
    console.error('Error updating cover:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server with HTTPS support
const USE_SSL = process.env.USE_SSL === 'true';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || './ssl/server.key';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || './ssl/server.cert';
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

if (USE_SSL) {
  // Check if SSL certificates exist
  if (!fs.existsSync(SSL_KEY_PATH) || !fs.existsSync(SSL_CERT_PATH)) {
    console.error('❌ SSL certificates not found!');
    console.error(`   Key: ${SSL_KEY_PATH}`);
    console.error(`   Cert: ${SSL_CERT_PATH}`);
    console.error('\nTo generate self-signed certificates, run:');
    console.error('openssl req -nodes -new -x509 -days 365 -keyout ssl/server.key -out ssl/server.cert\n');
    process.exit(1);
  }

  // Load SSL certificates
  const sslOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH)
  };

  // Create HTTPS server
  const httpsServer = https.createServer(sslOptions, app);

  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`\n🔒 Biblioteca Virtual HTTPS server running on https://localhost:${HTTPS_PORT}`);
    console.log(`📚 API available at https://localhost:${HTTPS_PORT}/api`);
    console.log(`🌐 Web interface at https://localhost:${HTTPS_PORT}\n`);
  });

  // Optionally also start HTTP server that redirects to HTTPS
  if (process.env.HTTP_REDIRECT === 'true') {
    const httpApp = express();
    httpApp.use((req, res) => {
      res.redirect(301, `https://${req.headers.host.split(':')[0]}:${HTTPS_PORT}${req.url}`);
    });

    httpApp.listen(PORT, () => {
      console.log(`🔀 HTTP redirect server running on http://localhost:${PORT} → https://localhost:${HTTPS_PORT}\n`);
    });
  }
} else {
  // Start HTTP server (default)
  const httpServer = http.createServer(app);

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Biblioteca Virtual server running on http://localhost:${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Web interface at http://localhost:${PORT}\n`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});
