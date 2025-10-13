# 📚 Biblioteca Virtual

A modern web application for managing an online library with automatic book recognition from cover images.

## Features

### Book Management
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
- **📷 Camera Support**: Use your device camera to capture book covers

### User System
- **👤 User Registration**: Full registration with name, email, postal address, and telephone
- **🔐 Authentication**: Secure login with bcrypt password hashing and session management
- **📝 Profile Management**: Users can update their profile, change password, and upload profile pictures
- **📚 Book Ownership**: Track which user added each book to the library
- **📖 Borrowing System**: Users can borrow and return books with due date tracking
- **📊 Personal Dashboard**: View your added books and borrowed books

### Administrator Features
- **👨‍💼 Admin Panel**: Special administrator account with elevated privileges
- **👥 User Management**: View all registered users and enable/disable accounts
- **📚 Full Book Control**: Modify any book details, change ownership, transfer borrowings
- **🔄 Borrowing Management**: Transfer active borrowings between users
- **🛡️ Protected Routes**: Admin-only endpoints secured with middleware

### Technical Features
- **💾 Local Storage**: All data stored in SQLite database
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🔒 Security**: Password hashing, session management, role-based access control

## Technology Stack

### Backend
- Node.js + Express
- SQLite3 for database
- Bcrypt for password hashing
- Express-session for session management
- Express-validator for input validation
- Tesseract.js for OCR text extraction
- Google Vision API for advanced image recognition (optional)
- Sharp for image processing (book covers and profile pictures)
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

3. **Configure environment variables**:

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` and set at minimum:
```bash
ADMIN_PASSWORD=your_secure_password_here
```

4. **Initialize the database**:
```bash
npm run init-db
```

5. **Create the administrator account**:
```bash
node scripts/add-admin.js
```

This creates an admin user with:
- Email: `biblioteca@casalmunic.de`
- Password: From `ADMIN_PASSWORD` environment variable

6. **(Optional but Recommended) Configure API keys**:

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

6. **Configure session secret** (important for production):

   Edit `.env` and change the SESSION_SECRET:
   ```env
   SESSION_SECRET=your_secure_random_secret_here
   ```

7. **Start the server**:
```bash
npm start
```

8. **Open your browser**:
   Navigate to http://localhost:3000

## Usage

### User Registration and Login

1. Click **"Registrarse"** in the header
2. Fill in all required fields:
   - Name
   - Email
   - Password (minimum 6 characters)
   - Postal address
   - Telephone
3. After registration, you'll be automatically logged in
4. Existing users can click **"Iniciar Sesión"** to log in

### User Profile

Access your profile by clicking on your avatar/name in the header:

- **Información**: View and edit your profile details
- **Cambiar Contraseña**: Change your password (requires old password)
- **Mis Libros**: See all books you've added to the library
- **Libros Prestados**: View books you're currently borrowing with due dates

### Adding a Book (Requires Login)

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
- **Borrow books**: Click "Prestar Libro" to borrow available books (14-day loan period)
- **Delete books**: Only the user who added the book can delete it

### Borrowing Books

1. Find an available book in the catalog
2. Click on the book to view details
3. Click **"Prestar Libro"** to borrow it
4. The book is now in your "Libros Prestados" list with a due date
5. Return the book from your profile when done

### Managing Your Library

- Books are displayed in a visual grid sorted by date added (newest first)
- The statistics bar shows your total book count
- All data is stored locally in SQLite
- **Book status badges**: Books show "Disponible" or "Prestado" status
- **Overdue tracking**: Borrowed books past their due date are highlighted in red

### Administrator Access

Login with the admin account to access additional features:

**User Management:**
- View all registered users
- Enable or disable user accounts
- Disabled users cannot login

**Book Management:**
- Edit any book details
- Change book ownership (transfer to another user)
- Transfer active borrowings between users

**Admin Endpoints** (API access only):
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/toggle-status` - Enable/disable user
- `GET /api/admin/books` - List all books
- `PUT /api/admin/books/:id` - Update book details
- `PUT /api/admin/books/:id/owner` - Change book owner
- `PUT /api/admin/books/:id/borrower` - Transfer borrowing

## Project Structure

```
biblioteca_virtual/
├── public/              # Frontend files
│   ├── index.html      # Main HTML page with auth UI
│   ├── styles.css      # Styles including profile components
│   └── app.js          # Frontend JavaScript with auth logic
├── services/           # Backend services
│   ├── database.js     # Database operations + admin functions
│   ├── bookRecognition.js  # Multi-method book recognition
│   ├── imageSearch.js  # Image search and data completion
│   └── auth.js         # Authentication service
├── middleware/         # Express middleware
│   └── auth.js        # Authentication & authorization middleware
├── scripts/            # Utility scripts
│   ├── init-db.js     # Database initialization
│   └── add-admin.js   # Create administrator account
├── uploads/            # Uploaded images (covers & profiles)
├── server.js           # Express server with all routes
├── package.json        # Dependencies
├── .env               # Environment variables
└── database.db        # SQLite database (created automatically)
```

## API Endpoints

### Books (Public)
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `GET /api/books/search?q=query` - Search books
- `GET /api/stats` - Get library statistics
- `GET /api/books/:id/borrowings` - Get borrowing history for a book

### Books (Authenticated)
- `POST /api/books` - Add new book (requires login)
- `POST /api/books/upload` - Upload and recognize book cover (requires login)
- `POST /api/books/complete` - Complete partial book data (requires login)
- `DELETE /api/books/:id` - Delete book (requires login + ownership)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (requires login)
- `PUT /api/auth/profile` - Update profile (requires login)
- `POST /api/auth/change-password` - Change password (requires login)
- `POST /api/auth/profile-picture` - Upload profile picture (requires login)
- `GET /api/auth/my-books` - Get books added by user (requires login)

### Borrowing (Authenticated)
- `POST /api/borrowings` - Borrow a book (requires login)
- `POST /api/borrowings/return` - Return a book (requires login)
- `GET /api/borrowings/my` - Get user's borrowed books (requires login)

### Admin (Admin Only)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/toggle-status` - Enable/disable user
- `GET /api/admin/books` - Get all books (admin view)
- `PUT /api/admin/books/:id` - Update any book details
- `PUT /api/admin/books/:id/owner` - Change book owner
- `PUT /api/admin/books/:id/borrower` - Change book borrower

## Configuration

Edit the `.env` file to customize:

```env
PORT=3000                           # Server port
DB_PATH=./database.db               # Database file path
UPLOAD_DIR=./uploads                # Upload directory
SESSION_SECRET=change_this_secret   # Session secret (CHANGE IN PRODUCTION!)
GOOGLE_BOOKS_API_KEY=               # Google Books API key (optional)
GOOGLE_VISION_API_KEY=              # Google Vision API key (optional)
GOOGLE_APPLICATION_CREDENTIALS=     # Path to Vision API credentials (optional)
```

### Database Schema

**users** table:
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - Bcrypt hashed password
- `postal_address` - User's postal address
- `telephone` - User's telephone number
- `profile_picture` - Path to profile picture (optional)
- `is_admin` - Admin flag (1 for admin, 0 for regular user)
- `is_enabled` - Account status (1 for enabled, 0 for disabled)
- `created_date` - Registration timestamp

**books** table:
- `id` - Primary key
- `title`, `author`, `isbn`, `publisher`, etc. - Book metadata
- `status` - 'available' or 'borrowed'
- `added_by_user_id` - Foreign key to users (book owner)
- `cover_image`, `thumbnail_image` - Image paths

**borrowing_records** table:
- `id` - Primary key
- `book_id` - Foreign key to books
- `user_id` - Foreign key to users
- `borrow_date` - When book was borrowed
- `due_date` - When book should be returned (14 days default)
- `return_date` - When book was actually returned (NULL if not returned)
- `status` - 'borrowed' or 'returned'

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

### Authentication Issues
- **"User account is disabled"**: Your account has been disabled by an administrator
- **Session expired**: Login again to continue
- **Cannot delete book**: Only the user who added the book can delete it
- **Cannot access admin features**: Admin endpoints require administrator privileges

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
- Run `npm run init-db` to reset the database (WARNING: deletes all data)
- To add admin fields to existing database: `node scripts/add-admin.js`
- Check file permissions on `database.db`

### Borrowing Issues
- **Book already borrowed**: Wait for it to be returned or contact admin
- **Cannot borrow**: Make sure you're logged in
- Books are automatically due 14 days after borrowing

## Security Considerations

### Production Deployment
- **Change SESSION_SECRET**: Use a strong random string in production
- **Use HTTPS**: Required for secure cookies and camera access
- **Database backups**: Regularly backup `database.db`
- **File permissions**: Restrict access to database and uploads directory
- **Password policy**: Current minimum is 6 characters (consider increasing)

### Current Security Features
- ✅ Bcrypt password hashing (10 rounds)
- ✅ HTTP-only session cookies
- ✅ Input validation on all endpoints
- ✅ Role-based access control (user/admin)
- ✅ Ownership verification for deletions
- ✅ Protected admin routes

## Future Enhancements

Completed features (marked with ✅):
- ✅ User authentication and multiple libraries
- ✅ Book borrowing/lending system
- ✅ User profiles with pictures
- ✅ Administrator panel

Potential future additions:
- Admin frontend UI (currently API-only)
- Export library to CSV/JSON
- Bulk import from ISBN list
- Book recommendations
- Categories and tags management
- Advanced filtering and sorting
- Reading lists and collections
- Integration with more book APIs
- Email notifications for due dates
- Book reservations queue
- Reading statistics and history

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please check:
- The troubleshooting section above
- Console logs for error details
- Server logs for backend errors
