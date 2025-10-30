export type NewsItem = {
  id: string
  title: string
  summary: string
  date: number
  link?: string
  read?: boolean
  category?: 'annex1' | 'fda' | 'gxp'
}

const KEY = 'prof_annex_news_v1'
const LAST_REFRESH_KEY = 'prof_annex_news_last_refresh'
const NEWS_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

export function getNews(): NewsItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function setNews(items: NewsItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function getLastRefresh(): number {
  try {
    const v = localStorage.getItem(LAST_REFRESH_KEY)
    return v ? parseInt(v, 10) : 0
  } catch {
    return 0
  }
}

export function setLastRefresh(ts: number) {
  localStorage.setItem(LAST_REFRESH_KEY, String(ts))
}

export function clearNewsCache() {
  localStorage.removeItem(KEY)
  localStorage.removeItem(LAST_REFRESH_KEY)
}

export function getNewsByCategory(category: 'annex1' | 'fda' | 'gxp'): NewsItem[] {
  return getNews()
    .filter(n => n.category === category)
    .sort((a, b) => b.date - a.date)
    .slice(0, 30)
}

export function seedNewsIfEmpty() {
  const cur = getNews()
  if (cur.length>0) return
  
  const annex1News: NewsItem[] = [
    { id: 'a1-1', category: 'annex1', title: 'EU GMP Annex 1: Clarification on CCS expectations', summary: 'Objavljena razlaga pričakovanj glede Contamination Control Strategy z dodatnimi primeri dokumentacije in metrik.', date: Date.now() - 1000*60*60*24*3, link: 'https://www.ema.europa.eu/en', read: false },
    { id: 'a1-2', category: 'annex1', title: 'Aseptic Processing: Updated Grade A/B separation guidance', summary: 'Dodane smernice glede fizične ločitve in zračnih tokov med Grade A in B območji z vidika tveganj.', date: Date.now() - 1000*60*60*24*7, link: 'https://www.ema.europa.eu/en', read: false },
    { id: 'a1-3', category: 'annex1', title: 'Environmental Monitoring: Revised microbial limits', summary: 'Posodobljene mejne vrednosti za mikrobiološki monitoring v aseptičnih conah A, B, C, D.', date: Date.now() - 1000*60*60*24*12, read: false },
    { id: 'a1-4', category: 'annex1', title: 'Personnel Qualification: Training and re-qualification cycles', summary: 'Poudarek na kontinuiranem usposabljanju in intervencijskih testih za osebje v aseptičnih conah.', date: Date.now() - 1000*60*60*24*18, read: false },
    { id: 'a1-5', category: 'annex1', title: 'Media fills: Best practices and acceptance criteria', summary: 'Posodobljena navodila za simulacijo s kulturnimi gojišči in sprejemljive stopnje kontaminacije (<0,1%).', date: Date.now() - 1000*60*60*24*25, read: false },
    { id: 'a1-6', category: 'annex1', title: 'Barrier Technology: Isolator vs RABS comparison', summary: 'Primerjava izolatov in RABS sistemov z vidika zaščite in regulatornih pričakovanj.', date: Date.now() - 1000*60*60*24*33, read: false },
    { id: 'a1-7', category: 'annex1', title: 'Cleaning and Disinfection: Rotation protocols', summary: 'Priporočila za rotacijo dezinfekcijskih sredstev in validacijo učinkovitosti.', date: Date.now() - 1000*60*60*24*40, read: false },
    { id: 'a1-8', category: 'annex1', title: 'Qualification of HVAC systems for aseptic manufacturing', summary: 'Dodatni zahtevi za kvalifikacijo prezračevalnih sistemov, meritve tokov zraka in differential pressure kaskad.', date: Date.now() - 1000*60*60*24*50, read: false },
    { id: 'a1-9', category: 'annex1', title: 'Contamination investigations: Root cause and CAPA', summary: 'Poglobljena navodila za preiskavo kontaminacijskih dogodkov in vzročne analize.', date: Date.now() - 1000*60*60*24*60, read: false },
    { id: 'a1-10', category: 'annex1', title: 'Annual Product Quality Review focus on sterility', summary: 'Poseben poudarek na sterilnih izdelkih pri letnem pregledu kakovosti (APR).', date: Date.now() - 1000*60*60*24*70, read: false }
  ]
  
  const fdaNews: NewsItem[] = [
    { id: 'fda-1', category: 'fda', title: 'FDA Drug Shortages: New reporting requirements 2025', summary: 'FDA je objavila nove zahteve za poročanje o pomanjkanju zdravil za kritične farmacevtske izdelke.', date: Date.now() - 1000*60*60*24*2, link: 'https://www.fda.gov/', read: false },
    { id: 'fda-2', category: 'fda', title: 'FDA 483 trends: Focus on data integrity', summary: 'Analiza FDA 483 opažanj v letu 2024 kaže povečan poudarek na integriteti podatkov in elektronskih zapisih.', date: Date.now() - 1000*60*60*24*8, link: 'https://www.fda.gov/', read: false },
    { id: 'fda-3', category: 'fda', title: 'Warning Letters: Common CGMP deficiencies identified', summary: 'FDA je izpostavila najpogostejše pomanjkljivosti pri CGMP: slaba kvalifikacija opreme, pomanjkljive metode validacije.', date: Date.now() - 1000*60*60*24*15, read: false },
    { id: 'fda-4', category: 'fda', title: 'Biologics Inspection Guide update: Emphasis on cell therapy', summary: 'Posodobljen vodič za inšpekcijske postopke za biološke izdelke z dodatnim poudarkom na celični terapiji.', date: Date.now() - 1000*60*60*24*22, read: false },
    { id: 'fda-5', category: 'fda', title: 'FDA CAPA effectiveness: Guidance for corrective actions', summary: 'Nova navodila FDA za vzpostavitev učinkovitih korektivnih in preventivnih ukrepov (CAPA).', date: Date.now() - 1000*60*60*24*30, read: false },
    { id: 'fda-6', category: 'fda', title: 'Emerging Technologies: Real-time release testing (RTRT)', summary: 'FDA podpira uporabo real-time release testiranja kot alternativo tradicionalnim testnim metodam.', date: Date.now() - 1000*60*60*24*38, read: false },
    { id: 'fda-7', category: 'fda', title: 'Import Alerts: Increased scrutiny on foreign manufacturers', summary: 'FDA je razširila import alerts zaradi ugotovljenih GMP pomanjkljivosti pri tujih proizvajalcih.', date: Date.now() - 1000*60*60*24*45, read: false },
    { id: 'fda-8', category: 'fda', title: 'Pharmaceutical Quality: Continuous manufacturing initiatives', summary: 'FDA spodbuja prehod na kontinuirano proizvodnjo in objavljenih več case studies uspešnih implementacij.', date: Date.now() - 1000*60*60*24*52, read: false },
    { id: 'fda-9', category: 'fda', title: 'Compounding Pharmacies: Enhanced oversight requirements', summary: 'Novi nadzorni ukrepi za compounding lekarniške obrate s poudarkom na sterilnih pripravkih.', date: Date.now() - 1000*60*60*24*62, read: false },
    { id: 'fda-10', category: 'fda', title: 'Vaccine Manufacturing: Post-pandemic quality focus', summary: 'FDA je objavila poročilo o nadzornih dejavnostih proizvajalcev cepiv v obdobju po pandemiji COVID-19.', date: Date.now() - 1000*60*60*24*72, read: false }
  ]
  
  const gxpNews: NewsItem[] = [
    { id: 'gxp-1', category: 'gxp', title: 'GxP Cloud Adoption: Validation guidance update', summary: 'Razširjena navodila za validacijo računalniško podprtih sistemov v oblaku v skladu z GxP.', date: Date.now() - 1000*60*60*24*4, read: false },
    { id: 'gxp-2', category: 'gxp', title: 'Part 11 Compliance: E-signature best practices', summary: 'Priporočila za uvedbo elektronskih podpisov v skladu s 21 CFR Part 11 z večfaktorsko avtentikacijo.', date: Date.now() - 1000*60*60*24*10, read: false },
    { id: 'gxp-3', category: 'gxp', title: 'Data Integrity: ALCOA+ principles in modern labs', summary: 'Posodobljena razlaga načel ALCOA+ (Attributable, Legible, Contemporaneous, Original, Accurate, Complete, Consistent, Enduring, Available).', date: Date.now() - 1000*60*60*24*16, read: false },
    { id: 'gxp-4', category: 'gxp', title: 'CSV (Computer System Validation): Risk-based approach', summary: 'Nov pristop k validaciji računalniških sistemov na osnovi tveganj, z ločevanjem kritičnosti.', date: Date.now() - 1000*60*60*24*24, read: false },
    { id: 'gxp-5', category: 'gxp', title: 'GLP (Good Laboratory Practice): Recent regulatory updates', summary: 'Posodobitve GLP smernic za neklinične laboratorijske študije: dokumentacija, kvalifikacija in nadzor.', date: Date.now() - 1000*60*60*24*32, read: false },
    { id: 'gxp-6', category: 'gxp', title: 'GCP (Good Clinical Practice): ICH E6(R3) final draft', summary: 'ICH E6(R3) končni osnutek prinaša dodatne poudare na decentraliziranih kliničnih preskušanjih.', date: Date.now() - 1000*60*60*24*42, read: false },
    { id: 'gxp-7', category: 'gxp', title: 'GDP (Good Distribution Practice): Temperature control focus', summary: 'Novo navodilo za nadzor temperature pri distribuciji farmacevtskih izdelkov, zlasti bioloških in cepiv.', date: Date.now() - 1000*60*60*24*48, read: false },
    { id: 'gxp-8', category: 'gxp', title: 'Audit Trail Reviews: Frequency and depth guidelines', summary: 'Priporočila glede pogostosti in globine pregledovanja audit trail zapisov pri GxP sistemih.', date: Date.now() - 1000*60*60*24*56, read: false },
    { id: 'gxp-9', category: 'gxp', title: 'Vendor Qualification: SaaS and cloud vendors checklist', summary: 'Kontrolni seznam za kvalifikacijo dobaviteljev oblačnih storitev v GxP okoljih (vendor audit).', date: Date.now() - 1000*60*60*24*64, read: false },
    { id: 'gxp-10', category: 'gxp', title: 'AI/ML in GxP: Emerging regulatory considerations', summary: 'Prva navodila za uporabo umetne inteligence in strojnega učenja v GxP reguliranih procesih.', date: Date.now() - 1000*60*60*24*74, read: false }
  ]
  
  setNews([...annex1News, ...fdaNews, ...gxpNews])
}

export function markAllRead() {
  const items = getNews().map(i => ({ ...i, read: true }))
  setNews(items)
}

export function markCategoryRead(category: 'annex1' | 'fda' | 'gxp') {
  const items = getNews().map(i => (i.category === category ? { ...i, read: true } : i))
  setNews(items)
}

// Fetch news from backend proxy and merge with local storage
export async function refreshFromRemote(sources: string[] = []): Promise<NewsItem[]> {
  try {
    // Use relative path in dev (Vite proxy); or env override in prod
    const backendUrl = ((import.meta as any)?.env?.VITE_API_BASE_URL || '').replace(/\/$/, '')
    
    // Fetch each category separately to get 10 items per category
    const categories = sources.length > 0 ? sources : ['annex1', 'fda', 'gxp']
    const responses = await Promise.all(
      categories.map(cat => 
        fetch(`${backendUrl}/api/rss/${cat}`)
          .then(r => r.json())
          .catch(() => [])
      )
    )
    
    const remoteItems: NewsItem[] = responses.flat().map(item => ({
      ...item,
      date: new Date(item.date).getTime()
    }))

    // Merge with existing news (keep read status for items with same title)
    const existing = getNews()
    const existingMap = new Map(existing.map(e => [(e.link || e.title), e]))
    
    const merged = remoteItems.map(remote => ({
      ...remote,
      read: existingMap.get(remote.title)?.read || false
    }))

    // Combine and deduplicate by title, keeping only the latest 30 per category
  const combined = [...merged, ...existing.filter(e => !merged.some(m => (m.link || m.title) === (e.link || e.title)))]
    
    // Ensure we have exactly 30 newest items per category
    const annex1Items = combined.filter(n => n.category === 'annex1')
      .sort((a, b) => b.date - a.date)
      .slice(0, 30)
    const fdaItems = combined.filter(n => n.category === 'fda')
      .sort((a, b) => b.date - a.date)
      .slice(0, 30)
    const gxpItems = combined.filter(n => n.category === 'gxp')
      .sort((a, b) => b.date - a.date)
      .slice(0, 30)
    
    const finalNews = [...annex1Items, ...fdaItems, ...gxpItems]
    setNews(finalNews)
    setLastRefresh(Date.now())
    return finalNews
  } catch (error) {
    console.error('Failed to refresh news from remote:', error)
    return getNews()
  }
}

export function isNewsStale(): boolean {
  const last = getLastRefresh()
  if (!last) return true
  return (Date.now() - last) > NEWS_TTL_MS
}
