// Global variables
let stream = null;
let capturedImageData = null;

// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const previewContainer = document.getElementById('preview-container');
const startCameraBtn = document.getElementById('start-camera');
const captureBtn = document.getElementById('capture');
const retakeBtn = document.getElementById('retake');
const form = document.getElementById('id-form');
const submitBtn = document.getElementById('submit-btn');
const statusMessage = document.getElementById('status-message');

// Google Apps Script Web App URL - UPDATE THIS WITH YOUR DEPLOYED SCRIPT URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbysV-ZPODYyrboOVMr1zhM0HHzPGod97HQ9IS0X_r24M878C0td1Z7z4gha0ytuQWQn/exec';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    startCameraBtn.addEventListener('click', startCamera);
    captureBtn.addEventListener('click', capturePhoto);
    retakeBtn.addEventListener('click', retakePhoto);
    form.addEventListener('submit', handleSubmit);
}

// Camera functions
async function startCamera() {
    try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        video.srcObject = stream;
        
        // Update UI
        startCameraBtn.style.display = 'none';
        captureBtn.style.display = 'inline-block';
        
        showStatus('Camera started successfully', 'success');
        setTimeout(() => hideStatus(), 2000);

    } catch (error) {
        console.error('Error accessing camera:', error);
        showStatus('Could not access camera. Please grant permission and try again.', 'error');
    }
}

function capturePhoto() {
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    capturedImageData = canvas.toDataURL('image/jpeg', 0.8);

    // Show preview
    preview.src = capturedImageData;
    previewContainer.style.display = 'block';
    video.style.display = 'none';

    // Update UI
    captureBtn.style.display = 'none';
    retakeBtn.style.display = 'inline-block';
    submitBtn.disabled = false;

    // Stop camera stream
    stopCamera();

    showStatus('Photo captured successfully!', 'success');
    setTimeout(() => hideStatus(), 2000);
}

function retakePhoto() {
    // Reset captured image
    capturedImageData = null;

    // Update UI
    previewContainer.style.display = 'none';
    video.style.display = 'block';
    retakeBtn.style.display = 'none';
    startCameraBtn.style.display = 'inline-block';
    submitBtn.disabled = true;

    showStatus('Ready to capture a new photo', 'success');
    setTimeout(() => hideStatus(), 2000);
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Form submission
async function handleSubmit(e) {
    e.preventDefault();

    if (!capturedImageData) {
        showStatus('Please capture a photo before submitting', 'error');
        return;
    }

    // Get form data
    const formData = {
        fullName: document.getElementById('full-name').value,
        idNumber: document.getElementById('id-number').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        notes: document.getElementById('notes').value,
        image: capturedImageData,
        timestamp: new Date().toISOString()
    };

    // Disable submit button
    submitBtn.disabled = true;
    showStatus('Submitting form... Please wait.', 'loading');

    try {
        // Check if script URL is configured
        if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            // For testing without backend
            console.log('Form data:', formData);
            
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            showStatus('⚠️ Google Apps Script URL not configured. Form data logged to console. See instructions below.', 'error');
            
            // Show instructions
            setTimeout(() => {
                const instructions = document.createElement('div');
                instructions.className = 'status-message error';
                instructions.innerHTML = `
                    <strong>Setup Instructions:</strong><br>
                    1. Create a Google Apps Script (see README)<br>
                    2. Deploy it as a web app<br>
                    3. Copy the deployment URL<br>
                    4. Update SCRIPT_URL in capture.js<br>
                    5. Push changes to GitHub
                `;
                statusMessage.parentNode.insertBefore(instructions, statusMessage.nextSibling);
            }, 500);
            
            submitBtn.disabled = false;
            return;
        }

        // Send to Google Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        // Note: With no-cors mode, we can't read the response
        // We assume success if no error is thrown
        showStatus('✅ Form submitted successfully! Thank you.', 'success');

        // Reset form
        setTimeout(() => {
            form.reset();
            capturedImageData = null;
            previewContainer.style.display = 'none';
            video.style.display = 'block';
            retakeBtn.style.display = 'none';
            startCameraBtn.style.display = 'inline-block';
            submitBtn.disabled = true;
            hideStatus();
        }, 3000);

    } catch (error) {
        console.error('Submission error:', error);
        showStatus('❌ Error submitting form. Please try again.', 'error');
        submitBtn.disabled = false;
    }
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
