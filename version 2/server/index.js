require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Finnhub Proxy
app.get('/api/finnhub/*', async (req, res) => {
    try {
        const path = req.params[0];
        const queryParams = new URLSearchParams(req.query).toString();
        const url = `https://finnhub.io/api/v1/${path}?${queryParams}&token=${FINNHUB_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        res.json(data);
    } catch (error) {
        console.error('Finnhub proxy error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Serve React static files in production
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));

// AI Chat Proxy
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { model, messages, provider } = req.body;
        
        const isNvidia = provider === 'nvidia';
        const apiKey = isNvidia 
            ? process.env.NVIDIA_NIM_API_KEY 
            : process.env.OPENROUTER_API_KEY;

        const apiUrl = isNvidia 
            ? "https://integrate.api.nvidia.com/v1/chat/completions"
            : "https://openrouter.ai/api/v1/chat/completions";

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                messages
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        res.json(data);
    } catch (error) {
        console.error('AI chat proxy error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Catch-all route to serve React app for non-API requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
