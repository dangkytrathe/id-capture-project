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

  fetch("https://script.google.com/macros/s/AKfycbzj_FMT8VCHeUhpz-TQjp56gVCpstkQaSUgRiO3uqzPo93Ez5JJ2Can_jz2IREwWlnP/exec", {
    method: "POST",
    body: JSON.stringify(payload)
  })
  .then(res => alert("Submitted successfully"))
  .catch(err => alert("Submission failed"));
});

