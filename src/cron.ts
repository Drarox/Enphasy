import { Cron } from 'croner';
import { refreshAccessToken, fetchLifetime } from './api';
import { db } from './db';

function getDateString(start: string, index: number): string {
    const [year, month, day] = start.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day + index));
    return baseDate.toISOString().split('T')[0];
}

async function syncDailyData() {
    try {
        const [prod, cons, imp, exp] = await Promise.all([
            fetchLifetime('energy_lifetime'),
            fetchLifetime('consumption_lifetime'),
            fetchLifetime('energy_import_lifetime'),
            fetchLifetime('energy_export_lifetime'),
        ]);

        if (!prod?.production || !cons?.consumption || !imp?.import || !exp?.export) {
            console.error('[Error] Incomplete data received for lifetime sync');
            return;
        }

        const len = prod.production.length;
        console.log(`[Sync] Syncing ${len} days of lifetime data...`);

        for (let i = 0; i < len; i++) {
            const date = getDateString(prod.start_date, i);
            db.run(
                `INSERT OR IGNORE INTO lifetime_data (date, production, consumption, import, export)
           VALUES (?, ?, ?, ?, ?)`,
                [
                    date,
                    prod.production[i] || 0,
                    cons.consumption[i] || 0,
                    imp.import[i] || 0,
                    exp.export[i] || 0,
                ]
            );
        }

        console.log(`[Sync] Synced daily data @ ${new Date().toISOString()}`);
    } catch (err) {
        console.error('[Error] Exception in syncDailyData:', err);
    }
}

export async function startCrons() {
    try {
        // Refresh access token immediately on startup
        await refreshAccessToken();
    } catch (err) {
        console.error('[Error] Failed to refresh token on startup:', err);
    }

    // Token refresh every day at 00:00
    new Cron('0 0 * * *', () => {
        console.log('[Cron] Refreshing access token...');
        refreshAccessToken().catch(err => console.error('[Error] Refresh token:', err));
    });

    // Daily sync at 03:00 AM
    new Cron('0 3 * * *', () => {
        console.log('[Cron] Syncing daily lifetime data...');
        syncDailyData().catch(err => console.error('[Error] Sync daily data:', err));
    });

    console.log('[Cron] Jobs scheduled: refreshAccessToken @ 00:00, syncDailyData @ 03:00');
}
