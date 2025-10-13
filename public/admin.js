// ==================== Admin Panel Functions ====================

// Open admin panel
async function openAdminModal() {
  document.getElementById('adminModal').style.display = 'flex';
  loadAdminUsers();
  loadAdminBooks();
}

// Close admin panel
function closeAdminModal() {
  document.getElementById('adminModal').style.display = 'none';
}

// Load all users for admin
async function loadAdminUsers() {
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      credentials: 'include'
    });
    const result = await response.json();

    if (result.success) {
      renderAdminUsers(result.data);
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Error loading users:', error);
    showError(t('connectionError'));
  }
}

// Render admin users list
function renderAdminUsers(users) {
  const container = document.getElementById('adminUsersList');
  container.innerHTML = '';

  users.forEach(user => {
    const item = document.createElement('div');
    item.className = 'admin-user-item';

    const badges = [];
    if (user.is_admin) {
      badges.push(`<span class="admin-badge admin-badge-admin">${t('administrator')}</span>`);
    }
    badges.push(`<span class="admin-badge admin-badge-${user.is_enabled ? 'enabled' : 'disabled'}">${user.is_enabled ? t('enabled') : t('disabled')}</span>`);

    const toggleButton = user.id !== currentUser.id ?
      `<button class="btn-sm ${user.is_enabled ? 'btn-danger' : 'btn-primary'}"
              onclick="toggleUserStatus(${user.id}, ${!user.is_enabled})">
        ${user.is_enabled ? t('disableUser') : t('enableUser')}
      </button>` : '';

    item.innerHTML = `
      <div class="admin-user-info">
        <div class="admin-user-name">${escapeHtml(user.name)}</div>
        <div class="admin-user-email">${escapeHtml(user.email)}</div>
        <div class="admin-user-badges">${badges.join('')}</div>
      </div>
      <div class="admin-user-actions">
        ${toggleButton}
      </div>
    `;

    container.appendChild(item);
  });
}

// Toggle user status
async function toggleUserStatus(userId, enable) {
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/toggle-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_enabled: enable })
    });

    const result = await response.json();

    if (result.success) {
      loadAdminUsers();
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Error toggling user status:', error);
    showError(t('connectionError'));
  }
}

// Load all books for admin
async function loadAdminBooks() {
  try {
    const response = await fetch(`${API_BASE}/books`, {
      credentials: 'include'
    });
    const result = await response.json();

    if (result.success) {
      renderAdminBooks(result.data);
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Error loading books:', error);
    showError(t('connectionError'));
  }
}

// Render admin books list
function renderAdminBooks(books) {
  const container = document.getElementById('adminBooksList');
  container.innerHTML = '';

  books.forEach(book => {
    const card = createAdminBookCard(book);
    container.appendChild(card);
  });
}

// Create admin book card with edit controls
function createAdminBookCard(book) {
  const card = document.createElement('div');
  card.className = 'book-card';
  card.style.cursor = 'default';

  const thumbnail = book.thumbnail || book.cover_image || '/placeholder-book.png';
  const statusClass = book.status === 'borrowed' ? 'status-borrowed' : 'status-available';

  card.innerHTML = `
    <img src="${thumbnail}" alt="${escapeHtml(book.title)}" class="book-cover" />
    <div class="book-info">
      <h3 class="book-title">${escapeHtml(book.title)}</h3>
      <p class="book-author">${escapeHtml(book.author || t('unknownAuthor'))}</p>
      <span class="book-status ${statusClass}">${t(book.status)}</span>
      <div class="book-actions">
        <button class="btn-sm btn-primary" onclick="openEditBookModal(${book.id})" title="${t('editBook')}">
          ✏️ ${t('editBook')}
        </button>
        <button class="btn-sm btn-danger" onclick="adminDeleteBook(${book.id})" title="${t('deleteBook')}">
          🗑️
        </button>
        ${book.status === 'available' ?
          `<button class="btn-sm btn-secondary" onclick="openForceBorrowModal(${book.id})" title="${t('forceBorrow')}">
            📤 ${t('forceBorrow')}
          </button>` :
          `<button class="btn-sm btn-secondary" onclick="adminForceReturn(${book.id})" title="${t('forceReturn')}">
            📥 ${t('forceReturn')}
          </button>`
        }
      </div>
    </div>
  `;

  return card;
}

// Admin delete book
async function adminDeleteBook(bookId) {
  if (!confirm(t('confirmDelete'))) return;

  try {
    const response = await fetch(`${API_BASE}/books/${bookId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const result = await response.json();

    if (result.success) {
      loadAdminBooks();
      loadBooks(); // Refresh main view
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    showError(t('errorDeleting'));
  }
}

// Admin force return
async function adminForceReturn(bookId) {
  if (!confirm(t('confirmForceReturn'))) return;

  try {
    const response = await fetch(`${API_BASE}/borrowings/return/${bookId}`, {
      method: 'POST',
      credentials: 'include'
    });

    const result = await response.json();

    if (result.success) {
      loadAdminBooks();
      loadBooks(); // Refresh main view
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Error returning book:', error);
    showError(t('connectionError'));
  }
}

// Open force borrow modal
async function openForceBorrowModal(bookId) {
  // Get all users
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      credentials: 'include'
    });
    const result = await response.json();

    if (result.success) {
      const users = result.data.filter(u => u.is_enabled);
      const userOptions = users.map(u =>
        `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.email)})</option>`
      ).join('');

      const selectedUserId = await showSelectDialog(
        t('borrowTo'),
        userOptions
      );

      if (selectedUserId) {
        await adminForceBorrow(bookId, selectedUserId);
      }
    }
  } catch (error) {
    console.error('Error loading users:', error);
    showError(t('connectionError'));
  }
}

// Helper to show select dialog
function showSelectDialog(title, optionsHTML) {
  return new Promise((resolve) => {
    const userId = prompt(`${title}:\n\n${optionsHTML.replace(/<[^>]*>/g, '\n')}`);
    resolve(userId);
  });
}

// Admin force borrow
async function adminForceBorrow(bookId, userId) {
  if (!confirm(t('confirmForceBorrow'))) return;

  try {
    const response = await fetch(`${API_BASE}/borrowings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ book_id: bookId, user_id: userId })
    });

    const result = await response.json();

    if (result.success) {
      loadAdminBooks();
      loadBooks(); // Refresh main view
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Error borrowing book:', error);
    showError(t('connectionError'));
  }
}

// ==================== Edit Book Modal ====================

let currentEditingBookId = null;

// Open edit book modal
async function openEditBookModal(bookId) {
  currentEditingBookId = bookId;

  try {
    const response = await fetch(`${API_BASE}/books/${bookId}`, {
      credentials: 'include'
    });
    const result = await response.json();

    if (result.success) {
      const book = result.data;

      // Populate form
      document.getElementById('editBookId').value = book.id;
      document.getElementById('editBookTitle').value = book.title || '';
      document.getElementById('editBookAuthor').value = book.author || '';
      document.getElementById('editBookISBN').value = book.isbn || '';
      document.getElementById('editBookPublisher').value = book.publisher || '';
      document.getElementById('editBookPublishedDate').value = book.published_date || '';
      document.getElementById('editBookDescription').value = book.description || '';
      document.getElementById('editBookPages').value = book.page_count || '';
      document.getElementById('editBookLanguage').value = book.language || '';
      document.getElementById('editBookCategories').value = book.categories || '';

      // Set cover preview
      const coverPreview = document.getElementById('editBookCoverPreview');
      coverPreview.src = book.thumbnail || book.cover_image || '/placeholder-book.png';

      document.getElementById('editBookModal').style.display = 'flex';
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Error loading book:', error);
    showError(t('connectionError'));
  }
}

// Close edit book modal
function closeEditBookModal() {
  document.getElementById('editBookModal').style.display = 'none';
  currentEditingBookId = null;
}

// Handle edit book form submission
async function handleEditBookSubmit(e) {
  e.preventDefault();

  const bookId = document.getElementById('editBookId').value;
  const bookData = {
    title: document.getElementById('editBookTitle').value,
    author: document.getElementById('editBookAuthor').value,
    isbn: document.getElementById('editBookISBN').value,
    publisher: document.getElementById('editBookPublisher').value,
    published_date: document.getElementById('editBookPublishedDate').value,
    description: document.getElementById('editBookDescription').value,
    page_count: document.getElementById('editBookPages').value,
    language: document.getElementById('editBookLanguage').value,
    categories: document.getElementById('editBookCategories').value
  };

  try {
    const isAdmin = currentUser && currentUser.is_admin;
    const endpoint = isAdmin ?
      `${API_BASE}/admin/books/${bookId}` :
      `${API_BASE}/books/${bookId}`;

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(bookData)
    });

    const result = await response.json();

    if (result.success) {
      closeEditBookModal();
      loadBooks(); // Refresh main view
      if (isAdmin) {
        loadAdminBooks(); // Refresh admin view
      }
    } else {
      showEditBookError(result.error);
    }
  } catch (error) {
    console.error('Error updating book:', error);
    showEditBookError(t('connectionError'));
  }
}

// Handle edit book cover upload
async function handleEditBookCoverUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Show uploading message
  const statusEl = document.getElementById('editBookStatus');
  statusEl.textContent = t('uploading');
  statusEl.className = 'status-message';
  statusEl.style.display = 'block';

  const formData = new FormData();
  formData.append('cover', file);

  try {
    const bookId = document.getElementById('editBookId').value;
    const isAdmin = currentUser && currentUser.is_admin;
    const endpoint = isAdmin ?
      `${API_BASE}/admin/books/${bookId}/cover` :
      `${API_BASE}/books/${bookId}/cover`;

    console.log('Uploading cover to:', endpoint, 'Admin:', isAdmin);

    const response = await fetch(endpoint, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });

    const result = await response.json();
    console.log('Cover upload result:', result);

    if (result.success) {
      // Update preview - use cover_image or thumbnail_image
      const newCover = result.data.cover_image || result.data.thumbnail_image;
      document.getElementById('editBookCoverPreview').src = newCover;

      // Show success
      statusEl.textContent = t('coverUpdated');
      statusEl.className = 'status-message status-success';

      // Hide after 3 seconds
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);

      // Refresh views
      loadBooks();
      if (isAdmin) {
        loadAdminBooks();
      }
    } else {
      showEditBookError(result.error);
    }
  } catch (error) {
    console.error('Error uploading cover:', error);
    showEditBookError(t('connectionError'));
  }
}

// Show edit book error
function showEditBookError(message) {
  const statusEl = document.getElementById('editBookStatus');
  statusEl.textContent = message;
  statusEl.className = 'status-message status-error';
  statusEl.style.display = 'block';

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 5000);
}
