import {getRefreshToken, saveRefreshToken} from '../db';

const BASE_URL = 'https://api.enphaseenergy.com';

const SYSTEM_ID = Bun.env.SYSTEM_ID;
const API_KEY = process.env.ENPHASE_API_KEY!;

let accessToken: string;

export async function fetchCurrentSummary() {
  try {
    const res = await fetch(BASE_URL + `/api/v4/systems/${SYSTEM_ID}/summary?key=${API_KEY}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      console.error(`[Error] fetchCurrentSummary failed: ${res.status} ${res.statusText}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('[Error] Exception in fetchCurrentSummary:', error);
    return null;
  }
}

export async function fetchLifetime(endpoint: string) {
  try {
    const res = await fetch(BASE_URL + `/api/v4/systems/${SYSTEM_ID}/${endpoint}?key=${API_KEY}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      console.error(`[Error] fetchLifetime(${endpoint}) failed: ${res.status} ${res.statusText}`);
      return { production: [], start_date: new Date().toISOString().split('T')[0] };
    }

    return await res.json();
  } catch (error) {
    console.error(`[Error] Exception in fetchLifetime(${endpoint}):`, error);
    return { production: [], start_date: new Date().toISOString().split('T')[0] };
  }
}

export async function refreshAccessToken() {
  const currentRefreshToken = getRefreshToken() || Bun.env.ENPHASE_INITAL_REFRESH_TOKEN;
  if (!currentRefreshToken) {
    console.error('[Fatal] Aborting server due to missing refresh token in database or environment.');
    process.exit(1);
  }

  try {
    const res = await fetch(BASE_URL + '/oauth/token?grant_type=refresh_token&refresh_token=' + currentRefreshToken, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${process.env.ENPHASE_BASIC_AUTH!}`,
      },
    });

    if (!res.ok) {
      console.error(`[Error] Refresh token failed: ${res.status} ${res.statusText}`);
      return;
    }

    const json = await res.json();
    if (!json.access_token) {
      console.error('[Error] No access token returned from refresh');
      return;
    }
    accessToken = json.access_token;

    if (json.refresh_token)
      saveRefreshToken(json.refresh_token);

    console.log('[Auth] Access token refreshed');
  } catch (error) {
    console.error('[Error] Exception in refreshAccessToken:', error);
  }
}
