/**
 * StatisticsPanel — Pie chart showing distribution of detected patterns.
 */
import { useMemo } from 'react';

const PATTERN_COLORS = {
    'cycle': '#ef4444',
    'fan_in': '#f59e0b',
    'fan_out': '#8b5cf6',
    'passthrough_shell': '#06b6d4',
    'temporal_clustering': '#ec4899',
    'amount_anomaly': '#f97316',
    'round_amount_structuring': '#14b8a6',
    'rapid_dormancy': '#6366f1',
    'layered_chain': '#a855f7',
    'legitimate_merchant': '#10b981',
};

const PATTERN_LABELS = {
    'cycle': 'Cycles',
    'fan_in': 'Fan-In',
    'fan_out': 'Fan-Out',
    'passthrough_shell': 'Pass-Through',
    'temporal_clustering': 'Temporal Burst',
    'amount_anomaly': 'Amount Anomaly',
    'round_amount_structuring': 'Round Amounts',
    'rapid_dormancy': 'Rapid Dormancy',
    'layered_chain': 'Layered Chain',
    'legitimate_merchant': 'Merchant',
};

function normKey(p) {
    if (p.startsWith('cycle_length_')) return 'cycle';
    return p;
}

export default function StatisticsPanel({ suspiciousAccounts, summary }) {
    const stats = useMemo(() => {
        if (!suspiciousAccounts) return [];
        const counts = {};
        suspiciousAccounts.forEach(a => {
            (a.detected_patterns || []).forEach(p => {
                const k = normKey(p);
                counts[k] = (counts[k] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .map(([key, count]) => ({
                key,
                count,
                label: PATTERN_LABELS[key] || key,
                color: PATTERN_COLORS[key] || '#94a3b8',
            }))
            .sort((a, b) => b.count - a.count);
    }, [suspiciousAccounts]);

    const total = stats.reduce((s, v) => s + v.count, 0);

    if (!stats.length) return null;

    // SVG donut chart
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 gradient-text">Pattern Distribution</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Donut Chart */}
                <div className="relative">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                        {stats.map(item => {
                            const pct = item.count / total;
                            const dash = circumference * pct;
                            const gap = circumference - dash;
                            const currentOffset = offset;
                            offset += dash;

                            return (
                                <circle
                                    key={item.key}
                                    cx="80" cy="80" r={radius}
                                    fill="none"
                                    stroke={item.color}
                                    strokeWidth="20"
                                    strokeDasharray={`${dash} ${gap}`}
                                    strokeDashoffset={-currentOffset}
                                    className="transition-all duration-500"
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{total}</p>
                            <p className="text-xs text-slate-400">Patterns</p>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {stats.map(item => (
                        <div key={item.key} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-sm text-slate-300">{item.label}</span>
                            <span className="text-sm font-bold text-white ml-auto">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
