import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({
    logger: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, dir: () => { } },
});

export interface StockData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    name: string;
    marketCap?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    trailingPE?: number;
    dividendYield?: number;
    eps?: number;
}

export interface HistoricalDataPoint {
    date: string;
    close: number;
    volume?: number;
}

export async function getStockQuote(symbol: string): Promise<StockData | null> {
    try {
        const quote = await yahooFinance.quote(symbol);
        if (!quote) {
            console.warn(`No quote found for ${symbol}`);
            return null;
        }
        return {
            symbol: quote.symbol,
            price: quote.regularMarketPrice ?? 0,
            change: quote.regularMarketChange ?? 0,
            changePercent: quote.regularMarketChangePercent ?? 0,
            name: quote.shortName || quote.longName || symbol,
            marketCap: quote.marketCap,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            trailingPE: quote.trailingPE,
            dividendYield: quote.dividendYield,
            eps: quote.epsTrailingTwelveMonths,
        };
    } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return null;
    }
}

export async function getStockHistory(symbol: string, from?: string, to?: string): Promise<HistoricalDataPoint[]> {
    try {
        const today = new Date();
        const period1 = from ? from : '2024-01-01'; // Default or provided start

        let period2Date = new Date();
        if (to) {
            period2Date = new Date(to);
        }

        const period2 = to ? to : today.toISOString().split('T')[0];

        const result = await yahooFinance.historical(symbol, {
            period1: period1,
            period2: period2,
            interval: '1d',
        });

        return result.map((item) => ({
            date: item.date.toISOString().split('T')[0],
            close: item.close,
            volume: item.volume,
        }));
    } catch (error) {
        console.error(`Failed to fetch history for ${symbol}:`, error);
        return [];
    }
}

export async function getBatchStockQuotes(symbols: string[]): Promise<StockData[]> {
    if (!symbols || symbols.length === 0) return [];

    // Yahoo-finance2 quote can typically handle single requests. 
    // We will use Promise.all which is standard for concurrent internal fetching.
    const promises = symbols.map(id => getStockQuote(id));
    const results = await Promise.all(promises);
    return results.filter((q): q is StockData => q !== null);
}


export interface IntradayResult {
    data: HistoricalDataPoint[];
    previousClose: number;
    previousCloseDate?: string;
}

export async function getIntradayData(symbol: string): Promise<IntradayResult | null> {
    try {
        const today = new Date();
        const period1 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        const result = await yahooFinance.chart(symbol, {
            period1: period1.toISOString(),
            interval: '1m',
            includePrePost: false, // Only regular market hours
        });

        // The API returns tradingPeriods, which is an array of arrays of sessions.
        // We want the last session that has data.

        // Flatten the trading periods to find the last valid session end time
        // However, yahoo-finance2 chart result 'quotes' are flat.
        // We just need to separate them by day/session gap.
        // A simple heuristic is: if time difference > 2 hours, it's a new session.
        // But we have result.meta.tradingPeriods!

        // Let's rely on finding the last quote, identifying its date, and filtering for that date.
        // Note: Timestamps in quotes are sometimes UTC, sometimes local. 
        // Best reliance is to look at the date string part.

        const lastQuote = result.quotes[result.quotes.length - 1];
        const lastQuoteDateStr = lastQuote.date.toISOString().split('T')[0];

        // Filter for quotes that fall on the same calendar day (UTC) as the last quote
        // This generally works well for US markets which don't span UTC midnight often in a way that breaks this simple check for 'regular' hours.
        // For strict correctness with tradingPeriods:
        // We can simply take all quotes that belong to the "latest day" found in the dataset.

        const currentSessionQuotes = result.quotes.filter(q =>
            q.date.toISOString().split('T')[0] === lastQuoteDateStr
        );

        // Calculate previous close:
        // It's the close of the *previous* session in the data.
        // Find the last quote that is NOT on the lastQuoteDateStr.
        let previousClose = result.meta.chartPreviousClose || result.meta.previousClose || 0;
        let previousCloseDate: string | undefined = undefined;

        const previousSessionQuotes = result.quotes.filter(q =>
            q.date.toISOString().split('T')[0] !== lastQuoteDateStr
        );

        if (previousSessionQuotes.length > 0) {
            const lastPrevQuote = previousSessionQuotes[previousSessionQuotes.length - 1];
            previousClose = lastPrevQuote.close as number;
            previousCloseDate = lastPrevQuote.date.toISOString();
        }

        const data = currentSessionQuotes
            .filter(q => q.close) // Filter nulls
            .map((item) => ({
                date: item.date.toISOString(),
                close: item.close as number,
                volume: item.volume as number,
            }));

        return {
            data,
            previousClose,
            previousCloseDate
        };
    } catch (error) {
        console.warn(`Intraday fetch failed for ${symbol}`, error);
        return null;
    }
}

export interface PerformanceMetric {
    price: number;
    change: number;
    percent: number;
}

export interface StockPerformance {
    currentPrice: number;
    perf1d: PerformanceMetric;
    perf5d: PerformanceMetric;
    perf1m: PerformanceMetric;
    perf6m: PerformanceMetric;
}

export async function getStockPerformance(symbol: string): Promise<StockPerformance | null> {
    try {
        const today = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1); // 1 year ago

        const result = await yahooFinance.chart(symbol, {
            period1: startDate.toISOString(),
            interval: '1d',
        });

        if (!result || !result.quotes || result.quotes.length === 0) return null;

        const quotes = result.quotes;
        const latest = quotes[quotes.length - 1];

        if (!latest.close) return null; // Should ideally check earlier

        const currentPrice = latest.close as number;
        const latestDate = new Date(latest.date);

        const findQuoteAgo = (daysAgo: number) => {
            const targetDate = new Date(latestDate);
            targetDate.setDate(targetDate.getDate() - daysAgo);

            for (let i = quotes.length - 1; i >= 0; i--) {
                const d = new Date(quotes[i].date);
                if (d <= targetDate) {
                    return quotes[i];
                }
            }
            return quotes[0];
        };

        const calcChange = (oldQ: any): PerformanceMetric => {
            if (!oldQ || typeof oldQ.close !== 'number') return { price: 0, change: 0, percent: 0 };
            const oldPrice = oldQ.close as number;
            const change = currentPrice - oldPrice;
            const percent = (change / oldPrice) * 100;
            return { price: oldPrice, change, percent };
        }

        const q1d = quotes.length >= 2 ? quotes[quotes.length - 2] : quotes[0];
        const q5d = findQuoteAgo(5);
        const q1m = findQuoteAgo(30);
        const q6m = findQuoteAgo(180);

        return {
            currentPrice,
            perf1d: calcChange(q1d),
            perf5d: calcChange(q5d),
            perf1m: calcChange(q1m),
            perf6m: calcChange(q6m),
        };

    } catch (error) {
        console.error(`Failed to fetch performance for ${symbol}:`, error);
        return null;
    }
}

export interface NewsArticle {
    uuid: string;
    title: string;
    publisher: string;
    link: string;
    providerPublishTime: string; // ISO date string
    thumbnail?: {
        resolutions: { url: string; width: number; height: number; tag: string }[];
    };
    relatedTickers?: string[];
}

export async function getStockNews(symbol: string): Promise<NewsArticle[]> {
    try {
        const result = await yahooFinance.search(symbol, { newsCount: 10 });
        return (result.news || []) as any as NewsArticle[];
    } catch (error) {
        console.error(`Failed to fetch news for ${symbol}:`, error);
        return [];
    }
}

export async function getMarketMovers(type: 'day_gainers' | 'day_losers' = 'day_gainers'): Promise<StockData[]> {
    try {
        const result = await yahooFinance.screener({ scrIds: type, count: 5 });
        return result.quotes.map((quote: any) => ({
            symbol: quote.symbol,
            price: quote.regularMarketPrice ?? 0,
            change: quote.regularMarketChange ?? 0,
            changePercent: quote.regularMarketChangePercent ?? 0,
            name: quote.shortName || quote.longName || quote.symbol,
            marketCap: quote.marketCap,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            trailingPE: quote.trailingPE,
            dividendYield: quote.dividendYield,
            eps: quote.epsTrailingTwelveMonths,
        }));
    } catch (error) {
        console.error(`Failed to fetch market movers (${type}):`, error);
        return [];
    }
}
