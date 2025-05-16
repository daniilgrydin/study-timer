const tableBody = document.querySelector('#edit-table tbody');
const dailyTotals = JSON.parse(localStorage.getItem('dailyTotals')) || {};
const addBtn = document.getElementById('add-btn');

// Function to format seconds into HH:MM:SS format
function formatHMS(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

// Function to parse the duration string (HH:MM:SS or MM:SS)
function parseDuration(hms) {
  const parts = hms.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

// Function to render the table from dailyTotals
function renderTable() {
  tableBody.innerHTML = '';
  const keys = Object.keys(dailyTotals).sort((a, b) => new Date(b) - new Date(a));
  keys.forEach(key => {
    const tr = document.createElement('tr');
    const durationStr = formatHMS(dailyTotals[key]);

    tr.innerHTML = `
      <td>${key}</td>
      <td><input type="text" value="${durationStr}" class="duration-input"></td>
      <td>
        <button class="save-btn" data-key="${key}">Save</button>
        <button class="delete-btn" data-key="${key}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// Event listener for saving and deleting logs
tableBody.addEventListener('click', e => {
  const key = e.target.dataset.key;
  if (e.target.classList.contains('save-btn')) {
    const input = e.target.closest('tr').querySelector('.duration-input');
    const value = parseDuration(input.value);
    dailyTotals[key] = value;
    localStorage.setItem('dailyTotals', JSON.stringify(dailyTotals));
    renderTable();
  } else if (e.target.classList.contains('delete-btn')) {
    if (confirm(`Delete log for ${key}?`)) {
      delete dailyTotals[key];
      localStorage.setItem('dailyTotals', JSON.stringify(dailyTotals));
      renderTable();
    }
  }
});

// Event listener for adding a new log
addBtn.addEventListener('click', () => {
  const date = document.getElementById('new-date').value;
  const duration = document.getElementById('new-duration').value;

  // Check if both date and duration are entered
  if (!date || !duration) return alert('Please enter both date and duration.');

  // Parse the duration to seconds
  const seconds = parseDuration(duration);

  // Ensure the date is in the correct format (YYYY-MM-DD)
  const formattedDate = new Date(date).toISOString().split('T')[0];

  // Add the new log entry to dailyTotals
  dailyTotals[formattedDate] = seconds;

  // Save the updated dailyTotals to localStorage
  localStorage.setItem('dailyTotals', JSON.stringify(dailyTotals));

  // Re-render the table and clear the inputs
  renderTable();
  document.getElementById('new-date').value = '';
  document.getElementById('new-duration').value = '';
});

// Initial render of the table
renderTable();
