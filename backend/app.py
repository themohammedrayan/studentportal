from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from collections import defaultdict
from datetime import datetime,timedelta

app = Flask(__name__)
CORS(app)

BASE_URL = "https://xylem.binalyto.com"
API_KEY = "ed5a11fa33f8cec"
API_SECRET = "f4be06e94994016"

HEADERS = {
    "Authorization": f"token {API_KEY}:{API_SECRET}",
    "Content-Type": "application/json"
}

@app.route("/enrollment", methods=["GET"])
def student_search():
    enrollment = request.args.get("enrollment")

    if not enrollment:
        return jsonify({"error": "Enrollment ID is required"}), 400

    url = f"{BASE_URL}/api/resource/Program Enrollment/{enrollment}"

    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        return jsonify({
            "error": "Student not found or API error",
            "details": r.json()
        }), r.status_code

    return jsonify(r.json().get("data"))

@app.route("/enrollments-by-student", methods=["GET"])
def enrollments_by_student():
    try:
        student_id = request.args.get("student_id")
        phone = request.args.get("phone")

        if not student_id and not phone:
            return jsonify({"error": "Student ID or Phone number is required"}), 400

        url = f"{BASE_URL}/api/resource/Program Enrollment"
        
        if phone:
            # Search by last 10 digits of phone number
            last_10_digits = phone[-10:]
            filters = json.dumps([
                ['Program Enrollment','student_mobile','like',f'%{last_10_digits}'],
                ['Program Enrollment','docstatus','=',1]
            ])
        else:
            # Search by student ID
            filters = json.dumps([
                ['Program Enrollment','student','=',student_id],
                ['Program Enrollment','docstatus','=',1]
            ])
        
        fields = json.dumps(
            ['name','student','student_name','program','creation','is_dropped','dropout_reason','docstatus','student_mobile','has_joined']
        )

        r = requests.get(url, headers=HEADERS, params={'fields':fields,'filters':filters,'limit_page_length':1000})

        if r.status_code != 200:
            return jsonify({
                "error": "Failed to fetch enrollments",
                "details": r.json()
            }), r.status_code

        return jsonify(r.json().get("data"))
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route("/attendance", methods=["GET"])
def attendance_search():
    student_id = request.args.get("student_id")

    if not student_id:
        return jsonify({"error": "Student ID is required"}), 400
    
    url = f"{BASE_URL}/api/resource/Class Attendance"
    
    from_date = (datetime.today() - timedelta(days=90)).strftime("%Y-%m-%d 00:00:00")

    filters = json.dumps([
        ['Class Attendance','student','=',student_id],
        ['Class Attendance','date','>=',from_date]
    ])
    #pulling only last 90 days attendance summary
    fields = json.dumps(
        ['name','student','enrollment','date','based_on','status']

    )

    r = requests.get(url,headers=HEADERS,params={'fields':fields,'filters':filters,'limit_page_length':1000})
    
    if r.status_code != 200:
        return jsonify({
            'error':'Failed to Fetch Attendance : Backend',
            'details':r.json()
        }), r.status_code
    
    summary_data = summarise_attendance(r.json()['data'])
    return jsonify(summary_data)


def summarise_attendance(records):
    batch_summary = {}
    hostel_summary = {}
    daily_summary = {}

    # Group records by date
    date_records = defaultdict(lambda: {'hostel': None, 'batch': None})
    
    for r in records:
        based_on = r.get('based_on')
        status = r.get('status')
        date = datetime.strptime(r["date"], "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d")
        
        if based_on == 'Hostel':
            date_records[date]['hostel'] = status
            hostel_summary[date] = status
        elif based_on == 'Batch':
            date_records[date]['batch'] = status
            batch_summary[date] = status
    
    # Determine daily location
    for date, attendance in date_records.items():
        in_hostel = attendance['hostel'] == 'Present'
        in_batch = attendance['batch'] == 'Present'
        
        if in_batch:
            daily_summary[date] = 'At Batch'
        elif in_hostel:
            daily_summary[date] = 'At Hostel'
        else:
            daily_summary[date] = 'At Home'

    return {
        'batch_summary': batch_summary,
        'hostel_summary': hostel_summary,
        'daily_summary': daily_summary
    }
@app.route("/result", methods=["GET"])
def exam_result_search():
    enrollment = request.args.get("enrollment")

    if not enrollment:
        return jsonify({"error": "Enrollment ID is required"}), 400

    url = f"{BASE_URL}/api/resource/Exam Result"
    
    # Filter for last 3 months
    from_date = (datetime.today() - timedelta(days=90)).strftime("%Y-%m-%d")

    filters = json.dumps([
        ['Exam Result','enrollment','=',enrollment],
        ['Exam Result','date','>=',from_date]
    ])
    
    fields = json.dumps(
        ['name','student','enrollment','date','exam_type','subject__paper','total_mark','student_mark','type_of_test']
    )

    r = requests.get(url,headers=HEADERS,params={'fields':fields,'filters':filters,'limit_page_length':1000})


    if r.status_code != 200:
        return jsonify({
            "error": "Student not found or API error",
            "details": r.json()
        }), r.status_code

    return jsonify(r.json().get("data"))


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

'''if __name__ == "__main__":
    app.run(port=5000, debug=True)
'''
