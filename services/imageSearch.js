const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ImageSearchService {
  constructor() {
    this.googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY;
    this.browser = null;
  }

  /**
   * Initialize browser for web scraping
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Upload image to Google Lens and perform reverse image search
   */
  async reverseImageSearch(imagePath) {
    let page = null;
    try {
      console.log('=== Starting Google Lens reverse image search ===');
      console.log('Image path:', imagePath);

      const browser = await this.initBrowser();
      console.log('Browser initialized');

      page = await browser.newPage();
      console.log('New page created');

      // Enable console logging from the page
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));
      page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      console.log('User agent set');

      // Use Google Lens upload endpoint directly
      console.log('Navigating to Google Lens upload page...');
      await page.goto('https://lens.google.com/upload', { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('Page loaded, current URL:', page.url());

      // Wait for file input to appear
      console.log('Waiting for file input...');
      await page.waitForSelector('input[type="file"]', { timeout: 10000 });
      console.log('File input found');

      // Upload the image file
      const fileInput = await page.$('input[type="file"]');
      console.log('Uploading file...');
      await fileInput.uploadFile(imagePath);
      console.log('File uploaded, waiting for processing...');

      // Wait for results to load - use setTimeout instead of waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 8000));
      console.log('Wait complete, current URL:', page.url());

      // Take a screenshot for debugging
      const screenshotPath = 'debug-lens-' + Date.now() + '.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('Screenshot saved to:', screenshotPath);

      // Try to wait for navigation or results
      try {
        console.log('Checking if page has results...');
        await page.waitForSelector('a[href*="amazon"], a[href*="goodreads"], a[href*="books"], div[role="link"]', { timeout: 5000 });
        console.log('Found result elements');
      } catch (e) {
        console.log('No specific result selectors found after upload, proceeding with page scraping...');
      }

      // Get page content
      const htmlContent = await page.content();
      console.log('Page HTML length:', htmlContent.length);

      // Extract search results from Google Lens
      console.log('Extracting results from page...');
      const results = await page.evaluate(() => {
        const data = {
          bestGuess: '',
          titles: [],
          links: [],
          amazonLinks: [],
          goodreadsLinks: [],
          allText: []
        };

        // Try to find the main title/best guess in various places
        const titleSelectors = [
          'h1', 'h2', 'h3', '[class*="title"]', '[class*="heading"]',
          '[data-text-content]', '[class*="product"]', '[role="heading"]'
        ];

        console.log('Searching for titles...');
        for (const selector of titleSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements for selector: ${selector}`);
          }
          elements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 5 && text.length < 200 && !data.titles.includes(text)) {
              data.titles.push(text);
              console.log('Found title:', text);
            }
          });
        }

        // Get all text content
        const allElements = document.querySelectorAll('div, span, p, a');
        allElements.forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 10 && text.length < 150) {
            data.allText.push(text);
          }
        });

        // Set best guess from first title
        if (data.titles.length > 0) {
          data.bestGuess = data.titles[0];
        }

        // Get all links
        console.log('Searching for links...');
        const linkElements = document.querySelectorAll('a[href]');
        console.log(`Found ${linkElements.length} total links`);

        linkElements.forEach(link => {
          const href = link.href;
          const text = link.textContent.trim();

          if (href.includes('amazon.') && !data.amazonLinks.includes(href)) {
            console.log('Found Amazon link:', href);
            data.amazonLinks.push(href);
          } else if (href.includes('goodreads.com') && !data.goodreadsLinks.includes(href)) {
            console.log('Found Goodreads link:', href);
            data.goodreadsLinks.push(href);
          }

          if (href && !href.includes('google.com') && !href.includes('lens.google') && !href.startsWith('javascript:')) {
            if (!data.links.includes(href)) {
              data.links.push(href);
            }
          }
        });

        return data;
      });

      console.log('=== Reverse image search results ===');
      console.log('Best guess:', results.bestGuess);
      console.log('Titles found:', results.titles.length, results.titles.slice(0, 5));
      console.log('Amazon links:', results.amazonLinks.length, results.amazonLinks);
      console.log('Goodreads links:', results.goodreadsLinks.length, results.goodreadsLinks);
      console.log('Total external links:', results.links.length);
      console.log('Sample text:', results.allText.slice(0, 10));

      // If no results from Lens, try extracting book title from text
      if (!results.bestGuess && results.allText.length > 0) {
        console.log('No best guess found, trying to extract from text...');
        // Look for book-like titles (capitalized words)
        for (const text of results.allText) {
          if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/.test(text) && text.length > 10) {
            results.bestGuess = text;
            console.log('Extracted title from text:', text);
            break;
          }
        }
      }

      return results;
    } catch (error) {
      console.error('!!! Error in reverse image search !!!');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      // Try to get page state on error
      if (page) {
        try {
          console.log('Page URL on error:', await page.url());
          await page.screenshot({ path: 'error-lens-' + Date.now() + '.png' });
          console.log('Error screenshot saved');
        } catch (e) {
          console.log('Could not capture error state');
        }
      }

      return null;
    }
  }

  /**
   * Scrape book details from Amazon product page
   */
  async scrapeAmazon(url) {
    try {
      console.log('Scraping Amazon:', url);
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const bookData = await page.evaluate(() => {
        const data = {
          title: '',
          author: '',
          publisher: '',
          isbn: '',
          description: '',
          pageCount: 0,
          publishedDate: ''
        };

        // Title
        const titleEl = document.querySelector('#productTitle, h1[id*="title"]');
        if (titleEl) data.title = titleEl.textContent.trim();

        // Author
        const authorEl = document.querySelector('.author a, .contributorNameID, a[data-a-target*="author"]');
        if (authorEl) data.author = authorEl.textContent.trim();

        // Details section
        const detailsSection = document.querySelector('#detailBullets_feature_div, #detail-bullets, .detail-bullet-list');
        if (detailsSection) {
          const text = detailsSection.textContent;

          // ISBN
          const isbnMatch = text.match(/ISBN-13[:\s]+([0-9-]+)/i) || text.match(/ISBN[:\s]+([0-9-]+)/i);
          if (isbnMatch) data.isbn = isbnMatch[1].replace(/-/g, '');

          // Publisher
          const publisherMatch = text.match(/Publisher[:\s]+([^;(]+)/i);
          if (publisherMatch) data.publisher = publisherMatch[1].trim();

          // Pages
          const pagesMatch = text.match(/([0-9]+)\s+pages/i);
          if (pagesMatch) data.pageCount = parseInt(pagesMatch[1]);

          // Publication date
          const dateMatch = text.match(/Publication date[:\s]+([A-Za-z]+\s+[0-9]+,\s+[0-9]+)/i);
          if (dateMatch) data.publishedDate = dateMatch[1];
        }

        // Description
        const descEl = document.querySelector('#bookDescription_feature_div, #feature-bullets');
        if (descEl) data.description = descEl.textContent.trim().substring(0, 500);

        return data;
      });

      console.log('Amazon scraping result:', bookData.title ? 'Success' : 'No data');
      return bookData.title ? bookData : null;
    } catch (error) {
      console.error('Error scraping Amazon:', error.message);
      return null;
    }
  }

  /**
   * Scrape book details from Goodreads
   */
  async scrapeGoodreads(url) {
    try {
      console.log('Scraping Goodreads:', url);
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const bookData = await page.evaluate(() => {
        const data = {
          title: '',
          author: '',
          publisher: '',
          isbn: '',
          description: '',
          pageCount: 0,
          publishedDate: '',
          rating: 0
        };

        // Title
        const titleEl = document.querySelector('h1[data-testid="bookTitle"], h1.Text');
        if (titleEl) data.title = titleEl.textContent.trim();

        // Author
        const authorEl = document.querySelector('.ContributorLink__name, a.authorName');
        if (authorEl) data.author = authorEl.textContent.trim();

        // Rating
        const ratingEl = document.querySelector('.RatingStatistics__rating, span[itemprop="ratingValue"]');
        if (ratingEl) data.rating = parseFloat(ratingEl.textContent.trim());

        // Details
        const detailsText = document.body.textContent;

        // ISBN
        const isbnMatch = detailsText.match(/ISBN[:\s]+([0-9-]+)/i);
        if (isbnMatch) data.isbn = isbnMatch[1].replace(/-/g, '');

        // Pages
        const pagesMatch = detailsText.match(/([0-9]+)\s+pages/i);
        if (pagesMatch) data.pageCount = parseInt(pagesMatch[1]);

        // Published
        const publishedMatch = detailsText.match(/Published\s+([A-Za-z]+\s+[0-9]+,?\s+[0-9]+)/i);
        if (publishedMatch) data.publishedDate = publishedMatch[1];

        const publisherMatch = detailsText.match(/by\s+([^(]+)\(/i);
        if (publisherMatch) data.publisher = publisherMatch[1].trim();

        // Description
        const descEl = document.querySelector('.BookPageMetadataSection__description, #description');
        if (descEl) data.description = descEl.textContent.trim().substring(0, 500);

        return data;
      });

      console.log('Goodreads scraping result:', bookData.title ? 'Success' : 'No data');
      return bookData.title ? bookData : null;
    } catch (error) {
      console.error('Error scraping Goodreads:', error.message);
      return null;
    }
  }

  /**
   * Main function to search book by cover image
   */
  async searchByImage(imagePath) {
    try {
      console.log('Starting book search by cover image...');

      // Step 1: Perform reverse image search
      const searchResults = await this.reverseImageSearch(imagePath);

      if (!searchResults) {
        console.log('Reverse image search failed');
        return null;
      }

      let bookData = null;

      // Step 2: Try to scrape Amazon links first
      if (searchResults.amazonLinks.length > 0) {
        for (const amazonUrl of searchResults.amazonLinks.slice(0, 3)) {
          bookData = await this.scrapeAmazon(amazonUrl);
          if (bookData && bookData.title) {
            console.log('Successfully scraped book data from Amazon');
            break;
          }
        }
      }

      // Step 3: Try Goodreads if Amazon didn't work
      if (!bookData && searchResults.goodreadsLinks.length > 0) {
        for (const goodreadsUrl of searchResults.goodreadsLinks.slice(0, 2)) {
          bookData = await this.scrapeGoodreads(goodreadsUrl);
          if (bookData && bookData.title) {
            console.log('Successfully scraped book data from Goodreads');
            break;
          }
        }
      }

      // Step 4: If scraping failed, use Google's best guess
      if (!bookData && searchResults.bestGuess) {
        console.log('Using Google best guess:', searchResults.bestGuess);
        bookData = {
          title: this.extractTitleFromGuess(searchResults.bestGuess),
          author: this.extractAuthorFromGuess(searchResults.bestGuess),
          description: '',
          isbn: '',
          publisher: '',
          pageCount: 0,
          publishedDate: ''
        };
      }

      // Step 5: Try to complete data using Google Books API
      if (bookData && bookData.title) {
        const completedData = await this.searchGoogleBooksByPartialInfo(bookData);
        if (completedData && completedData.length > 0) {
          // Merge scraped data with Google Books data
          return {
            ...completedData[0],
            // Keep scraped data as priority for certain fields
            ...(bookData.description && { description: bookData.description }),
            ...(bookData.rating && { rating: bookData.rating })
          };
        }
        return bookData;
      }

      console.log('Could not extract book information from image search');
      return null;
    } catch (error) {
      console.error('Error in image search:', error);
      return null;
    } finally {
      // Keep browser open for subsequent searches, will be closed when service stops
    }
  }

  /**
   * Extract title from Google's best guess
   */
  extractTitleFromGuess(guess) {
    // Remove common patterns
    let title = guess.replace(/\s*by\s+.*/i, '');
    title = title.replace(/\s*-\s+.*/i, '');
    title = title.replace(/^book:\s*/i, '');
    return title.trim();
  }

  /**
   * Extract author from Google's best guess
   */
  extractAuthorFromGuess(guess) {
    const byMatch = guess.match(/by\s+([^-]+)/i);
    if (byMatch) {
      return byMatch[1].trim();
    }
    return '';
  }

  /**
   * Use Google Vision API to detect web entities and similar images (fallback method)
   */
  async searchByImageVision(imagePath) {
    if (!this.googleVisionApiKey) {
      console.log('Google Vision API key not configured, skipping vision search');
      return null;
    }

    try {
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
