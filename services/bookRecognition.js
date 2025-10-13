const Tesseract = require('tesseract.js');
const axios = require('axios');
const sharp = require('sharp');
const imageSearch = require('./imageSearch');

class BookRecognitionService {
  constructor() {
    this.googleBooksApiKey = process.env.GOOGLE_BOOKS_API_KEY;
  }

  /**
   * Extract text from image using OCR
   */
  async extractTextFromImage(imagePath) {
    try {
      console.log('Extracting text from image:', imagePath);

      // Preprocess image for better OCR results
      const processedImagePath = imagePath + '_processed.jpg';
      await sharp(imagePath)
        .greyscale()
        .normalize()
        .sharpen()
        .toFile(processedImagePath);

      const result = await Tesseract.recognize(
        processedImagePath,
        'eng+spa',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      // Clean up processed image
      const fs = require('fs');
      if (fs.existsSync(processedImagePath)) {
        fs.unlinkSync(processedImagePath);
      }

      return result.data.text;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw error;
    }
  }

  /**
   * Extract ISBN from text
   */
  extractISBN(text) {
    // Look for ISBN-13 (978-X-XXX-XXXXX-X or 9783161484100)
    const isbn13Regex = /(?:ISBN(?:-13)?:?\s*)?(?:978|979)[-\s]?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d/gi;
    // Look for ISBN-10 (X-XXX-XXXXX-X or 0123456789)
    const isbn10Regex = /(?:ISBN(?:-10)?:?\s*)?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s][\dX]/gi;

    let matches = text.match(isbn13Regex);
    if (!matches) {
      matches = text.match(isbn10Regex);
    }

    if (matches && matches.length > 0) {
      // Clean ISBN (remove spaces, hyphens)
      return matches[0].replace(/[^0-9X]/gi, '');
    }

    return null;
  }

  /**
   * Search book by ISBN using Google Books API
   */
  async searchByISBN(isbn) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${
        this.googleBooksApiKey ? `&key=${this.googleBooksApiKey}` : ''
      }`;

      const response = await axios.get(url);

      if (response.data.items && response.data.items.length > 0) {
        return this.formatBookData(response.data.items[0]);
      }

      return null;
    } catch (error) {
      console.error('Error searching by ISBN:', error.message);
      return null;
    }
  }

  /**
   * Search book by title and author using Google Books API
   */
  async searchByTitleAuthor(title, author = '') {
    try {
      let query = `intitle:${title}`;
      if (author) {
        query += `+inauthor:${author}`;
      }

      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}${
        this.googleBooksApiKey ? `&key=${this.googleBooksApiKey}` : ''
      }`;

      const response = await axios.get(url);

      if (response.data.items && response.data.items.length > 0) {
        return this.formatBookData(response.data.items[0]);
      }

      return null;
    } catch (error) {
      console.error('Error searching by title/author:', error.message);
      return null;
    }
  }

  /**
   * Try to recognize book from cover image using multiple methods
   */
  async recognizeBook(imagePath) {
    try {
      console.log('Starting enhanced book recognition...');

      // STEP 1: Try Google Reverse Image Search (most accurate for book covers)
      console.log('Step 1: Attempting Google reverse image search with web scraping...');
      const imageSearchResult = await imageSearch.searchByImage(imagePath);

      if (imageSearchResult && imageSearchResult.title) {
        console.log('Book found via reverse image search:', imageSearchResult.title);
        return { ...imageSearchResult, recognitionMethod: 'reverse_image_search' };
      }

      // STEP 2: Try Google Vision API as fallback
      console.log('Step 2: Attempting Google Vision API image search...');
      const visionResult = await imageSearch.searchByImageVision(imagePath);

      if (visionResult) {
        const bookInfoFromVision = imageSearch.extractBookInfoFromVision(visionResult);

        if (bookInfoFromVision && bookInfoFromVision.title) {
          console.log('Vision API found:', bookInfoFromVision);

          // Search Google Books with info from Vision API
          const bookData = await this.searchByTitleAuthor(
            bookInfoFromVision.title,
            bookInfoFromVision.author
          );

          if (bookData) {
            console.log('Book matched via Vision API!');
            return { ...bookData, recognitionMethod: 'vision_api' };
          }
        }
      }

      // STEP 3: Try OCR to extract text from image
      console.log('Step 3: Attempting OCR text extraction...');
      const extractedText = await this.extractTextFromImage(imagePath);
      console.log('Extracted text:', extractedText.substring(0, 200));

      // STEP 4: Try to find ISBN from OCR text
      const isbn = this.extractISBN(extractedText);

      if (isbn) {
        console.log('Found ISBN:', isbn);
        const bookData = await this.searchByISBN(isbn);
        if (bookData) {
          console.log('Book matched via ISBN!');
          return { ...bookData, recognitionMethod: 'isbn_ocr' };
        }
      }

      // STEP 5: If no ISBN found, try to extract title from OCR text
      const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        // Assume first non-empty lines might be the title
        const possibleTitle = lines[0].trim();
        const possibleAuthor = lines.length > 1 ? lines[1].trim() : '';

        console.log('Attempting search with title:', possibleTitle);
        const bookData = await this.searchByTitleAuthor(possibleTitle, possibleAuthor);
        if (bookData) {
          console.log('Book matched via OCR title!');
          return { ...bookData, recognitionMethod: 'title_ocr' };
        }
      }

      console.log('Could not recognize book with any method');
      return null;
    } catch (error) {
      console.error('Error recognizing book:', error);
      throw error;
    }
  }

  /**
   * Complete partial book data by searching
   */
  async completeBookData(partialData) {
    try {
      console.log('Completing book data with partial information:', partialData);

      // Use the image search service to complete the data
      const completedData = await imageSearch.completeBookData(partialData);

      if (completedData) {
        console.log('Successfully completed book data');
        return completedData;
      }

      console.log('Could not complete book data');
      return partialData;
    } catch (error) {
      console.error('Error completing book data:', error);
      return partialData;
    }
  }

  /**
   * Format book data from Google Books API response
   */
  formatBookData(item) {
    const volumeInfo = item.volumeInfo;

    return {
      google_books_id: item.id,
      title: volumeInfo.title || 'Unknown Title',
      author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author',
      isbn: this.extractISBNFromIdentifiers(volumeInfo.industryIdentifiers),
      publisher: volumeInfo.publisher || '',
      published_date: volumeInfo.publishedDate || '',
      description: volumeInfo.description || '',
      page_count: volumeInfo.pageCount || 0,
      categories: volumeInfo.categories ? volumeInfo.categories.join(', ') : '',
      language: volumeInfo.language || '',
      thumbnail_image: volumeInfo.imageLinks?.thumbnail || '',
      cover_image: volumeInfo.imageLinks?.smallThumbnail || volumeInfo.imageLinks?.thumbnail || '',
      rating: volumeInfo.averageRating || 0
    };
  }

  /**
   * Extract ISBN from industry identifiers
   */
  extractISBNFromIdentifiers(identifiers) {
    if (!identifiers) return '';

    const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
    if (isbn13) return isbn13.identifier;

    const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
    if (isbn10) return isbn10.identifier;

    return '';
  }
}

module.exports = new BookRecognitionService();
