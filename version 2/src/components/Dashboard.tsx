import { useEffect, useState } from 'react';
import { getQuote } from '../services/api';
import type { Quote } from '../types';
import { NewsCardList } from './NewsCard';
import { StockChart } from './StockChart';
import { CompanyStats } from './CompanyStats';
import { AIAnalysis } from './AIAnalysis';
import { PaperTrading } from './PaperTrading';

interface DashboardProps {
    watchlist: string[];
    companyNames: Record<string, string>;
    activeTicker: string | null;
    onSelectTicker: (symbol: string) => void;
    portfolioBalance?: number | null;
    onBalanceChange?: (newBalance: number) => void;
}

export function Dashboard({ watchlist, companyNames, activeTicker, onSelectTicker, portfolioBalance, onBalanceChange }: DashboardProps) {
    
    
    return (
        <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
            <main className="main-content">
                <div className="index-cards-row">
                    {watchlist.map(ticker => (
                        <IndexCard key={ticker} symbol={ticker} name={companyNames[ticker] || ticker} onClick={() => onSelectTicker(ticker)} />
                    ))}
                </div>

                <section className="market-summary-section">
                    <h2 className="section-title">
                        {activeTicker ? `${companyNames[activeTicker] || activeTicker} summary` : 'US market summary'}
                    </h2>
                    
                    {activeTicker && <StockChart symbol={activeTicker} />}
                    {activeTicker && <CompanyStats symbol={activeTicker} />}
                    
                    {activeTicker && onBalanceChange && (
                        <PaperTrading 
                            symbol={activeTicker} 
                            name={companyNames[activeTicker] || activeTicker} 
                            portfolioBalance={portfolioBalance ?? null}
                            onBalanceChange={onBalanceChange}
                        />
                    )}
                    
                    <NewsCardList symbol={activeTicker} />
                </section>
            </main>

            {activeTicker && (
                <aside className="right-sidebar">
                    <AIAnalysis symbol={activeTicker} name={companyNames[activeTicker] || activeTicker} />
                </aside>
            )}
        </div>
    );
}

function IndexCard({ symbol, name, onClick }: { symbol: string, name: string, onClick: () => void }) {
    const [quote, setQuote] = useState<Quote | null>(null);

    useEffect(() => {
        getQuote(symbol).then(setQuote);
    }, [symbol]);

    return (
        <div className="index-card" onClick={onClick}>
            <div className="card-title">{name}</div>
            <div className="card-price">{quote ? quote.c.toFixed(2) : '--'}</div>
            {quote && (
                <div className={`card-change ${quote.dp >= 0 ? 'positive' : 'negative'}`}>
                    {quote.dp >= 0 ? '+' : ''}{quote.d.toFixed(2)} ({quote.dp >= 0 ? '+' : ''}{quote.dp.toFixed(2)}%)
                </div>
            )}
        </div>
    );
}
