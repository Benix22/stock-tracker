import { getStockRecommendations } from './src/lib/stock-api';

async function verify() {
    const symbol = 'AAPL';
    try {
        console.log(`Verifying target price for ${symbol}...`);
        const result = await getStockRecommendations(symbol);
        console.log('Target Price:', result.targetPrice);
        console.log('Target High:', result.targetHigh);
        console.log('Target Low:', result.targetLow);
        console.log('Recommendations count:', result.recommendations.length);

        if (result.targetPrice !== undefined) {
            console.log('✅ Success: Target price fetched.');
        } else {
            console.log('❌ Failure: Target price is undefined.');
        }
    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
