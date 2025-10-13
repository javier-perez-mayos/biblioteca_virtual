# Authentication & Borrowing System Implementation

## Backend Changes Complete ✅

### 1. Database Schema Updated
- **Users table**: name, email, password (hashed), postal_address, telephone
- **Books table**: Added `added_by_user_id` for ownership tracking
- **Borrowing records**: Tracks book borrowing with due dates and return status

### 2. New Services Created
- `services/auth.js`: User registration, login, profile management
- `middleware/auth.js`: Authentication middleware for protected routes

### 3. API Endpoints Added

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

#### Borrowing
- `POST /api/borrowings` - Borrow a book
- `POST /api/borrowings/return` - Return a book
- `GET /api/borrowings/my` - Get user's borrowed books
- `GET /api/books/:id/borrowings` - Get borrowing history for a book

### 4. Updated Endpoints with Authentication
- `POST /api/books` - Now requires login
- `POST /api/books/upload` - Now requires login
- `DELETE /api/books/:id` - Only owner can delete

### 5. Dependencies Installed
- `bcrypt` - Password hashing
- `express-session` - Session management
- `express-validator` - Input validation

## Business Rules Implemented

1. **Registration**: Users must provide name, email, password, postal address, and telephone
2. **Book Addition**: Only logged-in users can add books
3. **Book Deletion**: Users can only delete books they added
4. **Borrowing**:
   - Only available books can be borrowed
   - Default borrowing period: 14 days
   - Books marked as "borrowed" when checked out
   - Return sets book back to "available"

## Frontend Implementation Needed

### To Complete:
1. Registration/Login forms
2. User session handling
3. Show user info in header
4. Add "Borrow" button for available books
5. Add "Return" button for borrowed books
6. Show user's borrowed books
7. Hide delete button for books not owned by user
8. Require login before adding books

### Files to Modify:
- `public/index.html` - Add login/register modals
- `public/app.js` - Add auth functions and UI updates
- `public/styles.css` - Style auth forms and borrowing UI

## Testing the Backend

```bash
# Start server
npm start

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","postal_address":"123 Main St","telephone":"555-0100"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' \
  -c cookies.txt

# Add a book (requires login)
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Test Book","author":"Test Author"}'

# Borrow a book
curl -X POST http://localhost:3000/api/borrowings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"book_id":1}'
```

## Security Features

- Passwords are hashed with bcrypt (10 rounds)
- Session-based authentication
- HTTP-only cookies
- Input validation on all endpoints
- Ownership checks before deletions
- Book availability checks before borrowing

## Next Steps

Frontend implementation is required to complete the user-facing features. The backend is fully functional and ready to support all authentication and borrowing operations.
