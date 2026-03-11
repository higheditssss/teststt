// ─────────────────────────────────────────────
//  Vercel Serverless Function: /api/auth
//  Kick OAuth 2.1 cu PKCE
//  code_verifier este trimis de frontend (sessionStorage)
// ─────────────────────────────────────────────

const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const { action, code, redirect_uri, state, code_verifier } = req.query;

  const CLIENT_ID     = process.env.KICK_CLIENT_ID;
  const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(503).json({
      error: 'OAuth not configured. Adaugă KICK_CLIENT_ID și KICK_CLIENT_SECRET în .env.local',
    });
  }

  // ── 1. AUTHORIZE — generează URL + returnează code_verifier către frontend ──
  if (action === 'authorize' && redirect_uri) {
    const codeVerifier  = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const oauthState    = state || crypto.randomBytes(16).toString('hex');

    const authUrl = new URL('https://id.kick.com/oauth/authorize');
    authUrl.searchParams.set('response_type',         'code');
    authUrl.searchParams.set('client_id',             CLIENT_ID);
    authUrl.searchParams.set('redirect_uri',          redirect_uri);
    authUrl.searchParams.set('scope',                 'user:read channel:read');
    authUrl.searchParams.set('state',                 oauthState);
    authUrl.searchParams.set('code_challenge',        codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Returnăm și code_verifier către frontend ca să îl salveze în sessionStorage
    return res.status(200).json({
      url:           authUrl.toString(),
      state:         oauthState,
      code_verifier: codeVerifier,  // Frontend îl salvează și îl trimite înapoi la callback
    });
  }

  // ── 2. CALLBACK — exchange code → token ─────────────────────
  if (code && redirect_uri) {
    try {
      const body = new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri,
      });

      // Frontend trimite code_verifier salvat din sessionStorage
      if (code_verifier) {
        body.set('code_verifier', code_verifier);
      }

      const tokenRes = await fetch('https://id.kick.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const rawText = await tokenRes.text();
      let tokenData;
      try { tokenData = JSON.parse(rawText); }
      catch(e) {
        console.error('Token response not JSON:', rawText);
        return res.status(500).json({ error: 'Token response invalid: ' + rawText.substring(0, 200) });
      }

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('Token exchange failed:', JSON.stringify(tokenData));
        return res.status(400).json({
          error: tokenData.message || tokenData.error_description || tokenData.error || 'Token exchange failed',
        });
      }

      // Fetch user info
      const userRes = await fetch('https://api.kick.com/public/v1/users', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      let username = null, kickUserId = null, avatar = null;

      if (userRes.ok) {
        const userData = await userRes.json();
        console.log('[Kick Users API]', JSON.stringify(userData));
        // Încearcă toate structurile posibile
        const user = Array.isArray(userData.data) ? userData.data[0] 
                   : Array.isArray(userData)       ? userData[0]
                   : userData.data || userData;
        username = user?.username || user?.name || user?.slug || user?.login || null;
        // username se păstrează exact cum vine de la Kick (ex: highman_edits)
        kickUserId = user?.user_id  || user?.id   || null;
        avatar     = user?.profile_picture || user?.profile_pic || user?.avatar || null;
        console.log('[Kick Users] resolved:', { username, kickUserId, avatar });
      } else {
        const errText = await userRes.text();
        console.error('[Kick Users API] Error', userRes.status, errText);
      }

      return res.status(200).json({
        access_token:  tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_in:    tokenData.expires_in    || null,
        username,
        kickUserId,
        avatar,
      });

    } catch (err) {
      console.error('Auth callback error:', err);
      return res.status(500).json({ error: 'Authentication failed: ' + err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid request.' });
};