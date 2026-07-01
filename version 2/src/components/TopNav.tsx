import { useState } from 'react';
import { searchSymbol } from '../services/api';
import { Search, Loader2, Sun, Moon, LogOut, LayoutDashboard, Briefcase, Settings, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TopNavProps {
    onAddSymbol: (symbol: string, description: string) => void;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
    portfolioBalance?: number | null;
    currentView?: 'dashboard' | 'portfolio' | 'settings';
    onNavigate?: (view: 'dashboard' | 'portfolio' | 'settings') => void;
    onToggleMobileMenu?: () => void;
}

export function TopNav({ onAddSymbol, theme, onToggleTheme, portfolioBalance, currentView = 'dashboard', onNavigate, onToggleMobileMenu }: TopNavProps) {
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
            <div className="logo-group">
                {onToggleMobileMenu && (
                    <button className="icon-btn hamburger-btn" onClick={onToggleMobileMenu}>
                        <Menu size={20} />
                    </button>
                )}
                <span className="logo-text">SYNAPSE</span>
            </div>
            
            {onNavigate && user && (
                <nav className="nav-tabs">
                    <button 
                        onClick={() => onNavigate('dashboard')}
                        className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={14} /> Research
                    </button>
                    <button 
                        onClick={() => onNavigate('portfolio')}
                        className={`nav-btn ${currentView === 'portfolio' ? 'active' : ''}`}
                    >
                        <Briefcase size={14} /> Portfolio
                    </button>
                </nav>
            )}
            
            <div className="search-area">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search markets..." 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                    {loading && <Loader2 className="spinner" size={20} />}
                </div>
            </div>
            
            <div className="user-actions">
                {user && (
                    <>
                        {portfolioBalance !== null && portfolioBalance !== undefined && (
                            <div className="buying-power-badge hide-on-mobile">
                                ${portfolioBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BP
                            </div>
                        )}
                        <span className="hide-on-mobile user-email">
                            {user.email}
                        </span>
                        {onNavigate && (
                            <button className={`icon-btn ${currentView === 'settings' ? 'active-icon' : ''}`} onClick={() => onNavigate('settings')} title="Settings">
                                <Settings size={20} />
                            </button>
                        )}
                        <button className="icon-btn logout-btn" onClick={signOut} title="Sign Out">
                            <LogOut size={20} />
                        </button>
                    </>
                )}
                <button className="icon-btn theme-btn" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
}
