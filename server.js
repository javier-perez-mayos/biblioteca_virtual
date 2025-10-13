require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const db = require('./services/database');
const bookRecognition = require('./services/bookRecognition');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// ==================== API Routes ====================

/**
 * GET /api/books - Get all books
 */
app.get('/api/books', async (req, res) => {
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
app.get('/api/books/search', async (req, res) => {
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
app.get('/api/books/:id', async (req, res) => {
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
 * POST /api/books/upload - Upload book cover and recognize
 */
app.post('/api/books/upload', upload.single('cover'), async (req, res) => {
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
 * POST /api/books - Add a new book
 */
app.post('/api/books', async (req, res) => {
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

    const newBook = await db.addBook(bookData);
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
 * DELETE /api/books/:id - Delete book
 */
app.delete('/api/books/:id', async (req, res) => {
  try {
    // Get book details to delete associated image
    const book = await db.getBookById(req.params.id);

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
app.get('/api/stats', async (req, res) => {
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Biblioteca Virtual server running on http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Web interface at http://localhost:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});
