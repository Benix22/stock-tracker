
import { getIntradayData } from '../src/lib/stock-api';

async function main() {
    console.log('Testing getIntradayData...');
    const symbol = 'NVDA';
    const result = await getIntradayData(symbol);

    if (!result) {
        console.error('No result returned');
        return;
    }

    console.log(`Fetched ${result.data.length} data points`);
    console.log(`Previous close: ${result.previousClose}`);

    if (result.data.length > 0) {
        const first = result.data[0];
        const last = result.data[result.data.length - 1];
        console.log('First point:', first);
        console.log('Last point:', last);

        const firstDate = new Date(first.date);
        const lastDate = new Date(last.date);

        console.log('Start Time (Local):', firstDate.toLocaleString());
        console.log('End Time (Local):', lastDate.toLocaleString());

        // Verify if they are on same day
        if (firstDate.toDateString() !== lastDate.toDateString()) {
            console.warn('WARNING: Data spans multiple days!');
        } else {
            console.log('SUCCESS: Data is within a single day.');
        }
    }
}

main();
