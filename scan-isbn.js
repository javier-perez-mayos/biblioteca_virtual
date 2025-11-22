#!/usr/bin/env node

/**
 * Standalone Barcode Scanner - ISBN Extraction
 *
 * This script scans barcodes from images and extracts ISBN numbers.
 * Supports both ISBN-10 and ISBN-13 formats.
 *
 * Usage:
 *   node scan-isbn.js <image-path>
 *
 * Requirements:
 *   npm install quagga jimp
 */

const Quagga = require('quagga');
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

/**
 * Validates if a string is a valid ISBN-10 or ISBN-13
 */
function isValidISBN(code) {
    // Remove hyphens and spaces
    const cleaned = code.replace(/[-\s]/g, '');

    // Check if it's ISBN-13 (13 digits starting with 978 or 979)
    if (/^(978|979)\d{10}$/.test(cleaned)) {
        return validateISBN13(cleaned);
    }

    // Check if it's ISBN-10 (10 digits)
    if (/^\d{9}[\dX]$/.test(cleaned)) {
        return validateISBN10(cleaned);
    }

    return false;
}

/**
 * Validates ISBN-13 checksum
 */
function validateISBN13(isbn) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(isbn[12]);
}

/**
 * Validates ISBN-10 checksum
 */
function validateISBN10(isbn) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(isbn[i]) * (10 - i);
    }
    const lastChar = isbn[9];
    sum += (lastChar === 'X' ? 10 : parseInt(lastChar));
    return sum % 11 === 0;
}

/**
 * Converts ISBN-10 to ISBN-13
 */
function convertISBN10to13(isbn10) {
    const cleaned = isbn10.replace(/[-\s]/g, '').substring(0, 9);
    const base = '978' + cleaned;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    return base + checkDigit;
}

/**
 * Formats ISBN with hyphens for readability
 */
function formatISBN(isbn) {
    const cleaned = isbn.replace(/[-\s]/g, '');

    if (cleaned.length === 13) {
        // Format: 978-0-123-45678-9
        return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 4)}-${cleaned.substring(4, 7)}-${cleaned.substring(7, 12)}-${cleaned.substring(12)}`;
    } else if (cleaned.length === 10) {
        // Format: 0-123-45678-9
        return `${cleaned.substring(0, 1)}-${cleaned.substring(1, 4)}-${cleaned.substring(4, 9)}-${cleaned.substring(9)}`;
    }

    return isbn;
}

/**
 * Scans barcode from image file
 */
async function scanBarcodeFromImage(imagePath) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`Reading image: ${imagePath}`);

            // Read and prepare image
            const image = await Jimp.read(imagePath);
            const width = image.bitmap.width;
            const height = image.bitmap.height;

            console.log(`Image size: ${width}x${height}`);

            // Save a temp file in proper format
            const tempPath = path.join(__dirname, 'temp-barcode.jpg');
            await image.write(tempPath);

            // Configure Quagga
            Quagga.decodeSingle({
                src: tempPath,
                numOfWorkers: 0,
                locate: true,
                inputStream: {
                    size: width
                },
                decoder: {
                    readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader']
                }
            }, (result) => {
                // Clean up temp file
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }

                if (result && result.codeResult) {
                    const code = result.codeResult.code;
                    const format = result.codeResult.format;

                    console.log(`\n✅ Barcode detected!`);
                    console.log(`Format: ${format}`);
                    console.log(`Raw code: ${code}`);

                    // Check if it's a valid ISBN
                    if (isValidISBN(code)) {
                        const cleaned = code.replace(/[-\s]/g, '');
                        let isbn13 = cleaned;

                        if (cleaned.length === 10) {
                            isbn13 = convertISBN10to13(cleaned);
                            console.log(`\n📚 Valid ISBN-10: ${formatISBN(cleaned)}`);
                            console.log(`📚 Converted to ISBN-13: ${formatISBN(isbn13)}`);
                        } else {
                            console.log(`\n📚 Valid ISBN-13: ${formatISBN(cleaned)}`);
                        }

                        resolve({
                            success: true,
                            isbn10: cleaned.length === 10 ? cleaned : null,
                            isbn13: isbn13,
                            formatted: formatISBN(isbn13),
                            rawCode: code,
                            format: format
                        });
                    } else {
                        console.log(`\n⚠️  Not a valid ISBN`);
                        resolve({
                            success: false,
                            error: 'Barcode detected but not a valid ISBN',
                            rawCode: code,
                            format: format
                        });
                    }
                } else {
                    console.error(`\n❌ Error: No barcode detected in image`);
                    resolve({
                        success: false,
                        error: 'No barcode detected in image'
                    });
                }
            });

        } catch (error) {
            console.error(`\n❌ Error: ${error.message}`);
            resolve({
                success: false,
                error: error.message
            });
        }
    });
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Barcode Scanner - ISBN Extraction
==================================

Usage:
  node scan-isbn.js <image-path>

Examples:
  node scan-isbn.js ./book-cover.jpg
  node scan-isbn.js /path/to/barcode.png

Supported formats:
  - ISBN-13 (EAN-13)
  - ISBN-10 (EAN-13 with 978 prefix)
  - UPC-A/E

Requirements:
  npm install quagga jimp
        `);
        process.exit(1);
    }

    const imagePath = path.resolve(args[0]);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
        console.error(`❌ File not found: ${imagePath}`);
        process.exit(1);
    }

    // Scan the barcode
    const result = await scanBarcodeFromImage(imagePath);

    if (result.success) {
        console.log(`\n✨ ISBN successfully extracted!`);
        console.log(`\nResult:`);
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } else {
        console.log(`\n❌ Failed to extract ISBN`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

// Export functions for use as module
module.exports = {
    scanBarcodeFromImage,
    isValidISBN,
    validateISBN13,
    validateISBN10,
    convertISBN10to13,
    formatISBN
};
