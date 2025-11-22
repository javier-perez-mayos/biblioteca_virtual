# Barcode Scanner Troubleshooting Guide

## 🔍 Barcode Not Detected - Debugging Steps

### Step 1: Use Debug Test Page

I've created a dedicated test page with detailed logging:

```
https://localhost:3443/test-barcode.html
```

**What it does:**
- Shows real-time debug logs
- Displays scan attempts
- Shows canvas/video dimensions
- Logs all errors
- Confirms ZXing is loaded
- Tests barcode detection

**How to use:**
1. Open the test page
2. Click "Start Camera"
3. Watch the debug log
4. Point at barcode
5. Check what messages appear

### Step 2: Check Browser Console

**Open Developer Console:**
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+K`
- **Mac**: `Cmd+Option+I`

**Look for:**
- ✅ "Video metadata loaded"
- ✅ "Starting barcode scan loop..."
- ✅ "Scan attempt #10, #20, etc."
- ❌ Any red error messages
- ❌ "ZXing library not loaded"

### Step 3: Common Issues & Solutions

#### Issue: "ZXing library not loaded"

**Cause**: CDN script didn't load

**Solution:**
```html
<!-- Check this line exists in HTML -->
<script src="https://unpkg.com/@zxing/library@latest/umd/index.min.js"></script>
```

**Fix:**
1. Hard refresh: Ctrl+Shift+R
2. Check internet connection
3. Try different browser

#### Issue: Scan attempts but no detection

**Console shows:**
```
Scan attempt #10, canvas: 1280x720, video: 1280x720
Scan attempt #20, canvas: 1280x720, video: 1280x720
```

**Possible causes:**

1. **Barcode not in view**
   - ✅ Position barcode in GREEN rectangle
   - ✅ Center it in frame
   - ✅ Hold 10-15cm from camera

2. **Poor lighting**
   - ✅ Use bright, even lighting
   - ✅ Avoid shadows on barcode
   - ✅ No glare/reflections
   - ✅ Try flash/torch (mobile)

3. **Barcode quality**
   - ✅ Ensure barcode is clean
   - ✅ Check for damage/scratches
   - ✅ Verify it's printed clearly
   - ✅ Not wrinkled or curved

4. **Wrong barcode type**
   - ✅ Must be ISBN barcode (EAN-13)
   - ✅ Starts with 978 or 979
   - ✅ Not QR code or other type

5. **Camera focus**
   - ✅ Wait 2-3 seconds for autofocus
   - ✅ Tap screen to force focus (mobile)
   - ✅ Clean camera lens
   - ✅ Move closer/farther to help focus

#### Issue: Canvas size 0x0

**Console shows:**
```
Scan attempt #10, canvas: 0x0, video: 0x0
```

**Cause**: Video not loaded properly

**Solution:**
1. Stop and restart camera
2. Hard refresh page
3. Check camera permissions
4. Try different browser

#### Issue: No scan attempts logged

**Console doesn't show scan attempts**

**Cause**: Scan loop not starting

**Check:**
1. Did camera start successfully?
2. Are there JavaScript errors?
3. Is video playing?
4. Check for permission errors

### Step 4: Barcode Requirements

**What barcodes work:**
- ✅ ISBN-13 (EAN-13): 13 digits starting with 978/979
- ✅ ISBN-10 (EAN-13): 10 digits with 978 prefix
- ✅ UPC-A: Universal Product Code
- ✅ EAN-8: 8-digit format

**What doesn't work:**
- ❌ QR codes
- ❌ Data Matrix codes
- ❌ PDF417 codes
- ❌ Code 128 (unless explicitly enabled)
- ❌ Non-ISBN product barcodes

### Step 5: Test with Known Working Barcode

**Create test barcode:**

Visit: https://barcode.tec-it.com/en/EAN13

Enter: `9780134685991` (valid ISBN)

**Download** the barcode image

**Test with image upload:**
1. Go to scanner
2. Use image upload option
3. Upload the test barcode
4. Should detect immediately

If image upload works but camera doesn't:
- Issue is with camera/video, not ZXing
- Check camera focus
- Check lighting
- Try different camera

### Step 6: Video/Canvas Debug

**Check these in console:**

```javascript
// Type these in console while scanner is running:

// Check video dimensions
console.log('Video:', video.videoWidth, 'x', video.videoHeight);

// Check canvas dimensions
console.log('Canvas:', canvas.width, 'x', canvas.height);

// Check if video is playing
console.log('Video playing:', !video.paused);

// Check stream
console.log('Stream active:', scannerStream && scannerStream.active);

// Manual test
const ctx = canvas.getContext('2d');
ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
const result = await codeReader.decodeFromCanvas(canvas);
console.log('Manual test result:', result);
```

### Step 7: Browser Compatibility

**Tested & Working:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Mobile Chrome
- ✅ Mobile Safari

**Not supported:**
- ❌ IE 11 and below
- ❌ Very old browsers

### Step 8: Camera Settings

**Optimal settings:**
```javascript
{
  video: {
    facingMode: 'environment', // Back camera
    width: { ideal: 1280 },
    height: { ideal: 720 },
    focusMode: 'continuous',
    advanced: [
      { focusMode: 'continuous' },
      { focusDistance: { ideal: 0.3 } }
    ]
  }
}
```

**If detection fails, try lower resolution:**
```javascript
{
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 }
  }
}
```

### Step 9: Test Checklist

Run through this checklist:

**Basic:**
- [ ] HTTPS URL (https://localhost:3443)
- [ ] Camera permission granted
- [ ] Video playing (not frozen)
- [ ] Console shows scan attempts
- [ ] No JavaScript errors

**Barcode:**
- [ ] ISBN barcode (978 or 979)
- [ ] Clean and undamaged
- [ ] Properly printed/displayed
- [ ] Not curved or wrinkled
- [ ] Good contrast

**Environment:**
- [ ] Good lighting
- [ ] No shadows
- [ ] No glare/reflections
- [ ] Camera lens clean
- [ ] Barcode in frame

**Position:**
- [ ] 10-15cm distance
- [ ] Centered in green box
- [ ] Parallel to camera
- [ ] Held steady (2-3 sec)
- [ ] Allowed autofocus time

**Technical:**
- [ ] Video dimensions > 0x0
- [ ] Canvas dimensions > 0x0
- [ ] Scan attempts counting up
- [ ] No decode errors (except NotFoundException)
- [ ] ZXing library loaded

### Step 10: Advanced Debugging

**Enable all console logs:**

In browser console, type:
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Reload page
location.reload();
```

**Manual barcode detection test:**

```javascript
// Take a photo of the canvas
const canvas = document.getElementById('barcodeScannerCanvas');
const dataURL = canvas.toDataURL();
console.log('Canvas image:', dataURL);

// You can copy this data URL and check the image
// Right-click → Copy → Paste in new browser tab
```

**Check ZXing formats:**

```javascript
// See what formats ZXing is checking
console.log('Supported formats:', Object.keys(ZXing.BarcodeFormat));

// Output should include:
// EAN_13, EAN_8, UPC_A, UPC_E, etc.
```

## 📊 Expected Console Output

**Successful scan:**
```
Initializing ZXing barcode reader...
Getting video input devices...
Found 1 camera(s)
Starting video stream for device: abc123...
Video metadata loaded
Video stream started, beginning scan loop...
Canvas dimensions set to: 1280x720
Starting barcode scan loop...
Scan attempt #10, canvas: 1280x720, video: 1280x720
Scan attempt #20, canvas: 1280x720, video: 1280x720
Scan attempt #30, canvas: 1280x720, video: 1280x720
✅ Barcode detected!
Code: 9780134685991
Format: 13 EAN_13
Valid barcode detected: 9780134685991
Searching for book with ISBN: 9780134685991
```

## 🆘 Still Not Working?

If you've tried everything above:

1. **Test with debug page**
   ```
   https://localhost:3443/test-barcode.html
   ```

2. **Copy console logs**
   - Open console (F12)
   - Copy all messages
   - Share for debugging

3. **Try a different barcode**
   - Test with multiple barcodes
   - Use test barcode image
   - Try simple 13-digit ISBN

4. **Try different device**
   - Test on different computer/phone
   - Test with different camera
   - Test on different network

5. **Check for interference**
   - Close other apps using camera
   - Disable browser extensions
   - Try incognito/private mode

## 💡 Tips for Success

**Lighting:**
- Bright, even lighting is critical
- Natural daylight is best
- Avoid harsh shadows
- No glare on barcode

**Distance:**
- Start at 15cm
- Move slowly closer
- Find the "sweet spot"
- Let autofocus work

**Angle:**
- Keep barcode flat
- Parallel to camera
- Not tilted or rotated
- Fill frame but don't cut off

**Patience:**
- Wait 2-3 seconds
- Hold very steady
- Let autofocus settle
- Don't move while scanning

## 📚 Additional Resources

- Test page: https://localhost:3443/test-barcode.html
- Main scanner: https://localhost:3443/
- Standalone: https://localhost:3443/scan-barcode.html

---

**Remember**: The scanner works best with:
- ✅ Good lighting
- ✅ Steady hands
- ✅ Clean barcode
- ✅ Proper distance (10-15cm)
- ✅ ISBN barcodes (978/979)
