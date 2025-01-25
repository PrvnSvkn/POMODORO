let timer = null;
let isWorkPhase = true; // Work or break phase
let remainingTime = 40 * 60; // Default: 40 minutes for work
let workDuration = 40 * 60; // Customizable work duration
let breakDuration = 10 * 60; // Customizable break duration
let customAudio = null; // Custom audio file

// Get elements from the DOM
const timerDisplay = document.getElementById("timer-display");
const startButton = document.getElementById("start-timer");
const pauseButton = document.getElementById("pause-timer");
const resetButton = document.getElementById("reset-timer");
const workInput = document.getElementById("work-duration");
const breakInput = document.getElementById("break-duration");
const saveSettingsButton = document.getElementById("save-settings");
const customAudioInput = document.getElementById("custom-audio");
const audioPreview = document.getElementById("audio-preview");
const templates = document.querySelectorAll(".template-button");
const customSettingsToggle = document.getElementById("custom-settings-toggle");
const showCustomSettingsButton = document.getElementById("show-custom-settings");
const customSettingsForm = document.getElementById("custom-settings");

// Update the timer display in the popup
function updateTimerDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// Change the background color based on the phase
function updateBackgroundColor() {
  const body = document.body;
  body.style.backgroundColor = isWorkPhase
    ? "rgb(98, 121, 74)" // Work phase color
    : "rgb(206, 88, 79)"; // Break phase color
}

// Play audio alert when the timer ends
function playAudioAlert() {
  const audio = new Audio(customAudio || "default-alert.wav");
  audio.play().catch((error) => {
    console.error("Error playing audio:", error);
  });
}

// Save the current timer state in Chrome storage
function saveTimerState() {
  chrome.storage.sync.set({
    remainingTime,
    isWorkPhase,
  });
}

// Restore the timer state when the popup is opened
function restoreTimerState() {
  chrome.storage.sync.get(["remainingTime", "isWorkPhase"], (data) => {
    if (data.remainingTime !== undefined) {
      remainingTime = data.remainingTime;
    }
    if (data.isWorkPhase !== undefined) {
      isWorkPhase = data.isWorkPhase;
    }
    updateTimerDisplay();
    updateBackgroundColor();
  });
}

// Display a popup notification
function showPopup(message) {
  chrome.windows.create({
    url: `popup-notification.html?message=${encodeURIComponent(message)}`,
    type: "popup",
    width: 300,
    height: 150,
  });
}

// Timer logic
function startTimer() {
  if (timer) {
    console.log("Timer is already running!"); // Prevent multiple timers
    return;
  }

  console.log("Timer started");
  timer = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      updateTimerDisplay(); // Update the timer on the screen
      saveTimerState(); // Save state continuously
    } else {
      clearInterval(timer); // Stop the current timer
      timer = null;

      // Play audio alert
      playAudioAlert();

      // Switch phase (work <-> break)
      isWorkPhase = !isWorkPhase;
      remainingTime = isWorkPhase ? workDuration : breakDuration;

      // Update the background and start the next phase
      updateBackgroundColor();
      const message = isWorkPhase ? "Back to work!" : "Time for a break!";
      showPopup(message);
      updateTimerDisplay(); // Refresh display for the new phase
      startTimer(); // Automatically start the next phase
    }
  }, 1000); // Run every second
}

function pauseTimer() {
  clearInterval(timer);
  timer = null;
  saveTimerState(); // Save the state when paused
}

function resetTimer() {
  clearInterval(timer);
  timer = null;
  isWorkPhase = true;
  remainingTime = workDuration;
  updateTimerDisplay();
  updateBackgroundColor();
  saveTimerState(); // Save the reset state
}

// Save custom work and break durations
function saveSettings() {
  workDuration = parseInt(workInput.value) * 60; // Convert minutes to seconds
  breakDuration = parseInt(breakInput.value) * 60;
  isWorkPhase = true; // Reset to work phase
  remainingTime = workDuration;

  // Save the custom durations in Chrome storage
  chrome.storage.sync.set({
    workDuration,
    breakDuration,
  });

  updateTimerDisplay();
  updateBackgroundColor();
}

// Apply a preset template
function applyTemplate(work, breakTime) {
  workDuration = work * 60;
  breakDuration = breakTime * 60;
  isWorkPhase = true;
  remainingTime = workDuration;
  updateTimerDisplay();
  updateBackgroundColor();
}

// Show or hide the custom settings
function toggleCustomSettings() {
  if (customSettingsForm.classList.contains("hidden")) {
    customSettingsForm.classList.remove("hidden");
    customSettingsToggle.classList.add("hidden");
  } else {
    customSettingsForm.classList.add("hidden");
    customSettingsToggle.classList.remove("hidden");
  }
}

// Handle custom audio upload
customAudioInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    customAudio = URL.createObjectURL(file);
    audioPreview.src = customAudio; // Optional: Show a preview of the audio
  }
});

// Apply template event listeners
templates.forEach((template) => {
  template.addEventListener("click", () => {
    const work = parseInt(template.getAttribute("data-work"));
    const breakTime = parseInt(template.getAttribute("data-break"));
    applyTemplate(work, breakTime);
  });
});

// Event listeners for buttons
startButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", pauseTimer);
resetButton.addEventListener("click", resetTimer);
saveSettingsButton.addEventListener("click", saveSettings);
showCustomSettingsButton.addEventListener("click", toggleCustomSettings);

// Initialize the timer display and background color when the popup is opened
restoreTimerState();
updateTimerDisplay();
updateBackgroundColor();