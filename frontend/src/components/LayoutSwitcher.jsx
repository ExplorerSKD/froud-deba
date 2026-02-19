/**
 * LayoutSwitcher — Toggle between graph layout algorithms.
 */
const LAYOUTS = [
    { key: 'cose', label: 'Force-Directed', icon: '🌐' },
    { key: 'circle', label: 'Circular', icon: '⭕' },
    { key: 'breadthfirst', label: 'Hierarchical', icon: '🌳' },
    { key: 'grid', label: 'Grid', icon: '▦' },
    { key: 'concentric', label: 'Concentric', icon: '🎯' },
];

export default function LayoutSwitcher({ cyInstance }) {
    const applyLayout = (layoutName) => {
        if (!cyInstance) return;

        const layoutOpts = {
            name: layoutName,
            animate: true,
            animationDuration: 600,
            padding: 40,
        };

        if (layoutName === 'cose') {
            layoutOpts.nodeRepulsion = () => 8000;
            layoutOpts.idealEdgeLength = () => 120;
        }
        if (layoutName === 'concentric') {
            layoutOpts.concentric = (node) => node.data('score') || 0;
            layoutOpts.levelWidth = () => 2;
        }
        if (layoutName === 'breadthfirst') {
            layoutOpts.directed = true;
            layoutOpts.spacingFactor = 1.2;
        }

        const layout = cyInstance.layout(layoutOpts);
        layout.run();
    };

    return (
        <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">Layout:</span>
            {LAYOUTS.map(l => (
                <button
                    key={l.key}
                    onClick={() => applyLayout(l.key)}
                    title={l.label}
                    className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-sm flex items-center justify-center transition-colors border border-slate-700/30 hover:border-indigo-500/50"
                >
                    {l.icon}
                </button>
            ))}
        </div>
    );
}
