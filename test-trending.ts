import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({
    logger: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, dir: () => { } },
});

async function testScreener() {
    try {
        console.log("Testing screener day_gainers...");
        const result = await yahooFinance.screener({ scrIds: 'day_gainers', count: 5 });
        console.log("Screener Result (Gainers) count:", result.quotes.length);
        console.log("First Gainer:", JSON.stringify(result.quotes[0], null, 2));
    } catch (e) {
        console.error("Screener failed:", e);
    }
}

testScreener();
