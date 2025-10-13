# 📚 Biblioteca Virtual

A modern web application for managing an online library with automatic book recognition from cover images.

## Features

- **📸 Advanced Book Recognition**: Multiple recognition methods for maximum accuracy
  - Google Vision API for image-based search
  - OCR (Tesseract.js) for text extraction from covers
  - ISBN detection and lookup
  - Title/author extraction and matching
- **✍️ Manual Entry with Auto-Complete**: Enter just the title or ISBN, and auto-complete the rest
- **🤖 Automatic Metadata**: Automatically fetches book information from Google Books API
- **🔍 Search & Filter**: Search books by title, author, ISBN, or categories
- **🎨 Visual Catalog**: Beautiful grid layout displaying book covers
- **📖 Detailed View**: View complete book information including description, publisher, and more
- **💾 Local Storage**: All data stored in SQLite database
- **📱 Responsive Design**: Works on desktop and mobile devices
- **📷 Camera Support**: Use your device camera to capture book covers

## Technology Stack

### Backend
- Node.js + Express
- SQLite3 for database
- Tesseract.js for OCR text extraction
- Google Vision API for advanced image recognition (optional)
- Sharp for image processing
- Google Books API for book metadata
- Cheerio for web scraping fallback
- Multer for file uploads

### Frontend
- Vanilla JavaScript
- Modern CSS with Grid and Flexbox
- Native Web APIs (Camera, File Upload)

## Installation

1. **Clone or download the project**:
```bash
cd biblioteca_virtual
```

2. **Install dependencies**:
```bash
npm install
```

3. **Initialize the database**:
```bash
npm run init-db
```

4. **(Optional but Recommended) Configure API keys**:

   **Google Books API** (recommended for better metadata):
   - Visit: https://developers.google.com/books/docs/v1/using#APIKey
   - Create a project and enable Books API
   - Add to `.env`:
   ```
   GOOGLE_BOOKS_API_KEY=your_api_key_here
   ```

   **Google Vision API** (optional, for advanced image recognition):
   - Visit: https://cloud.google.com/vision/docs/setup
   - Create a project and enable Vision API
   - Create a service account and download credentials JSON
   - Add to `.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
   GOOGLE_VISION_API_KEY=your_vision_api_key
   ```

   Note: The app works without API keys using free tiers and fallback methods, but recognition accuracy improves with Vision API.

5. **Start the server**:
```bash
npm start
```

6. **Open your browser**:
   Navigate to http://localhost:3000

## Usage

### Adding a Book

1. Click the **"+ Agregar Libro"** button
2. Choose one of three options:

   **Option A: Image Recognition (Recommended)**
   - **📷 Tomar Foto**: Use your device camera to capture the book cover
   - **📁 Subir Archivo**: Upload an image file from your device
   - The app will automatically:
     1. Try Google Vision API for image-based recognition (if configured)
     2. Use OCR to extract text from the cover
     3. Detect ISBN from the extracted text
     4. Search Google Books API for complete metadata

   **Option B: Manual Entry with Auto-Complete**
   - **✍️ Entrada Manual**: Enter book details manually
   - Enter at least one field (title, author, or ISBN)
   - Click **"🔍 Autocompletar Datos"** to automatically fill missing information
   - The system will search Google Books and complete all available fields

3. Review and edit the book information if needed
4. Click **"Guardar Libro"** to add it to your library

### Searching Books

- Use the search box in the header to find books
- Search works across title, author, ISBN, and categories
- Results update in real-time

### Viewing Book Details

- Click on any book card to view full details
- See cover image, description, metadata, and more
- Option to delete books from the detail view

### Managing Your Library

- Books are displayed in a visual grid sorted by date added (newest first)
- The statistics bar shows your total book count
- All data is stored locally in SQLite

## Project Structure

```
biblioteca_virtual/
├── public/              # Frontend files
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Styles
│   └── app.js          # Frontend JavaScript
├── services/           # Backend services
│   ├── database.js     # Database operations
│   ├── bookRecognition.js  # Multi-method book recognition
│   └── imageSearch.js  # Image search and data completion
├── scripts/            # Utility scripts
│   └── init-db.js     # Database initialization
├── uploads/            # Uploaded cover images (created automatically)
├── server.js           # Express server
├── package.json        # Dependencies
├── .env               # Environment variables
└── database.db        # SQLite database (created automatically)
```

## API Endpoints

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `GET /api/books/search?q=query` - Search books
- `POST /api/books` - Add new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Upload & Recognition
- `POST /api/books/upload` - Upload and recognize book cover
- `POST /api/books/complete` - Complete partial book data

### Stats
- `GET /api/stats` - Get library statistics

## Configuration

Edit the `.env` file to customize:

```env
PORT=3000                           # Server port
DB_PATH=./database.db               # Database file path
UPLOAD_DIR=./uploads                # Upload directory
GOOGLE_BOOKS_API_KEY=               # Google Books API key (optional)
GOOGLE_VISION_API_KEY=              # Google Vision API key (optional)
GOOGLE_APPLICATION_CREDENTIALS=     # Path to Vision API credentials (optional)
```

## Development

To run in development mode with auto-reload:

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

## Tips

### Better Book Recognition
- **For best results with images:**
  - Take clear photos with good lighting
  - Ensure the book cover is flat and fully visible
  - Center the cover in the frame
  - Avoid shadows and reflections
  - Enable Google Vision API for significantly better accuracy
- **For manual entry:**
  - Enter as much information as you have
  - Use the "Autocompletar Datos" button to fill missing fields
  - Even just the title or ISBN is usually enough

### Using without Camera
- If camera access is denied or unavailable, use the file upload option
- Works with JPEG, PNG, GIF, and WebP images
- Maximum file size: 10MB

### Recognition Methods Priority
The app tries multiple methods in this order:
1. **Google Vision API** (if configured) - Most accurate for image recognition
2. **OCR + ISBN lookup** - Good for covers with visible ISBN
3. **OCR + Title/Author matching** - Fallback for books without ISBN
4. **Manual entry + Auto-complete** - User provides partial data, system fills the rest

## Troubleshooting

### Camera not working
- Ensure browser has camera permissions
- HTTPS is required for camera access (except on localhost)
- Try using the file upload option instead

### Book not recognized
- Try a clearer photo of the cover
- Ensure the ISBN is visible on the cover
- Consider enabling Google Vision API for better recognition
- Use manual entry with the "Autocompletar" button as alternative
- Enter just the title or ISBN and let the system find the rest

### Database errors
- Run `npm run init-db` to reset the database
- Check file permissions on `database.db`

## Future Enhancements

- User authentication and multiple libraries
- Book borrowing/lending system
- Export library to CSV/JSON
- Bulk import from ISBN list
- Book recommendations
- Categories and tags management
- Advanced filtering and sorting
- Reading lists and collections
- Integration with more book APIs

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please check:
- The troubleshooting section above
- Console logs for error details
- Server logs for backend errors
