/**
 * UploadCSV — Drag-and-drop CSV file upload component.
 * Posts the file to /upload-csv and passes the result to the parent.
 */
import { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function UploadCSV({ onResult, onLoading }) {
    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const uploadFile = async (file) => {
        if (!file || !file.name.toLowerCase().endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }

        setError('');
        setFileName(file.name);
        onLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/upload-csv`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 120000, // 2 min for large datasets
            });
            onResult(response.data);
        } catch (err) {
            console.error('Upload error:', err);
            let message = 'Upload failed. Please try again.';
            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                message = typeof detail === 'string' ? detail : JSON.stringify(detail);
            } else if (err.code === 'ECONNABORTED') {
                message = 'Request timed out. The dataset may be too large.';
            } else if (!err.response) {
                message = 'Cannot connect to backend. Make sure the server is running on port 8000.';
            }
            setError(message);
        } finally {
            onLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        uploadFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) uploadFile(file);
    };

    return (
        <div className="glass-card glass-card-hover p-8">
            <h2 className="text-xl font-bold mb-4 gradient-text">Upload Transaction Data</h2>
            <div
                className={`drop-zone rounded-xl p-12 text-center cursor-pointer transition-all ${dragOver ? 'drag-over' : ''
                    }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-indigo-400 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </div>
                <p className="text-lg font-medium text-indigo-300">
                    {fileName || 'Drop your CSV file here or click to browse'}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                    Supports flexible columns: TX_ID, SENDER_ACCOUNT_ID, RECEIVER_ACCOUNT_ID, TX_AMOUNT, TIMESTAMP
                </p>
            </div>

            {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                    ⚠ {error}
                </div>
            )}
        </div>
    );
}
