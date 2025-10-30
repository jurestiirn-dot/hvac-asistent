# Azure Setup – Cosmos DB + Azure OpenAI Embeddings

Celoten vodnik za konfiguracijo vector search sistema za Professor Annex pomočnika.

## Predpogoji

- Azure račun (začni z brezplačnim: https://azure.microsoft.com/free/)
- Azure CLI ali Azure Portal dostop
- Node.js in npm (že namestiš)

---

## 1. Ustvari Azure Cosmos DB račun

### Način 1: Azure Portal (priporočeno za začetnike)

1. **Odpri Azure Portal**: https://portal.azure.com
2. **Ustvari nov Cosmos DB račun**:
   - Klikni **"+ Create a resource"**
   - Išči **"Azure Cosmos DB"**
   - Izberi **"Create Azure Cosmos DB account"**
   
3. **Osnovne nastavitve**:
   - **Subscription**: Izberi svojo naročnino
   - **Resource Group**: Ustvari novo ali uporabi obstoječo (npr. `hvac-assistant-rg`)
   - **Account Name**: Unikatno ime (npr. `hvac-knowledge-db`)
   - **Location**: Izberi regijo najbližjo tebi (npr. `West Europe`)
   - **Capacity mode**: **Serverless** (najboljše za začetek – plačuješ samo za uporabo)
   - **API**: **Core (SQL)** ⚠️ POMEMBNO

4. **Networking**:
   - **Connectivity method**: **Public endpoint (all networks)** (za razvoj)
   - Produkcija: omejite na določene IP-je ali private endpoints

5. **Backup Policy**:
   - Pusti privzeto (Periodic backup)

6. **Encryption**:
   - Pusti privzeto (Service-managed key)

7. **Review + Create** → **Create**
   - Počakaj 5-10 minut, da se deployment zaključi

8. **Pridobi ključe**:
   - Ko je deployment končan, pojdi na tvoj Cosmos DB račun
   - V levem meniju izberi **"Keys"**
   - Kopiraj:
     - **URI** (npr. `https://hvac-knowledge-db.documents.azure.com:443/`)
     - **PRIMARY KEY**

### Način 2: Azure CLI (za napredne)

```bash
# Prijava
az login

# Ustvari resource group
az group create --name hvac-assistant-rg --location westeurope

# Ustvari Cosmos DB račun (SQL API, serverless)
az cosmosdb create \
  --name hvac-knowledge-db \
  --resource-group hvac-assistant-rg \
  --locations regionName=westeurope \
  --capabilities EnableServerless \
  --kind GlobalDocumentDB \
  --default-consistency-level Session

# Pridobi ključe
az cosmosdb keys list \
  --name hvac-knowledge-db \
  --resource-group hvac-assistant-rg \
  --type keys
```

---

## 2. Ustvari Azure OpenAI račun

### Način 1: Azure Portal

1. **Zahtevaj dostop do Azure OpenAI**:
   - Pojdi na: https://aka.ms/oai/access
   - Izpolni obrazec in počakaj na odobritev (lahko traja 1-2 dni)

2. **Po odobritvi ustvari Azure OpenAI servis**:
   - Pojdi na Azure Portal: https://portal.azure.com
   - Klikni **"+ Create a resource"**
   - Išči **"Azure OpenAI"**
   - Klikni **"Create"**

3. **Osnovne nastavitve**:
   - **Subscription**: Tvoja naročnina
   - **Resource Group**: Uporabi isto kot za Cosmos DB (`hvac-assistant-rg`)
   - **Region**: **Sweden Central** ali **East US** (regije z embeddings podporo)
   - **Name**: `hvac-openai-service`
   - **Pricing tier**: **Standard S0**

4. **Review + Create** → **Create**

5. **Ustvari embedding deployment**:
   - Po deploymentu pojdi na **"Azure OpenAI Studio"**: https://oai.azure.com
   - Izberi svoj servis
   - Pojdi na **"Deployments"**
   - Klikni **"+ Create new deployment"**
   - **Model**: Izberi **text-embedding-3-small** (1536 dimensions, hitro in poceni)
   - **Deployment name**: `text-embedding-3-small` (pomembno: uporabi to ime)
   - **Tokens per minute**: Začni z 10K (povečaj če potrebuješ)
   - Klikni **"Create"**

6. **Pridobi ključe**:
   - V Azure Portal pojdi na svoj OpenAI servis
   - V levem meniju izberi **"Keys and Endpoint"**
   - Kopiraj:
     - **Endpoint** (npr. `https://hvac-openai-service.openai.azure.com/`)
     - **KEY 1**

### Način 2: Azure CLI

```bash
# Ustvari Azure OpenAI servis
az cognitiveservices account create \
  --name hvac-openai-service \
  --resource-group hvac-assistant-rg \
  --location swedencentral \
  --kind OpenAI \
  --sku S0

# Pridobi ključe
az cognitiveservices account keys list \
  --name hvac-openai-service \
  --resource-group hvac-assistant-rg

# Pridobi endpoint
az cognitiveservices account show \
  --name hvac-openai-service \
  --resource-group hvac-assistant-rg \
  --query "properties.endpoint"

# Ustvari embedding deployment (prek REST API ali portal)
# Za CLI deployment glej: https://learn.microsoft.com/azure/ai-services/openai/how-to/create-resource
```

---

## 3. Konfiguracija `.env` datoteke

### Kopiraj example v pravo .env datoteko

```powershell
cd "c:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\backend"
Copy-Item .env.example .env
```

### Uredi `.env` datoteko

Odpri `backend/.env` v urejevalniku in vnesi svoje vrednosti:

```bash
# --- Strapi (obstoječe – ne spreminjaj) ---
HOST=0.0.0.0
PORT=1337
APP_KEYS="toBeModified1,toBeModified2"
API_TOKEN_SALT=tobemodified
ADMIN_JWT_SECRET=tobemodified
TRANSFER_TOKEN_SALT=tobemodified
JWT_SECRET=tobemodified
ENCRYPTION_KEY=tobemodified

# --- Knowledge Service (Cosmos + Azure OpenAI) ---
# Azure Cosmos DB
COSMOS_ENDPOINT=https://tvoje-ime.documents.azure.com:443/
COSMOS_KEY=tvoj_primarni_ključ_iz_cosmos_db
COSMOS_DB=hvac_knowledge
COSMOS_CONTAINER=knowledge
COSMOS_TENANT=public

# Azure OpenAI za embeddings
AZURE_OPENAI_ENDPOINT=https://tvoj-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=tvoj_openai_ključ
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Proxy/knowledge server port
PORT=3001
```

⚠️ **Pomembno**: Zamenjaj `tvoje-ime`, `tvoj_primarni_ključ_iz_cosmos_db`, `tvoj-openai`, in `tvoj_openai_ključ` z **dejanskimi vrednostmi** iz korakov 1 in 2.

---

## 4. Preveri konfiguracijo

### Zaženi backend strežnik

```powershell
cd "c:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\backend"
npm run proxy
```

Če je konfiguracija pravilna, boš videl:

```
✅ Cosmos DB ready with vector policy
🚀 RSS proxy & knowledge server on http://localhost:3001
```

Če vidiš napake:
- `⚠️ Cosmos DB not configured` → Preveri COSMOS_ENDPOINT in COSMOS_KEY
- `[knowledge-cosmos] Missing AZURE_OPENAI_*` → Preveri OpenAI vrednosti
- `401 Unauthorized` → Napačen API ključ
- `404 Not Found` → Napačen endpoint ali deployment name

### Test: Health check

```powershell
curl http://localhost:3001/api/health
```

Odgovor:
```json
{"ok":true,"time":"2025-10-29T..."}
```

---

## 5. Indeksiraj vsebino

Sedaj moraš napolniti Cosmos DB z vsebino. Ustvari testno datoteko za indeksiranje:

### Ustvari test indeksiranje

Ustvari novo datoteko `backend/test-index.js`:

```javascript
import 'dotenv/config'
import fetch from 'node-fetch'

const BASE = 'http://localhost:3001'

// Testni dokumenti za indeksiranje
const docs = [
  {
    id: 'annex1-ccs-1',
    tenantId: 'public',
    source: 'annex1',
    url: 'https://health.ec.europa.eu/system/files/2023-08/202206_annex1_en_0.pdf',
    title: 'Annex 1 - CCS Definition',
    lang: 'sl',
    text: `Contamination Control Strategy (CCS) je celovit sistem ukrepov za preprečevanje, 
    odkrivanje in obvladovanje kontaminacije v aseptičnih procesih. CCS mora biti dokumentiran 
    in mora vključevati analizo tveganj za vsako fazo proizvodnje.Ključne komponente CCS vključujejo: 
    nadzor nad okoljem (temperatura, vlažnost, tlačne razlike), monitoring delcev in mikroorganizmov, 
    validacijo filtracije zraka (HEPA filtri), nadzor nad osebjem (oblačenje, usposabljanje), 
    čiščenje in dezinfekcijo prostorov ter opremo. CCS mora biti redno pregledovan in posodobljen 
    na podlagi trending analiz, odstopanj in rezultatov validacij.`
  },
  {
    id: 'annex1-grade-ab-1',
    tenantId: 'public',
    source: 'annex1',
    url: 'https://health.ec.europa.eu/system/files/2023-08/202206_annex1_en_0.pdf',
    title: 'Annex 1 - Grade A/B Requirements',
    lang: sl',
    text: `Grade A območje predstavlja kritično cono za aseptične operacije. Zahteva se unidirektional 
    (laminarni) pretok zraka z hitrostjo 0.36-0.54 m/s. Delci ≥0.5 µm: maksimalno 3520 delcev/m³ 
    (At Rest in In Operation). Delci ≥5.0 µm: maksimalno 20 delcev/m³. Mikrobiološke meje (settle plates): 
    <1 CFU/4h. Grade B območje obkroža Grade A. At Rest enako kot Grade A, In Operation: 352,000 delcev/m³ 
    za ≥0.5 µm in 2900 za ≥5.0 µm. Mikrobiološke meje: <10 CFU/4h (settle plates). Tlačne razlike: 
    Grade A > Grade B (+10-15 Pa), Grade B > Grade C (+10-15 Pa).`
  },
  {
    id: 'iso-14644-1',
    tenantId: 'public',
    source: 'iso',
    url: 'https://www.iso.org/standard/53394.html',
    title: 'ISO 14644-1 Cleanroom Classification',
    lang: 'sl',
    text: `ISO 14644-1 standard definira klasifikacijo čistosti zraka v čistih prostorih in povezanih 
    nadzorovanih okoljih. Klasifikacija temelji na koncentraciji delcev v zraku. ISO razredi od ISO 1 
    (najčistejši) do ISO 9. ISO 5 ustreza Grade A/B (At Rest) z 3520 delci/m³ za ≥0.5 µm. 
    ISO 7 ustreza Grade C z 352,000 delci/m³. ISO 8 ustreza Grade D z 3,520,000 delci/m³. 
    Monitoring mora biti kontinuiran (Grade A/B) ali periodičen (Grade C/D). Standard zahteva validacijo 
    klasifikacije pri instalaciji (IQ), ob operativni kvalifikaciji (OQ) in periodično rekalifikacijo 
    (običajno vsako leto ali po večjih spremembah sistema).`
  },
  {
    id: 'mhra-gmp-guidance-1',
    tenantId: 'public',
    source: 'mhra',
    url: 'https://www.gov.uk/guidance/good-manufacturing-practice-and-good-distribution-practice',
    title: 'MHRA GMP Guidance for Sterile Products',
    lang: 'sl',
    text: `MHRA (Medicines and Healthcare products Regulatory Agency) zagotavlja smernice za proizvodnjo 
    sterilnih izdelkov v Združenem kraljestvu, usklajene z EU GMP Annex 1. Ključne zahteve vključujejo: 
    media fill validation (simulacija aseptičnega procesa z gojeno podlago) z minimalnimi kontaminacijami 
    (<0.1%), validacijo sterilizacijskih procesov (avtoklaviranje, filtracija), validacijo čiščenja 
    kriticnih površin, monitoring okolja (delci, mikrobiologija, temperatura, vlažnost), kvalifikacijo 
    osebja (aseptična tehnika, gowning procedura). MHRA poudarja pomen trending analiz in proaktivnega 
    upravljanja tveganj (Quality Risk Management - QRM).`
  },
  {
    id: 'pics-guide-sterile-1',
    tenantId: 'public',
    source: 'pics',
    url: 'https://www.picscheme.org/en/publications',
    title: 'PIC/S Guide to Sterile Manufacturing',
    lang: 'sl',
    text: `PIC/S (Pharmaceutical Inspection Co-operation Scheme) je mednarodno sodelovanje regulatornih 
    organov. PIC/S PE 009 Annex 1 guide zagotavlja harmoniziran pristop k inspekciji sterilne proizvodnje. 
    Poudarki: kritični parametri aseptične proizvodnje (čas ekspozicije, temperatura, tlak), validacija 
    HEPA filtrov (integrity test z DOP/PAO metodo ali photometric scan), kvalifikacija izolatorjev in RABS 
    sistemov (Restricted Access Barrier Systems), validacija H2O2 dekontaminacije (koncentracija, 
    ekspozicijski čas, verifikacija s biološkimi indikatorji - spore Geobacillus stearothermophilus). 
    PIC/S poudarja dokumentacijo CCS (Contamination Control Strategy) in proaktivno upravljanje z odstopanji.`
  },
  {
    id: 'internal-sop-gowning-1',
    tenantId: 'public',
    source: 'internal',
    url: null,
    title: 'SOP - Aseptična obleka Grade A/B',
    lang: 'sl',
    text: `Standard Operating Procedure za oblačenje v aseptično okolje Grade A/B. Koraki: 1) Odstranite 
    ves nakit, ure, telefone. 2) Umijte roke z antimikrobnim milom 30 sekund. 3) Vstopite v slepo sobo 
    (Grade D). 4) Oblecite si pokrivalo za lase (hairnet) in ovratnico. 5) Oblecite si sterilno kombinacijo 
    (sterile coverall) - začnite z nogami, nato roke, zaprite zadrgo. 6) Nataknite si sterilne škornje 
    ali obutev. 7) Oblecite si masko za obraz (če ni integrirana). 8) Desinficirajte roke z alkoholnim 
    gelom (70% IPA). 9) Vstopite v Grade C airlock. 10) Oblecite si prvi par sterilnih rokavic. 
    11) Vstopite v Grade B. 12) Desinficirajte rokavice z 70% IPA. 13) Oblecite si drugi par sterilnih 
    rokavic (double gloving). Trajanje celotnega postopka: 8-12 minut za usposobljeno osebje. 
    Periodična kvalifikacija osebja vsake 6 mesecev z media fill testom.`
  }
]

async function indexDocuments() {
  console.log(`📥 Indeksiram ${docs.length} dokumentov v Cosmos DB...`)
  
  try {
    const resp = await fetch(`${BASE}/api/knowledge/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docs })
    })
    
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Indeksiranje neuspešno: ${resp.status} - ${err}`)
    }
    
    const result = await resp.json()
    console.log(`✅ Uspešno indeksirano ${result.count} dokumentov`)
    console.log('🔍 Sedaj lahko testirate vector search!')
  } catch (e) {
    console.error('❌ Napaka pri indeksiranju:', e.message)
    process.exit(1)
  }
}

indexDocuments()
```

### Zaženi indeksiranje

```powershell
# Preveri da je backend strežnik še vedno zagnan na localhost:3001
# V novem terminalu:
cd "c:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\backend"
node test-index.js
```

Če je uspešno, boš videl:
```
📥 Indeksiram 6 dokumentov v Cosmos DB...
✅ Uspešno indeksirano 6 dokumentov
🔍 Sedaj lahko testirate vector search!
```

---

## 6. Testiraj vector search

### Test 1: Preveri da so dokumenti v Cosmos DB

1. Pojdi na Azure Portal → tvoj Cosmos DB račun
2. Izberi **"Data Explorer"**
3. Razširi `hvac_knowledge` → `knowledge`
4. Klikni **"Items"** – videl boš 6 dokumentov
5. Klikni na katerega koli dokument – vidiš ID, tenantId, source, text, **vector** (array z 1536 števili)

### Test 2: Vector search iz ukazne vrstice

Ustvari test datoteko `backend/test-search.js`:

```javascript
import 'dotenv/config'
import fetch from 'node-fetch'

const BASE = 'http://localhost:3001'

async function testSearch(query) {
  console.log(`\n🔍 Iskanje: "${query}"`)
  console.log('─'.repeat(80))
  
  try {
    const resp = await fetch(`${BASE}/api/knowledge/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        q: query, 
        k: 3,
        sources: ['annex1', 'iso', 'mhra', 'pics', 'internal']
      })
    })
    
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Search failed: ${resp.status} - ${err}`)
    }
    
    const result = await resp.json()
    console.log('\n📄 Odgovor:')
    console.log(result.answer)
    console.log('\n📚 Citati:')
    result.citations.forEach((c, i) => {
      console.log(`${i+1}. ${c.title}`)
      if (c.url) console.log(`   ${c.url}`)
    })
  } catch (e) {
    console.error('❌ Napaka:', e.message)
  }
}

// Test različnih poizvedb
(async () => {
  await testSearch('Kaj je CCS in kako se dokumentira?')
  await testSearch('Kakšne so zahteve za Grade A in Grade B območja?')
  await testSearch('Kako se izvaja oblačenje v aseptično okolje?')
  await testSearch('Kaj je ISO 14644-1 standard?')
})()
```

Zaženi:

```powershell
cd "c:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\backend"
node test-search.js
```

Pričakovan izpis:
```
🔍 Iskanje: "Kaj je CCS in kako se dokumentira?"
────────────────────────────────────────────────────────────────────────────────

📄 Odgovor:
Najdeni najbolj relevantni odstavki:

1. [ANNEX1] Contamination Control Strategy (CCS) je celovit sistem ukrepov...

📚 Citati:
1. ANNEX1 — Annex 1 - CCS Definition
   https://health.ec.europa.eu/system/files/2023-08/202206_annex1_en_0.pdf
...
```

---

## 7. Testiraj v aplikaciji

### Frontend setup

Preveri da je `app-v2/.env` nastavljen:

```bash
VITE_STRAPI_URL=http://localhost:1337
VITE_KNOWLEDGE_API_BASE=http://localhost:3001
```

Če ni, ustvari ga:

```powershell
cd "c:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\app-v2"
Copy-Item .env.example .env
```

### Zaženi aplikacijo

```powershell
cd "c:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\app-v2"
npm run dev
```

Odpri http://localhost:5173

### Test v Professor Annex

1. Klikni na **Profesor Annex** avatar (spodaj levo)
2. Izberi **Vprašanja** zavihek
3. Nastavi **Viri** dropdown na **Globalni** ali **Hibrid**
4. Preveri **source filtre** (Annex 1, ISO, MHRA, PIC/S, Internal)
5. Vnesi vprašanje: **"Kaj je CCS in kako se dokumentira?"**
6. Klikni **Išči**
7. Videl boš odgovor z citati iz indeksiranih dokumentov

---

## 8. Cene in optimizacija

### Azure Cosmos DB (Serverless)

- **Zaračunavanje**: Po zahtevah (Request Units - RUs)
- **Tipične cene** (West Europe, 2025):
  - Shranjevanje: ~€0.25/GB/mesec
  - RUs: ~€0.35 na milijon RUs
- **Primer porabe** (za 100 dokumentov, 1000 poizvedb/mesec):
  - Shranjevanje: ~0.1 GB = €0.025
  - Vector search: ~5 RUs/poizvedba = 5000 RUs = €0.002
  - **Skupaj: ~€0.03/mesec** 🎉

### Azure OpenAI Embeddings

- **text-embedding-3-small**:
  - ~€0.02 za 1 milijon tokenov
- **Primer porabe**:
  - 100 dokumentov × 500 tokenov = 50,000 tokenov = €0.001
  - 1000 poizvedb × 50 tokenov = 50,000 tokenov = €0.001
  - **Skupaj: ~€0.002/mesec** 🎉

### Skupni stroški začetka

Za testiranje in manjšo produkcijo (do 1000 poizvedb/mesec):
- **~€0.05–0.10/mesec** (z Azure free tier še manj)

### Optimizacije za produkcijo

1. **Chunking**: Razdeli dolge dokumente na manjše delčke (500-1000 tokenov)
2. **Metadata filtering**: Dodaj `lang`, `category`, `version` za hitrejše filtre
3. **Caching**: Implementiraj Redis cache za pogoste poizvedbe
4. **Rate limiting**: Omeji število poizvedb na uporabnika
5. **Incremental indexing**: Samo novi/spremenjeni dokumenti
6. **Semantic caching**: Prepoznaj podobne poizvedbe in vrni cached odgovore

---

## 9. Troubleshooting

### Cosmos DB napake

| Napaka | Vzrok | Rešitev |
|--------|-------|---------|
| `401 Unauthorized` | Napačen COSMOS_KEY | Preveri ključ v Portal → Keys |
| `404 Not Found` | Napačen COSMOS_ENDPOINT | Preveri endpoint v Portal → Overview |
| `Request rate too large` | Preveč RUs | Počakaj ali povečaj TPM limit |
| `Partition key mismatch` | Napačna HPK konfiguracija | Preveri /tenantId, /source paths |

### Azure OpenAI napake

| Napaka | Vzrok | Rešitev |
|--------|-------|---------|
| `401 Unauthorized` | Napačen API key | Preveri ključ v Portal → Keys |
| `404 Not Found` | Napačen deployment name | Preveri ime v OpenAI Studio → Deployments |
| `429 Rate limit` | Premalo TPM | Povečaj tokens-per-minute v deployment |
| `Model not found` | Napačna regija | Uporabi Sweden Central ali East US |

### Application napake

| Napaka | Vzrok | Rešitev |
|--------|-------|---------|
| `ERR_CONNECTION_REFUSED` | Backend ni zagnan | `npm run proxy` v backend/ |
| `Vector knowledge failed` | .env ni nastavljen | Preveri backend/.env |
| `No results` | Prazna baza | Zaženi test-index.js |
| `Slow searches` | Velika baza brez optimizacije | Implementiraj chunking |

---

## 10. Produkcijska deployments

### Option 1: Azure App Service + Cosmos DB

```bash
# Deploy backend na Azure App Service
az webapp up \
  --name hvac-backend \
  --resource-group hvac-assistant-rg \
  --runtime "NODE:18-lts"

# Nastavi environment variables
az webapp config appsettings set \
  --name hvac-backend \
  --resource-group hvac-assistant-rg \
  --settings \
    COSMOS_ENDPOINT="..." \
    COSMOS_KEY="..." \
    AZURE_OPENAI_ENDPOINT="..." \
    AZURE_OPENAI_API_KEY="..."
```

### Option 2: Azure Container Apps (priporočeno)

- Boljša skalabilnost
- Nižji stroški (pay-per-execution)
- Enostavna CI/CD integracija

### Frontend deployment

- **Azure Static Web Apps** (brezplačno za manjše projekte)
- **Vercel** / **Netlify** (enostavna Git integracija)
- **Azure Blob Storage + CDN** (najcenejše)

---

## 11. Monitoring in Analytics

### Azure Portal Metrics

1. **Cosmos DB**:
   - Portal → tvoj račun → **Metrics**
   - Monitoring: RUs consumed, latency, throttling

2. **Azure OpenAI**:
   - Portal → tvoj servis → **Metrics**
   - Monitoring: Requests, tokens, latency, errors

### Application Insights (opcijsko)

Za naprednejše monitoring:

```bash
npm install applicationinsights
```

V `backend/proxy.js`:

```javascript
import appInsights from 'applicationinsights'

appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .start()
```

---

## 12. Naslednji koraki

### Kratkoročno (takoj po setup)

- ✅ Preveri da zdravnik endpoints delujejo
- ✅ Indeksiraj test dokumente
- ✅ Testiraj v aplikaciji
- 📄 Dodaj več virov (Annex 1 PDF parsing, več MHRA/EMA)

### Srednjeročno (naslednji teden)

- 🔄 Implementiraj incremental indexing (batch updates)
- 🔍 Dodaj advanced filters (date range, category, language)
- 💾 Redis caching za pogoste poizvedbe
- 📊 Dashboard za analytics (top queries, response times)

### Dolgoročno (naslednji mesec)

- 🤖 Hybrid search (vector + keyword)
- 🧠 Answer generation z Azure OpenAI GPT-4
- 🌍 Multi-language support (EN, HR, DE)
- 👥 User feedback loop (thumbs up/down za rezultate)

---

## Potrebuješ pomoč?

- **Azure Docs**: https://docs.microsoft.com/azure
- **Cosmos DB**: https://learn.microsoft.com/azure/cosmos-db/
- **Azure OpenAI**: https://learn.microsoft.com/azure/ai-services/openai/
- **GitHub Issues**: Ustvari issue v projektu za support

---

## Appendix: Koristne ukaze

```powershell
# Preveri Cosmos DB connectivity
curl -X POST http://localhost:3001/api/health

# Test embedding generation
curl -X POST http://localhost:3001/api/knowledge/index `
  -H "Content-Type: application/json" `
  -d '{"docs":[{"text":"test","source":"internal"}]}'

# Test vector search
curl -X POST http://localhost:3001/api/knowledge/search `
  -H "Content-Type: application/json" `
  -d '{"q":"CCS","k":3,"sources":["annex1"]}'

# Preveri RSS endpoints
curl http://localhost:3001/api/rss/annex1

# Stop backend strežnik (v terminalu kjer teče)
Ctrl+C
```

---

✅ **Setup končan!** Sedaj imaš production-ready vector search sistem z Azure Cosmos DB in Azure OpenAI embeddings.
