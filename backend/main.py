"""
Money Muling Detection Engine — FastAPI Backend

Exposes a single POST /upload-csv endpoint that accepts a CSV file,
runs the graph-based fraud detection pipeline, and returns the
analysis results along with graph data for frontend visualization.
"""

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from detector import FraudDetector
from models import AnalysisResult

# ── App Initialization ─────────────────────────────────────────────────
app = FastAPI(
    title="Money Muling Detection Engine",
    description="Graph-Based Financial Crime Detection System",
    version="1.0.0",
)

# ── CORS — allow frontend dev server ───────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ───────────────────────────────────────────────────────
@app.get("/")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "Money Muling Detection Engine"}


# ── CSV Upload & Analysis ─────────────────────────────────────────────
@app.post("/upload-csv", response_model=AnalysisResult)
async def upload_csv(file: UploadFile = File(...)):
    """
    Accept a CSV file upload, run fraud detection analysis,
    and return structured results with graph visualization data.
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a CSV file.",
        )

    try:
        # Read file contents
        raw_bytes = await file.read()
        csv_content = raw_bytes.decode("utf-8")

        if not csv_content.strip():
            raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

        # Run fraud detection
        detector = FraudDetector()
        result = detector.analyze(csv_content)
        return result

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File encoding error. Please upload a UTF-8 encoded CSV.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}",
        )


# ── Run with: uvicorn main:app --reload ───────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
