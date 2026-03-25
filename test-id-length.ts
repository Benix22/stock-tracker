import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const res = await sql`SELECT user_id, length(user_id) as len FROM positions`;
  console.log(JSON.stringify(res, null, 2));
}

run().catch(console.error);
