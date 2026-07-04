import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getQuote } from '../services/api';
import { Loader2 } from 'lucide-react';

interface PaperTradingProps {
    symbol: string;
    name: string;
    portfolioBalance: number | null;
    onBalanceChange: (newBalance: number) => void;
}

export function PaperTrading({ symbol, portfolioBalance, onBalanceChange }: PaperTradingProps) {
    const { user } = useAuth();
    const [sharesHeld, setSharesHeld] = useState<number>(0);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<string>('1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        
        let isMounted = true;
        
        const fetchHoldingsAndPrice = async () => {
            // Fetch current price
            const quote = await getQuote(symbol);
            if (isMounted && quote) setCurrentPrice(quote.c);
            
            // Calculate shares held from trades
            const { data } = await supabase
                .from('trades')
                .select('trade_type, quantity')
                .eq('user_id', user.id)
                .eq('symbol', symbol);
                
            if (isMounted && data) {
                const held = data.reduce((acc, trade) => {
                    return trade.trade_type === 'BUY' 
                        ? acc + trade.quantity 
                        : acc - trade.quantity;
                }, 0);
                setSharesHeld(held);
            }
        };
        
        fetchHoldingsAndPrice();
        
        // Refresh price every 30 seconds
        const interval = setInterval(async () => {
            const quote = await getQuote(symbol);
            if (isMounted && quote) setCurrentPrice(quote.c);
        }, 30000);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [symbol, user]);

    if (!user) return null;
    if (portfolioBalance === null) return null;

    const handleTrade = async (type: 'BUY' | 'SELL') => {
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            setError('Please enter a valid quantity.');
            return;
        }
        if (!currentPrice) {
            setError('Waiting for current price...');
            return;
        }

        const totalValue = qty * currentPrice;

        if (type === 'BUY' && portfolioBalance < totalValue) {
            setError('Insufficient buying power.');
            return;
        }
        if (type === 'SELL' && sharesHeld < qty) {
            setError('Insufficient shares to sell.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const newBalance = type === 'BUY' ? portfolioBalance - totalValue : portfolioBalance + totalValue;

            // 1. Insert trade
            const { error: tradeError } = await supabase.from('trades').insert({
                user_id: user.id,
                symbol,
                trade_type: type,
                quantity: qty,
                price_per_share: currentPrice
            });
            if (tradeError) throw tradeError;

            // 2. Update portfolio
            const { error: portError } = await supabase.from('portfolios').update({
                balance: newBalance
            }).eq('user_id', user.id);
            if (portError) throw portError;

            // 3. Update local state
            onBalanceChange(newBalance);
            setSharesHeld(prev => type === 'BUY' ? prev + qty : prev - qty);
            setQuantity('1'); // reset
        } catch (err: any) {
            setError(err.message || 'An error occurred during trade.');
        } finally {
            setLoading(false);
        }
    };

    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const orderTotal = currentPrice ? parseInt(quantity || '0') * currentPrice : 0;

    return (
        <div className="paper-trading-panel">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Trade {symbol}</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div>Shares Held: <strong style={{ color: 'var(--text-primary)' }}>{sharesHeld}</strong></div>
                <div>Current Value: <strong style={{ color: 'var(--text-primary)' }}>${currentPrice ? fmt(sharesHeld * currentPrice) : '--'}</strong></div>
            </div>

            {error && (
                <div style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                    border: '1px solid var(--negative)',
                    borderRadius: '8px',
                    color: 'var(--negative)',
                    fontSize: '13px',
                    marginBottom: '16px'
                }}>
                    {error}
                </div>
            )}

            <div className="trade-controls">
                <div className="trade-qty">
                    <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Quantity</label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => { setError(null); setQuantity(e.target.value); }}
                        className="form-input"
                    />
                </div>

                <div className="trade-buttons">
                    <button
                        onClick={() => handleTrade('BUY')}
                        disabled={loading || !currentPrice}
                        className="btn-primary trade-buy"
                    >
                        {loading ? <Loader2 size={16} className="spinner" /> : `BUY $${currentPrice ? fmt(orderTotal) : '--'}`}
                    </button>

                    <button
                        onClick={() => handleTrade('SELL')}
                        disabled={loading || !currentPrice || sharesHeld <= 0}
                        className="btn-secondary trade-sell"
                    >
                        SELL
                    </button>
                </div>
            </div>
        </div>
    );
}
