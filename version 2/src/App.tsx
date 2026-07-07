import { useState, useEffect } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Dashboard } from './components/Dashboard';
import { PortfolioView } from './components/PortfolioView';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';
import { AIAnalysis } from './components/AIAnalysis';
import { BottomNav } from './components/BottomNav';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { THEMES, applyThemeToBody, type ThemeId } from './themes';

export type AppView = 'dashboard' | 'ai' | 'portfolio' | 'settings';

export interface AppState {
    watchlist: string[];
    companyNames: Record<string, string>;
    activeTicker: string | null;
}

const DEFAULT_WATCHLIST = ['DIA', 'SPY', 'AAPL', 'MSFT', 'BA', 'BRK-B', 'DIS', 'GE', 'HD'];
const DEFAULT_NAMES = {
    'DIA': 'SPDR Dow Jones Industrial Average ETF',
    'SPY': 'SPDR S&P 500 ETF Trust',
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'BA': 'The Boeing Company',
    'BRK-B': 'Berkshire Hathaway Inc.',
    'DIS': 'The Walt Disney Company',
    'GE': 'GE Aerospace',
    'HD': 'The Home Depot, Inc.'
};

function App() {
    const { user, isLoading } = useAuth();
    const [state, setState] = useState<AppState>(() => {
        const savedWatchlist = localStorage.getItem('stockTrackerWatchlist');
        const savedNames = localStorage.getItem('stockTrackerNames');
        return {
            watchlist: savedWatchlist ? JSON.parse(savedWatchlist) : DEFAULT_WATCHLIST,
            companyNames: savedNames ? JSON.parse(savedNames) : DEFAULT_NAMES,
            activeTicker: savedWatchlist ? JSON.parse(savedWatchlist)[0] : DEFAULT_WATCHLIST[0]
        };
    });

    const [theme, setTheme] = useState<ThemeId>(() => {
        const saved = localStorage.getItem('femiFinanceTheme') as ThemeId | null;
        return saved && THEMES.some(t => t.id === saved) ? saved : 'dark';
    });

    useEffect(() => {
        if (!user) return;
        const fetchWatchlist = async () => {
            const { data } = await supabase
                .from('watchlists')
                .select('symbols')
                .eq('user_id', user.id)
                .maybeSingle();
                
            if (data && data.symbols && data.symbols.length > 0) {
                setState(s => ({ ...s, watchlist: data.symbols as string[], activeTicker: data.symbols![0] }));
            } else if (!data) {
                // Initialize if no row exists
                await supabase.from('watchlists').insert({
                    user_id: user.id,
                    symbols: state.watchlist
                });
            }
        };
        fetchWatchlist();
    }, [user]);

    useEffect(() => {
        localStorage.setItem('stockTrackerWatchlist', JSON.stringify(state.watchlist));
        localStorage.setItem('stockTrackerNames', JSON.stringify(state.companyNames));
        
        if (user) {
            supabase.from('watchlists').upsert({
                user_id: user.id,
                symbols: state.watchlist
            }, { onConflict: 'user_id' }).then();
        }
    }, [state.watchlist, state.companyNames, user]);

    const [portfolioBalance, setPortfolioBalance] = useState<number | null>(null);

    useEffect(() => {
        if (!user) {
            setPortfolioBalance(null);
            return;
        }
        const fetchPortfolio = async () => {
            const { data } = await supabase.from('portfolios').select('balance').eq('user_id', user.id).maybeSingle();
            if (data && data.balance !== null) {
                setPortfolioBalance(data.balance);
            } else if (!data) {
                const { data: newData } = await supabase.from('portfolios').insert({ user_id: user.id, balance: 100000 }).select('balance').single();
                if (newData) setPortfolioBalance(newData.balance);
            }
        };
        fetchPortfolio();
    }, [user]);

    useEffect(() => {
        localStorage.setItem('femiFinanceTheme', theme);
        applyThemeToBody(theme);
    }, [theme]);

    const handleSelectTicker = (symbol: string) => {
        setState(s => ({ ...s, activeTicker: symbol }));
    };

    const handleAddSymbol = (symbol: string, description: string) => {
        setState(s => {
            if (s.watchlist.includes(symbol)) {
                return { ...s, activeTicker: symbol };
            }
            return {
                ...s,
                watchlist: [symbol, ...s.watchlist],
                companyNames: { ...s.companyNames, [symbol]: description },
                activeTicker: symbol
            };
        });
    };

    const [isGuest, setIsGuest] = useState(false);
    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Lock body scroll while the mobile drawer is open
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
                <Loader2 size={48} className="spinner" color="var(--accent)" />
            </div>
        );
    }

    return (
        <div className="app-root">
            <TopNav
                onAddSymbol={handleAddSymbol}
                theme={theme}
                onSelectTheme={setTheme}
                portfolioBalance={portfolioBalance}
                currentView={currentView}
                onNavigate={(v) => { setCurrentView(v); setIsMobileMenuOpen(false); }}
                onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                onSignIn={() => setIsGuest(false)}
            />
            
            {!user && !isGuest && <LoginModal onGuestAccess={() => setIsGuest(true)} />}

            <div className="dashboard-layout">
                <div
                    className={`mobile-backdrop ${isMobileMenuOpen ? 'visible' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                <Sidebar
                    watchlist={state.watchlist}
                    companyNames={state.companyNames}
                    activeTicker={state.activeTicker}
                    onSelectTicker={(t) => { handleSelectTicker(t); setIsMobileMenuOpen(false); }}
                    isMobileOpen={isMobileMenuOpen}
                />
                
                {currentView === 'dashboard' && (
                    <Dashboard 
                        watchlist={state.watchlist}
                        companyNames={state.companyNames}
                        activeTicker={state.activeTicker}
                        onSelectTicker={handleSelectTicker}
                        portfolioBalance={portfolioBalance}
                        onBalanceChange={setPortfolioBalance}
                    />
                )}

                {currentView === 'ai' && (
                    <div className="ai-page">
                        {state.activeTicker ? (
                            <AIAnalysis
                                symbol={state.activeTicker}
                                name={state.companyNames[state.activeTicker] || state.activeTicker}
                            />
                        ) : (
                            <div className="empty-state">Pick a stock from your watchlist to start chatting.</div>
                        )}
                    </div>
                )}

                {currentView === 'portfolio' && (
                    <PortfolioView portfolioBalance={portfolioBalance} onSignIn={() => setIsGuest(false)} />
                )}

                {currentView === 'settings' && (
                    <SettingsView theme={theme} onSelectTheme={setTheme} onSignIn={() => setIsGuest(false)} />
                )}
            </div>

            <BottomNav
                currentView={currentView}
                onNavigate={(v) => { setCurrentView(v); setIsMobileMenuOpen(false); window.scrollTo(0, 0); }}
            />
        </div>
    );
}

export default App;
