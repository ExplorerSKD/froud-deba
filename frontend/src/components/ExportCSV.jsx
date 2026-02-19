/**
 * ExportCSV — Download suspicious accounts as CSV.
 */
export default function ExportCSV({ accounts }) {
    const handleExport = () => {
        if (!accounts || accounts.length === 0) return;

        const headers = ['Account ID', 'Suspicion Score', 'Ring ID', 'Detected Patterns'];
        const rows = accounts.map(a => [
            a.account_id,
            a.suspicion_score,
            a.ring_id || '',
            (a.detected_patterns || []).join('; '),
        ]);

        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `suspicious_accounts_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleExport}
            disabled={!accounts?.length}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/80 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
            <span>📋</span>
            <span>Export CSV</span>
        </button>
    );
}
