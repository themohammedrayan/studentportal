let studentId = null;

async function searchStudent() {
  const enrollment = document.getElementById("enrollment").value;

  const res = await fetch(
    `http://localhost:5000/enrollment?enrollment=${encodeURIComponent(enrollment)}`
  );

  const data = await res.json();

  // adjust field name if required
  studentId = data.student;

  if (!studentId) {
    throw new Error("student_id not found in student response");
  }

  return data; // 🔑 return student JSON
}

async function getAttendance() {
  const res = await fetch(
    `http://localhost:5000/attendance?student_id=${encodeURIComponent(studentId)}`
  );

  const data = await res.json();
  return data; // 🔑 return attendance JSON
}

/**
 * Wrapper: runs both APIs in order
 * and prints both responses
 */
async function searchAndGetAttendance() {
  const output = document.getElementById("output");
  output.textContent = "Running API chain...\n";

  try {
    const studentData = await searchStudent();   // 1️⃣
    const attendanceData = await getAttendance(); // 2️⃣

    const combinedResponse = {
      student: studentData,
      attendance: attendanceData
    };

    output.textContent = JSON.stringify(combinedResponse, null, 2);
    renderAttendanceHeatmaps(attendanceData);
    // Render heatmaps if attendance data exists
    //if (attendanceData && attendanceData.attendance) {
      //renderAttendanceHeatmaps(attendanceData.attendance);
    //}

  } catch (err) {
    output.textContent = "❌ Error: " + err.message;
  }
}




/**
 * Render attendance heatmaps for batch and hostel
 */
function renderAttendanceHeatmaps(attendance) {
  // attendance[0] = batch attendance
  // attendance[1] = hostel attendance
  
  if (attendance.length >= 1) {
    renderHeatmap('batch-calendar', attendance[0], 'Batch');
  }
  
  if (attendance.length >= 2) {
    renderHeatmap('hostel-calendar', attendance[1], 'Hostel');
  }
}

/**
 * Render a single heatmap calendar
 */
function renderHeatmap(containerId, attendanceData, type) {
  const container = document.getElementById(containerId);
  
  // Generate last 90 days
  const last90Days = getLast90Days();
  
  // Calculate stats (only for days with records)
  let presentCount = 0;
  let absentCount = 0;
  let recordedDays = 0;
  
  last90Days.forEach(dateStr => {
    if (attendanceData && attendanceData[dateStr]) {
      recordedDays++;
      if (attendanceData[dateStr] === 'Present') {
        presentCount++;
      } else if (attendanceData[dateStr] === 'Absent') {
        absentCount++;
      }
    }
  });
  
  const attendanceRate = recordedDays > 0 ? ((presentCount / recordedDays) * 100).toFixed(1) : 0;

  // Build HTML
  let html = `
    <div class="attendance-stats">
      <div class="stat-item">
        <span class="stat-label">Recorded Days</span>
        <span class="stat-value">${recordedDays}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Present</span>
        <span class="stat-value present-count">${presentCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Absent</span>
        <span class="stat-value absent-count">${absentCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Attendance Rate</span>
        <span class="stat-value">${attendanceRate}%</span>
      </div>
    </div>
    <div class="calendar-grid">
  `;

  // Create calendar cells for all 90 days
  last90Days.forEach(dateStr => {
    const status = attendanceData && attendanceData[dateStr] ? attendanceData[dateStr] : null;
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    let statusClass = 'empty';
    let statusText = 'No record';
    
    if (status === 'Present') {
      statusClass = 'present';
      statusText = 'Present';
    } else if (status === 'Absent') {
      statusClass = 'absent';
      statusText = 'Absent';
    }

    html += `
      <div class="calendar-day ${statusClass}" title="${dateStr}: ${statusText}">
        <div class="day-number">${day}</div>
        <div class="day-month">${month}</div>
      </div>
    `;
  });

  html += `
    </div>
    <div class="heatmap-legend">
      <div class="legend-item">
        <div class="legend-box present"></div>
        <span>Present</span>
      </div>
      <div class="legend-item">
        <div class="legend-box absent"></div>
        <span>Absent</span>
      </div>
      <div class="legend-item">
        <div class="legend-box empty"></div>
        <span>No Record</span>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Generate array of last 90 days in YYYY-MM-DD format
 */
function getLast90Days() {
  const days = [];
  const today = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    days.push(dateStr);
  }
  
  return days;
}
