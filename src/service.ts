import {fetchCurrentSummary} from "./api";
import {db} from "./db";
import {BadRequestException, InternalServerException} from "./exception";

// Test environment variables
const REQ_CACHE_MINUTES = Bun.env.REQ_CACHE_MINUTES ? parseInt(Bun.env.REQ_CACHE_MINUTES) : 60;

let lastSummary: any = null;
let lastFetched = 0;
export const getCurrentData = async () => {
    const now = Date.now();
    if (!lastSummary || now - lastFetched > REQ_CACHE_MINUTES * 60 * 1000) {
        lastSummary = await fetchCurrentSummary();
        lastFetched = now;
    }
    return lastSummary;
}

export const getDailyData = async (dateParam: string) => {
    let date = dateParam;

    if (date=='yesterday')
        date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Basic ISO date format check (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');

    try {
        return db.query('SELECT * FROM lifetime_data WHERE date = ?').get(date);
    } catch (err) {
        console.error('[DB Error] Failed to retrieve daily data:', err);
        throw new InternalServerException('Failed to query database');
    }
}

export const getLifeTimeData = async () => {
    try {
        return db.query('SELECT * FROM lifetime_data').all();
    } catch (err) {
        console.error('[DB Error] Failed to retrieve data:', err);
        throw new InternalServerException('Failed to query database');
    }
}
