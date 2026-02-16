# Top Chatters - Cache Partajat Global (20 ore)

## 📦 Ce s-a schimbat?

Aplicația acum folosește un **sistem de cache partajat** între toți utilizatorii. Datele sunt salvate global și sunt accesibile tuturor pentru **20 de ore**.

### Funcționare:

1. **Primul utilizator** care accesează un canal (ex: `highman`) primește date noi și începe să colecteze statistici
2. **Al doilea utilizator** care accesează același canal în următoarele 20 ore va vedea **exact aceleași date** ca primul utilizator
3. Toate modificările (mesaje noi, statistici) se actualizează în **timp real** pentru toți utilizatorii
4. După **20 de ore**, cache-ul expiră automat și se resetează

---

## 🚀 Deployment

### Vercel (recomandat)

```bash
# 1. Instalează Vercel CLI
npm i -g vercel

# 2. Deploy
vercel
```

**Fișiere incluse:**
- `index.html` - Interfața principală (cu cache partajat)
- `api/channel.js` - Endpoint pentru datele canalului Kick
- `api/seventv.js` - Endpoint pentru emoticoane 7TV
- `api/cache.js` - **NOU** - Sistem de cache global partajat
- `vercel.json` - Configurație Vercel
- `package.json` - Dependințe

---

## 🔧 Testare locală

Pentru testare locală, folosește `server.js`:

```bash
node server.js
```

**ATENȚIE:** `server.js` NU include sistemul de cache global. Pentru cache partajat, trebuie să folosești deployment-ul Vercel.

---

## 📊 Cum funcționează cache-ul partajat?

### API Cache (`/api/cache`)

Endpoint nou care gestionează cache-ul global:

**GET** `/api/cache?action=get&key=topChatters_highman_state`
- Returnează datele din cache dacă există
- Include `expiresAt` și `expiresIn` (secunde rămase)

**POST** `/api/cache?action=set&key=topChatters_highman_state`
- Body: JSON cu datele de salvat
- Salvează pentru 20 ore (72.000.000 ms)

**GET** `/api/cache?action=stats`
- Returnează statistici despre cache (număr de chei, expirări)

### Flux de date:

```
User 1 (10:00) → Salvează date → Cache Global (expiră 06:00 următoarea zi)
                                       ↓
User 2 (10:05) → Încarcă date ← Cache Global (Date de la User 1)
                                       ↓
User 3 (14:00) → Încarcă date ← Cache Global (Date actualizate de User 1 & 2)
```

---

## 🎯 Caracteristici

✅ Date partajate între toți utilizatorii  
✅ Expirare automată după 20 ore  
✅ Fallback la localStorage dacă API-ul nu e disponibil  
✅ Mesaj UI care arată când expiră cache-ul  
✅ Nu mai există "sesiuni" - doar un cache global per canal  

---

## 📝 Modificări tehnice

### Fișiere modificate:

**index.html:**
- ❌ Eliminat: `sessionId`, `generateSessionId()`
- ✅ Adăugat: `async loadState()` cu fetch la `/api/cache`
- ✅ Adăugat: `async saveState()` cu POST la `/api/cache`
- ✅ Adăugat: Mesaj UI pentru cache info
- ✅ Adăugat: Helper `getTimeAgo()` pentru afișare timp

**api/cache.js (NOU):**
- Cache in-memory cu `Map()`
- Expirare automată după 20 ore
- Curățare automată la fiecare request

**Schimbări URL:**
- Înainte: `?user=highman&session=abc123`
- Acum: `?user=highman`

---

## 🔒 Reset statistici

Resetarea statisticilor este protejată cu parolă. Contactează @highman.edits pe Instagram pentru parolă.

---

## 💡 Note importante

1. **Cache-ul este volatile** - dacă Vercel restartează serverless function-ul, cache-ul se pierde (dar fallback la localStorage funcționează)
2. **Pentru persistență 100%**, consideră integrarea cu Redis/Upstash
3. **localStorage** rămâne ca backup local (se sincronizează cu cache-ul global)

---

## 📧 Contact

Instagram: [@highman.edits](https://instagram.com/highman.edits)

---

**Enjoy sharing stats! 🎉**
