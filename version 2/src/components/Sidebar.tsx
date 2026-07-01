import { useEffect, useState } from 'react';
import { getQuote } from '../services/api';
import type { Quote } from '../types';
import { AlignLeft, LayoutGrid, ChevronDown } from 'lucide-react';

interface SidebarProps {
    watchlist: string[];
    companyNames: Record<string, string>;
    activeTicker: string | null;
    onSelectTicker: (symbol: string) => void;
}

export function Sidebar({ watchlist, companyNames, activeTicker, onSelectTicker }: SidebarProps) {
    const [quotes, setQuotes] = useState<Record<string, Quote>>({});
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        const fetchQuotes = async () => {
            const newQuotes: Record<string, Quote> = {};
            for (const symbol of watchlist) {
                const q = await getQuote(symbol);
                if (q) newQuotes[symbol] = q;
            }
            setQuotes(newQuotes);
        };
        fetchQuotes();
        const interval = setInterval(fetchQuotes, 30000);
        return () => clearInterval(interval);
    }, [watchlist]);

    return (
        <aside className="sidebar">
            <div className="sidebar-section">
                <div className="sidebar-header">
                    <h2>Lists</h2>
                    <div className="sidebar-actions">
                        <button 
                            className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <AlignLeft size={18} />
                        </button>
                        <button 
                            className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="collapsible-group">
                    <div className="group-header">
                        <h3>Watchlist</h3>
                        <div className="group-actions">
                            <button className="icon-btn"><ChevronDown size={16} /></button>
                        </div>
                    </div>
                    <div className={`list-container ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                        {watchlist.map(symbol => {
                            const quote = quotes[symbol];
                            const isPositive = quote && quote.dp >= 0;
                            
                            return (
                                <div 
                                    key={symbol} 
                                    className={`list-item ${activeTicker === symbol ? 'active' : ''}`}
                                    onClick={() => onSelectTicker(symbol)}
                                >
                                    <div className="item-left">
                                        <div className="item-ticker">{symbol}</div>
                                        <div className="item-name">{companyNames[symbol] || symbol}</div>
                                    </div>
                                    <div className="item-right">
                                        <div className="item-price">{quote ? quote.c.toFixed(2) : '--'}</div>
                                        {quote && (
                                            <div className={`item-badge ${isPositive ? 'positive' : 'negative'}`}>
                                                {isPositive ? '+' : ''}{quote.dp.toFixed(2)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </aside>
    );
}
