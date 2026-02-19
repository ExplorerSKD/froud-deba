/**
 * LayerToggles — Toggle detection pattern layers on/off on the graph.
 */
import { useState } from 'react';

const LAYERS = [
    { key: 'cycles', label: 'Cycle Rings', color: '#ef4444', icon: '🔗' },
    { key: 'fan_in', label: 'Fan-In', color: '#f59e0b', icon: '📥' },
    { key: 'fan_out', label: 'Fan-Out', color: '#8b5cf6', icon: '📤' },
    { key: 'passthrough', label: 'Pass-Through', color: '#06b6d4', icon: '💨' },
    { key: 'round_amount', label: 'Round Amount', color: '#ec4899', icon: '💰' },
    { key: 'anomaly', label: 'Anomaly', color: '#f97316', icon: '📊' },
    { key: 'merchant', label: 'Merchants', color: '#10b981', icon: '🏪' },
];

function patternMatchesLayer(pattern, layerKey) {
    if (layerKey === 'cycles') return pattern.startsWith('cycle_length_');
    if (layerKey === 'fan_in') return pattern === 'fan_in';
    if (layerKey === 'fan_out') return pattern === 'fan_out';
    if (layerKey === 'passthrough') return pattern === 'passthrough_shell';
    if (layerKey === 'round_amount') return pattern === 'round_amount_structuring';
    if (layerKey === 'anomaly') return pattern === 'amount_anomaly';
    if (layerKey === 'merchant') return pattern === 'legitimate_merchant';
    return false;
}

export default function LayerToggles({ cyInstance, suspiciousAccounts }) {
    const [active, setActive] = useState(() => {
        const init = {};
        LAYERS.forEach(l => { init[l.key] = true; });
        return init;
    });

    const applyFilters = (filters) => {
        if (!cyInstance) return;

        // Build a map: accountId → patterns
        const patternMap = {};
        (suspiciousAccounts || []).forEach(a => {
            patternMap[a.account_id] = a.detected_patterns || [];
        });

        cyInstance.nodes().forEach(node => {
            const id = node.data('id');
            const patterns = patternMap[id];

            if (!patterns || patterns.length === 0) {
                // Normal account — always visible
                node.style('display', 'element');
                return;
            }

            // Check if any of this account's patterns match an active layer
            const hasActiveMatch = patterns.some(p => {
                for (const layer of LAYERS) {
                    if (filters[layer.key] && patternMatchesLayer(p, layer.key)) {
                        return true;
                    }
                }
                return false;
            });

            node.style('display', hasActiveMatch ? 'element' : 'none');
        });

        // Hide edges connected to hidden nodes
        cyInstance.edges().forEach(edge => {
            const srcVisible = edge.source().style('display') !== 'none';
            const tgtVisible = edge.target().style('display') !== 'none';
            edge.style('display', srcVisible && tgtVisible ? 'element' : 'none');
        });
    };

    const toggle = (key) => {
        setActive(prev => {
            const next = { ...prev, [key]: !prev[key] };
            applyFilters(next);
            return next;
        });
    };

    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Detection Layers</h3>
            <div className="flex flex-wrap gap-2">
                {LAYERS.map(layer => (
                    <button
                        key={layer.key}
                        onClick={() => toggle(layer.key)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${active[layer.key]
                                ? 'border-transparent text-white'
                                : 'border-slate-700/50 text-slate-500 bg-transparent'
                            }`}
                        style={active[layer.key] ? {
                            backgroundColor: layer.color + '33',
                            borderColor: layer.color + '66',
                            color: layer.color,
                        } : {}}
                    >
                        <span>{layer.icon}</span>
                        <span>{layer.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
