# 📚 Biblioteca Virtual

A modern web application for managing an online library with automatic book recognition from cover images.

## Features

- **📸 Book Recognition**: Add books by taking a photo of the cover or uploading an image
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
- Tesseract.js for OCR
- Sharp for image processing
- Google Books API for book metadata
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

4. **(Optional) Get a Google Books API key**:
   - Visit: https://developers.google.com/books/docs/v1/using#APIKey
   - Create a project and enable Books API
   - Copy your API key to `.env` file:
   ```
   GOOGLE_BOOKS_API_KEY=your_api_key_here
   ```
   Note: The app works without an API key, but may have rate limits.

5. **Start the server**:
```bash
npm start
```

6. **Open your browser**:
   Navigate to http://localhost:3000

## Usage

### Adding a Book

1. Click the **"+ Agregar Libro"** button
2. Choose one of two options:
   - **📷 Tomar Foto**: Use your device camera to capture the book cover
   - **📁 Subir Archivo**: Upload an image file from your device
3. The app will automatically:
   - Extract text from the cover using OCR
   - Search for ISBN or book title
   - Fetch complete book information from Google Books
4. Review and edit the book information if needed
5. Click **"Guardar Libro"** to add it to your library

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
│   └── bookRecognition.js  # OCR and book recognition
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

### Upload
- `POST /api/books/upload` - Upload and recognize book cover

### Stats
- `GET /api/stats` - Get library statistics

## Configuration

Edit the `.env` file to customize:

```env
PORT=3000                    # Server port
DB_PATH=./database.db        # Database file path
UPLOAD_DIR=./uploads         # Upload directory
GOOGLE_BOOKS_API_KEY=        # Google Books API key (optional)
```

## Development

To run in development mode with auto-reload:

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

## Tips

### Better Book Recognition
- Take clear photos with good lighting
- Ensure the book cover is flat and fully visible
- Center the cover in the frame
- Avoid shadows and reflections

### Using without Camera
- If camera access is denied or unavailable, use the file upload option
- Works with JPEG, PNG, GIF, and WebP images
- Maximum file size: 10MB

### Manual Entry
- If automatic recognition fails, you can manually enter book details
- Only the title is required - all other fields are optional
- You can always edit book information later

## Troubleshooting

### Camera not working
- Ensure browser has camera permissions
- HTTPS is required for camera access (except on localhost)
- Try using the file upload option instead

### Book not recognized
- Try a clearer photo of the cover
- Ensure the ISBN is visible on the cover
- Use manual entry if automatic recognition fails

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
