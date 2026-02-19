/**
 * FraudRingsTable — Table of detected fraud rings.
 * Shows ring ID, member accounts, pattern type, and risk score.
 */

export default function FraudRingsTable({ rings }) {
    const getScoreClass = (score) => {
        if (score >= 80) return 'score-high';
        if (score >= 60) return 'score-medium';
        return 'score-low';
    };

    if (!rings || rings.length === 0) return null;

    return (
        <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 gradient-text">
                Fraud Rings Detected ({rings.length})
            </h2>
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Ring ID</th>
                            <th>Members</th>
                            <th>Pattern</th>
                            <th>Risk Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rings.map((ring) => (
                            <tr key={ring.ring_id}>
                                <td className="font-mono font-bold text-red-400">{ring.ring_id}</td>
                                <td>
                                    <div className="flex flex-wrap gap-1">
                                        {ring.member_accounts.map((acc) => (
                                            <span
                                                key={acc}
                                                className="inline-block text-xs bg-red-500/15 text-red-300 px-2 py-0.5 rounded-full font-mono"
                                            >
                                                {acc}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <span className="inline-block text-xs bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full capitalize">
                                        {ring.pattern_type}
                                    </span>
                                </td>
                                <td>
                                    <span className={`score-badge ${getScoreClass(ring.risk_score)}`}>
                                        {ring.risk_score}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
