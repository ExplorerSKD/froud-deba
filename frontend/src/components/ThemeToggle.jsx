/**
 * ThemeToggle — Dark/Light mode toggle.
 */
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('mule_theme');
        if (saved === 'light') {
            setIsDark(false);
            document.documentElement.classList.add('light-mode');
        }
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.remove('light-mode');
            localStorage.setItem('mule_theme', 'dark');
        } else {
            document.documentElement.classList.add('light-mode');
            localStorage.setItem('mule_theme', 'light');
        }
    };

    return (
        <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center text-lg transition-all border border-slate-700/30"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? '🌙' : '☀️'}
        </button>
    );
}
