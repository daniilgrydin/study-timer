// Load the daily totals map from localStorage
const dailyTotals = JSON.parse(localStorage.getItem('dailyTotals')) || {};

// Convert seconds to HH:MM:SS
function formatHMS(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].join(':');
}

function buildCalendar() {
  const container = document.getElementById('calendar-grid');
  container.innerHTML = '';

  // Weekday headers
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  weekdays.forEach(day => {
    const hd = document.createElement('div');
    hd.className = 'day-cell header';
    hd.textContent = day;
    container.appendChild(hd);
  });

  // Setup dates
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to midnight
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();

  // Compute current week range (Sunday to Saturday)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + (6 - today.getDay()));
  weekEnd.setHours(0, 0, 0, 0);

  // Blank cells before 1st of month
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'day-cell blank';
    container.appendChild(blank);
  }

  // Day cells
  for (let d = 1; d <= numDays; d++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';

    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0); // normalize time for accurate comparison
    const key = cellDate.toLocaleDateString();
    const secs = dailyTotals[key] || 0;
    const hours = secs ? formatHMS(secs) : '';

    cell.innerHTML = `
      <div class="day-number">${d}</div>
      <div class="hours">${hours}</div>
    `;

    // Highlight today
    if (cellDate.getTime() === today.getTime()) {
      cell.classList.add('today');
    }
    // Highlight current week
    else if (cellDate >= weekStart && cellDate <= weekEnd) {
      cell.classList.add('current-week');
    }

    container.appendChild(cell);
  }
}

// Build on load
window.addEventListener('DOMContentLoaded', buildCalendar);
