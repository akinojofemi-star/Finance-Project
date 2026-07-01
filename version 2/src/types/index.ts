export interface Quote {
    c: number; // Current price
    d: number; // Change
    dp: number; // Percent change
    h: number; // High price of the day
    l: number; // Low price of the day
    o: number; // Open price of the day
    pc: number; // Previous close price
}

export interface NewsArticle {
    category: string;
    datetime: number;
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}

export interface HistoryData {
    timestamps: number[];
    closes: number[];
}

export interface SearchResult {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
}

export interface CompanyProfile {
    marketCapitalization: number;
    shareOutstanding: number;
    finnhubIndustry: string;
    weburl: string;
}

export interface CompanyMetrics {
    '52WeekHigh': number;
    '52WeekLow': number;
    'peExclExtraTTM': number;
    'beta': number;
    '10DayAverageTradingVolume': number;
}
