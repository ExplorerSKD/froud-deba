/**
 * SuspiciousTable — Sortable table of suspicious accounts.
 * Shows account ID, suspicion score, detected patterns, and ring ID.
 */
import { useState, useMemo } from 'react';

export default function SuspiciousTable({ accounts }) {
    const [sortField, setSortField] = useState('suspicion_score');
    const [sortDir, setSortDir] = useState('desc');

    const sorted = useMemo(() => {
        if (!accounts) return [];
        return [...accounts].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (typeof aVal === 'number') return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
            return sortDir === 'desc'
                ? String(bVal).localeCompare(String(aVal))
                : String(aVal).localeCompare(String(bVal));
        });
    }, [accounts, sortField, sortDir]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const getScoreClass = (score) => {
        if (score >= 80) return 'score-high';
        if (score >= 60) return 'score-medium';
        return 'score-low';
    };

    if (!accounts || accounts.length === 0) return null;

    return (
        <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 gradient-text">
                Suspicious Accounts ({accounts.length})
            </h2>
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('account_id')}>
                                Account ID {sortField === 'account_id' && (sortDir === 'desc' ? '↓' : '↑')}
                            </th>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('suspicion_score')}>
                                Score {sortField === 'suspicion_score' && (sortDir === 'desc' ? '↓' : '↑')}
                            </th>
                            <th>Detected Patterns</th>
                            <th>Ring ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((acc) => (
                            <tr key={acc.account_id}>
                                <td className="font-mono font-medium text-indigo-300">{acc.account_id}</td>
                                <td>
                                    <span className={`score-badge ${getScoreClass(acc.suspicion_score)}`}>
                                        {acc.suspicion_score}
                                    </span>
                                </td>
                                <td>
                                    {acc.detected_patterns.map((p) => (
                                        <span key={p} className="inline-block text-xs bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full mr-1 mb-0.5">
                                            {p}
                                        </span>
                                    ))}
                                </td>
                                <td className="font-mono text-red-400">{acc.ring_id || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
