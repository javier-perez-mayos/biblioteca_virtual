// Global state
let currentBooks = [];
let cameraStream = null;
let currentUser = null;

// API Base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeLanguage();
  checkAuthStatus();
  initializeEventListeners();
});

// Event Listeners
function initializeEventListeners() {
  // Search
  document.getElementById('searchBtn').addEventListener('click', handleSearch);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Auth buttons
  document.getElementById('loginBtn')?.addEventListener('click', openLoginModal);
  document.getElementById('registerBtn')?.addEventListener('click', openRegisterModal);
  document.getElementById('logoutLink')?.addEventListener('click', handleLogout);

  // User dropdown
  document.getElementById('userButton')?.addEventListener('click', toggleUserDropdown);
  document.getElementById('profileLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openProfileModal();
  });
  document.getElementById('myBooksLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openProfileModal('my-books');
  });
  document.getElementById('borrowedBooksLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openProfileModal('borrowed');
  });

  // Auth forms
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);

  // Profile forms
  document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
  document.getElementById('passwordForm')?.addEventListener('submit', handlePasswordChange);
  document.getElementById('profilePictureInput')?.addEventListener('change', handleProfilePictureUpload);

  // Profile tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchProfileTab(btn.dataset.tab));
  });

  // Add book modal
  const addBookBtn = document.getElementById('addBookBtn');
  if (addBookBtn) {
    addBookBtn.addEventListener('click', openAddBookModal);
  }

  document.getElementById('takePictureBtn').addEventListener('click', startCamera);
  document.getElementById('uploadFileBtn').addEventListener('click', () => {
    document.getElementById('coverInput').click();
  });
  document.getElementById('manualEntryBtn').addEventListener('click', showManualEntryForm);
  document.getElementById('coverInput').addEventListener('change', handleFileUpload);
  document.getElementById('captureBtn').addEventListener('click', capturePhoto);
  document.getElementById('cancelCameraBtn').addEventListener('click', stopCamera);
  document.getElementById('autoCompleteBtn').addEventListener('click', autoCompleteBookData);

  // Book form
  document.getElementById('bookForm').addEventListener('submit', handleBookSubmit);

  // Language selector
  document.getElementById('langButton')?.addEventListener('click', toggleLanguageDropdown);
  document.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = e.currentTarget.dataset.lang;
      setLanguage(lang);
      document.querySelector('.language-selector').classList.remove('active');
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    const userDropdown = document.querySelector('.user-dropdown');
    if (userDropdown && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove('active');
    }

    const langSelector = document.querySelector('.language-selector');
    if (langSelector && !langSelector.contains(e.target)) {
      langSelector.classList.remove('active');
    }
  });
}

// ==================== Language ====================

function initializeLanguage() {
  // Initialize flag SVGs
  document.getElementById('flag-en').innerHTML = getFlagSVG('en');
  document.getElementById('flag-de').innerHTML = getFlagSVG('de');
  document.getElementById('flag-ca').innerHTML = getFlagSVG('ca');
  document.getElementById('currentFlag').innerHTML = getFlagSVG(getCurrentLanguage());

  // Apply translations
  updateUILanguage();
}

function toggleLanguageDropdown(e) {
  e.stopPropagation();
  document.querySelector('.language-selector').classList.toggle('active');
}

function updateUILanguage() {
  // Update document language attribute
  document.documentElement.lang = currentLanguage;

  // Update page title
  document.title = t('appTitle');

  // Update current flag
  document.getElementById('currentFlag').innerHTML = getFlagSVG(currentLanguage);

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = t(key);
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = t(key);
  });

  // Reload books and stats to update dynamic content
  if (currentBooks.length > 0) {
    renderBooks(currentBooks);
  }
}

// ==================== Authentication ====================

async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include'
    });

    if (response.ok) {
      const result = await response.json();
      currentUser = result.data;
      updateUIForAuth(true);
      // Load books only if authenticated
      loadBooks();
      loadStats();
    } else {
      currentUser = null;
      updateUIForAuth(false);
      // Show login required state
      showLoginRequired();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    currentUser = null;
    updateUIForAuth(false);
    // Show login required state
    showLoginRequired();
  }
}

function updateUIForAuth(isAuthenticated) {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');

  if (isAuthenticated && currentUser) {
    authButtons.style.display = 'none';
    userMenu.style.display = 'flex';

    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    const userAvatar = document.getElementById('userAvatar');

    if (currentUser.profile_picture) {
      userAvatar.src = currentUser.profile_picture;
      userAvatar.style.display = 'block';
    } else {
      userAvatar.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';
      userAvatar.style.display = 'block';
    }
  } else {
    authButtons.style.display = 'flex';
    userMenu.style.display = 'none';
  }
}

function toggleUserDropdown(e) {
  e.stopPropagation();
  const dropdown = document.querySelector('.user-dropdown');
  dropdown.classList.toggle('active');
}

// Login Modal
function openLoginModal() {
  document.getElementById('loginModal').classList.add('active');
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('loginForm').reset();
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('active');
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.success) {
      currentUser = result.data;
      closeLoginModal();
      updateUIForAuth(true);
      loadBooks();
    } else {
      showError(result.error || t('errorLogin'), 'loginError');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError(t('connectionError'), 'loginError');
  }
}

// Register Modal
function openRegisterModal() {
  document.getElementById('registerModal').classList.add('active');
  document.getElementById('registerError').style.display = 'none';
  document.getElementById('registerForm').reset();
}

function closeRegisterModal() {
  document.getElementById('registerModal').classList.remove('active');
}

async function handleRegister(e) {
  e.preventDefault();

  const password = document.getElementById('regPassword').value;
  const passwordConfirm = document.getElementById('regPasswordConfirm').value;

  if (password !== passwordConfirm) {
    showError(t('passwordMismatch'), 'registerError');
    return;
  }

  const userData = {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    password: password,
    postal_address: document.getElementById('regAddress').value,
    telephone: document.getElementById('regPhone').value
  };

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (result.success) {
      currentUser = result.data;
      closeRegisterModal();
      updateUIForAuth(true);
      loadBooks();
    } else {
      const errorMsg = result.errors ? result.errors.map(e => e.msg).join(', ') : result.error;
      showError(errorMsg || t('errorRegister'), 'registerError');
    }
  } catch (error) {
    console.error('Register error:', error);
    showError(t('connectionError'), 'registerError');
  }
}

// Logout
async function handleLogout(e) {
  e.preventDefault();

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    currentUser = null;
    updateUIForAuth(false);
    loadBooks();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ==================== Profile Management ====================

function openProfileModal(tab = 'info') {
  document.getElementById('profileModal').classList.add('active');
  switchProfileTab(tab);
  loadProfileData();
}

function closeProfileModal() {
  document.getElementById('profileModal').classList.remove('active');
}

function switchProfileTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });

  // Load data for specific tabs
  if (tabName === 'my-books') {
    loadMyBooks();
  } else if (tabName === 'borrowed') {
    loadBorrowedBooks();
  }
}

async function loadProfileData() {
  if (!currentUser) return;

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include'
    });

    const result = await response.json();

    if (result.success) {
      const user = result.data;

      document.getElementById('profileName').value = user.name;
      document.getElementById('profileEmail').value = user.email;
      document.getElementById('profileAddress').value = user.postal_address;
      document.getElementById('profilePhone').value = user.telephone;

      const preview = document.getElementById('profilePicturePreview');
      if (user.profile_picture) {
        preview.src = user.profile_picture;
      } else {
        preview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  const userData = {
    name: document.getElementById('profileName').value,
    postal_address: document.getElementById('profileAddress').value,
    telephone: document.getElementById('profilePhone').value
  };

  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (result.success) {
      currentUser = result.data;
      updateUIForAuth(true);
      showStatusMessage(t('profileUpdated'), 'success', 'profileUpdateStatus');
    } else {
      showStatusMessage(result.error || t('errorUpdatingProfile'), 'error', 'profileUpdateStatus');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    showStatusMessage(t('connectionError'), 'error', 'profileUpdateStatus');
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword !== confirmPassword) {
    showStatusMessage(t('newPasswordMismatch'), 'error', 'passwordChangeStatus');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        oldPassword: document.getElementById('currentPassword').value,
        newPassword: newPassword
      })
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById('passwordForm').reset();
      showStatusMessage(t('passwordChanged'), 'success', 'passwordChangeStatus');
    } else {
      showStatusMessage(result.error || t('errorChangingPassword'), 'error', 'passwordChangeStatus');
    }
  } catch (error) {
    console.error('Password change error:', error);
    showStatusMessage(t('connectionError'), 'error', 'passwordChangeStatus');
  }
}

async function handleProfilePictureUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('picture', file);

  try {
    const response = await fetch(`${API_BASE}/auth/profile-picture`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById('profilePicturePreview').src = result.data.profile_picture;
      document.getElementById('userAvatar').src = result.data.profile_picture;
      // Profile picture updated successfully
    } else {
      showError(result.error || t('errorUploadingPhoto'));
    }
  } catch (error) {
    console.error('Profile picture upload error:', error);
    showError(t('connectionError'));
  }
}

async function loadMyBooks() {
  const loading = document.getElementById('myBooksLoading');
  const empty = document.getElementById('myBooksEmpty');
  const grid = document.getElementById('myBooksGrid');

  loading.style.display = 'block';
  empty.style.display = 'none';
  grid.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE}/auth/my-books`, {
      credentials: 'include'
    });

    const result = await response.json();

    loading.style.display = 'none';

    if (result.success && result.data.length > 0) {
      result.data.forEach(book => {
        const card = createBookCard(book);
        grid.appendChild(card);
      });
    } else {
      empty.style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading my books:', error);
    loading.style.display = 'none';
    empty.style.display = 'block';
  }
}

async function loadBorrowedBooks() {
  const loading = document.getElementById('borrowedLoading');
  const empty = document.getElementById('borrowedEmpty');
  const list = document.getElementById('borrowedList');

  loading.style.display = 'block';
  empty.style.display = 'none';
  list.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE}/borrowings/my`, {
      credentials: 'include'
    });

    const result = await response.json();

    loading.style.display = 'none';

    if (result.success && result.data.length > 0) {
      result.data.forEach(borrowing => {
        const item = createBorrowedItem(borrowing);
        list.appendChild(item);
      });
    } else {
      empty.style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading borrowed books:', error);
    loading.style.display = 'none';
    empty.style.display = 'block';
  }
}

function createBorrowedItem(borrowing) {
  const item = document.createElement('div');
  item.className = 'borrowed-item';

  const borrowDate = new Date(borrowing.borrow_date).toLocaleDateString();
  const dueDate = new Date(borrowing.due_date);
  const dueDateStr = dueDate.toLocaleDateString();
  const isOverdue = dueDate < new Date();

  const coverHtml = borrowing.cover_image
    ? `<img src="${borrowing.cover_image}" alt="${borrowing.title}" />`
    : '<div class="book-cover-placeholder">📖</div>';

  item.innerHTML = `
    <div class="borrowed-item-cover">
      ${coverHtml}
    </div>
    <div class="borrowed-item-info">
      <div class="borrowed-item-title">${escapeHtml(borrowing.title)}</div>
      <div class="borrowed-item-author">${escapeHtml(borrowing.author || t('unknownAuthor'))}</div>
      <div class="borrowed-item-dates">
        <div class="borrowed-item-date">
          <span class="date-label">${t('borrowedOn')}</span>
          <span class="date-value">${borrowDate}</span>
        </div>
        <div class="borrowed-item-date">
          <span class="date-label">${t('dueDate')}</span>
          <span class="date-value ${isOverdue ? 'date-overdue' : ''}">${dueDateStr}</span>
        </div>
      </div>
    </div>
    <div class="borrowed-item-actions">
      <button class="btn-primary" onclick="returnBook(${borrowing.book_id})">${t('returnBook')}</button>
    </div>
  `;

  return item;
}

async function returnBook(bookId) {
  if (!confirm(t('confirmReturn'))) return;

  try {
    const response = await fetch(`${API_BASE}/borrowings/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ book_id: bookId })
    });

    const result = await response.json();

    if (result.success) {
      loadBorrowedBooks();
      loadBooks();
    } else {
      showError(result.error || t('errorOccurred'));
    }
  } catch (error) {
    console.error('Error returning book:', error);
    showError(t('connectionError'));
  }
}

function showStatusMessage(message, type, elementId) {
  const statusEl = document.getElementById(elementId);
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
  statusEl.style.display = 'block';

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 5000);
}

function showError(message, elementId = null) {
  if (elementId) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  } else {
    alert(message);
  }
}

// Load books from API
async function loadBooks() {
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/books`);
    const result = await response.json();

    if (result.success) {
      currentBooks = result.data;
      renderBooks(currentBooks);
    } else {
      showError(t('errorLoading') + ': ' + result.error);
    }
  } catch (error) {
    console.error('Error loading books:', error);
    showError(t('connectionError'));
  }
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    const result = await response.json();

    if (result.success) {
      document.getElementById('totalBooksCount').textContent = result.data.totalBooks;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Show login required state
function showLoginRequired() {
  const loginRequiredState = document.getElementById('loginRequiredState');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const grid = document.getElementById('booksGrid');

  loadingState.style.display = 'none';
  emptyState.style.display = 'none';
  grid.style.display = 'none';
  loginRequiredState.style.display = 'block';
}

// Render books grid
function renderBooks(books) {
  const grid = document.getElementById('booksGrid');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const loginRequiredState = document.getElementById('loginRequiredState');

  loadingState.style.display = 'none';
  loginRequiredState.style.display = 'none';

  if (books.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  grid.style.display = 'grid';
  grid.innerHTML = '';

  books.forEach(book => {
    const card = createBookCard(book);
    grid.appendChild(card);
  });
}

// Create book card element
function createBookCard(book) {
  const card = document.createElement('div');
  card.className = 'book-card';
  card.onclick = () => openBookDetail(book.id);

  const coverHtml = book.cover_image || book.thumbnail_image
    ? `<img src="${book.cover_image || book.thumbnail_image}" alt="${book.title}" />`
    : `<div class="book-cover-placeholder">📖</div>`;

  card.innerHTML = `
    <div class="book-cover">
      ${coverHtml}
    </div>
    <div class="book-info">
      <div class="book-title">${escapeHtml(book.title)}</div>
      <div class="book-author">${escapeHtml(book.author || t('unknownAuthor'))}</div>
      <div class="book-meta">
        <span>${book.published_date ? new Date(book.published_date).getFullYear() : ''}</span>
        <span>${book.page_count ? book.page_count + ' pág.' : ''}</span>
      </div>
    </div>
  `;

  return card;
}

// Show loading state
function showLoading() {
  document.getElementById('loadingState').style.display = 'block';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('booksGrid').style.display = 'none';
}

// Handle search
async function handleSearch() {
  const query = document.getElementById('searchInput').value.trim();

  if (!query) {
    loadBooks();
    return;
  }

  try {
    showLoading();
    const response = await fetch(`${API_BASE}/books/search?q=${encodeURIComponent(query)}`);
    const result = await response.json();

    if (result.success) {
      renderBooks(result.data);
    } else {
      showError(t('errorSearching') + ': ' + result.error);
    }
  } catch (error) {
    console.error('Error searching:', error);
    showError(t('connectionError'));
  }
}

// Modal management
function openAddBookModal() {
  const modal = document.getElementById('addBookModal');
  modal.classList.add('active');
  resetAddBookForm();
}

function closeAddBookModal() {
  const modal = document.getElementById('addBookModal');
  modal.classList.remove('active');
  stopCamera();
  resetAddBookForm();
}

function resetAddBookForm() {
  document.getElementById('uploadStep').style.display = 'block';
  document.getElementById('detailsStep').style.display = 'none';
  document.getElementById('uploadProgress').style.display = 'none';
  document.getElementById('cameraPreview').style.display = 'none';
  document.getElementById('bookForm').reset();
  document.getElementById('coverInput').value = '';
}

// Camera functionality
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });

    cameraStream = stream;
    const video = document.getElementById('cameraVideo');
    video.srcObject = stream;

    document.getElementById('cameraPreview').style.display = 'block';
    document.querySelector('.upload-area').style.display = 'none';
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert(t('cameraError'));
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  document.getElementById('cameraPreview').style.display = 'none';
  document.querySelector('.upload-area').style.display = 'flex';
}

// Manual entry functionality
function showManualEntryForm() {
  document.getElementById('uploadStep').style.display = 'none';
  document.getElementById('detailsStep').style.display = 'block';

  // Show info message
  showRecognitionStatus(
    t('manualEntryHelp'),
    'info'
  );

  // Clear all form fields for manual entry
  document.getElementById('bookTitle').value = '';
  document.getElementById('bookAuthor').value = '';
  document.getElementById('bookISBN').value = '';
  document.getElementById('bookPublisher').value = '';
  document.getElementById('bookPublishedDate').value = '';
  document.getElementById('bookDescription').value = '';
  document.getElementById('bookPages').value = '';
  document.getElementById('bookLanguage').value = '';
  document.getElementById('bookCategories').value = '';
  document.getElementById('bookCoverImage').value = '';
  document.getElementById('bookThumbnail').value = '';
  document.getElementById('bookGoogleId').value = '';

  // Hide preview image
  document.getElementById('previewImage').src = '';
  document.querySelector('.form-preview').style.display = 'none';
}

function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  canvas.toBlob((blob) => {
    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
    uploadImage(file);
  }, 'image/jpeg', 0.9);

  stopCamera();
}

// File upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    uploadImage(file);
  }
}

async function uploadImage(file) {
  try {
    document.getElementById('uploadStep').style.display = 'block';
    document.getElementById('uploadProgress').style.display = 'block';

    const formData = new FormData();
    formData.append('cover', file);

    const response = await fetch(`${API_BASE}/books/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    document.getElementById('uploadProgress').style.display = 'none';

    if (result.success) {
      showBookDetailsForm(result);
    } else if (response.status === 409) {
      // Book already exists
      showRecognitionStatus(t('bookAlreadyExists'), 'error');
      setTimeout(() => {
        closeAddBookModal();
      }, 2000);
    } else {
      showError(t('errorUploading') + ': ' + result.error);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    document.getElementById('uploadProgress').style.display = 'none';
    showError(t('connectionError'));
  }
}

// Show book details form
function showBookDetailsForm(result) {
  document.getElementById('uploadStep').style.display = 'none';
  document.getElementById('detailsStep').style.display = 'block';

  const bookData = result.data;

  // Show recognition status
  if (result.recognized) {
    showRecognitionStatus(t('infoCompleted'), 'success');
  } else {
    showRecognitionStatus(t('bookNotRecognized'), 'warning');
  }

  // Populate form
  document.getElementById('bookTitle').value = bookData.title || '';
  document.getElementById('bookAuthor').value = bookData.author || '';
  document.getElementById('bookISBN').value = bookData.isbn || '';
  document.getElementById('bookPublisher').value = bookData.publisher || '';
  document.getElementById('bookPublishedDate').value = bookData.published_date || '';
  document.getElementById('bookDescription').value = bookData.description || '';
  document.getElementById('bookPages').value = bookData.page_count || '';
  document.getElementById('bookLanguage').value = bookData.language || '';
  document.getElementById('bookCategories').value = bookData.categories || '';
  document.getElementById('bookCoverImage').value = bookData.cover_image || '';
  document.getElementById('bookThumbnail').value = bookData.thumbnail_image || '';
  document.getElementById('bookGoogleId').value = bookData.google_books_id || '';

  // Show preview
  if (bookData.cover_image || bookData.thumbnail_image) {
    document.getElementById('previewImage').src = bookData.cover_image || bookData.thumbnail_image;
  }
}

function showRecognitionStatus(message, type) {
  const statusDiv = document.getElementById('recognitionStatus');
  statusDiv.textContent = message;
  statusDiv.className = `status-message status-${type}`;
  statusDiv.style.display = 'block';
}

// Auto-complete book data
async function autoCompleteBookData() {
  try {
    // Get current form values
    const partialData = {
      title: document.getElementById('bookTitle').value.trim(),
      author: document.getElementById('bookAuthor').value.trim(),
      isbn: document.getElementById('bookISBN').value.trim()
    };

    // Check if at least one field has data
    if (!partialData.title && !partialData.author && !partialData.isbn) {
      showRecognitionStatus(t('enterTitleOrISBN'), 'warning');
      return;
    }

    // Show loading state
    const autoCompleteBtn = document.getElementById('autoCompleteBtn');
    const originalText = autoCompleteBtn.textContent;
    autoCompleteBtn.disabled = true;
    autoCompleteBtn.textContent = t('searching');

    showRecognitionStatus(t('searchingBookInfo'), 'info');

    // Call the complete API
    const response = await fetch(`${API_BASE}/books/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(partialData)
    });

    const result = await response.json();

    // Restore button state
    autoCompleteBtn.disabled = false;
    autoCompleteBtn.textContent = originalText;

    if (result.success && result.data) {
      // Merge completed data with existing data (keep user-entered values)
      const completedData = result.data;

      // Only update empty fields
      if (!document.getElementById('bookTitle').value && completedData.title) {
        document.getElementById('bookTitle').value = completedData.title;
      }
      if (!document.getElementById('bookAuthor').value && completedData.author) {
        document.getElementById('bookAuthor').value = completedData.author;
      }
      if (!document.getElementById('bookISBN').value && completedData.isbn) {
        document.getElementById('bookISBN').value = completedData.isbn;
      }
      if (!document.getElementById('bookPublisher').value && completedData.publisher) {
        document.getElementById('bookPublisher').value = completedData.publisher;
      }
      if (!document.getElementById('bookPublishedDate').value && completedData.published_date) {
        document.getElementById('bookPublishedDate').value = completedData.published_date;
      }
      if (!document.getElementById('bookDescription').value && completedData.description) {
        document.getElementById('bookDescription').value = completedData.description;
      }
      if (!document.getElementById('bookPages').value && completedData.page_count) {
        document.getElementById('bookPages').value = completedData.page_count;
      }
      if (!document.getElementById('bookLanguage').value && completedData.language) {
        document.getElementById('bookLanguage').value = completedData.language;
      }
      if (!document.getElementById('bookCategories').value && completedData.categories) {
        document.getElementById('bookCategories').value = completedData.categories;
      }

      // Update cover image if available
      if (completedData.cover_image || completedData.thumbnail_image) {
        const coverUrl = completedData.cover_image || completedData.thumbnail_image;
        document.getElementById('bookCoverImage').value = coverUrl;
        document.getElementById('bookThumbnail').value = coverUrl;
        document.getElementById('previewImage').src = coverUrl;
        document.querySelector('.form-preview').style.display = 'block';
      }

      if (completedData.google_books_id) {
        document.getElementById('bookGoogleId').value = completedData.google_books_id;
      }

      showRecognitionStatus(t('infoCompleted'), 'success');
    } else {
      showRecognitionStatus(t('infoNotFound'), 'warning');
    }
  } catch (error) {
    console.error('Error auto-completing book data:', error);
    showRecognitionStatus(t('errorSearchingInfo'), 'error');

    const autoCompleteBtn = document.getElementById('autoCompleteBtn');
    autoCompleteBtn.disabled = false;
    autoCompleteBtn.textContent = t('autocomplete');
  }
}

// Submit book form
async function handleBookSubmit(event) {
  event.preventDefault();

  const bookData = {
    title: document.getElementById('bookTitle').value,
    author: document.getElementById('bookAuthor').value,
    isbn: document.getElementById('bookISBN').value,
    publisher: document.getElementById('bookPublisher').value,
    published_date: document.getElementById('bookPublishedDate').value,
    description: document.getElementById('bookDescription').value,
    page_count: parseInt(document.getElementById('bookPages').value) || 0,
    language: document.getElementById('bookLanguage').value,
    categories: document.getElementById('bookCategories').value,
    cover_image: document.getElementById('bookCoverImage').value,
    thumbnail_image: document.getElementById('bookThumbnail').value,
    google_books_id: document.getElementById('bookGoogleId').value
  };

  try {
    const response = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookData)
    });

    const result = await response.json();

    if (result.success) {
      closeAddBookModal();
      loadBooks();
      loadStats();
    } else {
      showError(t('errorSaving') + ': ' + result.error);
    }
  } catch (error) {
    console.error('Error saving book:', error);
    showError(t('connectionError'));
  }
}

// Book detail modal
async function openBookDetail(bookId) {
  try {
    const response = await fetch(`${API_BASE}/books/${bookId}`);
    const result = await response.json();

    if (result.success) {
      showBookDetailModal(result.data);
    } else {
      showError(t('errorLoading') + ': ' + result.error);
    }
  } catch (error) {
    console.error('Error loading book details:', error);
    showError(t('connectionError'));
  }
}

function showBookDetailModal(book) {
  const modal = document.getElementById('bookDetailModal');
  const content = document.getElementById('bookDetailContent');

  const coverHtml = book.cover_image || book.thumbnail_image
    ? `<img src="${book.cover_image || book.thumbnail_image}" alt="${book.title}" />`
    : `<div class="book-cover-placeholder" style="width: 100%; height: 400px;">📖</div>`;

  content.innerHTML = `
    <div class="book-detail">
      <div class="book-detail-cover">
        ${coverHtml}
      </div>
      <div class="book-detail-info">
        <h3>${escapeHtml(book.title)}</h3>
        <div class="book-detail-author">${escapeHtml(book.author || t('unknownAuthor'))}</div>

        <div class="book-detail-meta">
          ${book.isbn ? `
          <div class="meta-item">
            <div class="meta-label">ISBN</div>
            <div class="meta-value">${escapeHtml(book.isbn)}</div>
          </div>
          ` : ''}
          ${book.publisher ? `
          <div class="meta-item">
            <div class="meta-label">${t('publisher')}</div>
            <div class="meta-value">${escapeHtml(book.publisher)}</div>
          </div>
          ` : ''}
          ${book.published_date ? `
          <div class="meta-item">
            <div class="meta-label">${t('publishedDate')}</div>
            <div class="meta-value">${escapeHtml(book.published_date)}</div>
          </div>
          ` : ''}
          ${book.page_count ? `
          <div class="meta-item">
            <div class="meta-label">${t('pageCount')}</div>
            <div class="meta-value">${book.page_count}</div>
          </div>
          ` : ''}
          ${book.language ? `
          <div class="meta-item">
            <div class="meta-label">${t('language')}</div>
            <div class="meta-value">${escapeHtml(book.language).toUpperCase()}</div>
          </div>
          ` : ''}
          ${book.categories ? `
          <div class="meta-item">
            <div class="meta-label">${t('categories')}</div>
            <div class="meta-value">${escapeHtml(book.categories)}</div>
          </div>
          ` : ''}
        </div>

        ${book.description ? `
        <div class="book-detail-description">
          <h4>${t('description')}</h4>
          <p>${escapeHtml(book.description)}</p>
        </div>
        ` : ''}

        <div class="book-detail-actions">
          ${currentUser && book.added_by_user_id === currentUser.id ? `
            <button class="btn-danger" onclick="deleteBook(${book.id})">${t('deleteBook')}</button>
          ` : ''}
          ${currentUser && book.status === 'available' ? `
            <button class="btn-primary" onclick="borrowBook(${book.id})">${t('borrowBook')}</button>
          ` : ''}
          ${book.status === 'borrowed' ? `
            <span class="book-status status-borrowed">${t('borrowed')}</span>
          ` : ''}
          ${!currentUser ? `
            <p style="color: var(--text-secondary);">${t('loginRequired')}</p>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeBookDetailModal() {
  const modal = document.getElementById('bookDetailModal');
  modal.classList.remove('active');
}

// Borrow book
async function borrowBook(bookId) {
  if (!currentUser) {
    openLoginModal();
    return;
  }

  if (!confirm(t('confirmBorrow'))) return;

  try {
    const response = await fetch(`${API_BASE}/borrowings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ book_id: bookId })
    });

    const result = await response.json();

    if (result.success) {
      closeBookDetailModal();
      loadBooks();
    } else {
      showError(result.error || t('errorOccurred'));
    }
  } catch (error) {
    console.error('Error borrowing book:', error);
    showError(t('errorOccurred'));
  }
}

// Delete book
async function deleteBook(bookId) {
  if (!confirm(t('confirmDelete'))) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/books/${bookId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const result = await response.json();

    if (result.success) {
      closeBookDetailModal();
      loadBooks();
      loadStats();
    } else {
      showError(result.error || t('errorOccurred'));
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    showError(t('connectionError'));
  }
}

// Utility functions
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

function showSuccess(message) {
  // Simple alert for now - could be replaced with a toast notification
  alert(message);
}

function showError(message) {
  alert(message);
}

// Close modals on outside click
window.onclick = function(event) {
  const addModal = document.getElementById('addBookModal');
  const detailModal = document.getElementById('bookDetailModal');

  if (event.target === addModal) {
    closeAddBookModal();
  }
  if (event.target === detailModal) {
    closeBookDetailModal();
  }
};
