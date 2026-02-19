/**
 * App.jsx — Main dashboard layout for Money Muling Detection Engine.
 * Assembles all components: Upload, Summary, Graph, Tables, Reports, and Tools.
 */
import { useState } from 'react';
import UploadCSV from './components/UploadCSV';
import SummaryDashboard from './components/SummaryDashboard';
import GraphVisualization from './components/GraphVisualization';
import SuspiciousTable from './components/SuspiciousTable';
import FraudRingsTable from './components/FraudRingsTable';
import JsonDownload from './components/JsonDownload';
import ReportGenerator from './components/ReportGenerator';
import FilterDropdown from './components/FilterDropdown';
import SearchBar from './components/SearchBar';
import LayerToggles from './components/LayerToggles';
import UploadHistory, { saveToHistory } from './components/UploadHistory';
import StatisticsPanel from './components/StatisticsPanel';
import ExportCSV from './components/ExportCSV';
import LayoutSwitcher from './components/LayoutSwitcher';
import ThemeToggle from './components/ThemeToggle';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');
  const [cyInstance, setCyInstance] = useState(null);

  const handleResult = (data) => {
    setResult(data);
  };

  const handleUploadResult = (data, fileName) => {
    setResult(data);
    saveToHistory(data, fileName || 'uploaded.csv');
  };

  // Filter suspicious accounts by risk level
  const filteredAccounts = (() => {
    if (!result?.suspicious_accounts) return [];
    const accts = result.suspicious_accounts;
    switch (riskFilter) {
      case 'high': return accts.filter(a => a.suspicion_score >= 80);
      case 'medium': return accts.filter(a => a.suspicion_score >= 60 && a.suspicion_score < 80);
      case 'low': return accts.filter(a => a.suspicion_score < 60);
      default: return accts;
    }
  })();

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl pulse-glow">
              🔍
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold gradient-text">
                Money Muling Detection Engine
              </h1>
              <p className="text-slate-400 text-xs">
                Graph-Based Financial Crime Detection System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UploadHistory onLoadResult={handleResult} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Upload Section ─────────────────────────────── */}
      <section className="max-w-2xl mx-auto mb-8">
        <UploadCSV
          onResult={(data) => handleUploadResult(data)}
          onLoading={setLoading}
        />
      </section>

      {/* ── Loading State ──────────────────────────────── */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-300 font-medium">Analyzing transaction graph…</p>
          <p className="text-slate-500 text-sm">Running fraud detection algorithms</p>
        </div>
      )}

      {/* ── Results ────────────────────────────────────── */}
      {result && !loading && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* ── Toolbar row ──────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
            <div className="flex flex-wrap items-center gap-2">
              <ReportGenerator result={result} />
              <JsonDownload result={result} />
              <ExportCSV accounts={result.suspicious_accounts} />
            </div>
          </div>

          {/* ── Summary Cards ─────────────────────────── */}
          <SummaryDashboard summary={result.summary} />

          {/* ── Statistics Panel ──────────────────────── */}
          <StatisticsPanel
            suspiciousAccounts={result.suspicious_accounts}
            summary={result.summary}
          />

          {/* ── Graph Controls ────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            <SearchBar cyInstance={cyInstance} />
            <LayoutSwitcher cyInstance={cyInstance} />
          </div>

          {/* ── Layer Toggles ─────────────────────────── */}
          <LayerToggles
            cyInstance={cyInstance}
            suspiciousAccounts={result.suspicious_accounts}
          />

          {/* ── Graph Visualization ───────────────────── */}
          <GraphVisualization
            graphData={result.graph_data}
            suspiciousAccounts={result.suspicious_accounts}
            onCyReady={setCyInstance}
          />

          {/* ── Filter + Data Tables ──────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-bold text-white">Detailed Tables</h3>
            <FilterDropdown
              accounts={result.suspicious_accounts}
              onFilter={setRiskFilter}
            />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SuspiciousTable accounts={filteredAccounts} />
            <FraudRingsTable rings={result.fraud_rings} />
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="text-center text-slate-600 text-xs mt-16 pb-4">
        Money Muling Detection Engine &copy; {new Date().getFullYear()} — Graph-Based Financial Crime Detection
      </footer>
    </div>
  );
}
