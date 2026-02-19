/**
 * JsonDownload — Button to download the full analysis result as a .json file.
 */

export default function JsonDownload({ result }) {
    if (!result) return null;

    const handleDownload = () => {
        // Exclude graph_data from the download (it's only for visualization)
        const { graph_data, ...downloadData } = result;
        const blob = new Blob([JSON.stringify(downloadData, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fraud-analysis-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
                 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 cursor-pointer"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download JSON Report
        </button>
    );
}
