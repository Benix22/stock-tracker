import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({
    logger: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, dir: () => { } },
});

async function testNews() {
    try {
        console.log("Testing search for news...");
        const result = await yahooFinance.search('AAPL', { newsCount: 5 });
        console.log("search Result News:", JSON.stringify(result.news, null, 2));
    } catch (e) {
        console.error("search failed:", e);
    }
}

testNews();
