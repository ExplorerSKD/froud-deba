/**
 * SearchBar — Search for an account and highlight it on the graph.
 */
import { useState } from 'react';

export default function SearchBar({ cyInstance }) {
    const [query, setQuery] = useState('');
    const [found, setFound] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        if (!q || !cyInstance) return;

        // Reset previous highlights
        cyInstance.elements().removeClass('search-highlight search-dimmed highlighted-edge');

        const node = cyInstance.getElementById(q);

        if (node && node.length > 0) {
            // Highlight found node
            cyInstance.elements().addClass('search-dimmed');
            const neighborhood = node.neighborhood().add(node);
            neighborhood.removeClass('search-dimmed');
            node.addClass('search-highlight');
            node.connectedEdges().addClass('highlighted-edge');

            // Pan to the node
            cyInstance.animate({ center: { eles: node }, zoom: 1.5 }, { duration: 500 });
            setFound(true);
        } else {
            setFound(false);
        }
    };

    const handleClear = () => {
        setQuery('');
        setFound(null);
        if (cyInstance) {
            cyInstance.elements().removeClass('search-highlight search-dimmed highlighted-edge');
            cyInstance.fit(undefined, 40);
        }
    };

    return (
        <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search account ID..."
                    className="bg-slate-800/60 border border-slate-700/50 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 w-56 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-slate-500"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <button
                type="submit"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
                Find
            </button>
            {found !== null && (
                <button type="button" onClick={handleClear} className="px-2 py-2 text-slate-400 hover:text-white text-sm transition-colors">
                    ✕
                </button>
            )}
            {found === false && <span className="text-red-400 text-xs">Not found</span>}
            {found === true && <span className="text-green-400 text-xs">✓ Found</span>}
        </form>
    );
}
