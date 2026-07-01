import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, X, ArrowUp, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeStockWithAI } from '../services/ai';
import { getQuote, getCompanyProfile, getCompanyMetrics, getCompanyNews } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AIAnalysisProps {
    symbol: string;
    name: string;
}

export function AIAnalysis({ symbol, name }: AIAnalysisProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
    const [historyList, setHistoryList] = useState<{id: string, analysis_markdown: string, created_at: string}[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Clear chat when switching stocks
    useEffect(() => {
        setMessages([]);
        setError(null);
        setActiveTab('chat');
    }, [symbol]);

    // Fetch history when tab opens
    useEffect(() => {
        if (activeTab === 'history' && user) {
            setLoadingHistory(true);
            supabase.from('ai_history')
                .select('*')
                .eq('user_id', user.id)
                .eq('symbol', symbol)
                .order('created_at', { ascending: false })
                .then(({ data, error }) => {
                    if (data) setHistoryList(data);
                    setLoadingHistory(false);
                });
        }
    }, [activeTab, symbol, user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleAnalyze = async (customPrompt?: string) => {
        const text = customPrompt || userInput.trim();
        if (!text) return;

        const newMessages: {role: 'user'|'assistant', content: string}[] = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setUserInput('');
        setLoading(true);
        setError(null);

        try {
            // Fetch fresh context for the AI
            const [quote, profile, metrics, news] = await Promise.all([
                getQuote(symbol),
                getCompanyProfile(symbol),
                getCompanyMetrics(symbol),
                getCompanyNews(symbol)
            ]);

            const headlines = (news || []).slice(0, 5).map(n => n.headline);

            const result = await analyzeStockWithAI({
                symbol,
                name,
                price: quote?.c,
                change: quote?.d,
                percentChange: quote?.dp,
                marketCap: profile?.marketCapitalization,
                peRatio: metrics?.peExclExtraTTM,
                newsHeadlines: headlines,
                chatHistory: newMessages
            });

            setMessages([...newMessages, { role: 'assistant', content: result }]);

            // Save to history if logged in
            if (user) {
                await supabase.from('ai_history').insert({
                    user_id: user.id,
                    symbol,
                    analysis_markdown: result
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to generate analysis.");
            // Remove the user message if it failed, or let them see the error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-analysis-container" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>Synapse Intelligence</h3>
                {user && (
                    <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-color)', padding: '4px', borderRadius: '6px' }}>
                        <button 
                            onClick={() => setActiveTab('chat')}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: activeTab === 'chat' ? 'var(--card-bg)' : 'transparent',
                                border: '1px solid',
                                borderColor: activeTab === 'chat' ? 'var(--border-light)' : 'transparent',
                                borderRadius: '4px',
                                color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            Chat
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: activeTab === 'history' ? 'var(--card-bg)' : 'transparent',
                                border: '1px solid',
                                borderColor: activeTab === 'history' ? 'var(--border-light)' : 'transparent',
                                borderRadius: '4px',
                                color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            History
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'chat' ? (
                <>
                    <div style={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '16px', display: 'flex', flexDirection: 'column' }}>
                        {messages.length === 0 && !loading && !error && (
                            <>
                                <h3 className="ai-chat-header">Hi Femi, ask any financial question</h3>
                                <div className="ai-quick-prompts">
                                    <button className="ai-quick-btn" onClick={() => handleAnalyze(`What's going on with ${symbol} today?`)}>
                                        <Sparkles size={16} />
                                        What's going on with {symbol} today?
                                    </button>
                                    <button className="ai-quick-btn" onClick={() => handleAnalyze(`Analyze the current financial health of ${symbol}.`)}>
                                        <MessageSquare size={16} />
                                        Analyze the current financial health
                                    </button>
                                    <button className="ai-quick-btn" onClick={() => handleAnalyze(`Summarize the most recent news for ${symbol}.`)}>
                                        <MessageSquare size={16} />
                                        Summarize the most recent news
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="ai-messages-list">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`chat-message ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="ai-markdown-content">
                                            <ReactMarkdown>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            ))}
                            
                            {loading && (
                                <div className="chat-message message-assistant" style={{ opacity: 0.7 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Loader2 size={16} className="spinner" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="ai-error-box" style={{ marginTop: '16px' }}>
                                    <strong>Error:</strong> {error}
                                    <button className="ai-close-btn" onClick={() => setError(null)}><X size={16} /></button>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <div className="ai-chat-input-area">
                        <input 
                            type="text" 
                            className="ai-chat-input"
                            placeholder="Ask anything..."
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && userInput.trim()) {
                                    handleAnalyze(userInput.trim());
                                    setUserInput('');
                                }
                            }}
                        />
                        <button 
                            className="ai-chat-submit" 
                            onClick={() => {
                                if (userInput.trim()) {
                                    handleAnalyze(userInput.trim());
                                    setUserInput('');
                                }
                            }}
                        >
                            <ArrowUp size={16} />
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                    {loadingHistory ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                            <Loader2 size={24} className="spinner" />
                        </div>
                    ) : historyList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                            No AI history for {symbol} yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {historyList.map(h => (
                                <div key={h.id} style={{ 
                                    padding: '16px', 
                                    backgroundColor: 'var(--bg-color)', 
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-light)'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                        {new Date(h.created_at).toLocaleString()}
                                    </div>
                                    <div className="ai-markdown-content" style={{ fontSize: '14px' }}>
                                        <ReactMarkdown>{h.analysis_markdown}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
