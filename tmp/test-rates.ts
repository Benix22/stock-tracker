
import { getInterestRates } from './src/actions/trading-economics';

async function test() {
    console.log("Fetching interest rates...");
    try {
        const rates = await getInterestRates();
        console.log("Rates:", JSON.stringify(rates, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
