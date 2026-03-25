import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const count = await sql`SELECT count(*) FROM positions`;
  const all = await sql`SELECT * FROM positions`;
  console.log("Count:", count);
  console.log("All rows:", JSON.stringify(all, null, 2));
}

run().catch(console.error);
