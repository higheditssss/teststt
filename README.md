# Top Chatters - Cache Partajat Global (20 ore)

## 📦 Ce s-a schimbat?

Aplicația acum folosește un **sistem de cache partajat persistent** între toți utilizatorii folosind **Upstash Redis**. Datele sunt salvate global și sunt accesibile tuturor pentru **20 de ore**.

### Funcționare:

1. **Primul utilizator** care accesează un canal (ex: `highman`) primește date noi și începe să colecteze statistici
2. **Al doilea utilizator** care accesează același canal în următoarele 20 ore va vedea **exact aceleași date** ca primul utilizator (chiar și pe alt browser/dispozitiv)
3. Toate modificările (mesaje noi, statistici) se actualizează în **timp real** pentru toți utilizatorii
4. După **20 de ore**, cache-ul expiră automat și se resetează
5. **Datele persistă între refresh-uri, browsere și dispozitive** ✅

---

## 🚀 Setup Rapid (10 minute)

### 1. Setup Redis (NECESAR pentru cache persistent)

**Fără Redis = cache-ul se resetează la fiecare refresh!**

#### Pași rapizi:
1. Mergi pe **https://upstash.com** → Sign up gratuit cu GitHub
2. **Create Database** → Region: `eu-central-1 (Frankfurt)` → Type: `Regional`
3. Copiază **REST URL** și **REST TOKEN** din dashboard
4. Adaugă în Vercel:
   ```bash
   vercel env add UPSTASH_REDIS_REST_URL
   # Paste URL
   
   vercel env add UPSTASH_REDIS_REST_TOKEN
   # Paste TOKEN
   ```
5. Redeploy:
   ```bash
   vercel --prod
   ```

**📖 Ghid detaliat**: Vezi [SETUP-REDIS.md](./SETUP-REDIS.md)

### 2. Deploy pe Vercel

```bash
# Instalează Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 📁 Fișiere incluse

- `index.html` - Interfața principală (cu cache partajat)
- `api/channel.js` - Endpoint pentru datele canalului Kick
- `api/seventv.js` - Endpoint pentru emoticoane 7TV
- `api/cache.js` - **Cache persistent cu Upstash Redis** ⭐
- `vercel.json` - Configurație Vercel
- `package.json` - Dependințe
- `SETUP-REDIS.md` - **Ghid detaliat setup Redis**

---

## 🔧 Testare

### Test cache persistent:

1. **Browser 1**: Deschide `https://your-app.vercel.app?user=highman`
2. Așteaptă 1-2 minute să colecteze mesaje (ex: 150 mesaje)
3. **Browser 2** (sau incognito): Deschide același link
4. ✅ Ar trebui să vezi **imediat** aceleași 150 mesaje!

---

## 📊 Arhitectură

### Cache Flow cu Redis:

```
User 1 (10:00) → Salvează în Redis → Upstash Cloud (20h TTL)
                                            ↓
User 2 (10:05) → Citește din Redis ← Date persistente
                                            ↓
User 3 (14:00) → Citește din Redis ← Date actualizate (persistente)
```

### Fără Redis (versiunea veche):

```
User 1 (10:00) → Salvează local → ❌ Se pierde la refresh
User 2 (10:05) → Cache nou → ❌ Nu vede datele User 1
```

---

## 🎯 Caracteristici

✅ Date partajate între toți utilizatorii  
✅ **Persistență reală** (Redis cloud storage)  
✅ Expirare automată după 20 ore  
✅ Fallback la localStorage dacă Redis e offline  
✅ Mesaj UI care arată când expiră cache-ul  
✅ Funcționează pe browsere, dispozitive și platforme diferite  
✅ **Gratuit** (Upstash free tier: 10k requests/zi)  

---

## 💰 Costuri

**Upstash Free Tier** (permanent gratuit):
- ✅ 10,000 comenzi/zi
- ✅ 256 MB storage
- ✅ Suficient pentru sute de utilizatori simultani

---

## 🔒 Reset statistici

Resetarea statisticilor este protejată cu parolă. Contactează @highman.edits pe Instagram pentru parolă.

---

## 📝 Modificări tehnice vs versiunea anterioară

### Fișiere modificate:

**index.html:**
- ❌ Eliminat: `sessionId`, `generateSessionId()`
- ✅ Adăugat: `async loadState()` cu fetch la `/api/cache`
- ✅ Adăugat: `async saveState()` cu POST la `/api/cache`
- ✅ Adăugat: Mesaj UI pentru cache info
- ✅ Adăugat: Helper `getTimeAgo()` pentru afișare timp

**api/cache.js (NOU):**
- ✅ Integrare Upstash Redis REST API
- ✅ Expirare automată după 20 ore (SETEX)
- ✅ Persistență garantată între invocări
- ✅ Graceful fallback dacă Redis nu e configurat

**Schimbări URL:**
- Înainte: `?user=highman&session=abc123`
- Acum: `?user=highman`

---

## 💡 Troubleshooting

### Cache-ul se resetează la refresh

**Problemă**: Redis nu e configurat corect

**Fix**: 
1. Verifică env vars: `vercel env ls`
2. Asigură-te că ai `UPSTASH_REDIS_REST_URL` și `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy: `vercel --prod`

### "Redis not configured" în console

**Fix**: Vezi [SETUP-REDIS.md](./SETUP-REDIS.md) pentru setup pas-cu-pas

---

## 📧 Contact

Instagram: [@highman.edits](https://instagram.com/highman.edits)

---

**Enjoy sharing stats! 🎉**
