
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({
    logger: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, dir: () => { } },
});

async function main() {
    const symbol = 'NVDA';
    console.log(`Fetching performance data for ${symbol}...`);

    try {
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        const result = await yf.chart(symbol, {
            period1: startDate.toISOString(),
            interval: '1d',
        });

        const quotes = result.quotes;
        console.log(`Fetched ${quotes.length} daily bars.`);

        if (quotes.length === 0) return;

        const latest = quotes[quotes.length - 1]; // Closest to now
        const currentPrice = latest.close as number;
        const latestDate = new Date(latest.date);

        console.log(`Latest (${latestDate.toISOString().split('T')[0]}): ${currentPrice}`);

        // Helper to find quote X days/months ago
        const findQuoteAgo = (daysAgo: number) => {
            const targetDate = new Date(latestDate);
            targetDate.setDate(targetDate.getDate() - daysAgo);

            // Find quote with date <= targetDate
            // We iterate backwards
            for (let i = quotes.length - 1; i >= 0; i--) {
                const d = new Date(quotes[i].date);
                if (d <= targetDate) {
                    console.log(`Found reference for ${daysAgo} days ago: ${d.toISOString().split('T')[0]} (Target: ${targetDate.toISOString().split('T')[0]})`);
                    return quotes[i];
                }
            }
            return quotes[0]; // Fallback to earliest
        };

        const q1d = quotes.length >= 2 ? quotes[quotes.length - 2] : quotes[0]; // Previous trading day
        const q5d = findQuoteAgo(5);
        const q1m = findQuoteAgo(30);
        const q6m = findQuoteAgo(180);

        const calcChange = (oldQ: any) => {
            if (!oldQ || !oldQ.close) return { price: 0, change: 0, percent: 0 };
            const change = currentPrice - (oldQ.close as number);
            const percent = (change / (oldQ.close as number)) * 100;
            return { price: oldQ.close, change, percent };
        }

        console.log('1d:', calcChange(q1d));
        console.log('5d:', calcChange(q5d));
        console.log('1m:', calcChange(q1m));
        console.log('6m:', calcChange(q6m));

    } catch (e) {
        console.error(e);
    }
}

main();
