import { useState } from 'react';
import { searchSymbol } from '../services/api';
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
            <div className="logo-area" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {onToggleMobileMenu && (
                        <button className="icon-btn" onClick={onToggleMobileMenu} style={{ display: 'flex', alignItems: 'center' }}>
                            <Menu size={20} />
                        </button>
                    )}
                    <span className="logo-text">SYNAPSE FINANCE</span>
                </div>
                
                {onNavigate && user && (
                    <nav style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => onNavigate('dashboard')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', background: currentView === 'dashboard' ? 'var(--card-bg)' : 'transparent',
                                border: '1px solid', borderColor: currentView === 'dashboard' ? 'var(--border-light)' : 'transparent',
                                borderRadius: '4px', color: currentView === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer', fontSize: '13px', fontWeight: 500
                            }}
                        >
                            <LayoutDashboard size={14} /> Research
                        </button>
                        <button 
                            onClick={() => onNavigate('portfolio')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', background: currentView === 'portfolio' ? 'var(--card-bg)' : 'transparent',
                                border: '1px solid', borderColor: currentView === 'portfolio' ? 'var(--border-light)' : 'transparent',
                                borderRadius: '4px', color: currentView === 'portfolio' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer', fontSize: '13px', fontWeight: 500
                            }}
                        >
                            <Briefcase size={14} /> Portfolio
                        </button>
                    </nav>
                )}
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
                        <span className="hide-on-mobile" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {user.email}
                        </span>
                        {onNavigate && (
                            <button className="icon-btn" onClick={() => onNavigate('settings')} title="Settings" style={{ color: currentView === 'settings' ? 'var(--accent)' : 'var(--text-primary)' }}>
                                <Settings size={20} />
                            </button>
                        )}
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
