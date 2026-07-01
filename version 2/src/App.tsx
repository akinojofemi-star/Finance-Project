import { useState, useEffect } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Dashboard } from './components/Dashboard';
import { PortfolioView } from './components/PortfolioView';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

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

    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('femiFinanceTheme') as 'dark' | 'light') || 'dark';
    });

    useEffect(() => {
        if (!user) return;
        const fetchWatchlist = async () => {
            const { data, error } = await supabase
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
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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
    const [currentView, setCurrentView] = useState<'dashboard' | 'portfolio' | 'settings'>('dashboard');

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
                <Loader2 size={48} className="spinner" color="var(--accent)" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <TopNav 
                onAddSymbol={handleAddSymbol} 
                theme={theme} 
                onToggleTheme={toggleTheme} 
                portfolioBalance={portfolioBalance} 
                currentView={currentView}
                onNavigate={setCurrentView}
            />
            
            {!user && !isGuest && <LoginModal onGuestAccess={() => setIsGuest(true)} />}

            <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                <Sidebar 
                    watchlist={state.watchlist} 
                    companyNames={state.companyNames}
                    activeTicker={state.activeTicker}
                    onSelectTicker={handleSelectTicker}
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

                {currentView === 'portfolio' && (
                    <PortfolioView portfolioBalance={portfolioBalance} />
                )}

                {currentView === 'settings' && (
                    <SettingsView theme={theme} onToggleTheme={toggleTheme} />
                )}
            </div>
        </div>
    );
}

export default App;
