/**
 * App.jsx — Main dashboard layout for Money Muling Detection Engine.
 * Assembles all components: Upload, Summary, Graph, Tables, and JSON Download.
 */
import { useState } from 'react';
import UploadCSV from './components/UploadCSV';
import SummaryDashboard from './components/SummaryDashboard';
import GraphVisualization from './components/GraphVisualization';
import SuspiciousTable from './components/SuspiciousTable';
import FraudRingsTable from './components/FraudRingsTable';
import JsonDownload from './components/JsonDownload';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl pulse-glow">
            🔍
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold gradient-text">
            Money Muling Detection Engine
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Graph-Based Financial Crime Detection System — Upload transaction CSV data to detect
          fraud rings, smurfing patterns, and suspicious accounts using advanced graph algorithms.
        </p>
      </header>

      {/* ── Upload Section ───────────────────────────────────── */}
      <section className="max-w-2xl mx-auto mb-8">
        <UploadCSV onResult={setResult} onLoading={setLoading} />
      </section>

      {/* ── Loading State ────────────────────────────────────── */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-300 font-medium">Analyzing transaction graph…</p>
          <p className="text-slate-500 text-sm">Running fraud detection algorithms</p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────── */}
      {result && !loading && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Summary + Download */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
            <JsonDownload result={result} />
          </div>

          {/* Summary Cards */}
          <SummaryDashboard summary={result.summary} />

          {/* Graph Visualization */}
          <GraphVisualization
            graphData={result.graph_data}
            suspiciousAccounts={result.suspicious_accounts}
          />

          {/* Data Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SuspiciousTable accounts={result.suspicious_accounts} />
            <FraudRingsTable rings={result.fraud_rings} />
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="text-center text-slate-600 text-xs mt-16 pb-4">
        Money Muling Detection Engine &copy; {new Date().getFullYear()} — Graph-Based Financial Crime Detection
      </footer>
    </div>
  );
}
