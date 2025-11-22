# Barcode Scanner with SSL/HTTPS

Complete guide for using the barcode scanning functionality over secure HTTPS connection.

## 🔒 SSL Setup (Already Configured)

Your server is already configured with SSL/HTTPS:

- ✅ **HTTPS Server**: https://localhost:3443
- ✅ **HTTP Redirect**: http://localhost:3300 → https://localhost:3443
- ✅ **SSL Certificates**: Located in `./ssl/` directory

### SSL Configuration (.env)

```bash
USE_SSL=true
HTTPS_PORT=3443
HTTP_REDIRECT=true
SSL_KEY_PATH=./ssl/server.key
SSL_CERT_PATH=./ssl/server.cert
```

## 📱 Web-Based Barcode Scanner

### Access the Scanner

```
https://localhost:3443/scan-barcode.html
```

### Features

1. **Camera Scanning** 📷
   - Real-time barcode detection using device camera
   - Automatic ISBN validation
   - Works on mobile and desktop

2. **Image Upload** 📁
   - Upload photos of barcodes
   - Supports JPG, PNG, and other formats
   - Drag & drop support

3. **Instant Results** ✅
   - Displays ISBN-13 format
   - Shows barcode format (EAN-13, UPC, etc.)
   - Validates checksum automatically

### How to Use

1. **Open your browser** to https://localhost:3443/scan-barcode.html
2. **Accept SSL warning** (for self-signed certificate in development)
3. **Choose method**:
   - Click "Start Camera" to scan with webcam/phone camera
   - Click "Or click to upload" to scan from image file
4. **Scan barcode** by pointing camera or uploading image
5. **Get results** - ISBN is automatically extracted and validated

## 🔧 Command-Line Scanner

For server-side or batch processing:

```bash
# Scan from image file
node scan-isbn.js ./barcode-image.jpg

# Example output:
# Reading image: ./barcode-image.jpg
# Image size: 800x600
#
# ✅ Barcode detected!
# Format: EAN_13
# Raw code: 9780134685991
#
# 📚 Valid ISBN-13: 978-0-134-68599-1
```

## 🌐 API Endpoint

### POST /api/barcode/scan

Scan barcode from uploaded image via API.

**Endpoint**: `https://localhost:3443/api/barcode/scan`

**Method**: POST

**Authentication**: Required (session-based)

**Content-Type**: multipart/form-data

**Parameters**:
- `image` (file): Image file containing barcode

**Example with curl**:

```bash
curl -X POST https://localhost:3443/api/barcode/scan \
  -F "image=@/path/to/barcode.jpg" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  --insecure
```

**Success Response**:

```json
{
  "success": true,
  "isbn13": "9780134685991",
  "isbn10": null,
  "formatted": "978-0-134-68599-1",
  "rawCode": "9780134685991",
  "format": "EAN_13"
}
```

**Error Response**:

```json
{
  "success": false,
  "error": "No barcode detected in image"
}
```

## 🔐 SSL Certificate Management

### Development (Current Setup)

Self-signed certificates are used for local development:

```bash
# Already generated in ./ssl/ directory
openssl req -nodes -new -x509 -days 365 \
  -keyout ssl/server.key \
  -out ssl/server.cert
```

### Production Setup

For production, use Let's Encrypt free SSL certificates:

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Update .env with production certificates
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

## 📊 Supported Barcode Formats

The scanner supports these barcode formats commonly used for ISBNs:

- ✅ **EAN-13**: Standard ISBN-13 format (most common)
- ✅ **EAN-8**: Short ISBN format
- ✅ **UPC-A**: Universal Product Code
- ✅ **UPC-E**: Compressed UPC

## 🎯 Best Practices

### For Camera Scanning

1. **Lighting**: Ensure good, even lighting
2. **Distance**: Hold device 10-15cm from barcode
3. **Angle**: Keep barcode parallel to camera
4. **Stability**: Hold steady for 1-2 seconds
5. **Focus**: Allow camera to focus before scanning

### For Image Upload

1. **Resolution**: Minimum 640x480, recommended 1280x720+
2. **Quality**: Avoid blurry or low-quality images
3. **Crop**: Frame should focus on barcode area
4. **Format**: JPG or PNG recommended
5. **File size**: Keep under 5MB for best performance

### For API Integration

1. **Authentication**: Always include session cookie
2. **File size**: Limit uploads to 5MB
3. **Error handling**: Check `success` field in response
4. **Rate limiting**: Implement client-side rate limiting
5. **HTTPS**: Always use HTTPS in production

## 🛠️ Integration Examples

### JavaScript Fetch API

```javascript
async function scanBarcode(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('https://localhost:3443/api/barcode/scan', {
    method: 'POST',
    body: formData,
    credentials: 'include' // Include session cookie
  });

  const result = await response.json();

  if (result.success) {
    console.log('ISBN found:', result.isbn13);
    console.log('Formatted:', result.formatted);
  } else {
    console.error('Scan failed:', result.error);
  }
}

// Usage
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', (e) => {
  scanBarcode(e.target.files[0]);
});
```

### Node.js with axios

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function scanBarcode(imagePath) {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));

  try {
    const response = await axios.post(
      'https://localhost:3443/api/barcode/scan',
      form,
      {
        headers: form.getHeaders(),
        withCredentials: true,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Dev only
      }
    );

    console.log('ISBN:', response.data.isbn13);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

scanBarcode('./barcode.jpg');
```

### Python with requests

```python
import requests

def scan_barcode(image_path):
    url = 'https://localhost:3443/api/barcode/scan'

    with open(image_path, 'rb') as f:
        files = {'image': f}
        response = requests.post(
            url,
            files=files,
            verify=False  # Dev only - use verify=True in production
        )

    result = response.json()

    if result['success']:
        print(f"ISBN: {result['isbn13']}")
        print(f"Formatted: {result['formatted']}")
    else:
        print(f"Error: {result['error']}")

scan_barcode('./barcode.jpg')
```

## 🔍 Troubleshooting

### Camera Not Working

**Problem**: Camera access denied
**Solution**:
- Grant camera permissions in browser
- Check browser console for errors
- Ensure HTTPS is being used (required for camera access)

**Problem**: "getUserMedia is not supported"
**Solution**:
- Use modern browser (Chrome, Firefox, Safari, Edge)
- Access via HTTPS (camera requires secure context)

### Barcode Not Detected

**Problem**: No barcode found in image
**Solutions**:
- Improve image quality/lighting
- Ensure barcode is clearly visible
- Try higher resolution image
- Check barcode is not damaged

**Problem**: Barcode detected but not valid ISBN
**Solution**:
- Verify it's actually an ISBN barcode (EAN-13 starting with 978/979)
- Some product barcodes are not ISBNs
- Check if barcode checksum is valid

### SSL Certificate Warnings

**Problem**: Browser shows "Your connection is not private"
**Solution** (Development):
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"
3. Or add certificate to trusted certificates

**Solution** (Production):
- Use Let's Encrypt or commercial SSL certificate
- Ensure certificate is not expired
- Check certificate matches domain name

### API Authentication Issues

**Problem**: 401 Unauthorized error
**Solution**:
- Ensure you're logged in
- Include session cookie in request
- Check session hasn't expired

## 📚 Module Usage

You can also use the scanner as a Node.js module:

```javascript
const {
  scanBarcodeFromImage,
  isValidISBN,
  formatISBN,
  convertISBN10to13
} = require('./scan-isbn');

// Scan image
const result = await scanBarcodeFromImage('./book.jpg');

// Validate ISBN
if (isValidISBN('9780134685991')) {
  console.log('Valid!');
}

// Format ISBN
const formatted = formatISBN('9780134685991');
// Returns: "978-0-134-68599-1"

// Convert ISBN-10 to ISBN-13
const isbn13 = convertISBN10to13('0134685997');
// Returns: "9780134685991"
```

## 🚀 Starting the Server

```bash
# Start with SSL enabled (default)
npm start

# Server will start on:
# 🔒 HTTPS: https://localhost:3443
# 🔀 HTTP:  http://localhost:3300 (redirects to HTTPS)
```

## 📖 Additional Resources

- **Main app with barcode scanner**: https://localhost:3443/
- **Standalone scanner**: https://localhost:3443/scan-barcode.html
- **API documentation**: This file
- **ZXing library**: https://github.com/zxing-js/library
- **Let's Encrypt**: https://letsencrypt.org/

## 🔒 Security Notes

1. **Development**:
   - Self-signed certificates will show browser warnings
   - Safe to proceed on localhost
   - Never use self-signed certs in production

2. **Production**:
   - Always use valid SSL certificates (Let's Encrypt)
   - Enable HSTS headers
   - Use secure session cookies
   - Implement rate limiting
   - Validate all file uploads

3. **API Security**:
   - Authentication required for all endpoints
   - File upload size limits enforced
   - Uploaded files are cleaned up after processing
   - Input validation on all parameters

## 📝 License

MIT
