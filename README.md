# 🔍 Money Muling Detection Engine

**Graph-Based Financial Crime Detection System**

Detect money muling fraud, smurfing patterns, and suspicious transaction rings from CSV transaction data using graph theory algorithms and statistical analysis.

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
│   ├── main.py                       # FastAPI app & endpoints
│   ├── detector.py                   # Graph-based fraud detection engine (10 algorithms)
│   ├── models.py                     # Pydantic response models
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadCSV.jsx         # CSV upload with drag-and-drop
│   │   │   ├── GraphVisualization.jsx # Interactive Cytoscape.js graph
│   │   │   ├── SummaryDashboard.jsx  # Summary stat cards
│   │   │   ├── SuspiciousTable.jsx   # Sortable suspicious accounts table
│   │   │   ├── FraudRingsTable.jsx   # Detected fraud rings table
│   │   │   ├── StatisticsPanel.jsx   # Donut chart — pattern distribution
│   │   │   ├── SearchBar.jsx         # Search & highlight account on graph
│   │   │   ├── FilterDropdown.jsx    # Filter by risk level (High/Med/Low)
│   │   │   ├── LayerToggles.jsx      # Show/hide detection layers on graph
│   │   │   ├── LayoutSwitcher.jsx    # Switch graph layout algorithms
│   │   │   ├── ReportGenerator.jsx   # Export styled HTML investigation report
│   │   │   ├── ExportCSV.jsx         # Download results as CSV
│   │   │   ├── UploadHistory.jsx     # Previous analyses (localStorage)
│   │   │   ├── ThemeToggle.jsx       # Dark/Light mode switch
│   │   │   └── JsonDownload.jsx      # Download raw JSON results
│   │   ├── App.jsx                   # Main dashboard layout
│   │   ├── main.jsx
│   │   └── index.css                 # Design system + light mode
│   ├── package.json
│   └── vite.config.js
├── test.csv                          # Complex test data (60 txns, 7 patterns)
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

## 🔬 Detection Algorithms (10 Total)

### Core Algorithms

| # | Algorithm | Description | Score |
|---|-----------|-------------|-------|
| 1 | **Cycle Detection** | Finds circular money loops (A→B→C→A) of 3–5 nodes. Time-limited (5s) with length bounds for performance. | **+50** |
| 2 | **Pass-Through Ratio** | Detects shell accounts forwarding ≥98% of received funds. (`out / in > 0.98`) | **+30** |
| 3 | **Amount Anomaly** | Flags transactions >3 standard deviations from the global mean — catches unusual large transfers. | **+20** |
| 4 | **Temporal Clustering** | Identifies burst activity (≥10 txns in any 72-hour sliding window). | **+20** |
| 5 | **Round Amount Structuring** | Flags accounts where ≥50% of transactions are round numbers (₹1K, ₹5K, ₹10K, ₹50K, ₹1L). | **+15** |
| 6 | **Rapid Dormancy** | Flags accounts that burst (≥5 txns in 48h) then go silent for 7+ days — classic mule behavior. | **+15** |
| 7 | **Fan-In (Smurfing)** | Many small transfers into one account. Threshold: ≥10 distinct senders. | **+10** |
| 8 | **Fan-Out (Dispersion)** | One account distributing to many. Threshold: ≥10 distinct receivers. | **+10** |
| 9 | **Layered Chains** | Detects multi-hop paths (≥3 hops) typical of money laundering layers. | Flag only |
| 10 | **Merchant Protection** | Auto-identifies legitimate merchants (high fan-in, low pass-through, no cycles) → forces score to 0. | **Score = 0** |

### 🚨 Suspicion Scoring

Each account gets a risk score from **0 to 100**:

- **≥80**: 🔴 **High Risk** — likely fraud ring member
- **60–79**: 🟡 **Medium Risk** — suspicious patterns detected
- **<60**: 🟢 **Low Risk** — normal activity
- **Merchants**: Score forced to 0 (false positive protection)

```
Score = min(100, Cycle×50 + Shell×30 + Anomaly×20 + Burst×20 + Round×15 + Dormancy×15 + FanIn×10 + FanOut×10)
```

---

## 🖥️ Frontend Features

### High-Impact Tools

| Feature | Description |
|---------|-------------|
| 📄 **Generate Report** | Downloads a styled HTML investigation report with summary, tables, and print-friendly CSS |
| 🔍 **Search Account** | Type an account ID → graph pans, zooms, and highlights its connections |
| 🟡 **Risk Level Filter** | Filter suspicious accounts table by High (80+), Medium (60-79), Low |
| 🔗 **Detection Layer Toggles** | Show/hide cycle, fan-in, fan-out, pass-through, anomaly, round amount, merchant nodes |
| 🕐 **Upload History** | Previous analyses stored in localStorage — click to reload |

### Visualization & Export

| Feature | Description |
|---------|-------------|
| 📊 **Statistics Panel** | SVG donut chart showing pattern type distribution with color legend |
| 🎨 **Layout Switcher** | 5 graph layouts: Force-Directed, Circular, Hierarchical, Grid, Concentric |
| 📋 **Export CSV** | Download suspicious accounts as a CSV spreadsheet |
| 📥 **Download JSON** | Export full analysis results as JSON |
| 🌙 **Dark / Light Mode** | Theme toggle with localStorage persistence |

### Graph Interactions

- **Click node** → Shows account details (score, patterns, ring membership)
- **Hover node** → Highlights connected accounts and edges
- **Scroll** → Zoom in/out
- **Drag** → Pan the graph

---

## 📊 CSV Format

The system **auto-detects column names** — supports flexible headers:

```csv
TX_ID,SENDER_ACCOUNT_ID,RECEIVER_ACCOUNT_ID,TX_AMOUNT,TIMESTAMP
1,1001,1002,5000.00,1708329600
```

### Supported Column Aliases

| Internal Name | Accepted Headers |
|---------------|-----------------|
| `transaction_id` | TX_ID, txn_id, trans_id, id |
| `sender_id` | SENDER_ACCOUNT_ID, from_account, source_id, payer_id |
| `receiver_id` | RECEIVER_ACCOUNT_ID, to_account, target_id, payee_id |
| `amount` | TX_AMOUNT, txn_amount, value, transfer_amount, amt |
| `timestamp` | TIMESTAMP, date, datetime, tx_date, created_at |

### Timestamp Formats Supported
- **Unix epoch seconds**: `1708329600`
- **ISO strings**: `2026-02-19 10:00:00`
- **Step numbers**: `0, 1, 2, ...` (auto-converted to synthetic timestamps)
- **Missing**: Auto-generated sequential timestamps

---

## ⚡ Performance Optimizations

- **Vectorized pandas** — no `iterrows()`, all operations use `groupby()` aggregations
- **Length-bounded cycle detection** — NetworkX `simple_cycles(length_bound=5)`
- **5-second time limit** on cycle search — prevents hangs on dense graphs
- **BFS chain detection** with depth cap of 6
- **Pre-computed aggregations** — in/out amounts and degrees calculated once
- **Graph node limit** — max 2000 nodes for visualization (priority: suspicious + ring members)
- **Bulk edge insertion** — `add_edges_from()` instead of one-by-one
- **120-second upload timeout** on the frontend for large datasets

---

## 📝 API Reference

### `POST /upload-csv`

Upload a CSV file for fraud analysis.

**Request:** `multipart/form-data` with `file` field  
**Response:**

```json
{
  "suspicious_accounts": [
    {
      "account_id": "1001",
      "suspicion_score": 80,
      "detected_patterns": ["cycle_length_3", "round_amount_structuring"],
      "ring_id": "RING_001"
    }
  ],
  "fraud_rings": [
    {
      "ring_id": "RING_001",
      "member_accounts": ["1001", "1002", "1003"],
      "pattern_type": "cycle",
      "risk_score": 85
    }
  ],
  "summary": {
    "total_accounts_analyzed": 50,
    "suspicious_accounts_flagged": 8,
    "fraud_rings_detected": 3,
    "processing_time_seconds": 0.26
  },
  "graph_data": { "nodes": [...], "edges": [...] }
}
```

### `GET /`

Health check endpoint. Returns `{ "status": "ok" }`.

---

## 🚀 Deployment

### Docker

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
# Serve dist/ with any static file server
```

### Environment Variables

| Variable       | Default               | Description       |
|----------------|-----------------------|-------------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL  |

---

## 🧪 Test Data

The included `test.csv` contains **60 transactions** demonstrating all detection patterns:

| Pattern | Accounts | What It Tests |
|---------|----------|---------------|
| 3-node cycle | 1001→1002→1003→1001 | Cycle detection |
| 4-node cycle | 2001→2002→2003→2004→2001 | Larger ring detection |
| 5-node cycle | 3001→3005 | Max-length cycle |
| Fan-in (smurfing) | 4001–4011 → 5000 | 11 senders to one target |
| Fan-out | 6000 → 6101–6111 | One source to 11 targets |
| Layered chain | 7001→7002→7003→7004→7005 | Multi-hop layering |
| Shell account | 9000 (receives from 12, sends to 2) | Pass-through ratio |
| Normal traffic | 1101–1802 | No false positives |

---

## 📄 License

MIT
