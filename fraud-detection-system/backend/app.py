from flask import Flask, request, jsonify
import pickle
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load model
model = pickle.load(open('model.pkl', 'rb'))

features = [
    'transaction_amount',
    'rapid_txn',
    'location_change',
    'device_change',
    'odd_hour',
    'dormant',
    'amount_deviation',
    'txn_count'
]

@app.route('/')
def home():
    return "Fraud Detection API Running"

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    input_data = [data.get(f, 0) for f in features]
    pred = model.predict([input_data])[0]

    # Fraud reasons
    reasons = []
    if data.get('rapid_txn') == 1:
        reasons.append("High transaction frequency")
    if data.get('device_change') == 1:
        reasons.append("Device switch detected")
    if data.get('odd_hour') == 1:
        reasons.append("Odd hour transaction")

    return jsonify({
        "fraud": int(pred),
        "reasons": reasons
    })

if __name__ == '__main__':
    app.run(debug=True)