import { useState } from 'react';
import { searchSymbol } from '../services/api';
import { Search, Loader2, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TopNavProps {
    onAddSymbol: (symbol: string, description: string) => void;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
    portfolioBalance?: number | null;
}

export function TopNav({ onAddSymbol, theme, onToggleTheme, portfolioBalance }: TopNavProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, signOut } = useAuth();

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
                <span className="logo-text">SYNAPSE FINANCE</span>
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
            <div className="nav-right" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', flex: 1 }}>
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {portfolioBalance !== null && portfolioBalance !== undefined && (
                            <div style={{ 
                                padding: '4px 12px', 
                                backgroundColor: 'rgba(129, 201, 149, 0.1)', 
                                border: '1px solid var(--positive)', 
                                borderRadius: '4px',
                                color: 'var(--positive)',
                                fontWeight: 600,
                                fontSize: '14px'
                            }}>
                                ${portfolioBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Buying Power
                            </div>
                        )}
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {user.email}
                        </span>
                        <button className="icon-btn" onClick={signOut} title="Sign Out" style={{ color: 'var(--negative)' }}>
                            <LogOut size={20} />
                        </button>
                    </div>
                )}
                <button className="icon-btn" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
}
