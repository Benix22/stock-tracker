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
const symbolSubscriberCount = new Map<string, number>();
const socketSubscriptions = new Map<string, Set<string>>();

// Inicializamos el contador para los símbolos base
// Los base nunca se desubscriben
SYMBOLS_LIST.forEach(s => symbolSubscriberCount.set(s, Infinity));

/**
 * Filtra símbolos que Alpaca no soporta en su stream de acciones (US Stocks).
 * Alpaca no soporta índices (^GSPC), Forex (EUR=X), ni stocks internacionales (.MC).
 */
function isAlpacaSymbol(symbol: string): boolean {
  const s = symbol.toUpperCase();
  if (s.startsWith('^')) return false; // Índices
  if (s.includes('=')) return false;   // Forex / Commodities
  if (s.includes('.')) return false;   // Stocks internacionales
  if (s.includes('-')) return false;   // Formato Yahoo para Crypto (BTC-USD)
  return true;
}

async function startTunnel() {
  console.log('--- 🚀 INICIANDO TÚNEL CON WEBSOCKETS ---');
  console.log('📈 Símbolos:', SYMBOLS_LIST.join(', '));

  const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  await redisClient.connect();
  console.log('✅ Redis conectado');

  // WebSocket Connection Handler
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);
    socketSubscriptions.set(socket.id, new Set());
    
    socket.on('subscribe', (symbol: string) => {
      const upperSymbol = symbol.toUpperCase();
      if (!upperSymbol) return;

      // 1. Registrar la suscripción para este socket
      const subs = socketSubscriptions.get(socket.id);
      if (subs && !subs.has(upperSymbol)) {
        subs.add(upperSymbol);

        // 2. Incrementar el contador global de interesados
        const currentCount = symbolSubscriberCount.get(upperSymbol) || 0;
        symbolSubscriberCount.set(upperSymbol, currentCount + 1);

        // 3. Si es el primero, suscribir en Alpaca (solo si es un símbolo compatible)
        if (!activeSymbols.has(upperSymbol)) {
          activeSymbols.add(upperSymbol);
          
          if (isAlpacaSymbol(upperSymbol)) {
            console.log(`➕ [Dynamic] Suscribiendo a Alpaca: ${upperSymbol}`);
            const currentSymbols = Array.from(activeSymbols).filter(isAlpacaSymbol);
            stream.subscribeForTrades(currentSymbols);
            stream.subscribeForQuotes(currentSymbols);
          } else {
            console.log(`ℹ️ [Dynamic] Símbolo no compatible con Alpaca Stream: ${upperSymbol} (se usará polling en el cliente)`);
          }
        }
      }
    });

    socket.on('unsubscribe', (symbol: string) => {
      const upperSymbol = symbol.toUpperCase();
      handleUnsubscribe(socket.id, upperSymbol);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
      const subs = socketSubscriptions.get(socket.id);
      if (subs) {
        subs.forEach(symbol => handleUnsubscribe(socket.id, symbol));
        socketSubscriptions.delete(socket.id);
      }
    });
  });

  function handleUnsubscribe(socketId: string, symbol: string) {
    const subs = socketSubscriptions.get(socketId);
    if (!subs || !subs.has(symbol)) return;

    subs.delete(symbol);
    const currentCount = symbolSubscriberCount.get(symbol) || 0;
    
    if (currentCount !== Infinity && currentCount > 0) {
      const newCount = currentCount - 1;
      symbolSubscriberCount.set(symbol, newCount);

      // Si ya nadie está interesado, desubscribir de Alpaca
      if (newCount === 0 && activeSymbols.has(symbol)) {
        console.log(`➖ [Dynamic] Desubscribiendo de Alpaca: ${symbol} (sin interesados)`);
        activeSymbols.delete(symbol);
        
        // Alpaca SDK: Usamos unsubscribe para quitar solo este (si era compatible)
        if (isAlpacaSymbol(symbol)) {
          stream.unsubscribeFromTrades([symbol]);
          stream.unsubscribeFromQuotes([symbol]);
        }
      }
    }
  }

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
    const initialSymbols = Array.from(activeSymbols).filter(isAlpacaSymbol);
    if (initialSymbols.length > 0) {
      stream.subscribeForTrades(initialSymbols);
      stream.subscribeForQuotes(initialSymbols);
    }
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
