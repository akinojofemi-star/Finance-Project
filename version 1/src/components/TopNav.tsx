import { useState } from 'react';
import { searchSymbol } from '../services/api';
import { Search, Loader2, Sun, Moon } from 'lucide-react';

interface TopNavProps {
    onAddSymbol: (symbol: string, description: string) => void;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
}

export function TopNav({ onAddSymbol, theme, onToggleTheme }: TopNavProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && query.trim()) {
            setLoading(true);
            const res = await searchSymbol(query.trim());
            setLoading(false);
            
            if (res && res.symbol) {
                onAddSymbol(res.symbol, res.description);
                setQuery('');
            } else {
                alert('Could not find symbol on Finnhub standard tier.');
            }
        }
    };

    return (
        <header className="top-nav">
            <div className="logo-area">
                <span className="logo-text">FEMI FINANCE</span>
            </div>
            <div className="search-area">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input 
                        type="text" 
                        placeholder="What's going on with the markets today?" 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                    {loading && <Loader2 className="spinner" size={20} />}
                </div>
            </div>
            <div className="nav-right" style={{ display: 'flex', justifyContent: 'flex-end', width: '100px' }}>
                <button className="icon-btn" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
}
