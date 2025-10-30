# NAVODILA ZA PREVAJANJE LEKCIJ

## Možnost 1: Uporaba OpenAI API (Priporočeno)

### Predpogoji:
1. Potrebuješ OpenAI API ključ (plačljivo, ampak zelo kakovostno)
2. Registriraj se na https://platform.openai.com/
3. Ustvari API ključ v Account Settings

### Nastavitev API ključa:

**PowerShell:**
```powershell
$env:OPENAI_API_KEY="sk-proj-your-key-here"
```

**Preverjanje:**
```powershell
echo $env:OPENAI_API_KEY
```

### Zagon prevajanja:

```powershell
cd 'C:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\app-v2\src\content'
python translate_with_openai.py
```

**Izbiraš lahko:**
- 1: Samo glavne lekcije v angleščino (priporočeno za začetek)
- 2: Samo napredne lekcije v angleščino
- 3: Samo glavne lekcije v hrvaščino
- 4: Samo napredne lekcije v hrvaščino
- 5: Vse v angleščino
- 6: Vse v hrvaščino
- 7: Vse v oba jezika (traja najdlje, ~30-45 minut)

### Prednosti OpenAI pristopa:
✅ Zelo kakovostni prevodi
✅ Razume farmacevtsko terminologijo
✅ Ohranja formatiranje (Markdown, seznami, itd.)
✅ Konsistentnost terminologije
✅ Avtomatično shrani napredek po vsaki lekciji
✅ Lahko nadaljuješ če proces prekinješ

### Strošek:
- GPT-4o-mini model: ~$0.01-0.02 na lekcijo
- Vse lekcije (31): ~$0.30-0.60 (zelo poceni!)
- Lahko ga spremenišna "gpt-4o" za še boljšo kakovost (~$0.50-1.00 total)

---

## Možnost 2: Uporaba Google Translate (Brezplačno)

### Zagon:
```powershell
cd 'C:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\app-v2\src\content'
python translate_lessons.py
```

### Prednosti Google Translate:
✅ Brezplačno
✅ Ni potreben API ključ
✅ Deluje takoj

### Slabosti:
⚠️ Manj kakovostni prevodi za tehnično terminologijo
⚠️ Počasneje (rate limits)
⚠️ Lahko pride do napak pri dolgih tekstih

---

## Možnost 3: Ročni prevod

Če želiš maksimalno kontrolo, lahko ročno urejaš:
- `annex1-en.json` (angleščina)
- `annex1-hr.json` (hrvaščina)
- `annex1-advanced-en.json` (napredne angleščina)
- `annex1-advanced-hr.json` (napredne hrvaščina)

**Zelo zamudno, ampak 100% kontrole!**

---

## Moje priporočilo:

**NAJBOLJŠA OPCIJA:**
1. Uporabi OpenAI API za prvotni prevod (hitr + kakovostno)
2. Ročno preveri/uredi ključne termine
3. Testiraš v aplikaciji

**EKONOMIČNA OPCIJA:**
1. Google Translate za osnovno prevajanje (brezplačno)
2. Ročno popraviš tehnične terme

---

## Status datotek:

✅ `annex1-sl.json` - Slovenske lekcije (originalne)
✅ `annex1-advanced-sl.json` - Napredne slovenske (originalne)
⏳ `annex1-en.json` - Angleške (trenutno kopija slovenskih)
⏳ `annex1-hr.json` - Hrvaške (trenutno kopija slovenskih)
⏳ `annex1-advanced-en.json` - Napredne angleške (trenutno kopija slovenskih)
⏳ `annex1-advanced-hr.json` - Napredne hrvaške (trenutno kopija slovenskih)

**Sistem že deluje!** Samo prevodi manjkajo.

---

## Preverjanje delovanja:

Ko imaš prevode, zaženi aplikacijo:
```powershell
cd 'C:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\app-v2'
npm run dev
```

Spreminjaj jezik v aplikaciji in preveri da se lekcije pravilno naložijo!
