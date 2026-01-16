from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

BASE_URL = "https://xylem.binalyto.com"
API_KEY = "ed5a11fa33f8cec"
API_SECRET = "f4be06e94994016"

HEADERS = {
    "Authorization": f"token {API_KEY}:{API_SECRET}",
    "Content-Type": "application/json"
}

@app.route("/student", methods=["GET"])
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

if __name__ == "__main__":
    app.run(port=5000, debug=True)
