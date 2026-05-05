import Alpaca from '@alpacahq/alpaca-trade-api';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // En producción deberías restringir esto al dominio de tu App
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.WS_PORT || 3001;

// El SDK de Alpaca busca automáticamente APCA_API_KEY_ID y APCA_API_SECRET_KEY en el entorno
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: true,
  feed: process.env.ALPACA_FEED || 'iex'
});

const SYMBOLS_LIST = (process.env.SYMBOLS || 'AAPL,MSFT,GOOGL,TSLA,SGHC,NVDA')
  .split(',')
  .map(s => s.trim())
  .filter(s => s.length > 0);

const activeSymbols = new Set<string>(SYMBOLS_LIST);
const priceBuffer = new Map<string, any>();

async function startTunnel() {
  console.log('--- 🚀 INICIANDO TÚNEL CON WEBSOCKETS ---');
  console.log('📈 Símbolos:', SYMBOLS_LIST.join(', '));

  const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  await redisClient.connect();
  console.log('✅ Redis conectado');

  // WebSocket Connection Handler
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);
    
    socket.on('subscribe', (symbol: string) => {
      const upperSymbol = symbol.toUpperCase();
      if (upperSymbol && !activeSymbols.has(upperSymbol)) {
        console.log(`➕ [Dynamic] Suscribiendo a: ${upperSymbol}`);
        activeSymbols.add(upperSymbol);
        
        // Actualizamos la suscripción en el stream de Alpaca
        const currentSymbols = Array.from(activeSymbols);
        stream.subscribeForTrades(currentSymbols);
        stream.subscribeForQuotes(currentSymbols);
      }
    });

    socket.on('disconnect', () => console.log(`❌ Cliente desconectado: ${socket.id}`));
  });

  // Agregación y Throttling (Paso 5 y 6 del diagrama)
  // Emitimos actualizaciones a máximo 5Hz (cada 200ms) para evitar saturar el cliente
  setInterval(() => {
    if (priceBuffer.size > 0) {
      priceBuffer.forEach((data) => {
        io.emit('price_update', data);
      });
      priceBuffer.clear();
    }
  }, 200);

  const stream = alpaca.data_stream_v2;
  stream.onError((err: any) => console.error('❌ Error Stream:', err));
  stream.connect();

  stream.onConnect(() => {
    console.log('✅ Conectado a Alpaca WebSocket');
    const initialSymbols = Array.from(activeSymbols);
    stream.subscribeForTrades(initialSymbols);
    stream.subscribeForQuotes(initialSymbols);
  });

  stream.onStockTrade(async (trade: any) => {
    const price = trade.Price;
    await redisClient.set(`stock:${trade.Symbol}`, price.toString());
    
    // Guardamos en el buffer para el throttling
    priceBuffer.set(trade.Symbol, {
      symbol: trade.Symbol,
      price: price,
      timestamp: new Date().toISOString(),
      type: 'trade'
    });
    
    // console.log(`💰 TRADE ${trade.Symbol}: $${price}`); // Reducimos logs por volumen
  });

  stream.onStockQuote(async (quote: any) => {
    const midPrice = (quote.BidPrice + quote.AskPrice) / 2;
    const price = parseFloat(midPrice.toFixed(2));
    await redisClient.set(`stock:${quote.Symbol}`, price.toString());
    
    // Guardamos en el buffer para el throttling
    priceBuffer.set(quote.Symbol, {
      symbol: quote.Symbol,
      price: price,
      timestamp: new Date().toISOString(),
      type: 'quote'
    });

    // console.log(` price_change ${quote.Symbol}: $${price}`);
  });

  httpServer.listen(PORT, () => {
    console.log(`📡 Servidor WebSocket escuchando en puerto ${PORT}`);
  });
}

startTunnel().catch(console.error);
