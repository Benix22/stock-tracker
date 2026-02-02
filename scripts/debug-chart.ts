
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({
    logger: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, dir: () => { } },
});

async function main() {
    const symbol = 'NVDA'; // Active stock
    const period1 = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 days ago

    console.log(`Fetching data for ${symbol} since ${period1.toISOString()}`);

    try {
        const result = await yf.chart(symbol, {
            period1: period1.toISOString(),
            interval: '1m',
            includePrePost: false
        });

        console.log('Result Meta:', JSON.stringify(result.meta, null, 2));

        if (result.quotes.length > 0) {
            console.log('First Quote:', result.quotes[0]);
            console.log('Last Quote:', result.quotes[result.quotes.length - 1]);

            // Check distinctive days
            const days = new Set(result.quotes.map(q => q.date.toISOString().split('T')[0]));
            console.log('Days found:', Array.from(days));
        } else {
            console.log('No quotes found.');
        }

    } catch (e) {
        console.error(e);
    }
}

main();
