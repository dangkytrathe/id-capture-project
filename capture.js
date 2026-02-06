const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const preview = document.getElementById("preview");

let imageData = "";

// Start camera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    alert("Camera access denied");
  });

// Capture photo
captureBtn.addEventListener("click", () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  imageData = canvas.toDataURL("image/png");
  preview.src = imageData;
});

// Submit form
document.getElementById("dataForm").addEventListener("submit", e => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("fullName").value,
    idNumber: document.getElementById("idNumber").value,
    image: imageData
  };

  fetch("https://script.google.com/macros/s/AKfycbx2g34Cd67MWhxpAbgeFe0f2n9KRYTdpEPV-QKPM7k/dev", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload),
  mode: "no-cors"
});

