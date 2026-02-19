/**
 * GraphVisualization — Interactive Cytoscape.js directed graph.
 *
 * - Normal accounts = blue nodes
 * - Suspicious accounts = red nodes
 * - Fraud ring members = larger red nodes with glow
 * - Click node → shows account details
 * - Hover node → highlights connections
 */
import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

export default function GraphVisualization({ graphData, suspiciousAccounts }) {
    const containerRef = useRef(null);
    const cyRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        if (!graphData || !containerRef.current) return;

        // Destroy previous instance cleanly if it exists
        if (cyRef.current) {
            cyRef.current.destroy();
            cyRef.current = null;
        }

        let destroyed = false;
        let layout = null;

        // Build Cytoscape elements
        const elements = [];

        // Nodes
        graphData.nodes.forEach((node) => {
            elements.push({
                data: {
                    id: node.id,
                    label: node.id,
                    isSuspicious: node.is_suspicious,
                    isFraudRing: node.is_fraud_ring_member,
                    score: node.suspicion_score,
                    ringIds: node.ring_ids || [],
                },
            });
        });

        // Edges
        graphData.edges.forEach((edge, idx) => {
            elements.push({
                data: {
                    id: `edge-${idx}`,
                    source: edge.source,
                    target: edge.target,
                    amount: edge.amount,
                    txId: edge.transaction_id,
                    timestamp: edge.timestamp,
                },
            });
        });

        // Initialize Cytoscape
        const cy = cytoscape({
            container: containerRef.current,
            elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        label: 'data(label)',
                        'text-valign': 'bottom',
                        'text-halign': 'center',
                        'font-size': '10px',
                        color: '#94a3b8',
                        'text-margin-y': 8,
                        'background-color': '#6366f1',
                        width: 30,
                        height: 30,
                        'border-width': 2,
                        'border-color': '#818cf8',
                        'transition-property': 'background-color, width, height, border-color',
                        'transition-duration': '0.2s',
                    },
                },
                {
                    selector: 'node[?isSuspicious]',
                    style: {
                        'background-color': '#ef4444',
                        'border-color': '#f87171',
                        width: 35,
                        height: 35,
                    },
                },
                {
                    selector: 'node[?isFraudRing]',
                    style: {
                        'background-color': '#dc2626',
                        'border-color': '#fca5a5',
                        'border-width': 3,
                        width: 45,
                        height: 45,
                        'font-size': '11px',
                        'font-weight': 'bold',
                        color: '#fca5a5',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        width: 2,
                        'line-color': 'rgba(99, 102, 241, 0.4)',
                        'target-arrow-color': 'rgba(99, 102, 241, 0.6)',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'arrow-scale': 1.2,
                        'transition-property': 'line-color, target-arrow-color, width',
                        'transition-duration': '0.2s',
                    },
                },
                {
                    selector: '.highlighted',
                    style: {
                        'background-color': '#f59e0b',
                        'border-color': '#fbbf24',
                        width: 40,
                        height: 40,
                    },
                },
                {
                    selector: '.highlighted-edge',
                    style: {
                        'line-color': '#f59e0b',
                        'target-arrow-color': '#f59e0b',
                        width: 3,
                    },
                },
                {
                    selector: '.dimmed',
                    style: {
                        opacity: 0.2,
                    },
                },
            ],
            // Layout runs separately so we can stop it on cleanup
            layout: { name: 'preset' },
            minZoom: 0.3,
            maxZoom: 3,
        });

        // Run layout separately so we can track and stop it
        layout = cy.layout({
            name: 'cose',
            animate: true,
            animationDuration: 800,
            nodeRepulsion: () => 8000,
            idealEdgeLength: () => 120,
            padding: 40,
        });
        layout.run();

        // Click node → show details (guarded)
        cy.on('tap', 'node', (e) => {
            if (destroyed) return;
            const node = e.target;
            const data = node.data();
            const account = suspiciousAccounts?.find((a) => a.account_id === data.id);
            setSelectedNode({
                id: data.id,
                score: data.score,
                isSuspicious: data.isSuspicious,
                isFraudRing: data.isFraudRing,
                ringIds: data.ringIds,
                patterns: account?.detected_patterns || [],
            });
        });

        // Click background → deselect (guarded)
        cy.on('tap', (e) => {
            if (destroyed) return;
            if (e.target === cy) setSelectedNode(null);
        });

        // Hover → highlight connections (guarded)
        cy.on('mouseover', 'node', (e) => {
            if (destroyed) return;
            const node = e.target;
            const neighborhood = node.neighborhood().add(node);
            cy.elements().addClass('dimmed');
            neighborhood.removeClass('dimmed');
            node.connectedEdges().addClass('highlighted-edge');
            neighborhood.nodes().not(node).addClass('highlighted');
        });

        cy.on('mouseout', 'node', () => {
            if (destroyed) return;
            cy.elements().removeClass('dimmed highlighted highlighted-edge');
        });

        cyRef.current = cy;

        // Cleanup: stop layout first, then destroy
        return () => {
            destroyed = true;
            if (layout) {
                layout.stop();
            }
            cy.removeAllListeners();
            cy.destroy();
            cyRef.current = null;
        };
    }, [graphData, suspiciousAccounts]);

    if (!graphData) return null;

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold gradient-text">Transaction Graph</h2>
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
                        Normal
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                        Suspicious
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-red-700 border-2 border-red-300 inline-block"></span>
                        Fraud Ring
                    </span>
                </div>
            </div>

            <div ref={containerRef} className="cytoscape-container" />

            {/* Node detail panel */}
            {selectedNode && (
                <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                    <h3 className="font-bold text-indigo-300 mb-2">
                        Account: {selectedNode.id}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-slate-400">Score: </span>
                            <span className={`font-bold ${selectedNode.score >= 60 ? 'text-red-400' : 'text-green-400'}`}>
                                {selectedNode.score}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400">Status: </span>
                            <span className={selectedNode.isSuspicious ? 'text-red-400' : 'text-green-400'}>
                                {selectedNode.isSuspicious ? '⚠ Suspicious' : '✓ Normal'}
                            </span>
                        </div>
                        {selectedNode.isFraudRing && (
                            <div className="col-span-2">
                                <span className="text-slate-400">Fraud Ring: </span>
                                <span className="text-red-400 font-mono">
                                    {selectedNode.ringIds.join(', ')}
                                </span>
                            </div>
                        )}
                        {selectedNode.patterns.length > 0 && (
                            <div className="col-span-2">
                                <span className="text-slate-400">Patterns: </span>
                                {selectedNode.patterns.map((p) => (
                                    <span key={p} className="inline-block text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full mr-1 mb-1">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
