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

    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '8px',
            padding: '24px',
            marginTop: '24px'
        }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Trade {symbol}</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <div>Shares Held: <strong style={{ color: 'var(--text-primary)' }}>{sharesHeld}</strong></div>
                <div>Current Value: <strong style={{ color: 'var(--text-primary)' }}>${currentPrice ? (sharesHeld * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}</strong></div>
            </div>

            {error && (
                <div style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(242, 139, 130, 0.1)',
                    border: '1px solid var(--negative)',
                    borderRadius: '4px',
                    color: 'var(--negative)',
                    fontSize: '13px',
                    marginBottom: '16px'
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Quantity</label>
                    <input 
                        type="number" 
                        min="1"
                        value={quantity}
                        onChange={(e) => { setError(null); setQuantity(e.target.value); }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'var(--bg-color)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            outline: 'none'
                        }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => handleTrade('BUY')}
                        disabled={loading || !currentPrice}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: 'var(--positive)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: (loading || !currentPrice) ? 0.5 : 1
                        }}
                    >
                        {loading ? <Loader2 size={18} className="spinner" /> : `BUY $${currentPrice ? (parseInt(quantity || '0') * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}`}
                    </button>
                    
                    <button 
                        onClick={() => handleTrade('SELL')}
                        disabled={loading || !currentPrice || sharesHeld <= 0}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: 'transparent',
                            color: 'var(--negative)',
                            border: '1px solid var(--negative)',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: (loading || sharesHeld <= 0) ? 'not-allowed' : 'pointer',
                            opacity: (loading || !currentPrice || sharesHeld <= 0) ? 0.5 : 1
                        }}
                    >
                        SELL
                    </button>
                </div>
            </div>
        </div>
    );
}
