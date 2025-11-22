# Quick Start: Barcode Scanner with SSL

## ✅ Server is Running

Your server is now running with SSL enabled:

- 🔒 **HTTPS**: https://localhost:3443
- 🔀 **HTTP**: http://localhost:3300 (auto-redirects to HTTPS)

## 🚀 Access the Barcode Scanner

### Option 1: Web Interface (Recommended)

Open your browser and go to:

```
https://localhost:3443/scan-barcode.html
```

**First time?** You'll see a security warning for the self-signed certificate:
1. Click **"Advanced"**
2. Click **"Proceed to localhost (unsafe)"**

This is normal for development with self-signed certificates.

### Option 2: Main Application

The main app also has barcode scanning built-in:

```
https://localhost:3443/
```

1. Click **"Add Book"**
2. Click **"Scan Barcode"**
3. Point camera at ISBN barcode

### Option 3: Command Line

Scan barcode from image file:

```bash
node scan-isbn.js /path/to/barcode-image.jpg
```

### Option 4: API Endpoint

```bash
curl -X POST https://localhost:3443/api/barcode/scan \
  -F "image=@/path/to/barcode.jpg" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  --insecure
```

## 📱 Using the Web Scanner

### Camera Scanning

1. Click **"📷 Start Camera"**
2. Allow camera access when prompted
3. Point camera at ISBN barcode on book
4. Hold steady for 1-2 seconds
5. ✅ ISBN automatically extracted!

### Image Upload

1. Click **"📁 Or click to upload"**
2. Select image file with barcode
3. ✅ ISBN automatically extracted!

## 🎯 Tips for Best Results

✅ **Good lighting** - Ensure barcode is well-lit
✅ **10-15cm distance** - Not too close, not too far
✅ **Parallel angle** - Keep barcode flat to camera
✅ **Hold steady** - Allow 1-2 seconds for detection
✅ **Clear image** - Avoid blurry photos

## 📊 What Barcodes Work?

The scanner works with standard ISBN barcodes:

- ✅ ISBN-13 (EAN-13) - Most common
- ✅ ISBN-10 (EAN-13 with 978 prefix)
- ✅ UPC-A/E codes

**Look for**: Barcodes on back of books starting with 978 or 979

## 🔧 Files Created

1. **[scan-isbn.js](scan-isbn.js)** - Command-line scanner script
2. **[public/scan-barcode.html](public/scan-barcode.html)** - Web interface
3. **[server.js:415-441](server.js)** - API endpoint `/api/barcode/scan`
4. **[BARCODE-SCANNER-SSL.md](BARCODE-SCANNER-SSL.md)** - Full documentation

## 🛠️ Server Management

### Start Server
```bash
npm start
```

### Stop Server
```bash
pkill -f "node.*server.js"
```

### Check Server Status
```bash
curl -k https://localhost:3443/scan-barcode.html -I
```

## 📝 Example Output

When you scan a barcode, you'll see:

```
✅ ISBN Detected!

ISBN-13: 978-0-134-68599-1

Format: EAN_13
Type: ISBN-13
Valid: ✅ Yes
```

## 🔐 SSL Certificates

Your SSL setup:

- **Key**: `./ssl/server.key` ✅
- **Cert**: `./ssl/server.cert` ✅
- **Valid**: 365 days ✅
- **Type**: Self-signed (development)

For production, use Let's Encrypt free certificates.

## 🚨 Troubleshooting

### Camera not working?
- ✅ Grant camera permissions in browser
- ✅ Use HTTPS (camera requires secure context)
- ✅ Try different browser (Chrome/Firefox recommended)

### SSL warning won't go away?
- ✅ Normal for self-signed certificates
- ✅ Safe to proceed on localhost
- ✅ Click "Advanced" → "Proceed to localhost"

### Barcode not detected?
- ✅ Improve lighting
- ✅ Try higher resolution image
- ✅ Ensure barcode is ISBN (978/979 prefix)
- ✅ Check barcode is not damaged

## 📚 Need More Info?

See **[BARCODE-SCANNER-SSL.md](BARCODE-SCANNER-SSL.md)** for:
- Complete API documentation
- Integration examples (JavaScript, Python, Node.js)
- Advanced usage
- Production deployment
- Security best practices

## 🎉 You're Ready!

Open your browser now:

```
https://localhost:3443/scan-barcode.html
```

Start scanning barcodes! 📚✨
