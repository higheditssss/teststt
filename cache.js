// ─────────────────────────────────────────────
//  Vercel Serverless Function: /api/cache
//  Global shared cache pentru toți utilizatorii
//  Datele expiră după 20 ore
// ─────────────────────────────────────────────

// In-memory cache partajat între toate requesturile
const globalCache = new Map();

// Funcție pentru curățarea cache-ului expirat
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of globalCache.entries()) {
    if (now > value.expiresAt) {
      globalCache.delete(key);
    }
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { action, key } = req.query;

  // Curăță cache-ul expirat la fiecare request
  cleanExpiredCache();

  if (action === 'get' && key) {
    // Returnează datele din cache dacă există și nu au expirat
    const cached = globalCache.get(key);
    
    if (cached && Date.now() <= cached.expiresAt) {
      return res.status(200).json({
        cached: true,
        data: cached.data,
        expiresAt: cached.expiresAt,
        expiresIn: Math.floor((cached.expiresAt - Date.now()) / 1000) // seconds
      });
    }
    
    return res.status(200).json({ cached: false });
  }

  if (action === 'set' && key && req.method === 'POST') {
    // Salvează datele în cache pentru 20 ore
    const TWENTY_HOURS = 20 * 60 * 60 * 1000; // 20 ore în milisecunde
    const expiresAt = Date.now() + TWENTY_HOURS;
    
    globalCache.set(key, {
      data: req.body,
      expiresAt: expiresAt
    });

    return res.status(200).json({
      success: true,
      expiresAt: expiresAt,
      expiresIn: TWENTY_HOURS / 1000
    });
  }

  if (action === 'stats') {
    // Returnează statistici despre cache
    return res.status(200).json({
      totalKeys: globalCache.size,
      keys: Array.from(globalCache.keys()).map(k => ({
        key: k,
        expiresIn: Math.floor((globalCache.get(k).expiresAt - Date.now()) / 1000)
      }))
    });
  }

  return res.status(400).json({ error: 'Invalid action or missing parameters' });
};
