import { useEffect, useState } from 'react';
import { getCompanyProfile, getCompanyMetrics } from '../services/api';
import type { CompanyProfile, CompanyMetrics } from '../types';

interface CompanyStatsProps {
    symbol: string | null;
}

export function CompanyStats({ symbol }: CompanyStatsProps) {
    const [profile, setProfile] = useState<CompanyProfile | null>(null);
    const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;
        setLoading(true);
        Promise.all([
            getCompanyProfile(symbol),
            getCompanyMetrics(symbol)
        ]).then(([p, m]) => {
            setProfile(p);
            setMetrics(m);
            setLoading(false);
        });
    }, [symbol]);

    if (!symbol) return null;

    const formatNumber = (num: number) => {
        if (!num) return '--';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'T'; // Finnhub market cap is in millions, so 1e6 millions = 1 Trillion
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'B';
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    return (
        <aside className="company-stats-panel">
            <h3 className="stats-header">Key Statistics</h3>
            
            {loading ? (
                <div className="stats-loading">Loading data...</div>
            ) : (
                <div className="stats-grid">
                    <StatItem label="Market Cap" value={profile?.marketCapitalization ? `$${formatNumber(profile.marketCapitalization)}` : '--'} />
                    <StatItem label="P/E Ratio" value={metrics?.peExclExtraTTM?.toFixed(2) || '--'} />
                    <StatItem label="52 Week High" value={metrics?.['52WeekHigh'] ? `$${metrics['52WeekHigh'].toFixed(2)}` : '--'} />
                    <StatItem label="52 Week Low" value={metrics?.['52WeekLow'] ? `$${metrics['52WeekLow'].toFixed(2)}` : '--'} />
                    <StatItem label="Beta" value={metrics?.beta?.toFixed(2) || '--'} />
                    <StatItem label="Industry" value={profile?.finnhubIndustry || '--'} />
                    <StatItem label="Website" value={profile?.weburl ? <a href={profile.weburl} target="_blank" rel="noreferrer" className="stats-link">Link</a> : '--'} />
                </div>
            )}
        </aside>
    );
}

function StatItem({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <div className="stat-item">
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
        </div>
    );
}
