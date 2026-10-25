import { StravaActivity, StravaAuthTokens, StravaConfig } from '../types/index.ts';

const TOKENS_KEY = 'reset_app_strava_tokens_v1';
const CONFIG_KEY = 'reset_app_strava_config_v1';
const ACTIVITIES_CACHE_KEY = 'reset_app_strava_activities_cache_v1';
const SYNCED_COUNT_KEY = 'reset_app_strava_sync_count_v1';
const SHARED_COUNT_KEY = 'reset_app_shared_count_v1';

export const stravaService = {
  getTokens(): StravaAuthTokens | null {
    try {
      const saved = localStorage.getItem(TOKENS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  },

  saveTokens(tokens: StravaAuthTokens): void {
    try {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    } catch {}
  },

  clearTokens(): void {
    try {
      localStorage.removeItem(TOKENS_KEY);
      localStorage.removeItem(ACTIVITIES_CACHE_KEY);
    } catch {}
  },

  getConfig(): StravaConfig {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      clientId: '',
      clientSecret: '',
    };
  },

  saveConfig(config: StravaConfig): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch {}
  },

  getCachedActivities(): StravaActivity[] {
    try {
      const saved = localStorage.getItem(ACTIVITIES_CACHE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  saveCachedActivities(activities: StravaActivity[]): void {
    try {
      localStorage.setItem(ACTIVITIES_CACHE_KEY, JSON.stringify(activities));
    } catch {}
  },

  getSyncedWorkoutsCount(): number {
    try {
      return parseInt(localStorage.getItem(SYNCED_COUNT_KEY) || '0', 10);
    } catch {
      return 0;
    }
  },

  incrementSyncedWorkoutsCount(amount: number = 1): number {
    try {
      const current = this.getSyncedWorkoutsCount();
      const updated = current + amount;
      localStorage.setItem(SYNCED_COUNT_KEY, updated.toString());
      return updated;
    } catch {
      return 0;
    }
  },

  getSharedCount(): number {
    try {
      return parseInt(localStorage.getItem(SHARED_COUNT_KEY) || '0', 10);
    } catch {
      return 0;
    }
  },

  incrementSharedCount(): number {
    try {
      const current = this.getSharedCount();
      const updated = current + 1;
      localStorage.setItem(SHARED_COUNT_KEY, updated.toString());
      return updated;
    } catch {
      return 0;
    }
  },

  /**
   * Generates or fetches the Strava OAuth authorization URL.
   * Popup must open this provider URL directly as mandated by oauth-integration skill.
   */
  async getAuthUrl(redirectUri: string, clientId?: string): Promise<string> {
    const customConfig = this.getConfig();
    const effectiveClientId = clientId || customConfig.clientId;

    try {
      const query = new URLSearchParams();
      if (effectiveClientId) query.set('clientId', effectiveClientId);
      query.set('redirectUri', redirectUri);

      const res = await fetch(`/api/strava/auth-url?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
      }
    } catch (e) {
      console.warn('Fallback to client-side auth URL generation', e);
    }

    // Direct fallback client-side URL
    const id = effectiveClientId || 'demo';
    const params = new URLSearchParams({
      client_id: id,
      response_type: 'code',
      redirect_uri: redirectUri,
      approval_prompt: 'auto',
      scope: 'read,activity:read_all,activity:write',
    });
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  },

  /**
   * Opens provider authorization URL directly in popup and awaits postMessage callback
   */
  openAuthPopup(authUrl: string): Promise<{ code: string }> {
    return new Promise((resolve, reject) => {
      const width = 600;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'strava_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        reject(new Error('Popup blocked! Please allow popups for this site.'));
        return;
      }

      let handled = false;

      const handleMessage = (event: MessageEvent) => {
        // Origin validation: accept same origin, *.run.app, or localhost
        const origin = event.origin;
        const isRunApp = origin.endsWith('.run.app');
        const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isSame = origin === window.location.origin;

        if (!isRunApp && !isLocal && !isSame) {
          return;
        }

        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          handled = true;
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosedInterval);
          resolve({ code: event.data.code || '' });
        } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
          handled = true;
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosedInterval);
          reject(new Error(event.data.error || 'Authentication denied'));
        }
      };

      window.addEventListener('message', handleMessage);

      // Periodically check if user closed popup manually
      const checkClosedInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosedInterval);
          window.removeEventListener('message', handleMessage);
          if (!handled) {
            reject(new Error('Authentication window closed before completion'));
          }
        }
      }, 500);

      // Safety timeout after 5 minutes
      setTimeout(() => {
        if (!handled) {
          clearInterval(checkClosedInterval);
          window.removeEventListener('message', handleMessage);
          reject(new Error('OAuth flow timed out'));
        }
      }, 300000);
    });
  },

  /**
   * Exchanges authorization code for Strava access & refresh tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    config?: StravaConfig
  ): Promise<StravaAuthTokens> {
    const effectiveConfig = config || this.getConfig();

    const res = await fetch('/api/strava/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri,
        clientId: effectiveConfig.clientId,
        clientSecret: effectiveConfig.clientSecret,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to exchange token with Strava');
    }

    const data = await res.json();
    const tokens: StravaAuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athlete: data.athlete,
    };

    this.saveTokens(tokens);
    return tokens;
  },

  /**
   * Fetches recent activities from Strava API
   */
  async fetchActivities(accessToken: string): Promise<StravaActivity[]> {
    const res = await fetch('/api/strava/activities', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load Strava activities');
    }

    const activities: StravaActivity[] = await res.json();
    this.saveCachedActivities(activities);
    return activities;
  },

  /**
   * Publishes a completed Reset session / milestone workout to Strava
   */
  async publishActivity(
    accessToken: string,
    activity: {
      name: string;
      type: string;
      elapsed_time: number;
      description: string;
      distance?: number;
    }
  ): Promise<any> {
    const res = await fetch('/api/strava/publish-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(activity),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to publish activity to Strava');
    }

    return await res.json();
  },

  /**
   * Creates realistic demo activities for testing sync and habit linking
   */
  createDemoActivities(): StravaActivity[] {
    const now = new Date();
    const todayIso = now.toISOString();
    const yesterday = new Date(now.getTime() - 86400 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 86400 * 1000);

    const demo: StravaActivity[] = [
      {
        id: `demo-${Date.now()}-1`,
        name: 'Morning Resilience Run 🏃',
        distance: 5120, // 5.12 km
        moving_time: 1680, // 28 mins
        elapsed_time: 1720,
        total_elevation_gain: 45,
        type: 'Run',
        sport_type: 'Run',
        start_date_local: todayIso,
        average_speed: 3.05, // ~5:27/km
        has_heartrate: true,
        average_heartrate: 154,
        kudos_count: 8,
      },
      {
        id: `demo-${Date.now()}-2`,
        name: 'Mindful Recovery Walk & Sun exposure ☀️',
        distance: 3400,
        moving_time: 2400,
        elapsed_time: 2450,
        total_elevation_gain: 15,
        type: 'Walk',
        sport_type: 'Walk',
        start_date_local: yesterday.toISOString(),
        average_speed: 1.41,
        has_heartrate: true,
        average_heartrate: 98,
        kudos_count: 5,
      },
      {
        id: `demo-${Date.now()}-3`,
        name: 'Dopamine Detox Kettlebell & Core Workout 🏋️',
        distance: 0,
        moving_time: 2700, // 45 mins
        elapsed_time: 2800,
        type: 'Workout',
        sport_type: 'Workout',
        start_date_local: twoDaysAgo.toISOString(),
        has_heartrate: true,
        average_heartrate: 142,
        kudos_count: 12,
      },
    ];

    this.saveCachedActivities(demo);
    return demo;
  },

  /**
   * Simulates a connected demo athlete
   */
  createDemoConnection(): StravaAuthTokens {
    const demoTokens: StravaAuthTokens = {
      accessToken: 'demo_access_token_' + Date.now(),
      refreshToken: 'demo_refresh_token_' + Date.now(),
      expiresAt: Math.floor(Date.now() / 1000) + 21600,
      athlete: {
        id: 7771234,
        firstname: 'Alex',
        lastname: 'Vanguard',
        username: 'alex_reset',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        profile: '',
      },
    };
    this.saveTokens(demoTokens);
    return demoTokens;
  },
};
