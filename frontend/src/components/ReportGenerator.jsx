/**
 * ReportGenerator — Generates and downloads an HTML investigation report.
 */
export default function ReportGenerator({ result }) {
    const generateReport = () => {
        if (!result) return;

        const { summary, suspicious_accounts, fraud_rings } = result;
        const timestamp = new Date().toLocaleString();

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fraud Investigation Report — ${timestamp}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,sans-serif; background:#0f172a; color:#e2e8f0; padding:40px; }
  .container { max-width:900px; margin:0 auto; }
  h1 { font-size:28px; color:#818cf8; margin-bottom:8px; }
  h2 { font-size:20px; color:#a5b4fc; margin:32px 0 16px; border-bottom:1px solid #334155; padding-bottom:8px; }
  .subtitle { color:#94a3b8; font-size:14px; margin-bottom:32px; }
  .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin:24px 0; }
  .stat-card { background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px; text-align:center; }
  .stat-value { font-size:32px; font-weight:bold; }
  .stat-label { font-size:12px; color:#94a3b8; text-transform:uppercase; margin-top:4px; }
  table { width:100%; border-collapse:collapse; margin:16px 0; }
  th { background:#1e293b; color:#a5b4fc; text-align:left; padding:12px; font-size:13px; text-transform:uppercase; }
  td { padding:12px; border-bottom:1px solid #1e293b; font-size:14px; }
  .score-high { color:#ef4444; font-weight:bold; }
  .score-med { color:#f59e0b; font-weight:bold; }
  .pattern-tag { display:inline-block; background:rgba(99,102,241,0.15); color:#818cf8; padding:2px 8px; border-radius:20px; font-size:11px; margin:2px; }
  .ring-tag { color:#ef4444; font-weight:600; font-family:monospace; }
  .footer { margin-top:48px; padding-top:16px; border-top:1px solid #334155; color:#64748b; font-size:12px; text-align:center; }
  @media print { body { background:#fff; color:#1e293b; }
    .stat-card, th { background:#f1f5f9; border-color:#e2e8f0; }
    td { border-color:#e2e8f0; }
    .score-high { color:#dc2626; } .score-med { color:#d97706; }
    .pattern-tag { background:#e0e7ff; color:#4338ca; }
  }
</style>
</head>
<body>
<div class="container">
  <h1>🔍 Fraud Investigation Report</h1>
  <p class="subtitle">Generated: ${timestamp} • Money Muling Detection Engine</p>

  <h2>📊 Summary</h2>
  <div class="summary-grid">
    <div class="stat-card"><div class="stat-value" style="color:#6366f1">${summary.total_accounts_analyzed}</div><div class="stat-label">Accounts Analyzed</div></div>
    <div class="stat-card"><div class="stat-value" style="color:#ef4444">${summary.suspicious_accounts_flagged}</div><div class="stat-label">Suspicious Flagged</div></div>
    <div class="stat-card"><div class="stat-value" style="color:#f59e0b">${summary.fraud_rings_detected}</div><div class="stat-label">Fraud Rings</div></div>
    <div class="stat-card"><div class="stat-value" style="color:#10b981">${summary.processing_time_seconds}s</div><div class="stat-label">Processing Time</div></div>
  </div>

  <h2>🚨 Suspicious Accounts (${suspicious_accounts.length})</h2>
  <table>
    <thead><tr><th>Account ID</th><th>Score</th><th>Ring</th><th>Detected Patterns</th></tr></thead>
    <tbody>
      ${suspicious_accounts.map(a => `<tr>
        <td style="font-family:monospace;color:#818cf8">${a.account_id}</td>
        <td class="${a.suspicion_score >= 80 ? 'score-high' : 'score-med'}">${a.suspicion_score}</td>
        <td class="ring-tag">${a.ring_id || '—'}</td>
        <td>${(a.detected_patterns || []).map(p => `<span class="pattern-tag">${p}</span>`).join(' ')}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>🔗 Fraud Rings (${fraud_rings.length})</h2>
  <table>
    <thead><tr><th>Ring ID</th><th>Members</th><th>Type</th><th>Risk Score</th></tr></thead>
    <tbody>
      ${fraud_rings.map(r => `<tr>
        <td class="ring-tag">${r.ring_id}</td>
        <td>${r.member_accounts.map(m => `<span class="pattern-tag">${m}</span>`).join(' ')}</td>
        <td>${r.pattern_type}</td>
        <td class="${r.risk_score >= 80 ? 'score-high' : 'score-med'}">${r.risk_score}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    Money Muling Detection Engine — Graph-Based Financial Crime Detection System<br>
    This report is auto-generated. Verify findings before taking action.
  </div>
</div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fraud_report_${new Date().toISOString().slice(0, 10)}.html`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={generateReport}
            disabled={!result}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
            <span>📄</span>
            <span>Generate Report</span>
        </button>
    );
}
