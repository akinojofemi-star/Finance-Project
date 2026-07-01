import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, X, ArrowUp, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeStockWithAI } from '../services/ai';
import { getQuote, getCompanyProfile, getCompanyMetrics, getCompanyNews } from '../services/api';

interface AIAnalysisProps {
    symbol: string;
    name: string;
}

export function AIAnalysis({ symbol, name }: AIAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Clear chat when switching stocks
    useEffect(() => {
        setMessages([]);
        setError(null);
    }, [symbol]);

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
        } catch (err: any) {
            setError(err.message || "Failed to generate analysis.");
            // Remove the user message if it failed, or let them see the error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-analysis-container" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Bloomberg Terminal Intelligence</h3>
            </div>

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
        </div>
    );
}
