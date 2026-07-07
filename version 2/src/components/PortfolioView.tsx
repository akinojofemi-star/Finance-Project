import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getQuote } from '../services/api';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Briefcase } from 'lucide-react';

interface PortfolioViewProps {
    portfolioBalance: number | null;
    onSignIn?: () => void;
}

interface Trade {
    id: string;
    symbol: string;
    trade_type: 'BUY' | 'SELL';
    quantity: number;
    price_per_share: number;
    created_at: string;
}

interface Holding {
    symbol: string;
    quantity: number;
    totalCost: number;
    currentPrice: number;
}

export function PortfolioView({ portfolioBalance, onSignIn }: PortfolioViewProps) {
    const { user } = useAuth();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchPortfolioData = async () => {
            setLoading(true);
            const { data: tradesData } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            const fetchedTrades = (tradesData || []) as Trade[];
            setTrades(fetchedTrades);

            const holdingsMap: Record<string, { quantity: number, totalCost: number }> = {};
            const chronologicalTrades = [...fetchedTrades].reverse();

            for (const trade of chronologicalTrades) {
                if (!holdingsMap[trade.symbol]) {
                    holdingsMap[trade.symbol] = { quantity: 0, totalCost: 0 };
                }
                if (trade.trade_type === 'BUY') {
                    holdingsMap[trade.symbol].quantity += trade.quantity;
                    holdingsMap[trade.symbol].totalCost += (trade.quantity * trade.price_per_share);
                } else if (trade.trade_type === 'SELL') {
                    const avgCost = holdingsMap[trade.symbol].totalCost / holdingsMap[trade.symbol].quantity;
                    holdingsMap[trade.symbol].quantity -= trade.quantity;
                    holdingsMap[trade.symbol].totalCost -= (trade.quantity * avgCost);
                }
            }

            const activeSymbols = Object.keys(holdingsMap).filter(sym => holdingsMap[sym].quantity > 0);
            const holdingsWithPrices: Holding[] = [];
            for (const symbol of activeSymbols) {
                const quote = await getQuote(symbol);
                if (quote) {
                    holdingsWithPrices.push({
                        symbol,
                        quantity: holdingsMap[symbol].quantity,
                        totalCost: holdingsMap[symbol].totalCost,
                        currentPrice: quote.c
                    });
                }
            }

            setHoldings(holdingsWithPrices);
            setLoading(false);
        };

        fetchPortfolioData();
    }, [user]);

    if (!user) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div>Your portfolio lives here — practice trading with $100,000 in virtual cash.</div>
                    {onSignIn && (
                        <button className="btn-primary" onClick={onSignIn}>
                            Sign in to get started
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={40} className="spinner" color="var(--accent)" />
            </div>
        );
    }

    const investmentsValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const totalCostBasis = holdings.reduce((sum, h) => sum + h.totalCost, 0);
    const totalReturn = investmentsValue - totalCostBasis;
    const returnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;
    const netWorth = (portfolioBalance || 0) + investmentsValue;

    const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="page-container">
            <div className="page-inner">
                <h2 className="page-title">Portfolio Dashboard</h2>

                <div className="portfolio-metrics-grid">
                    <div className="metric-card">
                        <div className="metric-label">
                            <Briefcase size={14} /> Total Net Worth
                        </div>
                        <div className="metric-value">${fmtMoney(netWorth)}</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-label">
                            <DollarSign size={14} /> Cash Balance
                        </div>
                        <div className="metric-value">${fmtMoney(portfolioBalance || 0)}</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-label">Investments Value</div>
                        <div className="metric-value">${fmtMoney(investmentsValue)}</div>
                        <div
                            className="metric-change"
                            style={{ color: totalReturn >= 0 ? 'var(--positive)' : 'var(--negative)' }}
                        >
                            {totalReturn >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {totalReturn >= 0 ? '+' : ''}{fmtMoney(totalReturn)} ({returnPercent.toFixed(2)}%)
                        </div>
                    </div>
                </div>

                <div className="portfolio-columns">
                    <div className="card-panel" style={{ marginBottom: 0 }}>
                        <h3 style={{ fontSize: '17px', marginBottom: '20px', fontWeight: 600 }}>Current Holdings</h3>

                        {holdings.length === 0 ? (
                            <div className="empty-state">
                                No active holdings. Go to Dashboard to start trading.
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="holdings-table">
                                    <thead>
                                        <tr>
                                            <th>Symbol</th>
                                            <th className="right">Shares</th>
                                            <th className="right">Price</th>
                                            <th className="right">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holdings.map(h => (
                                            <tr key={h.symbol}>
                                                <td style={{ fontWeight: 600 }}>{h.symbol}</td>
                                                <td className="right">{h.quantity}</td>
                                                <td className="right">${h.currentPrice.toFixed(2)}</td>
                                                <td className="right" style={{ fontWeight: 500 }}>
                                                    ${fmtMoney(h.quantity * h.currentPrice)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card-panel" style={{ marginBottom: 0 }}>
                        <h3 style={{ fontSize: '17px', marginBottom: '20px', fontWeight: 600 }}>Transaction History</h3>

                        {trades.length === 0 ? (
                            <div className="empty-state">
                                No trades executed yet.
                            </div>
                        ) : (
                            <div className="transaction-list">
                                {trades.map(trade => (
                                    <div key={trade.id} className="transaction-item">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                            <div
                                                className="transaction-tag"
                                                style={{
                                                    backgroundColor: trade.trade_type === 'BUY' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                                                    color: trade.trade_type === 'BUY' ? 'var(--positive)' : 'var(--negative)',
                                                }}
                                            >
                                                {trade.trade_type}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{trade.symbol}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    {new Date(trade.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 500, fontSize: '14px' }}>{trade.quantity} shares</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                @ ${trade.price_per_share.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
