// SIMPLIFIED VERSION - Works without OpenCV
// Use this if OpenCV.js continues to have issues

// Global variables
let stream = null;
let capturedFrontImage = null;
let capturedBackImage = null;
let currentSide = 'front';

// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const overlayCanvas = document.getElementById('overlay-canvas');
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

// Google Apps Script URL
const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

// Constants
const ASPECT_RATIO = 1.586;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showDetectionMessage('Ready to start!', 'good');
    setTimeout(() => hideDetectionMessage(), 2000);
});

function setupEventListeners() {
    startCameraBtn.addEventListener('click', startCamera);
    captureFrontBtn.addEventListener('click', () => capturePhoto('front'));
    captureBackBtn.addEventListener('click', () => capturePhoto('back'));
    retakeBtn.addEventListener('click', retakePhoto);
    form.addEventListener('submit', handleSubmit);
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                aspectRatio: { ideal: ASPECT_RATIO },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        video.srcObject = stream;
        
        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        setupOverlayCanvas();
        drawGuideFrame();
        
        startCameraBtn.style.display = 'none';
        captureFrontBtn.style.display = 'inline-block';
        currentSide = 'front';
        progressFront.classList.add('active');
        
        showStatus('Camera started. Position ID card to fill the frame.', 'success');
        showDetectionMessage('Align ID card with guide frame', 'loading');
        setTimeout(() => hideStatus(), 3000);

    } catch (error) {
        console.error('Error accessing camera:', error);
        showStatus('Could not access camera. Please grant permission and try again.', 'error');
    }
}

function setupOverlayCanvas() {
    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;
}

function drawGuideFrame() {
    const overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Draw guide rectangle
    overlayCtx.strokeStyle = '#667eea';
    overlayCtx.lineWidth = 6;
    overlayCtx.setLineDash([15, 15]);
    overlayCtx.strokeRect(
        overlayCanvas.width * 0.05,
        overlayCanvas.height * 0.15,
        overlayCanvas.width * 0.9,
        overlayCanvas.height * 0.7
    );
    overlayCtx.setLineDash([]);
    
    // Add corner markers
    overlayCtx.strokeStyle = '#48bb78';
    overlayCtx.lineWidth = 8;
    const cornerSize = 40;
    const margin = overlayCanvas.width * 0.05;
    const topMargin = overlayCanvas.height * 0.15;
    const frameWidth = overlayCanvas.width * 0.9;
    const frameHeight = overlayCanvas.height * 0.7;
    
    // Top-left corner
    overlayCtx.beginPath();
    overlayCtx.moveTo(margin, topMargin + cornerSize);
    overlayCtx.lineTo(margin, topMargin);
    overlayCtx.lineTo(margin + cornerSize, topMargin);
    overlayCtx.stroke();
    
    // Top-right corner
    overlayCtx.beginPath();
    overlayCtx.moveTo(margin + frameWidth - cornerSize, topMargin);
    overlayCtx.lineTo(margin + frameWidth, topMargin);
    overlayCtx.lineTo(margin + frameWidth, topMargin + cornerSize);
    overlayCtx.stroke();
    
    // Bottom-left corner
    overlayCtx.beginPath();
    overlayCtx.moveTo(margin, topMargin + frameHeight - cornerSize);
    overlayCtx.lineTo(margin, topMargin + frameHeight);
    overlayCtx.lineTo(margin + cornerSize, topMargin + frameHeight);
    overlayCtx.stroke();
    
    // Bottom-right corner
    overlayCtx.beginPath();
    overlayCtx.moveTo(margin + frameWidth - cornerSize, topMargin + frameHeight);
    overlayCtx.lineTo(margin + frameWidth, topMargin + frameHeight);
    overlayCtx.lineTo(margin + frameWidth, topMargin + frameHeight - cornerSize);
    overlayCtx.stroke();
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
    const targetWidth = 1920;
    const targetHeight = Math.round(targetWidth / ASPECT_RATIO);
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    const videoAspect = video.videoWidth / video.videoHeight;
    
    let sx, sy, sWidth, sHeight;
    
    if (videoAspect > ASPECT_RATIO) {
        sHeight = video.videoHeight;
        sWidth = sHeight * ASPECT_RATIO;
        sx = (video.videoWidth - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = video.videoWidth;
        sHeight = sWidth / ASPECT_RATIO;
        sx = 0;
        sy = (video.videoHeight - sHeight) / 2;
    }
    
    context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    if (side === 'front') {
        capturedFrontImage = imageData;
        previewFront.src = imageData;
        previewContainerFront.style.display = 'block';
        placeholderFront.style.display = 'none';
        progressFront.classList.remove('active');
        progressFront.classList.add('completed');
        
        currentSide = 'back';
        captureFrontBtn.style.display = 'none';
        captureBackBtn.style.display = 'inline-block';
        retakeBtn.style.display = 'inline-block';
        progressBack.classList.add('active');
        
        showStatus('Front side captured! Now capture the back side.', 'success');
        showDetectionMessage('Now flip card to back side', 'loading');
    } else {
        capturedBackImage = imageData;
        previewBack.src = imageData;
        previewContainerBack.style.display = 'block';
        placeholderBack.style.display = 'none';
        progressBack.classList.remove('active');
        progressBack.classList.add('completed');
        
        captureBackBtn.style.display = 'none';
        retakeBtn.style.display = 'inline-block';
        submitBtn.disabled = false;
        
        stopCamera();
        
        showStatus('Both sides captured! Fill in the form and submit.', 'success');
    }
    
    setTimeout(() => hideStatus(), 3000);
}

function retakePhoto() {
    let sideToRetake = (!capturedBackImage || currentSide === 'back') ? 'back' : 'front';
    
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
    
    if (!stream) startCamera();
    
    showStatus(`Ready to retake ${sideToRetake} side`, 'success');
    setTimeout(() => hideStatus(), 2000);
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    const overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    hideDetectionMessage();
}

async function handleSubmit(e) {
    e.preventDefault();

    if (!capturedFrontImage || !capturedBackImage) {
        showStatus('Please capture both sides of the ID card', 'error');
        return;
    }

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

    submitBtn.disabled = true;
    uploadProgress.style.display = 'block';
    
    try {
        if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            await simulateUpload();
            console.log('Form data:', formData);
            showStatus('⚠️ Google Apps Script URL not configured.', 'error');
            submitBtn.disabled = false;
            uploadProgress.style.display = 'none';
            return;
        }

        simulateUploadProgress();

        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        updateProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showStatus('✅ Form submitted successfully!', 'success');
        uploadProgress.style.display = 'none';

        setTimeout(() => resetForm(), 2000);

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
    form.reset();
    capturedFrontImage = null;
    capturedBackImage = null;
    
    previewContainerFront.style.display = 'none';
    previewContainerBack.style.display = 'none';
    placeholderFront.style.display = 'flex';
    placeholderBack.style.display = 'flex';
    
    progressFront.classList.remove('active', 'completed');
    progressBack.classList.remove('active', 'completed');
    
    startCameraBtn.style.display = 'inline-block';
    captureFrontBtn.style.display = 'none';
    captureBackBtn.style.display = 'none';
    retakeBtn.style.display = 'none';
    submitBtn.disabled = true;
    
    currentSide = 'front';
    hideStatus();
    uploadProgress.style.display = 'none';
    updateProgress(0);
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

function hideStatus() {
    statusMessage.style.display = 'none';
    statusMessage.className = 'status-message';
}

window.addEventListener('beforeunload', () => stopCamera());
