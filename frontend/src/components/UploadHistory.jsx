/**
 * UploadHistory — Shows previously uploaded analyses stored in localStorage.
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mule_detection_history';
const MAX_HISTORY = 10;

export function saveToHistory(result, fileName) {
    try {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        history.unshift({
            id: Date.now(),
            fileName,
            timestamp: new Date().toISOString(),
            summary: result.summary,
            suspiciousCount: result.suspicious_accounts?.length || 0,
            ringsCount: result.fraud_rings?.length || 0,
            fullResult: result,
        });
        // Keep last MAX_HISTORY
        if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.warn('Failed to save history:', e);
    }
}

export default function UploadHistory({ onLoadResult }) {
    const [history, setHistory] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        try {
            const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            setHistory(h);
        } catch { setHistory([]); }
    }, []);

    const loadEntry = (entry) => {
        if (entry.fullResult) {
            onLoadResult(entry.fullResult);
            setIsOpen(false);
        }
    };

    const clearHistory = () => {
        localStorage.removeItem(STORAGE_KEY);
        setHistory([]);
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (history.length === 0 && !isOpen) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all"
            >
                <span>🕐</span>
                <span>History ({history.length})</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 glass-card p-4 shadow-2xl border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-300">Upload History</h3>
                        {history.length > 0 && (
                            <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <p className="text-xs text-slate-500">No previous uploads</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {history.map(entry => (
                                <button
                                    key={entry.id}
                                    onClick={() => loadEntry(entry)}
                                    className="w-full text-left p-3 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/30 transition-all"
                                >
                                    <p className="text-sm font-medium text-indigo-300 truncate">{entry.fileName}</p>
                                    <div className="flex gap-3 mt-1 text-xs text-slate-400">
                                        <span>🚨 {entry.suspiciousCount}</span>
                                        <span>🔗 {entry.ringsCount}</span>
                                        <span>{formatDate(entry.timestamp)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
