"""
Pydantic models for Money Muling Detection Engine API responses.
Defines strict typing for all data structures returned by the analysis endpoint.
"""

from pydantic import BaseModel
from typing import List, Optional


class SuspiciousAccount(BaseModel):
    """An account flagged as suspicious by the detection engine."""
    account_id: str
    suspicion_score: int
    detected_patterns: List[str]
    ring_id: Optional[str] = None


class FraudRing(BaseModel):
    """A detected fraud ring (cycle) in the transaction graph."""
    ring_id: str
    member_accounts: List[str]
    pattern_type: str
    risk_score: int


class Summary(BaseModel):
    """High-level summary statistics of the analysis run."""
    total_accounts_analyzed: int
    suspicious_accounts_flagged: int
    fraud_rings_detected: int
    processing_time_seconds: float


class GraphNode(BaseModel):
    """A node in the transaction graph for frontend visualization."""
    id: str
    is_suspicious: bool = False
    suspicion_score: int = 0
    is_fraud_ring_member: bool = False
    ring_ids: List[str] = []


class GraphEdge(BaseModel):
    """A directed edge in the transaction graph."""
    source: str
    target: str
    amount: float
    transaction_id: str
    timestamp: str


class GraphData(BaseModel):
    """Complete graph data for Cytoscape.js visualization."""
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class AnalysisResult(BaseModel):
    """Complete analysis result returned by the /upload-csv endpoint."""
    suspicious_accounts: List[SuspiciousAccount]
    fraud_rings: List[FraudRing]
    summary: Summary
    graph_data: GraphData
