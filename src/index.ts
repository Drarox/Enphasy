import { Hono } from 'hono';
import { fetchCurrentSummary } from './api';
import { startCrons } from './cron';
import { db, testDbConnection } from './db';

const app = new Hono();

// Test environment variables
const REQ_CACHE_MINUTES = Bun.env.REQ_CACHE_MINUTES ? parseInt(Bun.env.REQ_CACHE_MINUTES) : 60;

const requiredVars = [
  'ENPHASE_API_KEY',
  'ENPHASE_BASIC_AUTH',
  'SYSTEM_ID'
];

const missing = requiredVars.filter((name) => !Bun.env[name]);

if (missing.length > 0) {
  console.error('[ENV Error] Missing required environment variables:', missing.join(', '));
  process.exit(1); // fatal exit
}

// Test DB connection before proceeding
if (!testDbConnection()) {
  console.error('[Fatal] Aborting startup due to database connection failure.');
  process.exit(1);
}

// Routes
// Health check
app.get('/', (c) => c.text('Server is running'));

// Public endpoint: Cached Enphase data
let lastSummary: any = null;
let lastFetched = 0;
app.get('/current', async (c) => {
  try {
    const now = Date.now();
    if (!lastSummary || now - lastFetched > REQ_CACHE_MINUTES * 60 * 1000) {
      lastSummary = await fetchCurrentSummary();
      lastFetched = now;
    }
    return c.json(lastSummary);
  } catch (err) {
    console.error('[API Error] /current fetch failed:', err);
    return c.json({ error: 'Failed to fetch data' }, 500);
  }
});

// Lifetime data by date
app.get('/daily/:date', (c) => {
  let date = c.req.param('date');

  if (date=='yesterday')
    date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Basic ISO date format check (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, 400);
  }

  try {
    const row = db.query('SELECT * FROM lifetime_data WHERE date = ?').get(date);
    return row ? c.json(row) : c.notFound();
  } catch (err) {
    console.error('[DB Error] Failed to retrieve daily data:', err);
    return c.json({ error: 'Failed to query database' }, 500);
  }
});

// Lifetime data
app.get('/lifetime', (c) => {
  try {
    const rows = db.query('SELECT * FROM lifetime_data').all();
    return rows ? c.json(rows) : c.notFound();
  } catch (err) {
    console.error('[DB Error] Failed to retrieve data:', err);
    return c.json({ error: 'Failed to query database' }, 500);
  }
});

// Start cron jobs
startCrons();

// Secure export (port from env fallback)
export default {
  port: Bun.env.PORT ? Number(Bun.env.PORT) : 3000,
  fetch: app.fetch,
};
