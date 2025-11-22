# Barcode Scanner - ISBN Extraction

Standalone script to scan barcodes from images and extract ISBN numbers.

## Features

- ✅ Scans EAN-13, EAN-8, UPC-A/E barcodes
- ✅ Validates ISBN-10 and ISBN-13 checksums
- ✅ Auto-converts ISBN-10 to ISBN-13
- ✅ Formats ISBNs with hyphens for readability
- ✅ Works with any image format (JPG, PNG, etc.)

## Installation

```bash
npm install @zxing/library jimp
```

## Usage

### Command Line

```bash
# Scan barcode from image
node scan-isbn.js ./book-cover.jpg

# Scan from any image path
node scan-isbn.js /path/to/barcode.png
```

### As a Module

```javascript
const { scanBarcodeFromImage, isValidISBN } = require('./scan-isbn');

// Scan image
const result = await scanBarcodeFromImage('./book.jpg');

if (result.success) {
    console.log('ISBN-13:', result.isbn13);
    console.log('Formatted:', result.formatted);
}

// Validate ISBN
if (isValidISBN('9780134685991')) {
    console.log('Valid ISBN!');
}
```

## Output Format

```json
{
  "success": true,
  "isbn10": null,
  "isbn13": "9780134685991",
  "formatted": "978-0-134-68599-1",
  "rawCode": "9780134685991",
  "format": "EAN_13"
}
```

## Examples

### Example 1: Valid ISBN-13

```bash
$ node scan-isbn.js book-barcode.jpg

Reading image: book-barcode.jpg
Image size: 800x600

✅ Barcode detected!
Format: EAN_13
Raw code: 9780134685991

📚 Valid ISBN-13: 978-0-134-68599-1

✨ ISBN successfully extracted!

Result:
{
  "success": true,
  "isbn13": "9780134685991",
  "formatted": "978-0-134-68599-1",
  "rawCode": "9780134685991",
  "format": "EAN_13"
}
```

### Example 2: ISBN-10 (auto-converted)

```bash
$ node scan-isbn.js old-book.jpg

✅ Barcode detected!
Format: EAN_13
Raw code: 0134685997

📚 Valid ISBN-10: 0-134-68599-7
📚 Converted to ISBN-13: 978-0-134-68599-1
```

## How It Works

1. **Image Loading**: Uses Jimp to read image files
2. **Barcode Detection**: ZXing library decodes EAN/UPC barcodes
3. **ISBN Validation**: Verifies checksum for ISBN-10/13
4. **Format Conversion**: Converts ISBN-10 to ISBN-13
5. **Output**: Returns formatted ISBN with validation

## Supported Barcode Formats

- **EAN-13**: Standard ISBN-13 format
- **EAN-8**: Short ISBN format
- **UPC-A**: Universal Product Code
- **UPC-E**: Compressed UPC

## Tips for Best Results

1. **Good lighting**: Ensure barcode is well-lit
2. **High resolution**: Use at least 600x400 image size
3. **Clear image**: Avoid blurry or distorted barcodes
4. **Crop tightly**: Image should focus on the barcode area
5. **Flat surface**: Barcode should be on flat, not curved surface

## API Reference

### `scanBarcodeFromImage(imagePath)`
Scans barcode from image file and extracts ISBN.

**Parameters:**
- `imagePath` (string): Path to image file

**Returns:** Promise<Object>
- `success` (boolean): Whether ISBN was extracted
- `isbn13` (string): ISBN-13 format
- `isbn10` (string|null): ISBN-10 if applicable
- `formatted` (string): ISBN with hyphens
- `rawCode` (string): Raw barcode data
- `format` (string): Barcode format detected

### `isValidISBN(code)`
Validates ISBN-10 or ISBN-13 checksum.

### `convertISBN10to13(isbn10)`
Converts ISBN-10 to ISBN-13 format.

### `formatISBN(isbn)`
Formats ISBN with hyphens for readability.

## Troubleshooting

**No barcode detected:**
- Try higher resolution image
- Ensure good lighting and contrast
- Crop image to focus on barcode
- Check barcode is not damaged

**Invalid ISBN:**
- Barcode might not be an ISBN (e.g., regular product UPC)
- Checksum validation failed (damaged barcode)

## License

MIT
