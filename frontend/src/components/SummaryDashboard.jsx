/**
 * SummaryDashboard — Summary statistics cards.
 * Shows total accounts, suspicious flagged, fraud rings, and processing time.
 */

const StatCard = ({ icon, label, value, color }) => (
    <div className="glass-card glass-card-hover p-5 flex items-center gap-4">
        <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `${color}22`, color }}
        >
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
        </div>
    </div>
);

export default function SummaryDashboard({ summary }) {
    if (!summary) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon="👥"
                label="Total Accounts"
                value={summary.total_accounts_analyzed}
                color="#6366f1"
            />
            <StatCard
                icon="🚨"
                label="Suspicious Flagged"
                value={summary.suspicious_accounts_flagged}
                color="#ef4444"
            />
            <StatCard
                icon="🔗"
                label="Fraud Rings"
                value={summary.fraud_rings_detected}
                color="#f59e0b"
            />
            <StatCard
                icon="⚡"
                label="Processing Time"
                value={`${summary.processing_time_seconds}s`}
                color="#10b981"
            />
        </div>
    );
}
