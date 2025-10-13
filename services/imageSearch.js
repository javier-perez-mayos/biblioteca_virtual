const axios = require('axios');
const cheerio = require('cheerio');

class ImageSearchService {
  constructor() {
    this.googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY;
  }

  /**
   * Use Google Vision API to detect web entities and similar images
   */
  async searchByImageVision(imagePath) {
    if (!this.googleVisionApiKey) {
      console.log('Google Vision API key not configured, skipping vision search');
      return null;
    }

    try {
      const fs = require('fs');
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.googleVisionApiKey}`,
        {
          requests: [
            {
              image: { content: base64Image },
              features: [
                { type: 'WEB_DETECTION', maxResults: 10 },
                { type: 'TEXT_DETECTION' }
              ]
            }
          ]
        }
      );

      const webDetection = response.data.responses[0]?.webDetection;
      const textAnnotations = response.data.responses[0]?.textAnnotations;

      if (!webDetection) {
        return null;
      }

      // Extract book information from web entities
      const bookInfo = {
        entities: webDetection.webEntities || [],
        bestGuess: webDetection.bestGuessLabels?.[0]?.label || '',
        fullMatchingImages: webDetection.fullMatchingImages || [],
        partialMatchingImages: webDetection.partialMatchingImages || [],
        pagesWithMatchingImages: webDetection.pagesWithMatchingImages || [],
        extractedText: textAnnotations?.[0]?.description || ''
      };

      return bookInfo;
    } catch (error) {
      console.error('Error in Google Vision API search:', error.message);
      return null;
    }
  }

  /**
   * Search for book using SerpApi Google Images (alternative to Vision API)
   */
  async searchByImageUrl(imageUrl) {
    try {
      // Use Google Reverse Image Search
      const searchUrl = `https://www.google.com/searchbyimage?image_url=${encodeURIComponent(imageUrl)}&encoded_image=&image_content=&filename=&hl=en`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Try to extract book title and author from search results
      const results = {
        title: '',
        possibleTitles: [],
        possibleAuthors: []
      };

      // Look for book-related text in the results
      $('h3, .title, .product-title').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 0 && text.length < 200) {
          results.possibleTitles.push(text);
        }
      });

      return results.possibleTitles.length > 0 ? results : null;
    } catch (error) {
      console.error('Error in image URL search:', error.message);
      return null;
    }
  }

  /**
   * Extract book information from Vision API results
   */
  extractBookInfoFromVision(visionResult) {
    if (!visionResult) return null;

    const bookInfo = {
      title: '',
      author: '',
      keywords: []
    };

    // Use best guess label as potential title
    if (visionResult.bestGuess) {
      bookInfo.title = visionResult.bestGuess;
    }

    // Extract entities that might be book titles or authors
    visionResult.entities.forEach(entity => {
      if (entity.score > 0.5) {
        bookInfo.keywords.push(entity.description);
      }
    });

    // Try to parse title and author from the best guess or entities
    if (bookInfo.keywords.length > 0) {
      const firstKeyword = bookInfo.keywords[0];

      // Common patterns: "Title by Author", "Title - Author", "Book: Title"
      const byPattern = / by /i;
      const dashPattern = / - /i;

      if (byPattern.test(firstKeyword)) {
        const parts = firstKeyword.split(byPattern);
        bookInfo.title = parts[0].trim();
        bookInfo.author = parts[1]?.trim() || '';
      } else if (dashPattern.test(firstKeyword)) {
        const parts = firstKeyword.split(dashPattern);
        bookInfo.title = parts[0].trim();
        bookInfo.author = parts[1]?.trim() || '';
      } else {
        bookInfo.title = firstKeyword;
      }
    }

    return bookInfo;
  }

  /**
   * Search Google Books by partial information
   */
  async searchGoogleBooksByPartialInfo(partialInfo) {
    try {
      let query = '';

      if (partialInfo.title) {
        query += `intitle:${partialInfo.title}`;
      }

      if (partialInfo.author) {
        query += (query ? '+' : '') + `inauthor:${partialInfo.author}`;
      }

      if (partialInfo.isbn) {
        query = `isbn:${partialInfo.isbn}`;
      }

      if (!query) {
        return null;
      }

      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}${
        apiKey ? `&key=${apiKey}` : ''
      }`;

      const response = await axios.get(url);

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items.map(item => this.formatBookData(item));
      }

      return null;
    } catch (error) {
      console.error('Error searching Google Books with partial info:', error.message);
      return null;
    }
  }

  /**
   * Complete partial book data by searching Google Books
   */
  async completeBookData(partialData) {
    try {
      console.log('Attempting to complete book data with:', partialData);

      // Search with available information
      const results = await this.searchGoogleBooksByPartialInfo(partialData);

      if (results && results.length > 0) {
        // Take the best match (first result)
        const bestMatch = results[0];

        // Merge with existing data, keeping user-provided data as priority
        return {
          ...bestMatch,
          ...Object.fromEntries(
            Object.entries(partialData).filter(([_, v]) => v !== undefined && v !== '')
          )
        };
      }

      return null;
    } catch (error) {
      console.error('Error completing book data:', error);
      return null;
    }
  }

  /**
   * Format book data from Google Books API response
   */
  formatBookData(item) {
    const volumeInfo = item.volumeInfo;

    return {
      google_books_id: item.id,
      title: volumeInfo.title || '',
      author: volumeInfo.authors ? volumeInfo.authors.join(', ') : '',
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

module.exports = new ImageSearchService();
