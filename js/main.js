let studentId = null;
let enrId = null;

async function checkAndSearch() {
  const input = document.getElementById("enrollment").value.trim();
  const error = document.getElementById("error");
  const modal = document.getElementById("enrollment-modal");
  const loaderOverlay = document.getElementById("loader-overlay");
  
  error.innerText = "";
  modal.style.display = "none";
  
  if (!input) {
    error.innerText = "Please enter Enrollment ID, Student ID, or Phone Number";
    return;
  }
  
  // Validate input format
  const inputUpper = input.toUpperCase();
  const isEnrollmentId = inputUpper.startsWith('ENR');
  const isStudentId = inputUpper.startsWith('S');
  const isPhoneNumber = /^\d{10,}$/.test(input);
  
  // If input doesn't match any valid pattern, show error
  if (!isEnrollmentId && !isStudentId && !isPhoneNumber) {
    error.innerText = "Please enter a valid Enrollment ID (ENR...), Student ID (S-...), or Phone Number";
    return;
  }
  
  if (isStudentId || isPhoneNumber) {
    // Search by student ID or phone number
    try {
      // Show loader
      loaderOverlay.style.display = "flex";
      
      const queryParam = isPhoneNumber 
        ? `phone=${encodeURIComponent(input)}`
        : `student_id=${encodeURIComponent(input)}`;
      
      // Production API: https://studentportal-cwrg.onrender.com
      // Local Dev API: http://localhost:5000
      const res = await fetch(
        `https://studentportal-cwrg.onrender.com/enrollments-by-student?${queryParam}`
      );
      
      // Hide loader
      loaderOverlay.style.display = "none";
      
      if (res.status !== 200) {
        error.innerText = "Internal Server Error";
        return;
      }
      
      const data = await res.json();
      
      if (data.error || !data || data.length === 0) {
        const searchType = isPhoneNumber ? "Phone Number" : "Student ID";
        error.innerText = `No enrollments found for this ${searchType}`;
        return;
      }
      
      if (data.length === 1) {
        // Only one enrollment, proceed directly
        document.getElementById("enrollment").value = data[0].name;
        searchAndGetAttendance();
      } else {
        // Multiple enrollments, show selection modal
        showEnrollmentSelection(data);
      }
    } catch (err) {
      loaderOverlay.style.display = "none";
      error.innerText = "Error searching for enrollments";
    }
  } else {
    // Search by enrollment ID (existing flow)
    searchAndGetAttendance();
  }
}

function showEnrollmentSelection(enrollments) {
  const modal = document.getElementById("enrollment-modal");
  const listContainer = document.getElementById("enrollment-list");
  
  let html = '<div class="enrollment-options">';
  
  enrollments.forEach(enr => {
    const date = new Date(enr.creation).toLocaleDateString('en-IN');
    const isDropped = enr.is_dropped === 1 || enr.is_dropped === true;
    const hasJoined = enr.has_joined === 1 || enr.has_joined === true;
    const dropoutReason = enr.dropout_reason || 'Not specified';
    
    // Determine class: dropped takes priority over joined
    let statusClass = '';
    if (isDropped) {
      statusClass = 'dropped';
    } else if (hasJoined) {
      statusClass = 'joined';
    }
    
    html += `
      <div class="enrollment-option ${statusClass}" onclick="selectEnrollment('${enr.name}')">
        <div class="enr-info">
          <div class="enr-student-info">
            <div class="student-name">${enr.student_name || 'N/A'}</div>
            <div class="student-id">ID: ${enr.student || 'N/A'}</div>
          </div>
          <div class="enr-id">
            ${enr.name}
            ${isDropped ? '<span class="dropout-badge">DROPPED</span>' : ''}
            ${!isDropped && hasJoined ? '<span class="joined-badge">JOINED</span>' : ''}
          </div>
          <div class="enr-program">${enr.program || 'N/A'}</div>
          ${isDropped ? `<div class="dropout-reason">Reason: ${dropoutReason}</div>` : ''}
        </div>
        <div class="enr-date">Created: ${date}</div>
      </div>
    `;
  });
  
  html += '</div>';
  listContainer.innerHTML = html;
  modal.style.display = "flex";
}

function closeEnrollmentModal() {
  document.getElementById("enrollment-modal").style.display = "none";
}

function closeModalOnBackdrop(event) {
  if (event.target.id === "enrollment-modal") {
    closeEnrollmentModal();
  }
}

function selectEnrollment(enrollmentId) {
  document.getElementById("enrollment").value = enrollmentId;
  document.getElementById("enrollment-modal").style.display = "none";
  searchAndGetAttendance();
}

async function searchStudent() {
  const enrollment = document.getElementById("enrollment").value;
  const cards = document.getElementById("cards");
  const error = document.getElementById("error");

  cards.innerHTML = "";
  error.innerText = "";

  if (!enrollment) {
    error.innerText = "Please enter Enrollment ID";
    return null;
  }

  try {
    // Production API: https://studentportal-cwrg.onrender.com
    // Local Dev API: http://localhost:5000
    const res = await fetch(
      `https://studentportal-cwrg.onrender.com/enrollment?enrollment=${encodeURIComponent(enrollment)}`
    );

    if (res.status !== 200) {
      error.innerText = "Internal Server Error";
      return null;
    }

    const data = await res.json();

    if (data.error) {
      error.innerText = "Student not found";
      return null;
    }
    
    let enr_id = data['name'];
    let student_name = data['student_name'];
    let program = data['program'];
    let offered_amount = Math.round(Number(data['offered_amount']));
    let discount_amount = Math.round(Number(data['discount_amount']));
    let new_offered_amount = Math.round(Number(data['new_offered_amount']));
    let student_mobile = data['student_mobile'];
    let total_course_fee_paid = Math.round(Number(data['total_course_fee_paid']));
    let course_fee_balance = Math.round(Number(data['course_fee_balance']));
    let student_id_value = data['student'];
    studentId = student_id_value;
    enrId = enr_id;
    let center = data['preferred_centre'];
    let hostel_or_day_scholar = data['hostel_or_day_scholar'];
    let hostel = 'NA';
    if (hostel_or_day_scholar === 'Hosteller') {
      hostel = data['hostel']
    }
    let batch = data['student_batch_name'];
    let status = data['docstatus'] === 2 ? 'Cancelled':data['is_dropped']===1 ? 'Dropped': data['has_joined'] === 1 ? 'Joined':'Active'


    

    cards.innerHTML = `
      <div class="card">
        <div class="label">Enrollment ID</div>
        <div class="value">${enr_id}</div>
      </div>
      <div class="card">
        <div class="label">Student ID</div>
        <div class="value amount">${student_id_value}</div>
      </div>
      <div class="card">
        <div class="label">Student Name</div>
        <div class="value">${student_name}</div>
      </div>
      <div class="card">
        <div class="label">Program</div>
        <div class="value">${program}</div>
      </div>
      <div class="card">
        <div class="label">Contact Number</div>
        <div class="value">${student_mobile}</div>
      </div>
      <div class="card">
        <div class="label">Status</div>
        <div class="value">${status}</div>
      </div>
      <div class="card">
        <div class="label">Batch</div>
        <div class="value">${batch}</div>
      </div>
      <div class="card">
        <div class="label">Center</div>
        <div class="value">${center}</div>
      </div>
      <div class="card">
        <div class="label">Hostel</div>
        <div class="value">${hostel}</div>
      </div>
      <div class="card">
        <div class="label">Offered Amount</div>
        <div class="value amount">₹ ${offered_amount}</div>
      </div>
      <div class="card">
        <div class="label">Discount Amount</div>
        <div class="value discount">₹ ${discount_amount}</div>
      </div>
      <div class="card">
        <div class="label">Final Offered Amount</div>
        <div class="value amount">₹ ${new_offered_amount}</div>
      </div>
      <div class="card">
        <div class="label">Total Course Fee Paid</div>
        <div class="value amount">₹ ${total_course_fee_paid}</div>
      </div>
      <div class="card">
        <div class="label">Course Fee Balance</div>
        <div class="value amount">₹ ${course_fee_balance}</div>
      </div>
    `;
    
    return data;
  } catch (err) {
    error.innerText = "Error fetching data";
    return null;
  }
}

async function getAttendance() {
  // Production API: https://studentportal-cwrg.onrender.com
  // Local Dev API: http://localhost:5000
  const res = await fetch(
    `https://studentportal-cwrg.onrender.com/attendance?student_id=${encodeURIComponent(studentId)}`
  );

  if (res.status !== 200) {
    const error = document.getElementById("error");
    error.innerText = "Internal Server Error";
    throw new Error("Internal Server Error");
  }

  const data = await res.json();
  return data;
}

async function getExamResult() {
  const enrollment = document.getElementById("enrollment").value;
  // Production API: https://studentportal-cwrg.onrender.com
  // Local Dev API: http://localhost:5000
  const res = await fetch(
    `https://studentportal-cwrg.onrender.com/result?enrollment=${encodeURIComponent(enrollment)}`
  );

  if (res.status !== 200) {
    const error = document.getElementById("error");
    error.innerText = "Internal Server Error";
    throw new Error("Internal Server Error");
  }

  const data = await res.json();
  return data;
}



async function searchAndGetAttendance() {
  const output = document.getElementById("output");
  const heatmapContainer = document.getElementById("heatmap-container");
  const examResultContainer = document.getElementById("exam-result-container");
  const loaderOverlay = document.getElementById("loader-overlay");
  
  if (output) output.textContent = "Running API chain...\n";
  
  // Show loader
  loaderOverlay.style.display = "flex";
  heatmapContainer.style.display = "none";
  examResultContainer.style.display = "none";

  try {
    const studentData = await searchStudent();
    
    // If student not found, don't proceed with fetching attendance/results
    if (!studentData) {
      loaderOverlay.style.display = "none";
      heatmapContainer.style.display = "none";
      examResultContainer.style.display = "none";
      return;
    }
    
    const attendanceData = await getAttendance();
    const examResultData = await getExamResult();

    const combinedResponse = {
      student: studentData,
      attendance: attendanceData,
      examResult: examResultData
    };

    if (output) output.textContent = JSON.stringify(combinedResponse, null, 2);
    
    if (attendanceData && attendanceData.daily_summary) {
      heatmapContainer.style.display = "block";
      renderDailySummaryHeatmap(attendanceData.daily_summary);
    }

    if (examResultData && examResultData.length > 0) {
      examResultContainer.style.display = "block";
      renderExamResults(examResultData);
    }
    
    // Hide loader after all data is loaded
    loaderOverlay.style.display = "none";

  } catch (err) {
    if (output) output.textContent = "❌ Error: " + err.message;
    loaderOverlay.style.display = "none";
    heatmapContainer.style.display = "none";
    examResultContainer.style.display = "none";
  }
}






/**
 * Render daily summary heatmap (At Batch/At Hostel/At Home)
 */
function renderDailySummaryHeatmap(dailySummary) {
  const container = document.getElementById('daily-calendar');
  
  const last90Days = getLast90Days();
  
  let atBatchCount = 0;
  let atHostelCount = 0;
  let atHomeCount = 0;
  let recordedDays = 0;
  
  last90Days.forEach(dateStr => {
    const status = dailySummary[dateStr];
    if (status) {
      recordedDays++;
      if (status === 'At Batch') atBatchCount++;
      else if (status === 'At Hostel') atHostelCount++;
      else if (status === 'At Home') atHomeCount++;
    }
  });

  let html = `
    <div class="attendance-stats">
      <div class="stat-item">
        <span class="stat-label">Recorded Days</span>
        <span class="stat-value">${recordedDays}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">At Batch</span>
        <span class="stat-value at-batch-count">${atBatchCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">At Hostel</span>
        <span class="stat-value at-hostel-count">${atHostelCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">At Home</span>
        <span class="stat-value at-home-count">${atHomeCount}</span>
      </div>
    </div>
    <div class="calendar-grid">
  `;

  last90Days.forEach(dateStr => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const status = dailySummary[dateStr] || null;
    
    let className = 'calendar-day';
    let statusClass = 'empty';
    
    if (status === 'At Batch') {
      className += ' at-batch';
      statusClass = 'at-batch';
    } else if (status === 'At Hostel') {
      className += ' at-hostel';
      statusClass = 'at-hostel';
    } else if (status === 'At Home') {
      className += ' at-home';
      statusClass = 'at-home';
    } else {
      className += ' empty';
    }

    html += `
      <div class="${className}" title="${dateStr}: ${status || 'No Record'}">
        <div class="day-number">${day}</div>
        <div class="day-month">${month}</div>
      </div>
    `;
  });

  html += `
    </div>
    <div class="heatmap-legend">
      <div class="legend-item">
        <div class="legend-box at-batch"></div>
        <span>At Batch</span>
      </div>
      <div class="legend-item">
        <div class="legend-box at-hostel"></div>
        <span>At Hostel</span>
      </div>
      <div class="legend-item">
        <div class="legend-box at-home"></div>
        <span>At Home</span>
      </div>
      <div class="legend-item">
        <div class="legend-box empty"></div>
        <span>No Record</span>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function getLast90Days() {
  const days = [];
  const today = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  
  return days;
}

function renderExamResults(examResults) {
  const container = document.getElementById('exam-result-table');
  
  if (!examResults || examResults.length === 0) {
    container.innerHTML = '<p>No exam results found.</p>';
    return;
  }

  // Filter for last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const filteredResults = examResults.filter(result => {
    return new Date(result.date) >= threeMonthsAgo;
  });

  // Sort by date (most recent first)
  const sortedResults = [...filteredResults].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  // Calculate statistics
  const totalMarks = sortedResults.reduce((sum, result) => sum + Number(result.total_mark || 0), 0);
  const obtainedMarks = sortedResults.reduce((sum, result) => sum + Number(result.student_mark || 0), 0);
  const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : 0;
  
  // Calculate daily test average
  const dailyTests = sortedResults.filter(result => 
    result.exam_type && result.exam_type.toLowerCase().includes('daily')
  );
  const dailyTestAvg = dailyTests.length > 0 
    ? dailyTests.reduce((sum, result) => {
        const total = Number(result.total_mark || 0);
        const student = Number(result.student_mark || 0);
        return sum + (total > 0 ? (student / total) * 100 : 0);
      }, 0) / dailyTests.length
    : 0;

  let html = `
    <div class="exam-stats">
      <div class="stat-item">
        <span class="stat-label">Total Exams</span>
        <span class="stat-value">${sortedResults.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Daily Test Average</span>
        <span class="stat-value">${dailyTestAvg.toFixed(2)}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Overall Percentage</span>
        <span class="stat-value">${percentage}%</span>
      </div>
    </div>
    <div class="exam-table-wrapper">
      <table class="exam-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Subject/Paper</th>
            <th>Exam Type</th>
            <th>Type of Test</th>
            <th>Total Mark</th>
            <th>Student Mark</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
  `;

  sortedResults.forEach(result => {
    const date = new Date(result.date).toLocaleDateString('en-IN');
    const totalMark = Number(result.total_mark || 0);
    const studentMark = Number(result.student_mark || 0);
    const percent = totalMark > 0 ? ((studentMark / totalMark) * 100).toFixed(2) : 0;
    
    // Add color class based on percentage
    let percentClass = '';
    if (percent >= 75) percentClass = 'excellent';
    else if (percent >= 60) percentClass = 'good';
    else if (percent >= 40) percentClass = 'average';
    else percentClass = 'poor';

    html += `
      <tr>
        <td>${date}</td>
        <td>${result.subject__paper || '-'}</td>
        <td>${result.exam_type || '-'}</td>
        <td>${result.type_of_test || '-'}</td>
        <td>${totalMark}</td>
        <td>${studentMark}</td>
        <td class="${percentClass}">${percent}%</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
    <button class="print-button" onclick="printFullReport()">Print Full Report</button>
  `;

  container.innerHTML = html;
}

function printFullReport() {
  const enrollment = document.getElementById("enrollment").value;
  const studentCards = document.getElementById("cards").innerHTML;
  const attendanceSection = document.getElementById("heatmap-container").innerHTML;
  const examResultSection = document.getElementById("exam-result-table").innerHTML;
  
  const printWindow = window.open('', '', 'height=800,width=1000');
  printWindow.document.write(`
    <html>
      <head>
        <title>Student Report - ${enrollment}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
          }
          h2 {
            color: #333;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 5px;
          }
          h3 {
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          .card-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .card {
            border: 1px solid #ddd;
            padding: 12px;
            border-radius: 5px;
            background: #f9f9f9;
          }
          .label {
            font-size: 11px;
            color: #666;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .value {
            font-size: 14px;
            color: #333;
          }
          .amount {
            color: #27ae60;
            font-weight: bold;
          }
          .discount {
            color: #c0392b;
            font-weight: bold;
          }
          .attendance-stats, .exam-stats {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
            flex-wrap: wrap;
          }
          .stat-item {
            text-align: center;
            min-width: 120px;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
          }
          .stat-value {
            font-size: 18px;
            font-weight: bold;
            display: block;
            margin-top: 5px;
          }
          .at-batch-count { color: #3498db; }
          .at-hostel-count { color: #f39c12; }
          .at-home-count { color: #9b59b6; }
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(15, 1fr);
            gap: 5px;
            margin: 20px 0;
          }
          .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            font-size: 9px;
            padding: 3px;
            border: 1px solid #e5e7eb;
          }
          .calendar-day .day-number {
            font-weight: 600;
            font-size: 11px;
            color: #1f2937;
          }
          .calendar-day .day-month {
            font-size: 7px;
            color: #6b7280;
          }
          .calendar-day.at-batch {
            background: #3498db;
            color: white;
            border-color: #3498db;
          }
          .calendar-day.at-batch .day-number,
          .calendar-day.at-batch .day-month {
            color: white;
          }
          .calendar-day.at-hostel {
            background: #f39c12;
            color: white;
            border-color: #f39c12;
          }
          .calendar-day.at-hostel .day-number,
          .calendar-day.at-hostel .day-month {
            color: white;
          }
          .calendar-day.at-home {
            background: #9b59b6;
            color: white;
            border-color: #9b59b6;
          }
          .calendar-day.at-home .day-number,
          .calendar-day.at-home .day-month {
            color: white;
          }
          .calendar-day.empty {
            background-color: #f3f4f6;
            border-color: #d1d5db;
          }
          .heatmap-legend {
            display: flex;
            gap: 15px;
            margin-top: 15px;
            flex-wrap: wrap;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
          }
          .legend-box {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            border: 1px solid #d1d5db;
          }
          .legend-box.at-batch { background: #3498db; border-color: #3498db; }
          .legend-box.at-hostel { background: #f39c12; border-color: #f39c12; }
          .legend-box.at-home { background: #9b59b6; border-color: #9b59b6; }
          .legend-box.empty { background-color: #f3f4f6; }
          .exam-table-wrapper {
            overflow-x: auto;
            margin-top: 20px;
          }
          .exam-table {
            width: 100%;
            border-collapse: collapse;
          }
          .exam-table th,
          .exam-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-size: 12px;
          }
          .exam-table th {
            background-color: #4CAF50;
            color: white;
          }
          .exam-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .excellent { color: #4CAF50; font-weight: bold; }
          .good { color: #2196F3; font-weight: bold; }
          .average { color: #FF9800; font-weight: bold; }
          .poor { color: #f44336; font-weight: bold; }
          @media print {
            body { padding: 10px; }
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Student Complete Report</h1>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">Enrollment ID: ${enrollment}</p>
        
        <h2>Student Details</h2>
        <div class="card-container">
          ${studentCards}
        </div>
        
        <h2>Attendance Summary</h2>
        ${attendanceSection}
        
        <h2>Exam Results</h2>
        ${examResultSection}
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

