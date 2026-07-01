import { useState, useEffect } from 'react';
import { getCompanyNews } from '../services/api';
import type { NewsArticle } from '../types';
import { ChevronDown } from 'lucide-react';

export function NewsCardList({ symbol }: { symbol: string | null }) {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;
        setLoading(true);
        getCompanyNews(symbol).then(data => {
            setNews(data.slice(0, 5));
            setLoading(false);
        });
    }, [symbol]);

    if (loading) {
        return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading updates...</div>;
    }

    if (news.length === 0) {
        return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>No recent updates available.</div>;
    }

    return (
        <div className="news-feed">
            {news.map((article, i) => (
                <NewsCard key={article.id || i} article={article} defaultExpanded={i === 0} />
            ))}
        </div>
    );
}

function NewsCard({ article, defaultExpanded }: { article: NewsArticle, defaultExpanded: boolean }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const publishDate = new Date(article.datetime * 1000);
    const diffHrs = Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60));
    const diffMins = Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60));
    let timeStr = `${diffHrs}h ago`;
    if (diffHrs === 0) timeStr = `${diffMins} min. ago`;
    if (diffHrs > 24) timeStr = `${Math.floor(diffHrs/24)}d ago`;

    return (
        <div className={`news-item ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
            <div className="news-source">
                <strong>{article.source.toUpperCase()}</strong> <span style={{ opacity: 0.5 }}>{timeStr}</span>
            </div>
            <div className="news-header">
                <div className="news-title-area">
                    <h3 className="news-headline">{article.headline}</h3>
                </div>
                <button className="news-expand-btn">
                    <ChevronDown size={20} />
                </button>
            </div>
            <div className="news-body">
                {article.summary} <br/><br/>
                <a href={article.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                    Read full article on {article.source}
                </a>
            </div>
        </div>
    );
}
