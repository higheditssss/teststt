// ─────────────────────────────────────────────
//  Vercel Serverless Function: /api/channel
// ─────────────────────────────────────────────

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { user, token } = req.query;

  // ── If token provided: fetch authenticated user's own channel ──
  if (token && !user) {
    try {
      const userRes = await fetch('https://api.kick.com/public/v1/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!userRes.ok) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      const userData = await userRes.json();
      const u = Array.isArray(userData.data) ? userData.data[0] : userData.data || userData;
      const username = u?.username || u?.slug;

      if (!username) {
        return res.status(404).json({ error: 'Could not resolve username from token' });
      }

      // Now fetch channel info using the resolved username
      req.query.user = username;
    } catch (err) {
      return res.status(502).json({ error: 'Token lookup failed: ' + err.message });
    }
  }

  const resolvedUser = req.query.user || '';
  console.log('[channel.js] resolvedUser:', resolvedUser);

  if (!resolvedUser) {
    return res.status(400).json({ error: 'Missing ?user= param or ?token= param' });
  }

  try {
    // Try v2 first, fallback to v1
    let data;
    let response;
    
    try {
      response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(resolvedUser)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('v2 failed');
      data = await response.json();
    } catch (e) {
      response = await fetch(`https://kick.com/api/v1/channels/${encodeURIComponent(resolvedUser)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      data = await response.json();
    }

    const chatroomId = data?.chatroom?.id;
    const isLive = !!(data?.livestream);
    const title = data?.livestream?.session_title || null;
    const viewers = data?.livestream?.viewer_count || 0;
    const avatar = data?.user?.profile_pic || null;
    const kickUserId = data?.user?.id || null;
    const username = data?.user?.username || resolvedUser;

    console.log('[channel.js] chatroomId:', chatroomId, 'data keys:', Object.keys(data || {}));
    if (!chatroomId) {
      return res.status(404).json({ error: 'Channel not found or no chatroom' });
    }

    return res.status(200).json({ chatroomId, isLive, title, viewers, avatar, kickUserId, username });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(502).json({ error: error.message || 'Failed to fetch channel data' });
  }
};
