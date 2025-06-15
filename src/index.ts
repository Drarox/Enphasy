import { Hono } from 'hono';
import { startCrons } from './cron';
import { testDbConnection } from './db';
import controller from './controller';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

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
app.route('/', controller);

// Start cron jobs
startCrons();

// Error handler
app.onError((err, c) => {
  if (err instanceof HTTPException)
    return c.json({error: err.message || 'Error ' + err.status}, err.status);

  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
})

// Secure export (port from env fallback)
export default {
  port: Bun.env.PORT ? Number(Bun.env.PORT) : 3000,
  fetch: app.fetch,
};
