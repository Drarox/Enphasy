import { Database } from 'bun:sqlite';

export const db = new Database('./db/enphase.sqlite');

export function testDbConnection() {
    try {
        db.prepare('SELECT 1').get();
        console.log('[DB] Connection to SQLite successful.');
        return true;
    } catch (err) {
        console.error('[DB Error] Failed to connect to SQLite database:', err);
        return false;
    }
}

try {
    db.run(`
    CREATE TABLE IF NOT EXISTS lifetime_data (
      date TEXT PRIMARY KEY,
      production INTEGER,
      consumption INTEGER,
      import INTEGER,
      export INTEGER
    )
  `);
} catch (err) {
    console.error('[DB Error] Failed to create lifetime_data table:', err);
}

try {
    db.run(`
    CREATE TABLE IF NOT EXISTS token (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      refresh_token TEXT,
      updated_at INTEGER
    )
  `);
} catch (err) {
    console.error('[DB Error] Failed to create token table:', err);
}

export function saveRefreshToken(token: string) {
    try {
        db.run(
            `INSERT OR REPLACE INTO token (id, refresh_token, updated_at) VALUES (1, ?, ?)`,
            [token, Date.now()]
        );
    } catch (err) {
        console.error('[DB Error] Failed to save refresh token:', err);
    }
}

export function getRefreshToken(): string | null {
    try {
        const row = db.query(`SELECT refresh_token FROM token WHERE id = 1`).get();
        return row?.refresh_token ?? null;
    } catch (err) {
        console.error('[DB Error] Failed to get refresh token:', err);
        return null;
    }
}
