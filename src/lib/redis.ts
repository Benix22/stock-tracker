import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

const globalForRedis = global as unknown as { redisClient: ReturnType<typeof createClient> | undefined };

export const getRedisClient = async () => {
    if (!redisUrl) return null;

    if (!globalForRedis.redisClient) {
        globalForRedis.redisClient = createClient({ url: redisUrl });
        globalForRedis.redisClient.on('error', (err) => console.error('Redis Client Error', err));
        await globalForRedis.redisClient.connect();
    } else if (!globalForRedis.redisClient.isOpen) {
        await globalForRedis.redisClient.connect();
    }

    return globalForRedis.redisClient;
};

export async function getStockPriceFromRedis(symbol: string): Promise<number | null> {
    try {
        const client = await getRedisClient();
        if (!client) return null;

        const cleanSymbol = symbol.toUpperCase().split('.')[0];
        
        // Add a timeout to prevent blocking page load if VPS is slow
        const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Redis Timeout')), 800)
        );
        
        const value = await Promise.race([
            client.get(`stock:${cleanSymbol}`),
            timeoutPromise
        ]);
        
        return value ? parseFloat(value) : null;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(`Redis fetch for ${symbol} timed out or failed:`, msg);
        return null;
    }
}

export async function getBatchStockPricesFromRedis(symbols: string[]): Promise<Record<string, number>> {
    try {
        const client = await getRedisClient();
        if (!client) return {};

        const results: Record<string, number> = {};
        const keys = symbols.map(s => `stock:${s.toUpperCase().split('.')[0]}`);
        
        if (keys.length === 0) return {};

        // Add a timeout for the batch operation
        const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Redis Timeout')), 1200)
        );

        const values = await Promise.race([
            client.mGet(keys),
            timeoutPromise
        ]);
        
        if (!values) return {};

        symbols.forEach((symbol, index) => {
            const val = (values as any)[index];
            if (val) {
                results[symbol.toUpperCase()] = parseFloat(val);
            }
        });

        return results;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn('Redis batch fetch timed out or failed:', msg);
        return {};
    }
}
