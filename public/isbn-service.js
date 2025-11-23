// isbn-service.js - Barcode Scanner Service

class IsbnScannerService {
    constructor(elementId) {
        // Safety check: ensure the library is loaded
        if (typeof Html5Qrcode === 'undefined') {
            throw new Error("html5-qrcode library not loaded. Check internet connection.");
        }

        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Element with id ${elementId} not found`);
        }

        // Initialize the library instance
        this.html5QrCode = new Html5Qrcode(elementId);
        this.isScanning = false;
    }

    /**
     * Starts the camera and scanner.
     * @param {Function} onScanSuccess - Callback when an ISBN is found (returns text).
     * @param {string} deviceId - Optional device ID to use specific camera.
     */
    async start(onScanSuccess, deviceId = null) {
        if (this.isScanning) return;

        // Configuration for ISBN (EAN-13) including video constraints
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
            formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
            videoConstraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
                focusMode: "continuous",
                advanced: [{ focusMode: "continuous" }]
            }
        };

        try {
            if (deviceId) {
                await this.html5QrCode.start(
                    deviceId,
                    config,
                    (decodedText) => { if (onScanSuccess) onScanSuccess(decodedText); },
                    () => {}
                );
            } else {
                await this.html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => { if (onScanSuccess) onScanSuccess(decodedText); },
                    () => {}
                );
            }
            this.isScanning = true;
        } catch (err) {
            console.error("Failed to start scanner service:", err);
            throw err;
        }
    }

    async stop() {
        if (!this.isScanning) return;

        try {
            await this.html5QrCode.stop();
            this.isScanning = false;
        } catch (err) {
            console.error("Failed to stop scanner:", err);
        }
    }

    async fetchBookDetails(isbn) {
        // Use the backend API endpoint which handles multiple sources
        const API_BASE = window.location.origin;
        const url = `${API_BASE}/api/books/search-isbn/${isbn}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success && result.data) {
                return result.data;
            }
        } catch (error) {
            console.warn("Backend ISBN search error:", error);
        }

        return null;
    }

    /**
     * Attempts to retrieve a cover image URL for a given ISBN.
     * Uses OpenLibrary direct cover endpoint
     * @param {string} isbn
     * @returns {Promise<string|null>} cover URL or null
     */
    async getCoverUrl(isbn) {
        // OpenLibrary Cover endpoint (direct access, no API call needed)
        const olCover = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
        return olCover; // Return URL directly, browser will handle 404 if not found
    }
}
