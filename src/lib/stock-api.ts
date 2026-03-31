import YahooFinance from 'yahoo-finance2';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);

const yahooFinance = new YahooFinance({
    logger: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, dir: () => { } },
});

export interface StockRecommendation {
    epochGradeDate: string;
    firm: string;
    toGrade: string;
    fromGrade: string;
    action: string;
    targetPrice?: number;
}

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
    recommendations?: StockRecommendation[];
    targetPrice?: number;
    targetHigh?: number;
    targetLow?: number;
    targetMean?: number;
    consensus?: {
        strongBuy: number;
        buy: number;
        hold: number;
        sell: number;
        strongSell: number;
        recommendationKey?: string;
    };
    logoUrl?: string;
    currency?: string;
}

export interface HistoricalDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface StockProfile {
    symbol: string;
    ipoDate?: string;
    ceo?: string;
    fullTimeEmployees?: string;
    sector?: string;
    industry?: string;
    country?: string;
    exchange?: string;
    description?: string;
}

export interface CalendarEvent {
    type: 'Earnings' | 'Dividend' | 'Split' | 'Other';
    date: string;
    title: string;
    symbol?: string;
    description?: string;
    value?: string;
}

import { getRealTimeQuote, getBatchRealTimeQuotes } from './alpaca';

export async function getStockQuote(symbol: string): Promise<StockData | null> {
    try {
        const quote = await yahooFinance.quote(symbol);
        if (!quote) {
            console.warn(`No quote found for ${symbol}`);
            return null;
        }

        const data: StockData = {
            symbol: quote.symbol,
            price: quote.regularMarketPrice ?? 0,
            change: quote.regularMarketChange ?? 0,
            changePercent: quote.regularMarketChangePercent ?? 0,
            name: symbol === 'BZ=F' ? 'Brent Crude Oil' : (quote.shortName || quote.longName || symbol),
            marketCap: quote.marketCap,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            trailingPE: quote.trailingPE,
            dividendYield: quote.dividendYield,
            eps: quote.epsTrailingTwelveMonths,
            logoUrl: await getStockLogo(symbol),
            currency: quote.currency || 'USD',
        };

        const hasAlpacaKeys = process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY;
        if (hasAlpacaKeys && !symbol.startsWith('^') && !symbol.includes('=') && !symbol.includes('-')) {
            const alpacaData = await getRealTimeQuote(symbol);
            if (alpacaData) {
                data.price = alpacaData.price;
                data.change = alpacaData.change;
                data.changePercent = alpacaData.changePercent;
            }
        }

        return data;
    } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return null;
    }
}

export async function getStockHistory(
    symbol: string,
    from?: string,
    to?: string,
    interval: '1m' | '5m' | '15m' | '30m' | '60m' | '1h' | '1d' | '1wk' | '1mo' = '1d'
): Promise<HistoricalDataPoint[]> {
    try {
        const today = new Date();
        const period1 = from ? from : '2024-01-01'; // Default or provided start

        let period2Date = new Date();
        if (to) {
            period2Date = new Date(to);
        }

        const period2 = to ? to : today.toISOString().split('T')[0];

        const result = await yahooFinance.chart(symbol, {
            period1: period1,
            period2: period2,
            interval: interval,
        });

        return result.quotes
            .filter(item => item.close !== null && item.close !== undefined)
            .map((item) => {
                const dateStr = interval === '1d' || interval === '1wk' || interval === '1mo'
                    ? item.date.toISOString().split('T')[0]
                    : item.date.toISOString();

                return {
                    date: dateStr,
                    open: item.open as number,
                    high: item.high as number,
                    low: item.low as number,
                    close: item.close as number,
                    volume: item.volume as number,
                };
            });
    } catch (error) {
        console.error(`Failed to fetch history for ${symbol}:`, error);
        return [];
    }
}

export async function getBatchStockQuotes(symbols: string[]): Promise<StockData[]> {
    if (!symbols || symbols.length === 0) return [];

    let alpacaResults: any[] = [];
    const hasAlpacaKeys = process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY;

    if (hasAlpacaKeys) {
        // Only try Alpaca for stocks (avoiding indices or cryptos for now unless we scale)
        const alpacaSymbols = symbols.filter(s => !s.startsWith('^') && !s.includes('=') && !s.includes('-'));
        if (alpacaSymbols.length > 0) {
            alpacaResults = await getBatchRealTimeQuotes(alpacaSymbols);
        }
    }

    const alpacaMap = new Map(alpacaResults.map(r => [r.symbol, r]));

    // Fetch from Yahoo for everything not fulfilled by Alpaca or which needs extra info (like name/marketCap)
    const promises = symbols.map(async (sym) => {
        const alpacaData = alpacaMap.get(sym.toUpperCase().split('.')[0]);
        const yahooData = await getStockQuote(sym);
        
        if (!yahooData) return null;

        if (alpacaData) {
            return {
                ...yahooData,
                price: alpacaData.price,
                change: alpacaData.change,
                changePercent: alpacaData.changePercent,
            };
        }
        return yahooData;
    });

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
                open: item.open as number,
                high: item.high as number,
                low: item.low as number,
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

        const quotes = result.quotes.filter((q: any) => q.close !== null && q.close !== undefined);
        if (quotes.length === 0) return null;

        const latest = quotes[quotes.length - 1];

        if (latest.close === null || latest.close === undefined) return null; 

        let currentPrice = latest.close as number;

        const hasAlpacaKeys = process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY;
        if (hasAlpacaKeys && !symbol.startsWith('^') && !symbol.includes('=') && !symbol.includes('-')) {
            const alpacaData = await getRealTimeQuote(symbol);
            if (alpacaData) {
                currentPrice = alpacaData.price;
            }
        }

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
        const result = await yahooFinance.search(symbol, { newsCount: 10 }, { validateResult: false }) as any;
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

export interface RecommendationData {
    recommendations: StockRecommendation[];
    targetPrice?: number;
    targetHigh?: number;
    targetLow?: number;
    targetMean?: number;
    consensus?: {
        strongBuy: number;
        buy: number;
        hold: number;
        sell: number;
        strongSell: number;
        recommendationKey?: string;
    }
}

export async function getStockRecommendations(symbol: string): Promise<RecommendationData> {
    // Currencies, cryptos, and indices don't have recommendations/analyst target data
    if (symbol.endsWith('=X') || symbol.startsWith('^') || symbol.endsWith('=F') || symbol.includes('-USD') || symbol.includes('-EUR')) {
        return { recommendations: [] };
    }

    try {
        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ['upgradeDowngradeHistory', 'financialData', 'recommendationTrend']
        });

        if (!result) return { recommendations: [] };

        const history = result.upgradeDowngradeHistory?.history || [];
        const recommendations = history.map((rec: any) => ({
            epochGradeDate: rec.epochGradeDate instanceof Date ? rec.epochGradeDate.toISOString() : rec.epochGradeDate,
            firm: rec.firm,
            toGrade: rec.toGrade,
            fromGrade: rec.fromGrade,
            action: rec.action,
            targetPrice: rec.currentPriceTarget,
        }));

        let consensus = undefined;
        if (result.recommendationTrend?.trend && result.recommendationTrend.trend.length > 0) {
            const currentTrend = result.recommendationTrend.trend[0];
            consensus = {
                strongBuy: currentTrend.strongBuy || 0,
                buy: currentTrend.buy || 0,
                hold: currentTrend.hold || 0,
                sell: currentTrend.sell || 0,
                strongSell: currentTrend.strongSell || 0,
                recommendationKey: result.financialData?.recommendationKey,
            };
        }

        return {
            recommendations,
            targetPrice: result.financialData?.targetMeanPrice,
            targetHigh: result.financialData?.targetHighPrice,
            targetLow: result.financialData?.targetLowPrice,
            targetMean: result.financialData?.targetMeanPrice,
            consensus,
        };
    } catch (error) {
        console.error(`Failed to fetch recommendations for ${symbol}:`, error);
        return { recommendations: [] };
    }
}

export async function getStockProfile(symbol: string): Promise<StockProfile | null> {
    try {
        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ['assetProfile', 'defaultKeyStatistics', 'price', 'quoteType', 'summaryDetail']
        });

        if (!result) return null;

        const profile = result.assetProfile;
        const stats = result.defaultKeyStatistics;
        const price = result.price;
        const quoteType = result.quoteType;
        const summaryDetail = result.summaryDetail;

        // Fetch chart meta to get firstTradeDate reliably
        const chartResult = await yahooFinance.chart(symbol, { period1: '2024-01-01' }).catch(() => null);
        const firstTradeDate = chartResult?.meta?.firstTradeDate;

        const ceo = profile?.companyOfficers?.[0]?.name;

        // Format employees to "3.6k" format
        let employees = "N/A";
        if (profile?.fullTimeEmployees) {
            if (profile.fullTimeEmployees >= 1000) {
                employees = `${(profile.fullTimeEmployees / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
            } else {
                employees = profile.fullTimeEmployees.toString();
            }
        }

        // Try multiple sources for IPO Date (First Trade Date)
        const ipoSource = firstTradeDate || stats?.firstTradeDate || quoteType?.firstTradeDate || summaryDetail?.firstTradeDate;
        let formattedIpoDate = undefined;

        if (ipoSource) {
            const rawDate = (ipoSource as any).raw !== undefined ? (ipoSource as any).raw : ipoSource;
            const date = new Date(rawDate); // Chart meta usually returns a proper ISO or Date
            if (!isNaN(date.getTime())) {
                formattedIpoDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            }
        }

        return {
            symbol: symbol,
            ipoDate: formattedIpoDate,
            ceo: ceo,
            fullTimeEmployees: employees,
            sector: profile?.sector,
            industry: profile?.industry,
            country: profile?.country,
            exchange: price?.exchangeName,
            description: profile?.longBusinessSummary
        };
    } catch (error) {
        console.error(`Failed to fetch profile for ${symbol}:`, error);
        return null;
    }
}

const API_NINJAS_KEY = 'RsIIb36UUWDJcfx9ZeO0vTjxduMJcwCOXnxTbiLh';

export async function getStockLogo(symbol: string): Promise<string | undefined> {
    // Skip indices (starting with ^) as they don't have logos and cause API errors
    if (symbol.startsWith('^')) {
        return undefined;
    }
    const cleanSymbol = symbol.split('.')[0].split('-')[0].split('=')[0].toUpperCase();
    const logoDir = path.join(process.cwd(), 'public', 'logos');
    const logoPath = path.join(logoDir, `${cleanSymbol}.png`);
    const noLogoPath = path.join(logoDir, `${cleanSymbol}.no-logo`);
    const publicUrl = `/logos/${cleanSymbol}.png`;

    // Ensure directory exists
    if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
    }

    // 1. Check if cached (either found or confirmed not found)
    if (fs.existsSync(logoPath)) {
        return publicUrl;
    }
    if (fs.existsSync(noLogoPath)) {
        return undefined;
    }

    // 2. Not cached, try fetching from API Ninjas
    try {
        console.log(`Fetching logo for ${cleanSymbol} from API Ninjas...`);
        const response = await fetch(`https://api.api-ninjas.com/v1/logo?ticker=${cleanSymbol}`, {
            headers: { 'X-Api-Key': API_NINJAS_KEY }
        });

        if (!response.ok) throw new Error(`API Ninjas error: ${response.statusText}`);

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0 && data[0].image) {
            const imageUrl = data[0].image;

            // Download and save
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) throw new Error(`Failed to download logo image: ${imageResponse.statusText}`);

            const buffer = Buffer.from(await imageResponse.arrayBuffer());
            fs.writeFileSync(logoPath, buffer);

            console.log(`Saved logo for ${cleanSymbol} to ${logoPath}`);
            return publicUrl;
        } else {
            // Mark as not found to avoid future API calls
            fs.writeFileSync(noLogoPath, '');
            console.log(`No logo found for ${cleanSymbol}, marked in cache to avoid redundant calls.`);
        }
    } catch (error) {
        console.error(`Failed to fetch or save logo for ${cleanSymbol}:`, error);
        // We don't mark as .no-logo here in case it was a temporary network error
    }

    return undefined;
}

export async function getStockCalendar(symbol: string): Promise<CalendarEvent[]> {
    try {
        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ['calendarEvents', 'defaultKeyStatistics', 'summaryDetail', 'upgradeDowngradeHistory', 'earnings']
        });

        const events: CalendarEvent[] = [];

        // 1. Earnings
        if (result.calendarEvents?.earnings) {
            const e = result.calendarEvents.earnings;
            if (e.earningsDate && e.earningsDate.length > 0) {
                e.earningsDate.forEach((date: Date) => {
                    events.push({
                        type: 'Earnings',
                        date: date.toISOString(),
                        title: 'Earnings Call / Report',
                        description: `Estimated EPS: ${e.earningsAverage || 'N/A'}. Market usually reacts strongly to this report.`,
                        value: e.earningsAverage?.toString()
                    });
                });
            }
        }

        // 2. Earnings Guidance from earnings module
        if (result.earnings?.earningsChart?.earningsDate?.[0]) {
            const date = result.earnings.earningsChart.earningsDate[0];
            const alreadyIn = events.find(e => e.type === 'Earnings' && new Date(e.date).getTime() === date.getTime());
            if (!alreadyIn) {
                events.push({
                    type: 'Earnings',
                    date: date.toISOString(),
                    title: 'Upcoming Earnings Release',
                    description: 'Scheduled disclosure of quarterly profits and revenue guidance.'
                });
            }
        }

        // 3. Ex-Dividend
        if (result.calendarEvents?.exDividendDate) {
            events.push({
                type: 'Dividend',
                date: result.calendarEvents.exDividendDate.toISOString(),
                title: 'Ex-Dividend Date',
                description: 'Last day to buy shares to be entitled to the next dividend payment.'
            });
        }

        // 4. Dividends from summaryDetail
        const divDate = result.summaryDetail?.exDividendDate;
        if (divDate && divDate > new Date()) {
             if (!events.find(e => e.type === 'Dividend' && e.date === divDate.toISOString())) {
                 events.push({
                     type: 'Dividend',
                     date: divDate.toISOString(),
                     title: 'Dividend Payout Milestone',
                     description: 'Expected date for dividend entitlement adjustment.'
                 });
             }
        }

        // 5. Analyst Recommendation Changes (M&A and Guidance are often hidden here)
        if (result.upgradeDowngradeHistory?.history) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentRecs = result.upgradeDowngradeHistory.history
                .filter((r: any) => new Date(r.epochGradeDate).getTime() >= thirtyDaysAgo.getTime())
                .slice(0, 5); // Take last 5 most recent

            recentRecs.forEach((rec: any) => {
                events.push({
                    type: 'Other',
                    date: new Date(rec.epochGradeDate).toISOString(),
                    title: `Analyst Change: ${rec.firm}`,
                    description: `Revised to ${rec.toGrade} (from ${rec.fromGrade}). This reflects institutional sentiment changes.`
                });
            });
        }

        // 6. Split Check (historical or upcoming)
        const stats = result.defaultKeyStatistics;
        const lastSplitDate = stats?.lastSplitDate;
        if (lastSplitDate && stats) {
            const splitDate = new Date(lastSplitDate);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            if (splitDate >= oneMonthAgo) {
                 events.push({
                    type: 'Split',
                    date: splitDate.toISOString(),
                    title: `Stock Split: ${stats.lastSplitFactor}`,
                    description: 'Recent stock split executed. Price and share count been adjusted accordingly.'
                 });
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return events
            .filter(e => new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
        console.error(`Failed to fetch calendar for ${symbol}:`, error);
        return [];
    }
}

export async function getBatchStockCalendar(symbols: string[]): Promise<CalendarEvent[]> {
    if (!symbols || symbols.length === 0) return [];
    
    // Limits to unique symbols
    const uniqueSymbols = Array.from(new Set(symbols.map(s => s.toUpperCase())));
    
    const promises = uniqueSymbols.map(async (symbol) => {
        const events = await getStockCalendar(symbol);
        return events.map(e => ({ ...e, symbol }));
    });
    
    const results = await Promise.all(promises);
    const flattened = results.flat();
    
    return flattened.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
