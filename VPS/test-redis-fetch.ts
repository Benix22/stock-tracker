import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'SGHC', 'NVDA'];

async function testRedisFetch() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log('--- 🧪 PROBANDO CONEXIÓN REDIS VPS ---');
  console.log('🔗 Conectando a:', redisUrl.replace(/:[^:@]+@/, ':****@')); // Ocultar password en logs

  const client = createClient({ url: redisUrl });

  client.on('error', (err) => console.error('❌ Redis Client Error:', err));

  try {
    await client.connect();
    console.log('✅ Conexión establecida');

    console.log('\n📊 Valores actuales en Redis:');
    console.log('----------------------------');

    for (const symbol of SYMBOLS) {
      const value = await client.get(`stock:${symbol}`);
      if (value) {
        console.log(`🔹 ${symbol.padEnd(5)}: $${value}`);
      } else {
        console.log(`🔸 ${symbol.padEnd(5)}: (Sin datos aún)`);
      }
    }
    console.log('----------------------------');

    await client.disconnect();
    console.log('\n👋 Desconectado de Redis');
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

testRedisFetch();
