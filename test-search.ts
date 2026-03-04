import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
    try {
        const result = await yahooFinance.search('AAPL', { newsCount: 10 });
        console.log("News count:", result.news.length);
        console.log("Success (version updated)!");
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}
test();
