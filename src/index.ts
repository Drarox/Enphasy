import { Hono } from 'hono';
import { fetchCurrentSummary } from './api';
import { startCrons } from './cron';
import { db } from './db';

const REQ_CACHE_MINUTES = Bun.env.REQ_CACHE_MINUTES ? parseInt(Bun.env.REQ_CACHE_MINUTES) : 60;

const app = new Hono();

let lastSummary: any = null;
let lastFetched = 0;

// Health check
app.get('/', (c) => c.text('Server is running'));

// Public endpoint: Cached Enphase data
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
  const date = c.req.param('date');

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
