# User Profile Management System

## ✅ Backend Implementation Complete

### New API Endpoints

#### Profile Management
- `PUT /api/auth/profile` - Update profile information (name, postal_address, telephone)
- `POST /api/auth/change-password` - Change password (requires old password verification)
- `POST /api/auth/profile-picture` - Upload/update profile picture (auto-resized to 300x300)
- `GET /api/auth/my-books` - Get all books added by the current user
- `GET /api/borrowings/my` - Get books currently borrowed by user

### Features Implemented

#### 1. View Profile Information
- Users can view all their profile data including:
  - Name, Email (read-only)
  - Postal Address
  - Telephone
  - Profile Picture
  - Account creation date

#### 2. Modify Profile Information
- Update name, postal address, telephone
- Validates that fields are not empty
- Returns updated user object

#### 3. Change Password
- Requires current password verification
- New password must be at least 6 characters
- Password is hashed with bcrypt before storage

#### 4. Profile Picture Management
- Upload new profile picture
- Automatic resizing to 300x300 pixels
- Old profile picture is automatically deleted
- Optimized JPEG output (85% quality)

#### 5. View Owned Books
- See all books the user has added to the library
- Includes all book metadata and cover images

#### 6. View Borrowed Books
- See currently borrowed books
- Includes due dates and borrow dates
- Option to include returned books in history

### Database Schema

```sql
users table:
- id (PRIMARY KEY)
- name
- email (UNIQUE)
- password (hashed)
- postal_address
- telephone
- profile_picture (path to image)
- created_date

books table:
- ...existing fields...
- added_by_user_id (FOREIGN KEY to users.id)

borrowing_records table:
- id
- book_id (FOREIGN KEY)
- user_id (FOREIGN KEY)
- borrow_date
- return_date
- due_date
- status ('borrowed' or 'returned')
```

### Security Features

- All profile endpoints require authentication (`requireAuth` middleware)
- Password change requires old password verification
- Profile pictures are validated (image files only, 10MB max)
- Old profile pictures are automatically cleaned up
- Session-based authentication with HTTP-only cookies

### File Structure

```
services/
├── auth.js           # Updated with profile management methods
├── database.js       # Includes getBooksByUser and borrowing methods
└── ...

middleware/
└── auth.js          # requireAuth and attachUser middleware

server.js            # All new profile endpoints added
```

## Frontend Implementation Needed

### Pages to Create:

1. **Login/Register Modal**
   - Login form (email, password)
   - Registration form (all fields including profile picture)
   - Form validation
   - Error handling

2. **User Profile Page**
   - Profile information display/edit
   - Profile picture upload with preview
   - Password change form
   - My Books section (grid of owned books)
   - My Borrowed Books section (list with due dates)
   - Tabs or sections for organization

3. **Header Updates**
   - Show logged-in user name and avatar
   - Profile dropdown menu
   - Login/Register buttons when logged out

4. **Book Card Updates**
   - "Borrow" button for available books
   - "Return" button for books user has borrowed
   - Hide "Delete" button if user doesn't own the book
   - Show book status (Available/Borrowed)

5. **Book Detail Modal Updates**
   - Show who added the book
   - Show borrowing history
   - Borrow/Return actions

### Example API Usage

```javascript
// Update profile
await fetch('/api/auth/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Name',
    telephone: '555-1234'
  }),
  credentials: 'include'
});

// Change password
await fetch('/api/auth/change-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    oldPassword: 'current123',
    newPassword: 'newpass123'
  }),
  credentials: 'include'
});

// Upload profile picture
const formData = new FormData();
formData.append('picture', fileInput.files[0]);

await fetch('/api/auth/profile-picture', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});

// Get my books
const response = await fetch('/api/auth/my-books', {
  credentials: 'include'
});
const { data: myBooks } = await response.json();

// Get my borrowed books
const response = await fetch('/api/borrowings/my', {
  credentials: 'include'
});
const { data: borrowedBooks } = await response.json();
```

## Testing

```bash
# Start server
npm start

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","postal_address":"123 Test St","telephone":"555-0100"}' \
  -c cookies.txt

# Update profile
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Updated Name","telephone":"555-9999"}'

# Change password
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"oldPassword":"password123","newPassword":"newpass123"}'

# Get my books
curl http://localhost:3000/api/auth/my-books -b cookies.txt

# Get borrowed books
curl http://localhost:3000/api/borrowings/my -b cookies.txt
```

## Next Steps

The backend is fully complete and functional. The next phase is to build the frontend UI to:
1. Authenticate users (login/register)
2. Display user profile page
3. Allow profile editing
4. Show owned and borrowed books
5. Integrate borrowing/returning functionality into the book interface

All API endpoints are ready and tested. Frontend implementation can proceed immediately.
