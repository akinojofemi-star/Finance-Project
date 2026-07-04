import { useEffect, useRef, useState } from 'react';
import { searchSymbol } from '../services/api';
import { Search, Loader2, LogOut, LayoutDashboard, Briefcase, Settings, Menu, Palette, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { THEMES, type ThemeId } from '../themes';

interface TopNavProps {
    onAddSymbol: (symbol: string, description: string) => void;
    theme: ThemeId;
    onSelectTheme: (theme: ThemeId) => void;
    portfolioBalance?: number | null;
    currentView?: 'dashboard' | 'portfolio' | 'settings';
    onNavigate?: (view: 'dashboard' | 'portfolio' | 'settings') => void;
    onToggleMobileMenu?: () => void;
}

export function TopNav({ onAddSymbol, theme, onSelectTheme, portfolioBalance, currentView = 'dashboard', onNavigate, onToggleMobileMenu }: TopNavProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [themeOpen, setThemeOpen] = useState(false);
    const themeRef = useRef<HTMLDivElement>(null);
    const { user, signOut } = useAuth();

    useEffect(() => {
        if (!themeOpen) return;
        const handler = (e: MouseEvent) => {
            if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
                setThemeOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [themeOpen]);

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

    const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];
    const ActiveIcon = activeTheme.icon;

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

                <div className="theme-picker" ref={themeRef}>
                    <button
                        className="icon-btn theme-btn"
                        onClick={() => setThemeOpen(o => !o)}
                        title={`Theme: ${activeTheme.label}`}
                        aria-haspopup="menu"
                        aria-expanded={themeOpen}
                    >
                        <ActiveIcon size={20} />
                    </button>

                    {themeOpen && (
                        <div className="theme-menu" role="menu">
                            <div className="theme-menu-header">
                                <Palette size={14} />
                                <span>Theme</span>
                            </div>
                            {THEMES.map(t => {
                                const Icon = t.icon;
                                const isActive = t.id === theme;
                                return (
                                    <button
                                        key={t.id}
                                        className={`theme-option ${isActive ? 'active' : ''}`}
                                        onClick={() => { onSelectTheme(t.id); setThemeOpen(false); }}
                                        role="menuitem"
                                    >
                                        <span className="theme-swatch" style={{ backgroundColor: t.swatch }} />
                                        <Icon size={16} className="theme-option-icon" />
                                        <span className="theme-option-label">
                                            <span className="theme-option-name">{t.label}</span>
                                            <span className="theme-option-desc">{t.description}</span>
                                        </span>
                                        {isActive && <Check size={14} className="theme-check" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
