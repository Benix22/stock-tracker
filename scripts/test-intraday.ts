import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({
    logger: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, dir: () => { } },
});

async function main() {
    console.log('Testing Intraday Data...');
    const symbol = 'NVDA';

    try {
        const result = await yf.chart(symbol, {
            period1: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            interval: '1m',
        });

        console.log(`Fetched ${result.quotes.length} data points`);
        if (result.quotes.length > 0) {
            console.log('First:', result.quotes[0]);
            console.log('Last:', result.quotes[result.quotes.length - 1]);
        }

        const meta = result.meta;
        console.log('Meta price:', meta.regularMarketPrice);

    } catch (error) {
        console.error('Failed to fetch chart:', error);
    }
}

main();
