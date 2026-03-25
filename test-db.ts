import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const res = await sql`SELECT * FROM positions`;
  console.log(JSON.stringify(res, null, 2));
}

run().catch(console.error);
