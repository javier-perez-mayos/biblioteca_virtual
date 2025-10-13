const translations = {
  en: {
    // Header
    appTitle: 'Petita Escola Library',
    appDescription: 'Welcome to the virtual library of Petita Escola Munich!',
    search: 'Search books...',
    searchButton: 'Search',
    login: 'Login',
    register: 'Register',
    addBook: '+ Add Book',
    profile: 'My Profile',
    myBooks: 'My Books',
    borrowedBooks: 'Borrowed Books',
    logout: 'Logout',

    // Language names
    langEnglish: 'English',
    langGerman: 'German',
    langCatalan: 'Catalan',

    // Stats
    totalBooks: 'Total Books',
    availableBooks: 'Available Books',
    borrowedBooksCount: 'Borrowed Books',

    // Book status
    available: 'Available',
    borrowed: 'Borrowed',

    // Book modal
    addNewBook: 'Add New Book',
    editBook: 'Edit Book',
    bookDetails: 'Book Details',
    takePicture: '📷 Take Picture',
    uploadFile: '📁 Upload File',
    manualEntry: '✍️ Manual Entry',
    autocomplete: '🔍 Autocomplete Data',
    saveBook: 'Save Book',
    cancel: 'Cancel',
    deleteBook: 'Delete Book',
    borrowBook: 'Borrow Book',
    returnBook: 'Return Book',
    close: 'Close',

    // Book fields
    title: 'Title',
    author: 'Author',
    isbn: 'ISBN',
    publisher: 'Publisher',
    publishedDate: 'Published Date',
    description: 'Description',
    pageCount: 'Pages',
    language: 'Language',
    categories: 'Categories',
    rating: 'Rating',
    addedBy: 'Added by',
    addedDate: 'Added on',

    // Login modal
    loginTitle: 'Login',
    email: 'Email',
    password: 'Password',
    loginButton: 'Login',

    // Register modal
    registerTitle: 'Register',
    name: 'Full Name',
    postalAddress: 'Postal Address',
    telephone: 'Telephone',
    confirmPassword: 'Confirm Password',
    registerButton: 'Register',

    // Profile modal
    profileTitle: 'My Profile',
    tabInfo: 'Information',
    tabPassword: 'Change Password',
    tabMyBooks: 'My Books',
    tabBorrowed: 'Borrowed Books',
    updateProfile: 'Update Profile',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    changePassword: 'Change Password',
    uploadPicture: 'Upload Picture',
    changePhoto: 'Change Photo',
    noBooksAdded: 'You haven\'t added any books yet',
    noBorrowed: 'You haven\'t borrowed any books',

    // Borrowing
    borrowedOn: 'Borrowed on',
    dueDate: 'Due date',
    overdue: 'OVERDUE',

    // Messages
    processing: 'Processing...',
    recognizing: 'Recognizing book...',
    uploading: 'Uploading...',
    loading: 'Loading...',
    noResults: 'No books found',
    confirmDelete: 'Are you sure you want to delete this book?',
    confirmBorrow: 'Borrow this book for 14 days?',
    confirmReturn: 'Return this book?',
    loginRequired: 'Login to borrow books',

    // Success messages
    bookAdded: 'Book added successfully',
    bookUpdated: 'Book updated successfully',
    bookDeleted: 'Book deleted successfully',
    bookBorrowed: 'Book borrowed successfully',
    bookReturned: 'Book returned successfully',
    profileUpdated: 'Profile updated successfully',
    passwordChanged: 'Password changed successfully',
    loginSuccess: 'Welcome back!',
    registerSuccess: 'Registration successful',

    // Error messages
    errorOccurred: 'An error occurred',
    authRequired: 'Authentication required',
    adminRequired: 'Admin access required',
    fillAllFields: 'Please fill all required fields',
    passwordMismatch: 'Passwords do not match',
    newPasswordMismatch: 'New passwords do not match',
    invalidEmail: 'Invalid email address',
    bookNotFound: 'Book not found',
    userDisabled: 'User account is disabled',
    connectionError: 'Connection error',
    errorLoading: 'Error loading',
    errorSaving: 'Error saving book',
    errorDeleting: 'Error deleting book',
    errorSearching: 'Search error',
    errorUploading: 'Error uploading image',
    errorUpdatingProfile: 'Error updating profile',
    errorChangingPassword: 'Error changing password',
    errorUploadingPhoto: 'Error uploading photo',
    errorLogin: 'Login error',
    errorRegister: 'Registration error',
    bookAlreadyExists: 'This book already exists in the library',
    bookNotRecognized: 'Could not recognize the book. Please enter the data manually.',
    enterTitleOrISBN: 'Please enter at least title, author, or ISBN to autocomplete.',
    searchingBookInfo: 'Searching for book information...',
    infoCompleted: '✅ Information completed successfully. Verify the data.',
    infoNotFound: '⚠️ No additional information found. Try with more specific data.',
    errorSearchingInfo: '❌ Error searching for information. Please try again.',
    searching: 'Searching...',
    unknownAuthor: 'Unknown author',
    manualEntryHelp: 'Manual entry: Fill in the fields you know and use "Autocomplete" to search for the rest.',
    cameraError: 'Could not access camera. Please make sure you have granted camera permissions.',

    // Recognition methods
    visionAPI: 'Google Vision API',
    ocrISBN: 'OCR + ISBN',
    ocrTitle: 'OCR + Title/Author',
    manual: 'Manual Entry',
    recognitionMethod: 'Recognition Method',

    // Additional UI strings
    loadingBooks: 'Loading books...',
    emptyLibraryTitle: 'No books in the library',
    emptyLibraryMessage: 'Start by adding your first book by taking a photo of the cover',
    addFirstBook: 'Add First Book',
    chooseOption: 'Choose an option to add your book',
    alreadyHaveAccount: 'Already have an account?',
    loginHere: 'Login here',
    noAccount: 'Don\'t have an account?',
    registerHere: 'Register here',
    saveChanges: 'Save Changes',
    loadingBooksEllipsis: 'Loading books...',
    noBooksYet: 'You haven\'t added any books yet',
    loadingBorrowedBooks: 'Loading borrowed books...',
    noBorrowedCurrently: 'You don\'t have any books borrowed currently',
    loginRequiredTitle: 'Login Required',
    loginRequiredMessage: 'Please login or register to access the library',
    loginToAccess: 'Login to Access Library'
  },

  de: {
    // Header
    appTitle: 'Petita Escola Bibliothek',
    appDescription: 'Willkommen in der virtuellen Bibliothek der Petita Escola München!',
    search: 'Bücher suchen...',
    searchButton: 'Suchen',
    login: 'Anmelden',
    register: 'Registrieren',
    addBook: '+ Buch hinzufügen',
    profile: 'Mein Profil',
    myBooks: 'Meine Bücher',
    borrowedBooks: 'Ausgeliehene Bücher',
    logout: 'Abmelden',

    // Language names
    langEnglish: 'Englisch',
    langGerman: 'Deutsch',
    langCatalan: 'Katalanisch',

    // Stats
    totalBooks: 'Bücher insgesamt',
    availableBooks: 'Verfügbare Bücher',
    borrowedBooksCount: 'Ausgeliehene Bücher',

    // Book status
    available: 'Verfügbar',
    borrowed: 'Ausgeliehen',

    // Book modal
    addNewBook: 'Neues Buch hinzufügen',
    editBook: 'Buch bearbeiten',
    bookDetails: 'Buchdetails',
    takePicture: '📷 Foto aufnehmen',
    uploadFile: '📁 Datei hochladen',
    manualEntry: '✍️ Manuelle Eingabe',
    autocomplete: '🔍 Daten automatisch vervollständigen',
    saveBook: 'Buch speichern',
    cancel: 'Abbrechen',
    deleteBook: 'Buch löschen',
    borrowBook: 'Buch ausleihen',
    returnBook: 'Buch zurückgeben',
    close: 'Schließen',

    // Book fields
    title: 'Titel',
    author: 'Autor',
    isbn: 'ISBN',
    publisher: 'Verlag',
    publishedDate: 'Erscheinungsdatum',
    description: 'Beschreibung',
    pageCount: 'Seiten',
    language: 'Sprache',
    categories: 'Kategorien',
    rating: 'Bewertung',
    addedBy: 'Hinzugefügt von',
    addedDate: 'Hinzugefügt am',

    // Login modal
    loginTitle: 'Anmelden',
    email: 'E-Mail',
    password: 'Passwort',
    loginButton: 'Anmelden',

    // Register modal
    registerTitle: 'Registrieren',
    name: 'Vollständiger Name',
    postalAddress: 'Postanschrift',
    telephone: 'Telefon',
    confirmPassword: 'Passwort bestätigen',
    registerButton: 'Registrieren',

    // Profile modal
    profileTitle: 'Mein Profil',
    tabInfo: 'Informationen',
    tabPassword: 'Passwort ändern',
    tabMyBooks: 'Meine Bücher',
    tabBorrowed: 'Ausgeliehene Bücher',
    updateProfile: 'Profil aktualisieren',
    currentPassword: 'Aktuelles Passwort',
    newPassword: 'Neues Passwort',
    confirmNewPassword: 'Neues Passwort bestätigen',
    changePassword: 'Passwort ändern',
    uploadPicture: 'Bild hochladen',
    changePhoto: 'Foto ändern',
    noBooksAdded: 'Sie haben noch keine Bücher hinzugefügt',
    noBorrowed: 'Sie haben keine Bücher ausgeliehen',

    // Borrowing
    borrowedOn: 'Ausgeliehen am',
    dueDate: 'Rückgabedatum',
    overdue: 'ÜBERFÄLLIG',

    // Messages
    processing: 'Verarbeitung...',
    recognizing: 'Buch wird erkannt...',
    uploading: 'Hochladen...',
    loading: 'Laden...',
    noResults: 'Keine Bücher gefunden',
    confirmDelete: 'Möchten Sie dieses Buch wirklich löschen?',
    confirmBorrow: 'Dieses Buch für 14 Tage ausleihen?',
    confirmReturn: 'Dieses Buch zurückgeben?',
    loginRequired: 'Melden Sie sich an, um Bücher auszuleihen',

    // Success messages
    bookAdded: 'Buch erfolgreich hinzugefügt',
    bookUpdated: 'Buch erfolgreich aktualisiert',
    bookDeleted: 'Buch erfolgreich gelöscht',
    bookBorrowed: 'Buch erfolgreich ausgeliehen',
    bookReturned: 'Buch erfolgreich zurückgegeben',
    profileUpdated: 'Profil erfolgreich aktualisiert',
    passwordChanged: 'Passwort erfolgreich geändert',
    loginSuccess: 'Willkommen zurück!',
    registerSuccess: 'Registrierung erfolgreich',

    // Error messages
    errorOccurred: 'Ein Fehler ist aufgetreten',
    authRequired: 'Authentifizierung erforderlich',
    adminRequired: 'Administratorzugriff erforderlich',
    fillAllFields: 'Bitte füllen Sie alle Pflichtfelder aus',
    passwordMismatch: 'Passwörter stimmen nicht überein',
    newPasswordMismatch: 'Neue Passwörter stimmen nicht überein',
    invalidEmail: 'Ungültige E-Mail-Adresse',
    bookNotFound: 'Buch nicht gefunden',
    userDisabled: 'Benutzerkonto ist deaktiviert',
    connectionError: 'Verbindungsfehler',
    errorLoading: 'Fehler beim Laden',
    errorSaving: 'Fehler beim Speichern des Buches',
    errorDeleting: 'Fehler beim Löschen des Buches',
    errorSearching: 'Suchfehler',
    errorUploading: 'Fehler beim Hochladen des Bildes',
    errorUpdatingProfile: 'Fehler beim Aktualisieren des Profils',
    errorChangingPassword: 'Fehler beim Ändern des Passworts',
    errorUploadingPhoto: 'Fehler beim Hochladen des Fotos',
    errorLogin: 'Anmeldefehler',
    errorRegister: 'Registrierungsfehler',
    bookAlreadyExists: 'Dieses Buch existiert bereits in der Bibliothek',
    bookNotRecognized: 'Buch konnte nicht erkannt werden. Bitte geben Sie die Daten manuell ein.',
    enterTitleOrISBN: 'Bitte geben Sie mindestens Titel, Autor oder ISBN ein, um automatisch zu vervollständigen.',
    searchingBookInfo: 'Buchinformationen werden gesucht...',
    infoCompleted: '✅ Informationen erfolgreich vervollständigt. Überprüfen Sie die Daten.',
    infoNotFound: '⚠️ Keine zusätzlichen Informationen gefunden. Versuchen Sie es mit spezifischeren Daten.',
    errorSearchingInfo: '❌ Fehler beim Suchen von Informationen. Bitte versuchen Sie es erneut.',
    searching: 'Suchen...',
    unknownAuthor: 'Unbekannter Autor',
    manualEntryHelp: 'Manuelle Eingabe: Füllen Sie die bekannten Felder aus und verwenden Sie "Automatisch vervollständigen", um den Rest zu suchen.',
    cameraError: 'Zugriff auf die Kamera nicht möglich. Bitte stellen Sie sicher, dass Sie die Kameraberechtigungen erteilt haben.',

    // Recognition methods
    visionAPI: 'Google Vision API',
    ocrISBN: 'OCR + ISBN',
    ocrTitle: 'OCR + Titel/Autor',
    manual: 'Manuelle Eingabe',
    recognitionMethod: 'Erkennungsmethode',

    // Additional UI strings
    loadingBooks: 'Bücher werden geladen...',
    emptyLibraryTitle: 'Keine Bücher in der Bibliothek',
    emptyLibraryMessage: 'Beginnen Sie, indem Sie Ihr erstes Buch hinzufügen, indem Sie ein Foto des Covers machen',
    addFirstBook: 'Erstes Buch hinzufügen',
    chooseOption: 'Wählen Sie eine Option, um Ihr Buch hinzuzufügen',
    alreadyHaveAccount: 'Haben Sie bereits ein Konto?',
    loginHere: 'Hier anmelden',
    noAccount: 'Haben Sie noch kein Konto?',
    registerHere: 'Hier registrieren',
    saveChanges: 'Änderungen speichern',
    loadingBooksEllipsis: 'Bücher werden geladen...',
    noBooksYet: 'Sie haben noch keine Bücher hinzugefügt',
    loadingBorrowedBooks: 'Ausgeliehene Bücher werden geladen...',
    noBorrowedCurrently: 'Sie haben derzeit keine Bücher ausgeliehen',
    loginRequiredTitle: 'Anmeldung erforderlich',
    loginRequiredMessage: 'Bitte melden Sie sich an oder registrieren Sie sich, um auf die Bibliothek zuzugreifen',
    loginToAccess: 'Anmelden, um auf Bibliothek zuzugreifen'
  },

  ca: {
    // Header
    appTitle: 'Biblioteca de la Petita Escola',
    appDescription: 'Benvingudes a la biblioteca virtual de la Petita Escola de Munic!',
    search: 'Cercar llibres...',
    searchButton: 'Cercar',
    login: 'Iniciar Sessió',
    register: 'Registrar-se',
    addBook: '+ Afegir Llibre',
    profile: 'El Meu Perfil',
    myBooks: 'Els Meus Llibres',
    borrowedBooks: 'Llibres Prestats',
    logout: 'Tancar Sessió',

    // Language names
    langEnglish: 'Anglès',
    langGerman: 'Alemany',
    langCatalan: 'Català',

    // Stats
    totalBooks: 'Total de Llibres',
    availableBooks: 'Llibres Disponibles',
    borrowedBooksCount: 'Llibres Prestats',

    // Book status
    available: 'Disponible',
    borrowed: 'Prestat',

    // Book modal
    addNewBook: 'Afegir Llibre Nou',
    editBook: 'Editar Llibre',
    bookDetails: 'Detalls del Llibre',
    takePicture: '📷 Fer Foto',
    uploadFile: '📁 Pujar Arxiu',
    manualEntry: '✍️ Entrada Manual',
    autocomplete: '🔍 Autocompletar Dades',
    saveBook: 'Desar Llibre',
    cancel: 'Cancel·lar',
    deleteBook: 'Eliminar Llibre',
    borrowBook: 'Prestar Llibre',
    returnBook: 'Tornar Llibre',
    close: 'Tancar',

    // Book fields
    title: 'Títol',
    author: 'Autor',
    isbn: 'ISBN',
    publisher: 'Editorial',
    publishedDate: 'Data de Publicació',
    description: 'Descripció',
    pageCount: 'Pàgines',
    language: 'Idioma',
    categories: 'Categories',
    rating: 'Valoració',
    addedBy: 'Afegit per',
    addedDate: 'Afegit el',

    // Login modal
    loginTitle: 'Iniciar Sessió',
    email: 'Correu Electrònic',
    password: 'Contrasenya',
    loginButton: 'Iniciar Sessió',

    // Register modal
    registerTitle: 'Registrar-se',
    name: 'Nom Complet',
    postalAddress: 'Adreça Postal',
    telephone: 'Telèfon',
    confirmPassword: 'Confirmar Contrasenya',
    registerButton: 'Registrar-se',

    // Profile modal
    profileTitle: 'El Meu Perfil',
    tabInfo: 'Informació',
    tabPassword: 'Canviar Contrasenya',
    tabMyBooks: 'Els Meus Llibres',
    tabBorrowed: 'Llibres Prestats',
    updateProfile: 'Actualitzar Perfil',
    currentPassword: 'Contrasenya Actual',
    newPassword: 'Nova Contrasenya',
    confirmNewPassword: 'Confirmar Nova Contrasenya',
    changePassword: 'Canviar Contrasenya',
    uploadPicture: 'Pujar Imatge',
    changePhoto: 'Canviar Foto',
    noBooksAdded: 'No heu afegit cap llibre encara',
    noBorrowed: 'No teniu cap llibre prestat',

    // Borrowing
    borrowedOn: 'Prestat el',
    dueDate: 'Data de retorn',
    overdue: 'ENDARRERIT',

    // Messages
    processing: 'Processant...',
    recognizing: 'Reconeixent llibre...',
    uploading: 'Pujant...',
    loading: 'Carregant...',
    noResults: 'No s\'han trobat llibres',
    confirmDelete: 'Esteu segur que voleu eliminar aquest llibre?',
    confirmBorrow: 'Prestar aquest llibre durant 14 dies?',
    confirmReturn: 'Tornar aquest llibre?',
    loginRequired: 'Inicieu sessió per prestar llibres',

    // Success messages
    bookAdded: 'Llibre afegit correctament',
    bookUpdated: 'Llibre actualitzat correctament',
    bookDeleted: 'Llibre eliminat correctament',
    bookBorrowed: 'Llibre prestat correctament',
    bookReturned: 'Llibre tornat correctament',
    profileUpdated: 'Perfil actualitzat correctament',
    passwordChanged: 'Contrasenya canviada correctament',
    loginSuccess: 'Benvingut de nou!',
    registerSuccess: 'Registre correcte',

    // Error messages
    errorOccurred: 'S\'ha produït un error',
    authRequired: 'Cal autenticació',
    adminRequired: 'Cal accés d\'administrador',
    fillAllFields: 'Si us plau, ompliu tots els camps obligatoris',
    passwordMismatch: 'Les contrasenyes no coincideixen',
    newPasswordMismatch: 'Les noves contrasenyes no coincideixen',
    invalidEmail: 'Adreça de correu electrònic no vàlida',
    bookNotFound: 'Llibre no trobat',
    userDisabled: 'El compte d\'usuari està desactivat',
    connectionError: 'Error de connexió',
    errorLoading: 'Error carregant',
    errorSaving: 'Error desant el llibre',
    errorDeleting: 'Error eliminant el llibre',
    errorSearching: 'Error de cerca',
    errorUploading: 'Error pujant la imatge',
    errorUpdatingProfile: 'Error actualitzant el perfil',
    errorChangingPassword: 'Error canviant la contrasenya',
    errorUploadingPhoto: 'Error pujant la foto',
    errorLogin: 'Error d\'inici de sessió',
    errorRegister: 'Error de registre',
    bookAlreadyExists: 'Aquest llibre ja existeix a la biblioteca',
    bookNotRecognized: 'No s\'ha pogut reconèixer el llibre. Si us plau, introduïu les dades manualment.',
    enterTitleOrISBN: 'Si us plau, introduïu almenys el títol, autor o ISBN per autocompletar.',
    searchingBookInfo: 'Cercant informació del llibre...',
    infoCompleted: '✅ Informació completada correctament. Verifiqueu les dades.',
    infoNotFound: '⚠️ No s\'ha trobat informació addicional. Intenteu-ho amb dades més específiques.',
    errorSearchingInfo: '❌ Error cercant informació. Si us plau, torneu-ho a intentar.',
    searching: 'Cercant...',
    unknownAuthor: 'Autor desconegut',
    manualEntryHelp: 'Entrada manual: Ompliu els camps que coneixeu i feu servir "Autocompletar" per cercar la resta.',
    cameraError: 'No s\'ha pogut accedir a la càmera. Si us plau, assegureu-vos que heu concedit els permisos de càmera.',

    // Recognition methods
    visionAPI: 'API de Google Vision',
    ocrISBN: 'OCR + ISBN',
    ocrTitle: 'OCR + Títol/Autor',
    manual: 'Entrada Manual',
    recognitionMethod: 'Mètode de Reconeixement',

    // Additional UI strings
    loadingBooks: 'Carregant llibres...',
    emptyLibraryTitle: 'No hi ha llibres a la biblioteca',
    emptyLibraryMessage: 'Comença afegint el teu primer llibre fent una foto de la portada',
    addFirstBook: 'Afegir Primer Llibre',
    chooseOption: 'Tria una opció per afegir el teu llibre',
    alreadyHaveAccount: 'Ja tens compte?',
    loginHere: 'Inicia sessió aquí',
    noAccount: 'No tens compte?',
    registerHere: 'Registra\'t aquí',
    saveChanges: 'Desar Canvis',
    loadingBooksEllipsis: 'Carregant llibres...',
    noBooksYet: 'No has afegit cap llibre encara',
    loadingBorrowedBooks: 'Carregant llibres prestats...',
    noBorrowedCurrently: 'No tens cap llibre prestat actualment',
    loginRequiredTitle: 'Cal iniciar sessió',
    loginRequiredMessage: 'Si us plau, inicieu sessió o registreu-vos per accedir a la biblioteca',
    loginToAccess: 'Iniciar Sessió per Accedir a la Biblioteca'
  }
};

// Current language (default: Catalan)
let currentLanguage = localStorage.getItem('appLanguage') || 'ca';

// Get translation for a key
function t(key) {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

// Set language
function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    updateUILanguage();
  }
}

// Get current language
function getCurrentLanguage() {
  return currentLanguage;
}
