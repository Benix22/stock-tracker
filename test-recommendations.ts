import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({
    logger: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, dir: () => { } },
});

async function test() {
    try {
        const symbol = 'AAPL';
        const result = await yahooFinance.quoteSummary(symbol, { modules: ['upgradeDowngradeHistory'] });
        const history = result.upgradeDowngradeHistory?.history;
        if (history && history.length > 0) {
            console.log('Keys:', Object.keys(history[0]));
            console.log('Sample:', history[0]);
        }
    } catch (error) {
        console.error(error);
    }
}

test();
