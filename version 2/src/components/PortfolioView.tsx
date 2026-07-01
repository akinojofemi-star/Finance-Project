import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getQuote } from '../services/api';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Briefcase } from 'lucide-react';

interface PortfolioViewProps {
    portfolioBalance: number | null;
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

export function PortfolioView({ portfolioBalance }: PortfolioViewProps) {
    const { user } = useAuth();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchPortfolioData = async () => {
            setLoading(true);
            
            // 1. Fetch trades
            const { data: tradesData } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            const fetchedTrades = (tradesData || []) as Trade[];
            setTrades(fetchedTrades);

            // 2. Aggregate into holdings
            const holdingsMap: Record<string, { quantity: number, totalCost: number }> = {};
            
            // We iterate from oldest to newest to calculate cost basis correctly
            const chronologicalTrades = [...fetchedTrades].reverse();
            
            for (const trade of chronologicalTrades) {
                if (!holdingsMap[trade.symbol]) {
                    holdingsMap[trade.symbol] = { quantity: 0, totalCost: 0 };
                }
                
                if (trade.trade_type === 'BUY') {
                    holdingsMap[trade.symbol].quantity += trade.quantity;
                    holdingsMap[trade.symbol].totalCost += (trade.quantity * trade.price_per_share);
                } else if (trade.trade_type === 'SELL') {
                    // Average cost basis reduction
                    const avgCost = holdingsMap[trade.symbol].totalCost / holdingsMap[trade.symbol].quantity;
                    holdingsMap[trade.symbol].quantity -= trade.quantity;
                    holdingsMap[trade.symbol].totalCost -= (trade.quantity * avgCost);
                }
            }

            // Filter out 0 quantity holdings
            const activeSymbols = Object.keys(holdingsMap).filter(sym => holdingsMap[sym].quantity > 0);
            
            // 3. Fetch current prices
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
            <div style={{ flex: 1, padding: '32px', display: 'flex', justifyContent: 'center' }}>
                Please log in to view portfolio.
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={40} className="spinner" color="var(--accent)" />
            </div>
        );
    }

    const investmentsValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const totalCostBasis = holdings.reduce((sum, h) => sum + h.totalCost, 0);
    const totalReturn = investmentsValue - totalCostBasis;
    const returnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;
    
    const netWorth = (portfolioBalance || 0) + investmentsValue;

    return (
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'var(--bg-color)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '32px' }}>Portfolio Dashboard</h2>

                {/* Top Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-light)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Briefcase size={16} /> Total Net Worth
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 600 }}>${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-light)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={16} /> Cash Balance
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 600 }}>${(portfolioBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>

                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-light)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Investments Value</div>
                        <div style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>${investmentsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: totalReturn >= 0 ? 'var(--positive)' : 'var(--negative)', fontSize: '14px', fontWeight: 500 }}>
                            {totalReturn >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({returnPercent.toFixed(2)}%)
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Active Holdings Table */}
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-light)' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Current Holdings</h3>
                        
                        {holdings.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
                                No active holdings. Go to Dashboard to start trading.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Symbol</th>
                                        <th style={{ paddingBottom: '12px', fontWeight: 500, textAlign: 'right' }}>Shares</th>
                                        <th style={{ paddingBottom: '12px', fontWeight: 500, textAlign: 'right' }}>Price</th>
                                        <th style={{ paddingBottom: '12px', fontWeight: 500, textAlign: 'right' }}>Total Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map(h => (
                                        <tr key={h.symbol} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '16px 0', fontWeight: 600 }}>{h.symbol}</td>
                                            <td style={{ padding: '16px 0', textAlign: 'right' }}>{h.quantity}</td>
                                            <td style={{ padding: '16px 0', textAlign: 'right' }}>${h.currentPrice.toFixed(2)}</td>
                                            <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 500 }}>${(h.quantity * h.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Transaction History */}
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-light)' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Transaction History</h3>
                        
                        {trades.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
                                No trades executed yet.
                            </div>
                        ) : (
                            <div style={{ overflowY: 'auto', maxHeight: '500px', paddingRight: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {trades.map(trade => (
                                        <div key={trade.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ 
                                                    padding: '8px', 
                                                    borderRadius: '4px',
                                                    backgroundColor: trade.trade_type === 'BUY' ? 'rgba(129, 201, 149, 0.1)' : 'rgba(242, 139, 130, 0.1)',
                                                    color: trade.trade_type === 'BUY' ? 'var(--positive)' : 'var(--negative)',
                                                    fontWeight: 600,
                                                    fontSize: '12px'
                                                }}>
                                                    {trade.trade_type}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{trade.symbol}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                        {new Date(trade.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 500 }}>{trade.quantity} shares</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>@ ${trade.price_per_share.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
