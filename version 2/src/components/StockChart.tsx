import { useState, useEffect } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getHistory } from '../services/api';

const RANGES = ['1D', '1W', '1M', 'YTD', '1Y', 'ALL'];

interface StockChartProps {
    symbol: string | null;
}

export function StockChart({ symbol }: StockChartProps) {
    const [range, setRange] = useState('1Y');
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSMA, setShowSMA] = useState(false);

    useEffect(() => {
        if (!symbol) return;
        
        let isActive = true;
        setLoading(true);
        
        getHistory(symbol, range).then(data => {
            if (!isActive) return;
            if (data) {
                const formatted = data.timestamps.map((t: number, i: number) => {
                    const date = new Date(t * 1000);
                    return {
                        time: range === '1D' 
                            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : date.toLocaleDateString(),
                        price: data.closes[i]
                    };
                });

                // Calculate 20-period Simple Moving Average
                const period = 20;
                const withSMA = formatted.map((dataPoint, i, arr) => {
                    if (i < period - 1) return { ...dataPoint, sma: null };
                    let sum = 0;
                    for (let j = 0; j < period; j++) {
                        sum += arr[i - j].price;
                    }
                    return { ...dataPoint, sma: sum / period };
                });

                setChartData(withSMA);
            } else {
                setChartData([]);
            }
            setLoading(false);
        });
        
        return () => { isActive = false; };
    }, [symbol, range]);

    if (!symbol) return null;

    // Determine color based on trend
    const isPositive = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;
    const color = isPositive ? '#81c995' : '#f28b82';

    return (
        <div className="chart-container" style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>Price History</h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <input 
                            type="checkbox" 
                            checked={showSMA}
                            onChange={(e) => setShowSMA(e.target.checked)}
                            style={{ accentColor: 'var(--accent)' }}
                        />
                        Show 20-Period SMA
                    </label>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {RANGES.map(r => (
                        <button 
                            key={r}
                            onClick={() => setRange(r)}
                            style={{ 
                                background: range === r ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none',
                                color: range === r ? 'var(--text-primary)' : 'var(--text-secondary)',
                                padding: '6px 12px',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500
                            }}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>
            
            <div style={{ height: '300px', width: '100%' }}>
                {loading ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        Loading chart data...
                    </div>
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="time" 
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                                stroke="var(--border-light)" 
                                minTickGap={30} 
                            />
                            <YAxis 
                                domain={['auto', 'auto']} 
                                orientation="right"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                                stroke="var(--border-light)" 
                                tickFormatter={(val) => `$${val.toFixed(2)}`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#303134', border: 'none', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="price" stroke={color} fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                            {showSMA && (
                                <Line 
                                    type="monotone" 
                                    dataKey="sma" 
                                    stroke="var(--accent)" 
                                    strokeWidth={2} 
                                    dot={false} 
                                    name="SMA (20)"
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        No history data available for this range.
                    </div>
                )}
            </div>
        </div>
    );
}
