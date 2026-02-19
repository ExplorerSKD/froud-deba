"""
Fraud Detection Engine — High-performance graph-based money muling detection.

Optimized for large datasets using:
  • Vectorized pandas (no iterrows)
  • NetworkX length-bounded cycle detection
  • Pre-aggregated groupby statistics
  • Time-limited detection with early exits
"""

import time
from collections import defaultdict
from datetime import datetime, timedelta
from io import StringIO
from typing import Dict, List, Set, Tuple

import networkx as nx
import numpy as np
import pandas as pd

from models import (
    AnalysisResult,
    FraudRing,
    GraphData,
    GraphEdge,
    GraphNode,
    Summary,
    SuspiciousAccount,
)

# ══════════════════════════════════════════════════════════════════════
# COLUMN NAME MAPPING
# ══════════════════════════════════════════════════════════════════════
COLUMN_ALIASES: Dict[str, List[str]] = {
    "transaction_id": [
        "transaction_id", "tx_id", "txn_id", "trans_id", "id",
        "transaction_no", "txn_no", "trans_no",
    ],
    "sender_id": [
        "sender_id", "sender_account_id", "from_account", "from_id",
        "source_id", "source_account", "sender", "payer_id",
        "from_account_id", "orig_id", "originator_id", "debit_account",
    ],
    "receiver_id": [
        "receiver_id", "receiver_account_id", "to_account", "to_id",
        "target_id", "target_account", "receiver", "payee_id",
        "to_account_id", "dest_id", "beneficiary_id", "credit_account",
    ],
    "amount": [
        "amount", "tx_amount", "txn_amount", "transaction_amount",
        "value", "transfer_amount", "amt",
    ],
    "timestamp": [
        "timestamp", "date", "datetime", "time", "tx_date", "txn_date",
        "transaction_date", "created_at", "tx_time",
    ],
}


def _map_columns(df: pd.DataFrame) -> pd.DataFrame:
    lower_to_orig = {c.lower().strip(): c for c in df.columns}
    rename = {}
    for internal, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in lower_to_orig:
                rename[lower_to_orig[alias]] = internal
                break
    return df.rename(columns=rename) if rename else df


class FraudDetector:
    """High-performance fraud detection engine."""

    # Scoring
    CYCLE_SCORE = 50
    PASSTHROUGH_SCORE = 30
    TEMPORAL_SCORE = 20
    FAN_IO_SCORE = 10
    MAX_SCORE = 100
    SUSPICIOUS_THRESHOLD = 60

    # Detection thresholds
    FAN_THRESHOLD = 10
    MAX_CYCLE_LEN = 5
    MIN_CHAIN_LEN = 3
    PASSTHROUGH_RATIO = 0.98
    MERCHANT_PT_CAP = 0.5
    TEMPORAL_WINDOW_H = 72
    TEMPORAL_TX_MIN = 10

    # Performance limits
    MAX_CYCLES = 500
    MAX_VIZ_NODES = 2000
    CYCLE_TIME_LIMIT = 5.0  # seconds

    def __init__(self) -> None:
        self.graph: nx.DiGraph = nx.DiGraph()
        self.df: pd.DataFrame = pd.DataFrame()
        self.has_ts = False

        # Pre-computed aggregations (filled during _precompute)
        self._in_amt: Dict[str, float] = {}
        self._out_amt: Dict[str, float] = {}
        self._in_deg: Dict[str, int] = {}
        self._out_deg: Dict[str, int] = {}

        # Detection results
        self.cycles: List[List[str]] = []
        self.fan_in: Set[str] = set()
        self.fan_out: Set[str] = set()
        self.chains: Set[str] = set()
        self.passthrough: Set[str] = set()
        self.temporal: Set[str] = set()
        self.merchants: Set[str] = set()

        self.scores: Dict[str, int] = {}
        self.patterns: Dict[str, List[str]] = {}
        self.rings: Dict[str, List[str]] = {}

    # ── Public API ─────────────────────────────────────────────────

    def analyze(self, csv_content: str) -> AnalysisResult:
        t0 = time.time()
        self._parse_csv(csv_content)
        self._build_graph()
        self._precompute()
        self._detect_all()
        self._score()
        return self._build_result(round(time.time() - t0, 3))

    # ══════════════════════════════════════════════════════════════
    # PARSING — vectorized, no iterrows
    # ══════════════════════════════════════════════════════════════

    def _parse_csv(self, csv_content: str) -> None:
        self.df = pd.read_csv(StringIO(csv_content))
        self.df.columns = [c.strip() for c in self.df.columns]
        self.df = _map_columns(self.df)

        required = {"sender_id", "receiver_id", "amount"}
        missing = required - set(self.df.columns)
        if missing:
            raise ValueError(
                f"Missing columns: {missing}. Found: {list(self.df.columns)}"
            )

        # Auto-generate transaction_id if absent
        if "transaction_id" not in self.df.columns:
            self.df["transaction_id"] = np.arange(1, len(self.df) + 1).astype(str)

        # Vectorized type conversion
        self.df["sender_id"] = self.df["sender_id"].astype(str).str.strip()
        self.df["receiver_id"] = self.df["receiver_id"].astype(str).str.strip()
        self.df["amount"] = pd.to_numeric(self.df["amount"], errors="coerce").fillna(0.0)
        self.df["transaction_id"] = self.df["transaction_id"].astype(str)

        # Remove self-loops
        self.df = self.df[self.df["sender_id"] != self.df["receiver_id"]].copy()

        self._parse_timestamps()

    def _parse_timestamps(self) -> None:
        if "timestamp" not in self.df.columns:
            self.df["timestamp"] = pd.date_range("2026-01-01", periods=len(self.df), freq="h")
            self.has_ts = False
            return

        raw = self.df["timestamp"]
        numeric = pd.to_numeric(raw, errors="coerce")

        if numeric.notna().all():
            mx = numeric.max()
            if mx > 1e9:
                self.df["timestamp"] = pd.to_datetime(numeric, unit="s", errors="coerce")
                self.has_ts = True
            elif mx > 1e6:
                self.df["timestamp"] = pd.to_datetime(numeric, unit="ms", errors="coerce")
                self.has_ts = True
            else:
                # Step numbers → synthetic, skip temporal
                base = pd.Timestamp("2026-01-01")
                self.df["timestamp"] = base + pd.to_timedelta(numeric, unit="h")
                self.has_ts = False
        else:
            self.df["timestamp"] = pd.to_datetime(raw, errors="coerce")
            self.has_ts = self.df["timestamp"].notna().mean() > 0.5

        self.df["timestamp"] = self.df["timestamp"].fillna(pd.Timestamp("2026-01-01"))

    # ══════════════════════════════════════════════════════════════
    # GRAPH & PRE-AGGREGATION — vectorized groupby
    # ══════════════════════════════════════════════════════════════

    def _build_graph(self) -> None:
        """Build graph from edge tuples (fast bulk add)."""
        self.graph = nx.DiGraph()

        # Aggregate edges: total amount & count per (sender, receiver)
        edge_agg = (
            self.df.groupby(["sender_id", "receiver_id"])
            .agg(
                amount=("amount", "sum"),
                tx_count=("amount", "count"),
                transaction_id=("transaction_id", "first"),
                timestamp=("timestamp", "first"),
            )
            .reset_index()
        )

        # Bulk-add edges
        edges = [
            (r.sender_id, r.receiver_id, {
                "amount": r.amount,
                "tx_count": r.tx_count,
                "transaction_id": r.transaction_id,
                "timestamp": str(r.timestamp),
            })
            for r in edge_agg.itertuples(index=False)
        ]
        self.graph.add_edges_from(edges)

    def _precompute(self) -> None:
        """Pre-aggregate in/out amounts and degrees using pandas groupby."""
        # Inbound totals
        in_grp = self.df.groupby("receiver_id")["amount"].sum()
        self._in_amt = in_grp.to_dict()

        # Outbound totals
        out_grp = self.df.groupby("sender_id")["amount"].sum()
        self._out_amt = out_grp.to_dict()

        # Degrees from graph (O(1) each)
        self._in_deg = dict(self.graph.in_degree())
        self._out_deg = dict(self.graph.out_degree())

    # ══════════════════════════════════════════════════════════════
    # DETECTION — all algorithms
    # ══════════════════════════════════════════════════════════════

    def _detect_all(self) -> None:
        self._detect_cycles()
        self._detect_fan()
        self._detect_chains()
        self._detect_passthrough()
        if self.has_ts:
            self._detect_temporal()
        self._detect_merchants()

    def _detect_cycles(self) -> None:
        """Time-limited, length-bounded cycle detection."""
        self.cycles = []
        seen: Set[frozenset] = set()
        deadline = time.time() + self.CYCLE_TIME_LIMIT

        try:
            for cycle in nx.simple_cycles(self.graph, length_bound=self.MAX_CYCLE_LEN):
                if time.time() > deadline or len(self.cycles) >= self.MAX_CYCLES:
                    break
                if len(cycle) >= 3:
                    key = frozenset(cycle)
                    if key not in seen:
                        seen.add(key)
                        self.cycles.append(list(cycle))
        except (nx.NetworkXError, Exception):
            pass

    def _detect_fan(self) -> None:
        """Fan-in/out from pre-computed degrees."""
        self.fan_in = {n for n, d in self._in_deg.items() if d >= self.FAN_THRESHOLD}
        self.fan_out = {n for n, d in self._out_deg.items() if d >= self.FAN_THRESHOLD}

    def _detect_chains(self) -> None:
        """BFS-based chain detection (faster than recursive DFS)."""
        self.chains = set()
        successors = dict(self.graph.adjacency())

        for start in self.graph.nodes():
            # BFS from each node
            queue: List[Tuple[str, int]] = [(start, 1)]
            visited = {start}

            while queue:
                node, depth = queue.pop(0)
                if depth >= self.MIN_CHAIN_LEN:
                    # Reconstruct isn't needed; just flag all reachable at depth
                    self.chains.add(start)
                    self.chains.add(node)
                    break
                if depth > 6:  # hard cap
                    break
                for succ in successors.get(node, {}):
                    if succ not in visited:
                        visited.add(succ)
                        queue.append((succ, depth + 1))

    def _detect_passthrough(self) -> None:
        """Vectorized pass-through ratio using pre-aggregated amounts."""
        self.passthrough = set()
        for node in self.graph.nodes():
            total_in = self._in_amt.get(node, 0.0)
            if total_in <= 0:
                continue
            total_out = self._out_amt.get(node, 0.0)
            if total_out / total_in > self.PASSTHROUGH_RATIO:
                self.passthrough.add(node)

    def _detect_temporal(self) -> None:
        """Sliding window using sorted arrays (vectorized pre-group)."""
        self.temporal = set()
        window = timedelta(hours=self.TEMPORAL_WINDOW_H)

        # Collect all timestamps per account in one pass
        sender_ts = self.df.groupby("sender_id")["timestamp"].apply(list).to_dict()
        receiver_ts = self.df.groupby("receiver_id")["timestamp"].apply(list).to_dict()

        all_accounts = set(sender_ts.keys()) | set(receiver_ts.keys())

        for acc in all_accounts:
            ts_list = sender_ts.get(acc, []) + receiver_ts.get(acc, [])
            if len(ts_list) < self.TEMPORAL_TX_MIN:
                continue
            ts_list.sort()
            # Sliding window
            left = 0
            for right in range(len(ts_list)):
                while ts_list[right] - ts_list[left] > window:
                    left += 1
                if right - left + 1 >= self.TEMPORAL_TX_MIN:
                    self.temporal.add(acc)
                    break

    def _detect_merchants(self) -> None:
        """Filter legitimate merchants using pre-computed stats."""
        self.merchants = set()
        cycle_members: Set[str] = set()
        for c in self.cycles:
            cycle_members.update(c)

        for node in self.graph.nodes():
            ind = self._in_deg.get(node, 0)
            outd = self._out_deg.get(node, 0)

            # in_degree must be ≥ 3× out_degree
            if outd == 0:
                ratio = float("inf")
            else:
                ratio = ind / outd
            if ratio < 3.0:
                continue

            # Low pass-through
            total_in = self._in_amt.get(node, 0.0)
            total_out = self._out_amt.get(node, 0.0)
            pt = total_out / total_in if total_in > 0 else 0.0
            if pt >= self.MERCHANT_PT_CAP:
                continue

            # Not in any cycle
            if node in cycle_members:
                continue

            self.merchants.add(node)

    # ══════════════════════════════════════════════════════════════
    # SCORING
    # ══════════════════════════════════════════════════════════════

    def _score(self) -> None:
        cycle_set: Set[str] = set()
        for c in self.cycles:
            cycle_set.update(c)

        # Ring mapping
        self.rings = {}
        for i, c in enumerate(self.cycles, 1):
            rid = f"RING_{i:03d}"
            for a in c:
                self.rings.setdefault(a, []).append(rid)

        for node in self.graph.nodes():
            if node in self.merchants:
                self.scores[node] = 0
                self.patterns[node] = ["legitimate_merchant"]
                continue

            s = 0
            p: List[str] = []

            if node in cycle_set:
                s += self.CYCLE_SCORE
                for c in self.cycles:
                    if node in c:
                        p.append(f"cycle_length_{len(c)}")
                p = list(set(p))

            if node in self.passthrough:
                s += self.PASSTHROUGH_SCORE
                p.append("passthrough_shell")

            if node in self.temporal:
                s += self.TEMPORAL_SCORE
                p.append("temporal_clustering")

            if node in self.fan_in:
                s += self.FAN_IO_SCORE
                p.append("fan_in")

            if node in self.fan_out:
                s += self.FAN_IO_SCORE
                p.append("fan_out")

            if node in self.chains:
                p.append("layered_chain")

            self.scores[node] = min(s, self.MAX_SCORE)
            self.patterns[node] = p

    # ══════════════════════════════════════════════════════════════
    # RESULT — with large-dataset node limiting
    # ══════════════════════════════════════════════════════════════

    def _build_result(self, proc_time: float) -> AnalysisResult:
        # Suspicious accounts
        sus: List[SuspiciousAccount] = []
        for node, sc in self.scores.items():
            if sc >= self.SUSPICIOUS_THRESHOLD:
                rids = self.rings.get(node, [])
                sus.append(SuspiciousAccount(
                    account_id=node,
                    suspicion_score=sc,
                    detected_patterns=self.patterns.get(node, []),
                    ring_id=rids[0] if rids else None,
                ))
        sus.sort(key=lambda a: a.suspicion_score, reverse=True)

        # Fraud rings
        fr: List[FraudRing] = []
        for i, c in enumerate(self.cycles, 1):
            avg = sum(self.scores.get(a, 0) for a in c) / len(c)
            fr.append(FraudRing(
                ring_id=f"RING_{i:03d}",
                member_accounts=c,
                pattern_type="cycle",
                risk_score=min(int(avg + 10), 100),
            ))

        # Summary
        summary = Summary(
            total_accounts_analyzed=self.graph.number_of_nodes(),
            suspicious_accounts_flagged=len(sus),
            fraud_rings_detected=len(fr),
            processing_time_seconds=proc_time,
        )

        # Graph data — limit nodes for visualization
        all_nodes = set(self.graph.nodes())
        ring_members: Set[str] = set()
        for r in fr:
            ring_members.update(r.member_accounts)

        priority = {n for n, sc in self.scores.items() if sc >= self.SUSPICIOUS_THRESHOLD}
        priority |= ring_members

        if len(all_nodes) > self.MAX_VIZ_NODES:
            rest = list(all_nodes - priority)
            slots = max(0, self.MAX_VIZ_NODES - len(priority))
            display = priority | set(rest[:slots])
        else:
            display = all_nodes

        nodes = [
            GraphNode(
                id=n,
                is_suspicious=self.scores.get(n, 0) >= self.SUSPICIOUS_THRESHOLD,
                suspicion_score=self.scores.get(n, 0),
                is_fraud_ring_member=n in ring_members,
                ring_ids=self.rings.get(n, []),
            )
            for n in display
        ]

        edges = [
            GraphEdge(
                source=u, target=v,
                amount=d.get("amount", 0),
                transaction_id=d.get("transaction_id", ""),
                timestamp=d.get("timestamp", ""),
            )
            for u, v, d in self.graph.edges(data=True)
            if u in display and v in display
        ]

        return AnalysisResult(
            suspicious_accounts=sus,
            fraud_rings=fr,
            summary=summary,
            graph_data=GraphData(nodes=nodes, edges=edges),
        )
