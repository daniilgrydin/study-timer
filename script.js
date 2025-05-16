// ===========================
// Element References
// ===========================
const timerEl = document.getElementById("timer");
const modeEl = document.getElementById("mode");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const endBtn = document.getElementById("end-btn");
const debugToggle = document.getElementById("debug-toggle");
const modal = document.getElementById("exercise-modal");
const promptEl = document.getElementById("exercise-prompt");
const doneBtn = document.getElementById("done-btn");
const fgCircle = document.getElementById("progress-fg");
const bellSound = document.getElementById("bell-sound");
const logTableBody = document.querySelector("#log-table tbody");
const addManualBtn = document.getElementById("add-manual-btn");
const wrapDayBtn = document.getElementById("wrap-day-btn");
const clearLogBtn = document.getElementById("clear-log-btn");
const toggleLogBtn = document.getElementById("toggle-log-btn");
const rightPanel = document.querySelector(".right-panel");
const container = document.querySelector(".container");
const settingsModal = document.getElementById("settings-modal");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const zenModeBtn = document.getElementById("zen-mode-btn");

// ===========================
// Default or Saved Settings
// ===========================
let settings = JSON.parse(localStorage.getItem("settings")) || {
  workDuration: 45, // in minutes
  chillDuration: 15, // in minutes
  exerciseBreaks: 3, // number of exercise breaks
  weeklyGoal: 5 * 3600, // in seconds (5 hours)
};

// Timer-related variables
let studyDuration = settings.workDuration * 60; // in seconds
let chillDuration = settings.chillDuration * 60; // in seconds
let exerciseBreaks = settings.exerciseBreaks;
let weeklyGoal = settings.weeklyGoal;

let timer, remaining, totalTime;
let isStudy = true,
  pausedForExercise = false,
  isPaused = false;
let workSeconds = 0;
let studyStart;

let breakPoints = [];
let breaksDone = 0;

const exercises = ["20 sit-ups", "15 push-ups", "1-minute plank", "20 curl-ups"];
let exerciseIndex = 0;

// ===========================
// Settings Modal Functionality
// ===========================

// Open settings modal and populate fields with current settings
document.getElementById("settings-btn").addEventListener("click", () => {
  settingsModal.style.display = "block";
  document.getElementById("set-work").value = settings.workDuration;
  document.getElementById("set-chill").value = settings.chillDuration;
  document.getElementById("set-breaks").value = settings.exerciseBreaks;
  document.getElementById("set-weekly").value = settings.weeklyGoal / 3600; // convert seconds to hours
});

// Close settings modal
closeSettingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "none";
});

// Save settings and apply changes
saveSettingsBtn.addEventListener("click", () => {
  const videoUrl = document.getElementById("set-video-url").value;
  const videoId = extractVideoId(videoUrl);
  if (videoId) {
    localStorage.setItem("ytVideoId", videoId);
    loadBackgroundVideo();
  }

  settings.workDuration = parseInt(document.getElementById("set-work").value);
  settings.chillDuration = parseInt(document.getElementById("set-chill").value);
  settings.exerciseBreaks = parseInt(document.getElementById("set-breaks").value);
  settings.weeklyGoal = parseInt(document.getElementById("set-weekly").value) * 3600;

  localStorage.setItem("settings", JSON.stringify(settings));
  applySettings();
  settingsModal.style.display = "none";
});

// Apply settings to the timer
function applySettings() {
  studyDuration = settings.workDuration * 60;
  chillDuration = settings.chillDuration * 60;
  exerciseBreaks = settings.exerciseBreaks;
  weeklyGoal = settings.weeklyGoal;
}

// ===========================
// Timer Configuration
// ===========================

// Configure durations based on debug mode or saved settings
function configureDurations() {
  if (debugToggle.checked) {
    studyDuration = 10; // 10 seconds for debug mode
    chillDuration = 5; // 5 seconds for debug mode
    exerciseBreaks = 1; // 1 exercise break for debug mode
  } else {
    const saved = JSON.parse(localStorage.getItem("settings")) || {};
    studyDuration = (saved.workDuration || 45) * 60;
    chillDuration = (saved.chillDuration || 15) * 60;
    exerciseBreaks = saved.exerciseBreaks || 1;
  }
}

// Format time in MM:SS format
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Play bell sound
function playBell() {
  bellSound.currentTime = 0;
  bellSound.play();
  // Set volume to 0.5
    // bellSound.volume = 10;
}

// Update the document title
function updateTitle(activity) {
  document.title = activity;
}

// Update timer display and progress circle
function updateDisplay() {
  timerEl.textContent = formatTime(remaining);
  const fraction = remaining / totalTime;
  fgCircle.style.strokeDashoffset = 565 - 565 * fraction;
  updateTitle(modeEl.textContent); // Update the title with the current mode
}

// ===========================
// Timer Logic
// ===========================

// Main timer tick function
function tick() {
  if (isPaused) return;

  if (remaining <= 0) {
    clearInterval(timer);
    isStudy ? finishStudy() : finishChill();
    return;
  }

  remaining--;
  if (isStudy && !pausedForExercise) workSeconds++;

  // Check for exercise break
  if (
    isStudy &&
    !pausedForExercise &&
    breaksDone < breakPoints.length &&
    remaining === studyDuration - breakPoints[breaksDone]
  ) {
    pauseForExercise();
    breaksDone++;
    return;
  }

  updateDisplay();
}

// Start the study timer
function startTimer() {
  clearInterval(timer);
  configureDurations();
  isStudy = true;
  pausedForExercise = false;
  isPaused = false;
  workSeconds = 0;
  remaining = studyDuration;
  totalTime = studyDuration;
  studyStart = new Date();
  modeEl.textContent = "✍️Study Session";
  fgCircle.setAttribute("stroke", "var(--study)");
  playBell();
  updateDisplay();

  // Set up break points
  breakPoints = [];
  breaksDone = 0;
  for (let i = 1; i <= exerciseBreaks; i++) {
    breakPoints.push(Math.floor(studyDuration * (i / (exerciseBreaks + 1))));
  }

  timer = setInterval(tick, 1000);
}

// Finish the study session and start chill time
function finishStudy() {
  const end = new Date();
  logSession(studyStart, end, workSeconds);
  updateTotalTime();
  startChill();
}

// Start chill time
function startChill() {
  clearInterval(timer);
  isStudy = false;
  pausedForExercise = false;
  isPaused = false;
  remaining = chillDuration;
  totalTime = chillDuration;
  modeEl.textContent = "🧋Chill Time";
  fgCircle.setAttribute("stroke", "var(--chill)");
  playBell();
  updateDisplay();
  timer = setInterval(tick, 1000);
}

// Finish chill time and restart study timer
function finishChill() {
  startTimer();
}

// Pause for an exercise break
function pauseForExercise() {
  pausedForExercise = true;
  clearInterval(timer);
  promptEl.textContent = exercises[exerciseIndex++ % exercises.length];
  fgCircle.setAttribute("stroke", "var(--exercise)");
  playBell();
  modal.style.visibility = "visible";
  modeEl.textContent = "🏋️‍♂️Exercise Break";
  updateTitle("🏋️‍♂️Exercise Break"); // Update the title for exercise break
}

// Resume timer after exercise break
doneBtn.addEventListener("click", () => {
  modal.style.visibility = "hidden";
  pausedForExercise = false;
  modeEl.textContent = "✍️Study Session";
  playBell();
  updateDisplay();
  timer = setInterval(tick, 1000);
});

// ===========================
// Log and Session Management
// ===========================

// Toggle visibility of the log panel
toggleLogBtn.addEventListener("click", () => {
  const isVisible = !container.classList.contains("single-panel");

  if (isVisible) {
    rightPanel.style.display = "none";
    container.classList.add("single-panel");
    toggleLogBtn.textContent = "Show Log";
  } else {
    rightPanel.style.display = "block";
    container.classList.remove("single-panel");
    toggleLogBtn.textContent = "Hide Log";
  }
});

// End the current session
endBtn.addEventListener("click", () => {
  clearInterval(timer);
  if (isStudy) {
    const end = new Date();
    logSession(studyStart, end, workSeconds);
  }
  resetTimer();
  updateTotalTime();
});

// Reset the timer to its initial state
function resetTimer() {
  isStudy = true;
  pausedForExercise = false;
  isPaused = false;
  timerEl.textContent = "00:00";
  modeEl.textContent = "⏳Ready to start";
  fgCircle.style.strokeDashoffset = 565;
  updateTitle("Ready to start"); // Reset the title
}

// Pause or resume the timer
pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
});

// Add a manual log entry
addManualBtn.addEventListener("click", () => {
  const start = prompt("Start time (HH:MM)", "00:00");
  const end = prompt("End time (HH:MM)", "00:45");
  const dur = prompt("Duration (MM:SS)", "45:00");
  if (start && end && dur) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${logTableBody.children.length + 1}</td><td>${start}</td><td>${end}</td><td>${dur}</td>`;
    logTableBody.appendChild(tr);
    saveLogs();
    updateTotalTime();
  }
});

// Wrap up the day's sessions and save totals
wrapDayBtn.addEventListener("click", () => {
  if (!logTableBody.children.length) return alert("No sessions to wrap!");

  let totalSec = 0;
  Array.from(logTableBody.children).forEach((row) => {
    const [h, m, s] = row.cells[3].textContent.split(":").map(Number);
    const secs = isNaN(s) ? h * 60 + m : h * 3600 + m * 60 + s;
    totalSec += secs;
  });

  const todayKey = new Date().toLocaleDateString();
  const dailyTotals = JSON.parse(localStorage.getItem("dailyTotals")) || {};
  dailyTotals[todayKey] = (dailyTotals[todayKey] || 0) + totalSec;
  localStorage.setItem("dailyTotals", JSON.stringify(dailyTotals));

  logTableBody.innerHTML = "";
  saveLogs();
  updateTotalTime();
  alert(`Wrapped the day: ${formatHMS(totalSec)}`);
});

// Clear all log entries
clearLogBtn.addEventListener("click", () => {
  if (confirm("Clear all logs?")) {
    logTableBody.innerHTML = "";
    saveLogs();
    updateTotalTime();
  }
});

// Log a session to the table
function logSession(start, end, durSecs) {
  const tr = document.createElement("tr");
  const idx = logTableBody.children.length + 1;
  tr.innerHTML = `<td>${idx}</td><td>${start.toLocaleTimeString()}</td><td>${end.toLocaleTimeString()}</td><td>${formatTime(durSecs)}</td>`;
  logTableBody.appendChild(tr);
  saveLogs();
}

// Save logs to localStorage
function saveLogs() {
  localStorage.setItem("studyLogs", logTableBody.innerHTML);
}

// Load logs from localStorage
function loadLogs() {
  const data = localStorage.getItem("studyLogs");
  if (data) logTableBody.innerHTML = data;
}

// Update the total time worked
function updateTotalTime() {
  let total = 0;
  Array.from(logTableBody.children).forEach((row) => {
    const [m, s] = row.cells[3].textContent.split(":").map(Number);
    total += m * 60 + s;
  });
  document.getElementById("total-time").textContent = `Total Time Worked: ${Math.floor(total/60/60)}:${Math.floor(total / 60 % 60)}:${String(total % 60).padStart(2, "0")}`;
}

// Format time in HH:MM:SS format
function formatHMS(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ===========================
// Zen Mode Functionality
// ===========================

let isZenMode = false;
const zenAllowedIds = ["timer", "zen-mode-btn", "exercise-modal", "settings-modal"];

// Toggle Zen Mode
zenModeBtn.addEventListener("click", () => {
  isZenMode = !isZenMode;

  const allChildren = Array.from(document.body.children);

  allChildren.forEach((el) => {
    // Skip allowed elements
    if (zenAllowedIds.includes(el.id)) return;

    if (isZenMode) {
      el.classList.add("zen-hidden");
      zenModeBtn.textContent = "Exit Zen Mode";
    } else {
      el.classList.remove("zen-hidden");
      zenModeBtn.textContent = "Enter Zen Mode";
    }
  });
});

// ===========================
// Background Video Functionality
// ===========================

// Load background video from YouTube
function loadBackgroundVideo() {
    const videoId = localStorage.getItem("ytVideoId");
    if (!videoId) return;
  
    const iframe = document.getElementById("yt-bg");
  
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1`;
  }
  

// Extract YouTube video ID from URL
function extractVideoId(url) {
    var regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
  const match = url.match(regex);
  return match[1] || null;
}

// Set video URL input field
document.getElementById("set-video-url").value = `https://www.youtube.com/embed/${localStorage.getItem("ytVideoId") || ""}?autoplay=1&loop=1&enablejsapi=1`;

// Video Controls
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h') {
      document.querySelectorAll('.container').forEach(container => {
        container.style.display =
          container.style.display === 'none' ? '' : 'none';
      });
      document.querySelectorAll('#video-background iframe').forEach(frame => {
        frame.style.pointer_events =
            frame.style.pointer_events === 'none' ? 'auto' : 'none';
        frame.style.opacity =
            frame.style.opacity === '1' ? '0.1' : '1';
        frame.style.filter =
            frame.style.filter === 'none' ? 'blur(5px)' : 'none';
      });
    }
  });
  

// ===========================
// Initialization
// ===========================

loadLogs();
updateTotalTime();
applySettings();
startBtn.addEventListener("click", startTimer);
loadBackgroundVideo();