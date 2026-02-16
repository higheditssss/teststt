// ─────────────────────────────────────────────
//  Vercel Serverless Function: /api/seventv
//  Proxiază cererile 7TV API pentru a evita CORS
//  Usage:
//    GET /api/seventv?type=user&kick_id=123456
//    GET /api/seventv?type=emotes&kick_id=123456
// ─────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { type, kick_id, username } = req.query;

  try {
    let url;

    if (type === 'user' && kick_id) {
      // Fetch 7TV user data by Kick user ID (includes style: paint + badge)
      url = `https://7tv.io/v3/users/kick/${encodeURIComponent(kick_id)}`;
    } else if (type === 'emotes' && kick_id) {
      // Fetch 7TV emote set for a Kick channel
      url = `https://7tv.io/v3/users/kick/${encodeURIComponent(kick_id)}`;
    } else {
      return res.status(400).json({ error: 'Missing params. Need type=user&kick_id=... or type=emotes&kick_id=...' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TopChatters/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // 404 = user not on 7TV, not an error
      if (response.status === 404) {
        return res.status(200).json({ not_found: true });
      }
      return res.status(response.status).json({ error: `7TV returned ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('7TV proxy error:', error);
    return res.status(502).json({ error: error.message || 'Failed to fetch 7TV data' });
  }
};