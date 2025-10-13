// Global state
let currentBooks = [];
let cameraStream = null;

// API Base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  loadStats();
  initializeEventListeners();
});

// Event Listeners
function initializeEventListeners() {
  // Search
  document.getElementById('searchBtn').addEventListener('click', handleSearch);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Add book modal
  document.getElementById('addBookBtn').addEventListener('click', openAddBookModal);
  document.getElementById('takePictureBtn').addEventListener('click', startCamera);
  document.getElementById('uploadFileBtn').addEventListener('click', () => {
    document.getElementById('coverInput').click();
  });
  document.getElementById('coverInput').addEventListener('change', handleFileUpload);
  document.getElementById('captureBtn').addEventListener('click', capturePhoto);
  document.getElementById('cancelCameraBtn').addEventListener('click', stopCamera);

  // Book form
  document.getElementById('bookForm').addEventListener('submit', handleBookSubmit);
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
      showError('Error cargando libros: ' + result.error);
    }
  } catch (error) {
    console.error('Error loading books:', error);
    showError('Error de conexión al cargar los libros');
  }
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    const result = await response.json();

    if (result.success) {
      document.getElementById('totalBooks').textContent = result.data.totalBooks;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Render books grid
function renderBooks(books) {
  const grid = document.getElementById('booksGrid');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');

  loadingState.style.display = 'none';

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
      <div class="book-author">${escapeHtml(book.author || 'Autor desconocido')}</div>
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
      showError('Error en la búsqueda: ' + result.error);
    }
  } catch (error) {
    console.error('Error searching:', error);
    showError('Error de conexión en la búsqueda');
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
    alert('No se pudo acceder a la cámara. Por favor, permite el acceso o sube una imagen.');
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
      showRecognitionStatus('Este libro ya existe en la biblioteca', 'error');
      setTimeout(() => {
        closeAddBookModal();
      }, 2000);
    } else {
      showError('Error subiendo imagen: ' + result.error);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    document.getElementById('uploadProgress').style.display = 'none';
    showError('Error de conexión al subir la imagen');
  }
}

// Show book details form
function showBookDetailsForm(result) {
  document.getElementById('uploadStep').style.display = 'none';
  document.getElementById('detailsStep').style.display = 'block';

  const bookData = result.data;

  // Show recognition status
  if (result.recognized) {
    showRecognitionStatus('¡Libro reconocido automáticamente! Verifica los datos.', 'success');
  } else {
    showRecognitionStatus('No se pudo reconocer el libro. Por favor, ingresa los datos manualmente.', 'warning');
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
      showSuccess('Libro agregado exitosamente');
    } else {
      showError('Error guardando libro: ' + result.error);
    }
  } catch (error) {
    console.error('Error saving book:', error);
    showError('Error de conexión al guardar el libro');
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
      showError('Error cargando detalles: ' + result.error);
    }
  } catch (error) {
    console.error('Error loading book details:', error);
    showError('Error de conexión al cargar detalles');
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
        <div class="book-detail-author">${escapeHtml(book.author || 'Autor desconocido')}</div>

        <div class="book-detail-meta">
          ${book.isbn ? `
          <div class="meta-item">
            <div class="meta-label">ISBN</div>
            <div class="meta-value">${escapeHtml(book.isbn)}</div>
          </div>
          ` : ''}
          ${book.publisher ? `
          <div class="meta-item">
            <div class="meta-label">Editorial</div>
            <div class="meta-value">${escapeHtml(book.publisher)}</div>
          </div>
          ` : ''}
          ${book.published_date ? `
          <div class="meta-item">
            <div class="meta-label">Fecha de Publicación</div>
            <div class="meta-value">${escapeHtml(book.published_date)}</div>
          </div>
          ` : ''}
          ${book.page_count ? `
          <div class="meta-item">
            <div class="meta-label">Páginas</div>
            <div class="meta-value">${book.page_count}</div>
          </div>
          ` : ''}
          ${book.language ? `
          <div class="meta-item">
            <div class="meta-label">Idioma</div>
            <div class="meta-value">${escapeHtml(book.language).toUpperCase()}</div>
          </div>
          ` : ''}
          ${book.categories ? `
          <div class="meta-item">
            <div class="meta-label">Categorías</div>
            <div class="meta-value">${escapeHtml(book.categories)}</div>
          </div>
          ` : ''}
        </div>

        ${book.description ? `
        <div class="book-detail-description">
          <h4>Descripción</h4>
          <p>${escapeHtml(book.description)}</p>
        </div>
        ` : ''}

        <div class="book-detail-actions">
          <button class="btn-danger" onclick="deleteBook(${book.id})">Eliminar Libro</button>
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

// Delete book
async function deleteBook(bookId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este libro?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/books/${bookId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      closeBookDetailModal();
      loadBooks();
      loadStats();
      showSuccess('Libro eliminado exitosamente');
    } else {
      showError('Error eliminando libro: ' + result.error);
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    showError('Error de conexión al eliminar el libro');
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
