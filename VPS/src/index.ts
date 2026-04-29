import Alpaca from '@alpacahq/alpaca-trade-api';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// El SDK de Alpaca busca automáticamente APCA_API_KEY_ID y APCA_API_SECRET_KEY en el entorno
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: true,
  feed: process.env.ALPACA_FEED || 'iex'
});

const SYMBOLS = (process.env.SYMBOLS || 'AAPL,MSFT,GOOGL')
  .split(',')
  .map(s => s.trim())
  .filter(s => s.length > 0);

async function startTunnel() {
  console.log('--- 🚀 INICIANDO TÚNEL ---');
  console.log('📈 Símbolos:', SYMBOLS.join(', '));

  const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  await redisClient.connect();
  console.log('✅ Redis conectado');

  const stream = alpaca.data_stream_v2;

  stream.onError((err: any) => console.error('❌ Error Stream:', err));

  stream.connect();

  stream.onConnect(() => {
    console.log('✅ Conectado a Alpaca WebSocket');
    stream.subscribeForTrades(SYMBOLS);
    stream.subscribeForQuotes(SYMBOLS); // 👈 Añadimos esto para ver más movimiento
  });

  stream.onStockTrade(async (trade: any) => {
    await redisClient.set(`stock:${trade.Symbol}`, trade.Price.toString());
    console.log(`💰 TRADE ${trade.Symbol}: $${trade.Price}`);
  });

  stream.onStockQuote(async (quote: any) => {
    // Usamos el precio medio entre Bid y Ask como precio actual
    const midPrice = (quote.BidPrice + quote.AskPrice) / 2;
    await redisClient.set(`stock:${quote.Symbol}`, midPrice.toFixed(2));
    console.log(` price_change ${quote.Symbol}: $${midPrice.toFixed(2)}`);
  });

}

startTunnel().catch(console.error);
