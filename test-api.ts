import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({
    logger: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, dir: () => { } },
});

async function test() {
    const symbol = 'AAPL';
    try {
        console.log('--- Quote ---');
        const quote = await yahooFinance.quote(symbol);
        console.log('Quote keys:', Object.keys(quote));

        console.log('--- Quote Summary (financialData) ---');
        const summary = await yahooFinance.quoteSummary(symbol, { modules: ['financialData'] });
        console.log('Financial Data:', summary.financialData);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
