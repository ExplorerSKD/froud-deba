/**
 * FilterDropdown — Filter suspicious accounts by risk level.
 */
import { useState, useMemo } from 'react';

export default function FilterDropdown({ accounts, onFilter }) {
    const [level, setLevel] = useState('all');

    const filtered = useMemo(() => {
        if (!accounts) return [];
        switch (level) {
            case 'high': return accounts.filter(a => a.suspicion_score >= 80);
            case 'medium': return accounts.filter(a => a.suspicion_score >= 60 && a.suspicion_score < 80);
            case 'low': return accounts.filter(a => a.suspicion_score < 60);
            default: return accounts;
        }
    }, [accounts, level]);

    const handleChange = (e) => {
        setLevel(e.target.value);
        onFilter(e.target.value);
    };

    const counts = useMemo(() => {
        if (!accounts) return { high: 0, medium: 0, low: 0 };
        return {
            high: accounts.filter(a => a.suspicion_score >= 80).length,
            medium: accounts.filter(a => a.suspicion_score >= 60 && a.suspicion_score < 80).length,
            low: accounts.filter(a => a.suspicion_score < 60 && a.suspicion_score > 0).length,
        };
    }, [accounts]);

    return (
        <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400 font-medium">Risk Level:</label>
            <select
                value={level}
                onChange={handleChange}
                className="bg-slate-800/60 border border-slate-700/50 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
            >
                <option value="all">All Accounts</option>
                <option value="high">🔴 High (80+) — {counts.high}</option>
                <option value="medium">🟡 Medium (60-79) — {counts.medium}</option>
                <option value="low">🟢 Low (&lt;60) — {counts.low}</option>
            </select>
        </div>
    );
}
