export async function analyzeStockWithAI(context: {
    symbol: string;
    name: string;
    price?: number;
    change?: number;
    percentChange?: number;
    marketCap?: number;
    peRatio?: number;
    newsHeadlines: string[];
    model?: string;
    provider?: string;
    userPrompt?: string;
    chatHistory?: { role: 'user' | 'assistant'; content: string }[];
}): Promise<string> {
    const MODELS_TO_TRY = [
        { id: 'openai/gpt-4o-mini', provider: 'openrouter' },
        { id: 'meta/llama-3.3-70b-instruct', provider: 'nvidia' },
        { id: 'google/gemini-flash-1.5', provider: 'openrouter' },
        { id: 'mistralai/mistral-large-2-instruct', provider: 'nvidia' },
        { id: 'meta-llama/llama-3-8b-instruct:free', provider: 'openrouter' }
    ];

    const baseData = `Context: The user is looking at ${context.name} (${context.symbol}).
${context.price !== undefined ? `Price: $${context.price.toFixed(2)} (${(context.change || 0) >= 0 ? 'up' : 'down'} ${(context.percentChange || 0).toFixed(2)}% today).` : 'Live price data currently unavailable due to API rate limits.'}
${context.marketCap ? `Market cap: $${(context.marketCap / 1e6).toFixed(2)} Trillion.` : ''}
${context.peRatio ? `P/E ratio: ${context.peRatio.toFixed(2)}.` : ''}
Recent headlines:
${context.newsHeadlines && context.newsHeadlines.length > 0 ? context.newsHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'No recent news available.'}`;

    const apiMessages: any[] = [
        { role: "system", content: "You are an expert Synapse Finance AI assistant. Be concise, objective, and analytical. Use markdown formatting for readability." },
        { role: "system", content: `LATEST LIVE DATA:\n${baseData}` }
    ];

    if (context.chatHistory && context.chatHistory.length > 0) {
        apiMessages.push(...context.chatHistory);
        if (context.userPrompt) {
            apiMessages.push({ role: "user", content: context.userPrompt });
        }
    } else {
        const prompt = context.userPrompt 
            ? `${context.userPrompt}`
            : `Based on this exact data, provide a quick, highly professional summary (max 2 paragraphs) of why the stock might be performing this way today and what investors should look out for.`;
        apiMessages.push({ role: "user", content: prompt });
    }

    let lastError: any = null;

    for (const modelOption of MODELS_TO_TRY) {
        const apiUrl = "/api/ai/chat";

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelOption.id,
                    provider: modelOption.provider,
                    messages: apiMessages
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || errData.error || `API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "No analysis generated.";
        } catch (error: any) {
            console.error(`AI Analysis failed with model ${modelOption.id}:`, error);
            lastError = error;
            // Loop continues to next model
        }
    }

    throw new Error(`All fallback models failed. Last error: ${lastError?.message || 'Unknown error'}`);
}
