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
        'eng+spa+cat+deu+fra', // English, Spanish, Catalan, German, French
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
   * Now includes comprehensive error handling with fallback chain:
   * 1. Google Books API (primary)
   * 2. OpenLibrary covers (with size validation)
   * 3. Google Images search (if configured)
   */
  async searchByISBN(isbn) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${
        this.googleBooksApiKey ? `&key=${this.googleBooksApiKey}` : ''
      }`;
      console.log('\n=== COVER SEARCH: Starting search for ISBN:', isbn, '===');
      console.log('COVER SEARCH [Step 1]: Calling Google Books API');
      console.log('COVER SEARCH [API Call]: GET', url);

      const response = await axios.get(url);
      console.log('COVER SEARCH [API Response]: Google Books returned', response.data.items?.length || 0, 'items');

      if (response.data.items && response.data.items.length > 0) {
        console.log('COVER SEARCH [Raw Response]:', JSON.stringify(response.data.items[0].volumeInfo?.imageLinks, null, 2));

        const bookData = this.formatBookData(response.data.items[0]);

        console.log('COVER SEARCH [Formatted]: cover_image =', bookData.cover_image || '(empty)');
        console.log('COVER SEARCH [Formatted]: thumbnail_image =', bookData.thumbnail_image || '(empty)');

        // Validate and fix cover images
        await this.validateAndFixCoverImages(bookData, isbn);

        return bookData;
      }

      console.log('COVER SEARCH: No items found in Google Books response');
      console.log('COVER SEARCH [Fallback]: Trying OpenLibrary for book metadata');
      return await this.searchOpenLibrary(isbn);
    } catch (error) {
      console.error('COVER SEARCH [ERROR]: Google Books API failed:', error.message);
      console.log('COVER SEARCH [Fallback]: Trying OpenLibrary for book metadata');
      return await this.searchOpenLibrary(isbn);
    }
  }

  /**
   * Search OpenLibrary for book metadata by ISBN
   * Used as fallback when Google Books fails
   */
  async searchOpenLibrary(isbn) {
    try {
      const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`;
      console.log('COVER SEARCH [OpenLibrary Metadata]: Calling OpenLibrary API');
      console.log('COVER SEARCH [API Call]: GET', url);

      const response = await axios.get(url);
      console.log('COVER SEARCH [API Response]:', JSON.stringify(response.data, null, 2));

      const key = `ISBN:${isbn}`;
      const bookInfo = response.data[key];

      if (!bookInfo) {
        console.log('COVER SEARCH [OpenLibrary Metadata]: No book found');
        return null;
      }

      // Format OpenLibrary data to match our schema
      const bookData = {
        title: bookInfo.title || '',
        author: bookInfo.authors ? bookInfo.authors.map(a => a.name).join(', ') : '',
        isbn: isbn,
        publisher: bookInfo.publishers ? bookInfo.publishers[0]?.name || '' : '',
        published_date: bookInfo.publish_date || '',
        description: bookInfo.notes || '',
        page_count: bookInfo.number_of_pages || '',
        language: '',
        categories: bookInfo.subjects ? bookInfo.subjects.map(s => s.name).join(', ') : '',
        cover_image: bookInfo.cover?.large || bookInfo.cover?.medium || '',
        thumbnail_image: bookInfo.cover?.small || bookInfo.cover?.medium || '',
        google_books_id: '',
        source: 'openlibrary'
      };

      console.log('COVER SEARCH [OpenLibrary Metadata]: Book found:', bookData.title);
      console.log('COVER SEARCH [OpenLibrary Metadata]: cover_image =', bookData.cover_image || '(empty)');

      // Ensure HTTPS for cover images
      if (bookData.cover_image) {
        bookData.cover_image = bookData.cover_image.replace('http://', 'https://');
      }
      if (bookData.thumbnail_image) {
        bookData.thumbnail_image = bookData.thumbnail_image.replace('http://', 'https://');
      }

      // If no cover from metadata API, try the direct cover endpoint
      if (!bookData.cover_image && !bookData.thumbnail_image) {
        const directCover = await this.getCoverImageFromAlternativeSources(isbn);
        if (directCover) {
          bookData.cover_image = directCover;
          bookData.thumbnail_image = directCover;
        }
      }

      return bookData;
    } catch (error) {
      console.error('COVER SEARCH [OpenLibrary Metadata ERROR]:', error.message);
      return null;
    }
  }

  /**
   * Validates cover images and applies fallback chain if needed
   * Handles: empty URLs, small placeholders, invalid images
   */
  async validateAndFixCoverImages(bookData, isbn) {
    let coverImage = bookData.cover_image || '';
    let thumbnailImage = bookData.thumbnail_image || '';

    console.log('COVER SEARCH [Step 2]: Validating cover images from Google Books');
    console.log('COVER SEARCH [Validation]: cover_image =', coverImage || '(empty)');
    console.log('COVER SEARCH [Validation]: thumbnail_image =', thumbnailImage || '(empty)');

    // Ensure HTTPS
    if (coverImage) coverImage = coverImage.replace('http://', 'https://');
    if (thumbnailImage) thumbnailImage = thumbnailImage.replace('http://', 'https://');

    // Step 1: Check if Google Books provided valid images
    if (!coverImage && !thumbnailImage) {
      console.log('COVER SEARCH [Decision]: No cover images from Google Books, proceeding to fallback chain');
      await this.applyCoverFallbackChain(bookData, isbn);
      return;
    }

    // Step 2: Validate the provided image URLs
    const primaryUrl = coverImage || thumbnailImage;
    console.log('COVER SEARCH [Validation]: Making HEAD request to validate image');
    console.log('COVER SEARCH [API Call]: HEAD', primaryUrl);

    try {
      // Make a HEAD request to check image validity
      const headResponse = await axios.head(primaryUrl, { timeout: 5000 });
      const contentLength = parseInt(headResponse.headers['content-length'] || '0');
      const contentType = headResponse.headers['content-type'] || '';

      console.log('COVER SEARCH [API Response]: Content-Length:', contentLength, 'bytes');
      console.log('COVER SEARCH [API Response]: Content-Type:', contentType);

      // Check if it's too small (likely a placeholder)
      if (contentLength < 1000 || !contentType.startsWith('image/')) {
        console.log('COVER SEARCH [Decision]: Image invalid (size < 1000 bytes or wrong type), trying fallbacks');
        await this.applyCoverFallbackChain(bookData, isbn);
        return;
      }

      // If valid, ensure both fields are populated
      bookData.cover_image = coverImage || thumbnailImage;
      bookData.thumbnail_image = thumbnailImage || coverImage;
      console.log('COVER SEARCH [Success]: Primary cover validated and accepted ✓');

    } catch (error) {
      console.log('COVER SEARCH [ERROR]: HEAD request failed:', error.message);
      console.log('COVER SEARCH [Decision]: Proceeding to fallback chain');
      await this.applyCoverFallbackChain(bookData, isbn);
    }
  }

  /**
   * Apply fallback chain for cover images
   * 1. OpenLibrary (with validation)
   * 2. Google Images (if API configured)
   */
  async applyCoverFallbackChain(bookData, isbn) {
    console.log('COVER SEARCH [Step 3]: Starting fallback chain');

    // Try OpenLibrary first
    console.log('COVER SEARCH [Step 3a]: Trying OpenLibrary');
    const openLibraryCover = await this.getCoverImageFromAlternativeSources(isbn);
    if (openLibraryCover) {
      bookData.cover_image = openLibraryCover;
      bookData.thumbnail_image = openLibraryCover;
      console.log('COVER SEARCH [Success]: Using OpenLibrary cover ✓');
      return;
    }

    // Try Google Images as last resort (if API is configured)
    console.log('COVER SEARCH [Step 3b]: Trying Google Custom Search API');
    const googleImagesCover = await this.searchCoverViaGoogleImages(bookData);
    if (googleImagesCover) {
      bookData.cover_image = googleImagesCover;
      bookData.thumbnail_image = googleImagesCover;
      console.log('COVER SEARCH [Success]: Using Google Images cover ✓');
      return;
    }

    console.log('COVER SEARCH [Final]: All methods exhausted, no valid cover found');
    console.log('COVER SEARCH [Final]: Setting needsManualCoverSearch flag');
    // Mark that we need manual search
    bookData.needsManualCoverSearch = true;
  }

  /**
   * Search for book cover using Google Custom Search API
   * Returns null if API not configured or no results found
   */
  async searchCoverViaGoogleImages(bookData) {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      console.log('COVER SEARCH [Google Images]: Checking API configuration');
      console.log('COVER SEARCH [Google Images]: API Key configured?', !!apiKey);
      console.log('COVER SEARCH [Google Images]: Search Engine ID configured?', !!searchEngineId);

      if (!apiKey || !searchEngineId) {
        console.log('COVER SEARCH [Google Images]: API not configured, skipping');
        return null;
      }

      const query = `${bookData.title} ${bookData.author} book cover`;
      console.log('COVER SEARCH [Google Images]: Search query:', query);

      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=5&imgSize=medium&safe=active`;
      console.log('COVER SEARCH [API Call]: GET', searchUrl.replace(apiKey, 'REDACTED'));

      const response = await axios.get(searchUrl, { timeout: 10000 });
      console.log('COVER SEARCH [API Response]: Found', response.data.items?.length || 0, 'results');

      if (response.data.items && response.data.items.length > 0) {
        console.log('COVER SEARCH [Google Images]: Validating each result...');

        // Try each result until we find a valid one
        for (let i = 0; i < response.data.items.length; i++) {
          const item = response.data.items[i];
          const imageUrl = item.link;

          console.log(`COVER SEARCH [Google Images]: Result ${i + 1}/${response.data.items.length}:`, imageUrl);

          // Skip OpenLibrary URLs (we already tried those)
          if (imageUrl.includes('covers.openlibrary.org')) {
            console.log('COVER SEARCH [Google Images]: Skipping (OpenLibrary URL)');
            continue;
          }

          console.log('COVER SEARCH [API Call]: HEAD', imageUrl);

          // Validate the image
          try {
            const headResponse = await axios.head(imageUrl, { timeout: 5000 });
            const contentLength = parseInt(headResponse.headers['content-length'] || '0');
            const contentType = headResponse.headers['content-type'] || '';

            console.log('COVER SEARCH [API Response]: Content-Length:', contentLength, 'bytes');
            console.log('COVER SEARCH [API Response]: Content-Type:', contentType);

            if (contentLength > 1000 && contentType.startsWith('image/')) {
              console.log('COVER SEARCH [Google Images]: Valid image found ✓');
              return imageUrl;
            } else {
              console.log('COVER SEARCH [Google Images]: Rejected (too small or wrong type)');
            }
          } catch (validationError) {
            console.log('COVER SEARCH [Google Images ERROR]:', validationError.message);
            continue;
          }
        }

        console.log('COVER SEARCH [Google Images]: No valid images in results');
      } else {
        console.log('COVER SEARCH [Google Images]: No results returned by API');
      }

      return null;
    } catch (error) {
      console.error('COVER SEARCH [Google Images ERROR]:', error.message);
      return null;
    }
  }

  /**
   * Get cover image from alternative sources (OpenLibrary, etc)
   * Note: We check if the image is valid (not a 1x1 placeholder)
   */
  async getCoverImageFromAlternativeSources(isbn) {
    // Try OpenLibrary - but we need to verify it's not a placeholder
    const olCover = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

    console.log('COVER SEARCH [OpenLibrary]: Checking cover availability');
    console.log('COVER SEARCH [API Call]: HEAD', olCover);

    try {
      // Make a HEAD request to check if the image exists
      const response = await axios.head(olCover);

      console.log('COVER SEARCH [API Response]: Status', response.status);
      console.log('COVER SEARCH [API Response]: Headers:', JSON.stringify(response.headers, null, 2));

      // Check Content-Length - if it's tiny (< 1000 bytes), it's likely a placeholder
      const contentLength = parseInt(response.headers['content-length'] || '0');
      console.log('COVER SEARCH [OpenLibrary]: Content-Length:', contentLength, 'bytes');

      if (contentLength > 1000) {
        console.log('COVER SEARCH [OpenLibrary]: Valid cover found (> 1000 bytes) ✓');
        return olCover;
      } else {
        console.log('COVER SEARCH [OpenLibrary]: Rejected - placeholder image (< 1000 bytes)');
      }
    } catch (error) {
      console.log('COVER SEARCH [OpenLibrary ERROR]:', error.message);
    }

    return null;
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

      // STEP 5: If no ISBN found, try to extract title from OCR text with improved logic
      const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
      console.log('OCR extracted lines:', lines);

      if (lines.length > 0) {
        // Clean and combine lines to find title and author
        const cleanedLines = lines.map(line => line.trim().replace(/[^\w\s]/g, ' ').trim());

        // Try multiple line combinations as potential titles
        const titleCombinations = [
          cleanedLines[0], // First line only
          cleanedLines.slice(0, 2).join(' '), // First two lines
          cleanedLines.slice(0, 3).join(' ')  // First three lines
        ];

        for (const possibleTitle of titleCombinations) {
          if (possibleTitle && possibleTitle.length >= 3) {
            console.log('Attempting search with title:', possibleTitle);

            // Try with author if available
            const possibleAuthor = cleanedLines[1] || '';
            let bookData = await this.searchByTitleAuthor(possibleTitle, possibleAuthor);

            if (!bookData && possibleAuthor) {
              // Try without author if first attempt failed
              bookData = await this.searchByTitleAuthor(possibleTitle, '');
            }

            if (bookData) {
              console.log('Book matched via OCR title!');
              return { ...bookData, recognitionMethod: 'title_ocr' };
            }
          }
        }

        // Try searching with author name if it looks like a name
        for (const line of cleanedLines) {
          if (line.split(' ').length === 2 && line.length > 5 && line.length < 30) {
            console.log('Attempting search by potential author:', line);
            const bookData = await this.searchByTitleAuthor('', line);
            if (bookData) {
              console.log('Book matched via author name!');
              return { ...bookData, recognitionMethod: 'author_ocr' };
            }
          }
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
