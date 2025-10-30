import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { parseString } from 'xml2js'
import { promisify } from 'util'
import cosmos from './knowledge-cosmos.js'
import * as gemini from './gemini-chat.js'

const parseXML = promisify(parseString)
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
// Initialize Gemini Flash for chat mode (brezplačno)
gemini.initGemini()

// Quiet Chrome DevTools probe (avoids 404 noise in console)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.json({ ok: true })
})


// Simple health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    time: new Date().toISOString(),
    gemini: gemini.isGeminiAvailable(),
    cosmos: cosmos.isCosmosAvailable?.() || false
  })
})

// Configure Gemini API key at runtime (dev helper – not persisted)
app.post('/api/chat/config', (req, res) => {
  const { apiKey } = req.body || {}
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
    return res.status(400).json({ ok: false, error: 'Provide apiKey' })
  }
  const ok = gemini.configureGemini(apiKey)
  res.json({ ok, gemini: gemini.isGeminiAvailable() })
})

// RSS feed configurations - multiple sources per category
const FEEDS = {
  annex1: [
    { url: 'https://www.ema.europa.eu/en/rss.xml', name: 'EMA' },
    { url: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency.atom', name: 'MHRA' }
  ],
  fda: [
    { url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drugs/rss.xml', name: 'FDA Drugs' },
    { url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/cder-drug-safety-communications/rss.xml', name: 'FDA Safety' }
  ],
  gxp: [
    { url: 'https://www.ema.europa.eu/en/news-events/rss.xml', name: 'EMA News' },
    { url: 'https://www.ich.org/page/news-events', name: 'ICH Updates' }
  ]
}

// Parse RSS/Atom feed and normalize to NewsItem format
async function fetchAndParse(url, category) {
  try {
    const response = await axios.get(url, { timeout: 10000 })
    const xml = response.data
    const parsed = await parseXML(xml)

    let items = []

    // Handle RSS format
    if (parsed.rss?.channel?.[0]?.item) {
      items = parsed.rss.channel[0].item.map(item => ({
        id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title?.[0] || 'Untitled',
        summary: item.description?.[0]?.replace(/<[^>]*>/g, '').substring(0, 800) || 'No summary available',
        date: item.pubDate?.[0] ? new Date(item.pubDate[0]).toISOString() : new Date().toISOString(),
        link: item.link?.[0] || '',
        read: false,
        category
      }))
    }

    // Handle Atom format
    if (parsed.feed?.entry) {
      items = parsed.feed.entry.map(entry => ({
        id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: entry.title?.[0]?._ || entry.title?.[0] || 'Untitled',
        summary: entry.summary?.[0]?._ || entry.summary?.[0]?.replace(/<[^>]*>/g, '').substring(0, 800) || 'No summary available',
        date: entry.updated?.[0] || entry.published?.[0] || new Date().toISOString(),
        link: entry.link?.[0]?.$?.href || '',
        read: false,
        category
      }))
    }

    return items.slice(0, 30) // Return max 30 items per feed
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message)
    return []
  }
}

// Endpoint: Get Annex 1 news (EMA + MHRA)
app.get('/api/rss/annex1', async (req, res) => {
  const results = await Promise.all(
    FEEDS.annex1.map(feed => fetchAndParse(feed.url, 'annex1'))
  )
  const combined = results.flat()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 30)
  res.json(combined)
})

// Endpoint: Get FDA news
app.get('/api/rss/fda', async (req, res) => {
  const results = await Promise.all(
    FEEDS.fda.map(feed => fetchAndParse(feed.url, 'fda'))
  )
  const combined = results.flat()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 30)
  res.json(combined)
})

// Endpoint: Get GxP news
app.get('/api/rss/gxp', async (req, res) => {
  const results = await Promise.all(
    FEEDS.gxp.map(feed => fetchAndParse(feed.url, 'gxp'))
  )
  const combined = results.flat()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 30)
  res.json(combined)
})

// Endpoint: Get all feeds at once
app.get('/api/rss/all', async (req, res) => {
  const [annex1, fda, gxp] = await Promise.all([
    fetch('http://localhost:3001/api/rss/annex1').then(r => r.json()),
    fetch('http://localhost:3001/api/rss/fda').then(r => r.json()),
    fetch('http://localhost:3001/api/rss/gxp').then(r => r.json())
  ])
  res.json({ annex1, fda, gxp })
})

// --- Simple Global Knowledge Retrieval (HTML scrape + keyword ranking) ---
// NOTE: This is a lightweight fallback to provide broader context without vector DB.
// For production, plug in Azure Cosmos DB + Azure OpenAI embeddings for RAG.
const ANNEX_SOURCES = [
  {
    url: 'https://health.ec.europa.eu/system/files/2023-08/202206_annex1_en_0.pdf',
    title: 'EU GMP Annex 1 (PDF, EN) — Official',
    type: 'pdf' // PDF best parsed with pdf-parse in production
  },
  {
    url: 'https://www.ema.europa.eu/en/human-regulatory/research-development/compliance/good-manufacturing-practice/gmp-gdp-inspections',
    title: 'EMA — GMP and GDP inspections',
    type: 'html'
  },
  {
    url: 'https://www.gov.uk/guidance/good-manufacturing-practice-and-good-distribution-practice',
    title: 'MHRA — GMP and GDP guidance',
    type: 'html'
  },
  {
    url: 'https://www.pics.org/publications',
    title: 'PIC/S — Publications (incl. guidance)',
    type: 'html'
  },
  {
    url: 'https://www.iso.org/standard/53394.html',
    title: 'ISO 14644-1 Cleanrooms and associated controlled environments — Part 1',
    type: 'html'
  }
]

function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreChunk(text, queryTerms) {
  const t = text.toLowerCase()
  let score = 0
  for (const q of queryTerms) {
    const m = t.match(new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'))
    if (m) score += m.length * 3
    // proximity heuristic
    if (q.includes(' ')) {
      if (t.includes(q)) score += 5
    }
  }
  // prefer chunks mentioning Annex 1 specifics
  if (t.includes('annex 1') || t.includes('aseptic') || t.includes('cleanroom') || t.includes('grade a')) score += 2
  return score
}

app.post('/api/knowledge/ask', async (req, res) => {
  const { query, k = 5 } = req.body || {}
  if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Missing query' })
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)

  const results = []

  // Fetch and rank HTML sources (lightweight). PDFs are skipped here but returned as citations.
  await Promise.all(
    ANNEX_SOURCES.map(async (src) => {
      if (src.type === 'pdf') {
        // Don’t parse PDF here (keep request light). Add it as a citation for the user.
        results.push({
          source: src.title,
          url: src.url,
          chunk: 'Uradni dokument (PDF). Odprite za celotno vsebino.',
          score: 1
        })
        return
      }
      try {
        const resp = await axios.get(src.url, { timeout: 10000 })
        const text = stripHtml(resp.data)
        // split into rough paragraphs
        const parts = text.split(/(?<=\.)\s{1,}/).filter(p => p && p.length > 120)
        parts.slice(0, 1200).forEach((p) => {
          const s = scoreChunk(p, terms)
          if (s > 0) {
            results.push({ source: src.title, url: src.url, chunk: p.slice(0, 600), score: s })
          }
        })
      } catch (e) {
        console.warn('Knowledge fetch failed for', src.url, e.message)
      }
    })
  )

  const top = results.sort((a, b) => b.score - a.score).slice(0, k)
  const answer = top.length
    ? [
        'Povzetek na podlagi zunanjih virov (ne-LMM):',
        '',
        ...top.map((r, i) => `${i + 1}. ${r.chunk}`)
      ].join('\n')
    : 'Za to vprašanje ni bilo najdenih dovolj relevantnih zadetkov v zunanjih virih. Poskusite bolj specifično poizvedbo (npr. "Grade A/B unidirectional flow", "CCS performance indicators").'

  const citations = top.map(r => ({ title: r.source, url: r.url }))
  res.json({ answer, citations })
})

// --- Cosmos DB vector search endpoints ---
app.post('/api/knowledge/search', async (req, res) => {
  try {
    const { q, k = 5, sources = [] } = req.body || {}
    if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Missing q' })
    const hits = await cosmos.vectorSearch({ query: q, k, sources })
    const answer = hits.length
      ? [
          'Najdeni najbolj relevantni odstavki:',
          '',
          ...hits.map((h, i) => `${i + 1}. [${h.source.toUpperCase()}] ${h.text.slice(0, 600)}`),
        ].join('\n')
      : 'Ni relevantnih zadetkov v indeksirani zbirki. Najprej indeksirajte vire ali razširite filtre.'
    const citations = hits.map(h => ({ title: `${h.source.toUpperCase()} — ${h.title || 'Vir'}`, url: h.url }))
    res.json({ answer, citations })
  } catch (e) {
    console.error('Vector search failed:', e.message)
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/knowledge/index', async (req, res) => {
  try {
    const { docs = [] } = req.body || {}
    if (!Array.isArray(docs) || docs.length === 0) return res.status(400).json({ error: 'Provide docs[]' })
    const out = await cosmos.upsertDocuments(docs)
    res.json({ ok: true, count: out.length })
  } catch (e) {
    console.error('Upsert failed:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// Ensure Cosmos DB container exists on boot (non-blocking)
cosmos.ensureCosmos().then(r => {
  if (r.enabled) console.log('✅ Cosmos DB ready with vector policy')
  else console.log('⚠️ Cosmos DB not configured; using HTML fallback only')
}).catch(e => console.warn('Cosmos ensure failed', e.message))

app.listen(PORT, () => {
  console.log(`🚀 RSS proxy & knowledge server on http://localhost:${PORT}`)
})

// --- Gemini Flash chat endpoint (brezplačno, 15 req/min) ---
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], context = {} } = req.body || {}
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Missing messages array' })
    }
    
    if (!gemini.isGeminiAvailable()) {
      return res.status(503).json({ 
        error: 'Chat mode not available. Add GOOGLE_GEMINI_API_KEY to .env',
        hint: 'Get free key at: https://aistudio.google.com/app/apikey'
      })
    }
    
    const result = await gemini.chatCompletion(messages, context)
    res.json(result)
  } catch (e) {
    console.error('[chat] Error:', e.message)
    res.status(500).json({ error: e.message })
  }
})
