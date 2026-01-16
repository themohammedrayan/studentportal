document.getElementById("searchBtn").addEventListener("click", searchStudent);

async function searchStudent() {
  const enrollment = document.getElementById("enrollment").value;
  const result = document.getElementById("result");

  if (!enrollment) {
    result.innerText = "Please enter Enrollment ID";
    return;
  }

  result.innerText = "Loading...";

  try {
    const res = await fetch(
      `http://localhost:5000/student?enrollment=${encodeURIComponent(enrollment)}`
    );

    if (!res.ok) {
      throw new Error("Student not found");
    }

    const data = await res.json();

    const filteredData = {
      "Enrollment ID": data.name,
      "Student Name": data.student_name,
      "Program": data.program,
      "Offered Amount": data.offered_amount,
      "Discount Amount": data.discount_amount,
      "Final Offered Amount": data.new_offered_amount,
    };

    result.innerText = JSON.stringify(filteredData, null, 2);

  } catch (err) {
    result.innerText = "Error fetching student data";
  }
}
