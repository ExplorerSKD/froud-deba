# 🔍 Money Muling Detection Engine

**Graph-Based Financial Crime Detection System**

Detect money muling fraud, smurfing patterns, and suspicious transaction rings from CSV transaction data using graph theory algorithms.

---

## 🏗 Architecture

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React (Vite), Tailwind CSS, Cytoscape.js, Axios |
| Backend  | Python FastAPI, NetworkX, Pandas  |

## 📁 Project Structure

```
money-muling-detector/
├── backend/
│   ├── main.py              # FastAPI app & endpoints
│   ├── detector.py           # Enhanced Graph-based fraud detection engine
│   ├── models.py             # Pydantic response models
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadCSV.jsx
│   │   │   ├── GraphVisualization.jsx
│   │   │   ├── SuspiciousTable.jsx
│   │   │   ├── FraudRingsTable.jsx
│   │   │   ├── SummaryDashboard.jsx
│   │   │   └── JsonDownload.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── test.csv                  # Sample data with fraud patterns
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API docs at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔬 Detection Algorithms

This system implements **7 advanced detection algorithms** to identify financial crime patterns:

| Algorithm | Description | Score Impact |
|-----------|-------------|--------------|
| **1. Cycle Detection** | Finds circular transaction rings (e.g., A→B→C→A) of length 3–5. Primary indicator of money muling. | **+50** |
| **2. Pass-Through Ratio** | Detects shell accounts that forward >98% of received funds within 48 hours. (`out_amount / in_amount > 0.98`) | **+30** |
| **3. Temporal Clustering** | Identifies accounts with burst activity (≥10 transactions) within any 72-hour sliding window. | **+20** |
| **4. Fan-in Detection** | Detects "Smurfing" (many small transfers into one account). Threshold: ≥10 distinct senders. | **+10** |
| **5. Fan-out Detection** | Detects dispersion of funds (one account sending to many). Threshold: ≥10 distinct receivers. | **+10** |
| **6. Layered Chains** | Detects long transaction paths (≥3 hops) typical of layering schemes. | (Informational) |
| **7. Merchant Trap Protection** | **CRITICAL**: Automatically identifies legitimate merchants (High Fan-in, Low Pass-Through, No Cycles) and **forces their score to 0** to prevent false positives. | **Score = 0** |

### 🚨 Suspicion Scoring Model

Each account is assigned a risk score from **0 to 100**.

- **Score ≥ 60**: Flagged as **Suspicious**
- **Score < 60**: Considered Normal (or Low Risk)
- **Legitimate Merchants**: Score forced to 0

**Formula:**
```python
Score = min(100, (IsCycle * 50) + (IsShell * 30) + (IsBurst * 20) + (IsFanIn * 10) + (IsFanOut * 10))
```

---

## 📊 CSV Format

The system accepts a CSV file with the following columns:

```csv
transaction_id,sender_id,receiver_id,amount,timestamp
TX001,ACC001,ACC002,5000,2026-02-19 10:00:00
```

---

## 🚀 Deployment

### Docker (Optional)

**Backend:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/ .
RUN pip install -r requirements.txt
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY frontend/ .
RUN npm install && npm run build
# Serve with any static file server
```

### Environment Variables

| Variable       | Default               | Description       |
|----------------|-----------------------|-------------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL  |

---

## 📝 API Reference

### `POST /upload-csv`

Upload a CSV file for fraud analysis.

**Request:** `multipart/form-data` with `file` field  
**Response:** JSON with `suspicious_accounts`, `fraud_rings`, `summary`, and `graph_data`

---

## 📄 License

MIT
