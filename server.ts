import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// 1. Strava OAuth URL Generator
app.get('/api/strava/auth-url', (req, res) => {
  const queryClientId = req.query.clientId as string | undefined;
  const queryRedirectUri = req.query.redirectUri as string | undefined;

  const clientId = queryClientId || process.env.STRAVA_CLIENT_ID || '';
  const redirectUri =
    queryRedirectUri ||
    (process.env.APP_URL
      ? `${process.env.APP_URL.replace(/\/$/, '')}/auth/callback`
      : `http://localhost:${PORT}/auth/callback`);

  const params = new URLSearchParams({
    client_id: clientId || 'strava_client_id_placeholder',
    response_type: 'code',
    redirect_uri: redirectUri,
    approval_prompt: 'auto',
    scope: 'read,activity:read_all,activity:write',
  });

  const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;

  res.json({
    url,
    clientId,
    redirectUri,
  });
});

// 2. Strava Token Exchange
app.post('/api/strava/token', async (req, res) => {
  try {
    const { code, clientId: bodyClientId, clientSecret: bodyClientSecret } = req.body;

    const clientId = bodyClientId || process.env.STRAVA_CLIENT_ID;
    const clientSecret = bodyClientSecret || process.env.STRAVA_CLIENT_SECRET;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Demo Mode handling
    if (!clientId || !clientSecret || clientId === 'demo' || code.startsWith('demo_')) {
      return res.json({
        access_token: 'demo_token_' + Date.now(),
        refresh_token: 'demo_refresh_' + Date.now(),
        expires_at: Math.floor(Date.now() / 1000) + 21600,
        athlete: {
          id: 1234567,
          username: 'demo_athlete',
          firstname: 'Alex',
          lastname: 'Vanguard',
          city: 'San Francisco',
          state: 'California',
          country: 'United States',
          profile: '',
        },
      });
    }

    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json(data);
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error exchanging Strava token:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 3. Strava Token Refresh
app.post('/api/strava/refresh', async (req, res) => {
  try {
    const { refreshToken, clientId: bodyClientId, clientSecret: bodyClientSecret } = req.body;

    const clientId = bodyClientId || process.env.STRAVA_CLIENT_ID;
    const clientSecret = bodyClientSecret || process.env.STRAVA_CLIENT_SECRET;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    if (refreshToken.startsWith('demo_')) {
      return res.json({
        access_token: 'demo_token_' + Date.now(),
        refresh_token: refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + 21600,
      });
    }

    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json(data);
    }
    return res.json(data);
  } catch (error: any) {
    console.error('Error refreshing Strava token:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 4. Strava Activities Proxy
app.get('/api/strava/activities', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Bearer token required' });
    }

    const token = authHeader.substring(7);

    if (token.startsWith('demo_token_')) {
      const now = new Date();
      const todayIso = now.toISOString();
      const yesterday = new Date(now.getTime() - 86400 * 1000).toISOString();
      const twoDaysAgo = new Date(now.getTime() - 2 * 86400 * 1000).toISOString();

      return res.json([
        {
          id: 101,
          name: 'Morning Resilience Run 🏃',
          distance: 5200,
          moving_time: 1740,
          elapsed_time: 1800,
          total_elevation_gain: 55,
          type: 'Run',
          sport_type: 'Run',
          start_date_local: todayIso,
          average_speed: 2.98,
          has_heartrate: true,
          average_heartrate: 152,
          kudos_count: 14,
        },
        {
          id: 102,
          name: 'Mindful Sunset Walk 🌅',
          distance: 3800,
          moving_time: 2600,
          elapsed_time: 2700,
          total_elevation_gain: 20,
          type: 'Walk',
          sport_type: 'Walk',
          start_date_local: yesterday,
          average_speed: 1.46,
          has_heartrate: true,
          average_heartrate: 96,
          kudos_count: 9,
        },
        {
          id: 103,
          name: 'Dopamine Detox Kettlebell Session 🏋️',
          distance: 0,
          moving_time: 2700,
          elapsed_time: 2850,
          type: 'Workout',
          sport_type: 'Workout',
          start_date_local: twoDaysAgo,
          has_heartrate: true,
          average_heartrate: 138,
          kudos_count: 18,
        },
      ]);
    }

    const stravaRes = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=25',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await stravaRes.json();
    if (!stravaRes.ok) {
      return res.status(stravaRes.status).json(data);
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error fetching Strava activities:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 5. Strava Publish Activity Proxy
app.post('/api/strava/publish-activity', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Bearer token required' });
    }

    const token = authHeader.substring(7);
    const { name, type, elapsed_time, description, distance } = req.body;

    if (!name || !type || !elapsed_time) {
      return res.status(400).json({ error: 'Name, type, and elapsed_time are required' });
    }

    if (token.startsWith('demo_token_')) {
      return res.json({
        id: `demo-${Date.now()}`,
        name,
        type,
        elapsed_time,
        description,
        distance: distance || 0,
        start_date_local: new Date().toISOString(),
        kudos_count: 1,
        status: 'published_demo',
      });
    }

    const stravaRes = await fetch('https://www.strava.com/api/v3/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        type,
        start_date_local: new Date().toISOString(),
        elapsed_time,
        description,
        distance: distance || 0,
      }),
    });

    const data = await stravaRes.json();
    if (!stravaRes.ok) {
      return res.status(stravaRes.status).json(data);
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error publishing Strava activity:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 6. OAuth Callback route (Required by skills/system_skills/oauth/SKILL.md)
// Both /auth/callback and /auth/callback/ handled
const callbackHandler: express.RequestHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Strava Authentication — Reset</title>
    <style>
      body {
        background-color: #121212;
        color: #E5E5E5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
      }
      .card {
        background: #181818;
        border: 1px solid #2B2B2B;
        border-radius: 8px;
        padding: 24px 32px;
        text-align: center;
        max-width: 380px;
      }
      .icon {
        font-size: 28px;
        margin-bottom: 12px;
      }
      h2 {
        font-size: 16px;
        margin: 0 0 8px 0;
        font-weight: 600;
        color: #FFF;
      }
      p {
        font-size: 13px;
        color: #888;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">🏃</div>
      <h2>Connecting with Strava</h2>
      <p>Authentication complete. Closing this window...</p>
    </div>
    <script>
      (function() {
        var params = new URLSearchParams(window.location.search);
        var code = params.get('code');
        var error = params.get('error');
        var scope = params.get('scope');

        if (window.opener) {
          window.opener.postMessage({
            type: error ? 'OAUTH_AUTH_ERROR' : 'OAUTH_AUTH_SUCCESS',
            provider: 'strava',
            code: code,
            error: error,
            scope: scope
          }, '*');
          setTimeout(function() {
            window.close();
          }, 350);
        } else {
          setTimeout(function() {
            window.location.href = '/';
          }, 1000);
        }
      })();
    </script>
  </body>
</html>`);
};

app.get('/auth/callback', callbackHandler);
app.get('/auth/callback/', callbackHandler);

// 7. Mount Vite in Dev, or Static in Prod
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Reset server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
