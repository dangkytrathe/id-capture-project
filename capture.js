// Global variables
let stream = null;
let capturedFrontImage = null;
let capturedBackImage = null;
let currentSide = 'front'; // 'front' or 'back'
let detectionInterval = null;
let opencvReady = false;
let opencvLoadAttempts = 0;

// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const overlayCanvas = document.getElementById('overlay-canvas');
const cameraContainer = document.getElementById('camera-container');
const detectionMessage = document.getElementById('detection-message');

const previewFront = document.getElementById('preview-front');
const previewBack = document.getElementById('preview-back');
const previewContainerFront = document.getElementById('preview-container-front');
const previewContainerBack = document.getElementById('preview-container-back');
const placeholderFront = document.getElementById('placeholder-front');
const placeholderBack = document.getElementById('placeholder-back');

const progressFront = document.getElementById('progress-front');
const progressBack = document.getElementById('progress-back');

const startCameraBtn = document.getElementById('start-camera');
const captureFrontBtn = document.getElementById('capture-front');
const captureBackBtn = document.getElementById('capture-back');
const retakeBtn = document.getElementById('retake');

const form = document.getElementById('id-form');
const submitBtn = document.getElementById('submit-btn');
const statusMessage = document.getElementById('status-message');

const uploadProgress = document.getElementById('upload-progress');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Google Apps Script Web App URL - UPDATE THIS WITH YOUR DEPLOYED SCRIPT URL
const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

// Constants
const ASPECT_RATIO = 1.586; // Credit card aspect ratio (85.60mm × 53.98mm)
const DETECTION_THRESHOLD = 0.95; // 95% coverage required

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadOpenCV();
});

// Load OpenCV.js
function loadOpenCV() {
    showDetectionMessage('Loading OpenCV...', 'loading');
    
    // Check if OpenCV is already loaded
    if (typeof cv !== 'undefined' && cv.Mat) {
        onOpenCvReady();
        return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    
    script.onload = () => {
        console.log('OpenCV script loaded, waiting for initialization...');
        checkOpenCVReady();
    };
    
    script.onerror = () => {
        console.error('Failed to load OpenCV.js');
        showDetectionMessage('OpenCV failed to load. Detection disabled.', 'bad');
        // Continue without OpenCV - basic capture still works
        opencvReady = false;
    };
    
    document.body.appendChild(script);
}

// Check if OpenCV is ready (it needs time to initialize after script loads)
function checkOpenCVReady() {
    opencvLoadAttempts++;
    
    if (typeof cv !== 'undefined' && cv.Mat) {
        onOpenCvReady();
    } else if (opencvLoadAttempts < 50) {
        // Try again in 100ms (max 5 seconds)
        setTimeout(checkOpenCVReady, 100);
    } else {
        console.error('OpenCV initialization timeout');
        showDetectionMessage('OpenCV timeout. Detection disabled.', 'bad');
        opencvReady = false;
        setTimeout(() => hideDetectionMessage(), 3000);
    }
}

// OpenCV ready callback
function onOpenCvReady() {
    opencvReady = true;
    console.log('OpenCV.js is ready');
    showDetectionMessage('OpenCV ready!', 'good');
    setTimeout(() => hideDetectionMessage(), 2000);
}

function setupEventListeners() {
    startCameraBtn.addEventListener('click', startCamera);
    captureFrontBtn.addEventListener('click', () => capturePhoto('front'));
    captureBackBtn.addEventListener('click', () => capturePhoto('back'));
    retakeBtn.addEventListener('click', retakePhoto);
    form.addEventListener('submit', handleSubmit);
}

// Camera functions
async function startCamera() {
    try {
        // Request camera access with specific aspect ratio
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                aspectRatio: { ideal: ASPECT_RATIO },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        video.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        // Set up overlay canvas to match video
        setupOverlayCanvas();
        
        // Start detection loop
        startDetection();
        
        // Update UI
        startCameraBtn.style.display = 'none';
        captureFrontBtn.style.display = 'inline-block';
        currentSide = 'front';
        progressFront.classList.add('active');
        
        showStatus('Camera started. Position ID card to fill the frame.', 'success');
        setTimeout(() => hideStatus(), 3000);

    } catch (error) {
        console.error('Error accessing camera:', error);
        showStatus('Could not access camera. Please grant permission and try again.', 'error');
        showDetectionMessage('Camera access denied', 'bad');
    }
}

function setupOverlayCanvas() {
    const rect = video.getBoundingClientRect();
    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;
}

function startDetection() {
    if (!opencvReady) {
        showDetectionMessage('OpenCV loading...', 'loading');
        return;
    }

    detectionInterval = setInterval(() => {
        detectIDCard();
    }, 100); // Check 10 times per second
}

function stopDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
}

function detectIDCard() {
    if (!opencvReady || !video.videoWidth) return;

    try {
        // Create a canvas to capture current frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Convert to OpenCV Mat
        let src = cv.imread(tempCanvas);
        let gray = new cv.Mat();
        let blurred = new cv.Mat();
        let edges = new cv.Mat();
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        
        // Apply Gaussian blur to reduce noise
        let ksize = new cv.Size(5, 5);
        cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);
        
        // Edge detection with Canny
        cv.Canny(blurred, edges, 50, 150, 3, false);
        
        // Dilate edges to connect broken lines
        let kernel = cv.Mat.ones(3, 3, cv.CV_8U);
        cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 2);
        
        // Find contours
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // Calculate frame area
        const frameArea = src.rows * src.cols;
        
        // Find best rectangular contour
        let maxArea = 0;
        let bestContour = null;
        let bestRect = null;
        let coveragePercent = 0;

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            // Skip if too small (less than 10% of frame)
            if (area < frameArea * 0.1) {
                contour.delete();
                continue;
            }
            
            // Get bounding rectangle
            const rect = cv.boundingRect(contour);
            
            // Check if it's roughly rectangular (aspect ratio check)
            const aspectRatio = rect.width / rect.height;
            const isCardLike = aspectRatio > 1.3 && aspectRatio < 2.0;
            
            if (isCardLike && area > maxArea) {
                maxArea = area;
                if (bestContour) bestContour.delete();
                bestContour = contour.clone();
                bestRect = rect;
                coveragePercent = (area / frameArea) * 100;
            } else {
                contour.delete();
            }
        }

        // Draw overlay
        const overlayCtx = overlayCanvas.getContext('2d');
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        // Scale factor from video to canvas
        const scaleX = overlayCanvas.width / src.cols;
        const scaleY = overlayCanvas.height / src.rows;

        if (bestRect && coveragePercent >= DETECTION_THRESHOLD) {
            // Draw green rectangle
            overlayCtx.strokeStyle = '#48bb78';
            overlayCtx.lineWidth = 6;
            overlayCtx.strokeRect(
                bestRect.x * scaleX,
                bestRect.y * scaleY,
                bestRect.width * scaleX,
                bestRect.height * scaleY
            );
            
            showDetectionMessage(`Perfect! ${coveragePercent.toFixed(0)}% - Ready to capture`, 'good');
        } else if (bestRect) {
            // Draw red rectangle
            overlayCtx.strokeStyle = '#f56565';
            overlayCtx.lineWidth = 6;
            overlayCtx.strokeRect(
                bestRect.x * scaleX,
                bestRect.y * scaleY,
                bestRect.width * scaleX,
                bestRect.height * scaleY
            );
            
            showDetectionMessage(`Move closer - ${coveragePercent.toFixed(0)}% (need 95%)`, 'bad');
        } else {
            // Draw guide frame
            overlayCtx.strokeStyle = '#f56565';
            overlayCtx.lineWidth = 4;
            overlayCtx.setLineDash([15, 15]);
            overlayCtx.strokeRect(
                overlayCanvas.width * 0.05,
                overlayCanvas.height * 0.15,
                overlayCanvas.width * 0.9,
                overlayCanvas.height * 0.7
            );
            overlayCtx.setLineDash([]);
            
            showDetectionMessage('Position ID card in frame', 'bad');
        }

        // Cleanup
        src.delete();
        gray.delete();
        blurred.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        kernel.delete();
        if (bestContour) bestContour.delete();

    } catch (error) {
        console.error('Detection error:', error);
        // Don't spam errors - just stop detection temporarily
        stopDetection();
        setTimeout(() => {
            if (stream) startDetection();
        }, 2000);
    }
}

function showDetectionMessage(message, type) {
    detectionMessage.textContent = message;
    detectionMessage.className = `detection-message ${type}`;
}

function hideDetectionMessage() {
    detectionMessage.textContent = '';
    detectionMessage.className = 'detection-message';
}

function capturePhoto(side) {
    // Set canvas dimensions to maintain aspect ratio
    const targetWidth = 1920;
    const targetHeight = Math.round(targetWidth / ASPECT_RATIO);
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw video frame to canvas (centered and cropped to aspect ratio)
    const context = canvas.getContext('2d');
    const videoAspect = video.videoWidth / video.videoHeight;
    
    let sx, sy, sWidth, sHeight;
    
    if (videoAspect > ASPECT_RATIO) {
        // Video is wider, crop width
        sHeight = video.videoHeight;
        sWidth = sHeight * ASPECT_RATIO;
        sx = (video.videoWidth - sWidth) / 2;
        sy = 0;
    } else {
        // Video is taller, crop height
        sWidth = video.videoWidth;
        sHeight = sWidth / ASPECT_RATIO;
        sx = 0;
        sy = (video.videoHeight - sHeight) / 2;
    }
    
    context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

    // Convert to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    if (side === 'front') {
        capturedFrontImage = imageData;
        previewFront.src = imageData;
        previewContainerFront.style.display = 'block';
        placeholderFront.style.display = 'none';
        progressFront.classList.remove('active');
        progressFront.classList.add('completed');
        
        // Switch to back side
        currentSide = 'back';
        captureFrontBtn.style.display = 'none';
        captureBackBtn.style.display = 'inline-block';
        retakeBtn.style.display = 'inline-block';
        progressBack.classList.add('active');
        
        showStatus('Front side captured! Now capture the back side.', 'success');
    } else {
        capturedBackImage = imageData;
        previewBack.src = imageData;
        previewContainerBack.style.display = 'block';
        placeholderBack.style.display = 'none';
        progressBack.classList.remove('active');
        progressBack.classList.add('completed');
        
        // Both sides captured
        captureBackBtn.style.display = 'none';
        retakeBtn.style.display = 'inline-block';
        submitBtn.disabled = false;
        
        // Stop camera
        stopCamera();
        
        showStatus('Both sides captured! Fill in the form and submit.', 'success');
    }
    
    setTimeout(() => hideStatus(), 3000);
}

function retakePhoto() {
    let sideToRetake;
    
    // Determine which side to retake
    if (!capturedBackImage || currentSide === 'back') {
        sideToRetake = 'back';
    } else {
        sideToRetake = 'front';
    }
    
    if (sideToRetake === 'front') {
        capturedFrontImage = null;
        previewContainerFront.style.display = 'none';
        placeholderFront.style.display = 'flex';
        progressFront.classList.remove('completed');
        progressFront.classList.add('active');
        progressBack.classList.remove('active');
        currentSide = 'front';
        captureFrontBtn.style.display = 'inline-block';
        captureBackBtn.style.display = 'none';
    } else {
        capturedBackImage = null;
        previewContainerBack.style.display = 'none';
        placeholderBack.style.display = 'flex';
        progressBack.classList.remove('completed');
        progressBack.classList.add('active');
        currentSide = 'back';
        captureBackBtn.style.display = 'inline-block';
        captureFrontBtn.style.display = 'none';
    }
    
    retakeBtn.style.display = currentSide === 'back' && capturedFrontImage ? 'inline-block' : 'none';
    submitBtn.disabled = true;
    
    // Restart camera
    if (!stream) {
        startCamera();
    }
    
    showStatus(`Ready to retake ${sideToRetake} side`, 'success');
    setTimeout(() => hideStatus(), 2000);
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    stopDetection();
    
    // Clear overlay
    const overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    hideDetectionMessage();
}

// Form submission with progress
async function handleSubmit(e) {
    e.preventDefault();

    if (!capturedFrontImage || !capturedBackImage) {
        showStatus('Please capture both sides of the ID card', 'error');
        return;
    }

    // Get form data
    const formData = {
        fullName: document.getElementById('full-name').value,
        idNumber: document.getElementById('id-number').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        notes: document.getElementById('notes').value,
        frontImage: capturedFrontImage,
        backImage: capturedBackImage,
        timestamp: new Date().toISOString()
    };

    // Disable submit button
    submitBtn.disabled = true;
    uploadProgress.style.display = 'block';
    
    try {
        // Check if script URL is configured
        if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            // Simulate upload progress for testing
            await simulateUpload();
            
            console.log('Form data:', formData);
            showStatus('⚠️ Google Apps Script URL not configured. See README for setup instructions.', 'error');
            submitBtn.disabled = false;
            uploadProgress.style.display = 'none';
            return;
        }

        // Simulate upload progress (since we can't track real progress with no-cors)
        simulateUploadProgress();

        // Send to Google Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        // Complete progress
        updateProgress(100);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showStatus('✅ Form submitted successfully! Thank you.', 'success');
        uploadProgress.style.display = 'none';

        // Reset form after delay
        setTimeout(() => {
            resetForm();
        }, 2000);

    } catch (error) {
        console.error('Submission error:', error);
        showStatus('❌ Error submitting form. Please try again.', 'error');
        submitBtn.disabled = false;
        uploadProgress.style.display = 'none';
    }
}

function simulateUploadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        updateProgress(progress);
    }, 200);
}

async function simulateUpload() {
    for (let i = 0; i <= 100; i += 5) {
        updateProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

function updateProgress(percent) {
    progressBar.style.width = percent + '%';
    progressText.textContent = `Uploading... ${Math.round(percent)}%`;
}

function resetForm() {
    // Reset form fields
    form.reset();
    
    // Reset images
    capturedFrontImage = null;
    capturedBackImage = null;
    
    // Reset previews
    previewContainerFront.style.display = 'none';
    previewContainerBack.style.display = 'none';
    placeholderFront.style.display = 'flex';
    placeholderBack.style.display = 'flex';
    
    // Reset progress
    progressFront.classList.remove('active', 'completed');
    progressBack.classList.remove('active', 'completed');
    
    // Reset buttons
    startCameraBtn.style.display = 'inline-block';
    captureFrontBtn.style.display = 'none';
    captureBackBtn.style.display = 'none';
    retakeBtn.style.display = 'none';
    submitBtn.disabled = true;
    
    // Reset state
    currentSide = 'front';
    
    // Hide status
    hideStatus();
    uploadProgress.style.display = 'none';
    updateProgress(0);
}

// Status message functions
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

function hideStatus() {
    statusMessage.style.display = 'none';
    statusMessage.className = 'status-message';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopCamera();
});
