// Enhanced semantic search with fuzzy matching and synonym support
import { Row } from './search'

// GMP-specific synonyms and related terms
const SYNONYMS: Record<string, string[]> = {
  'ccs': ['contamination control strategy', 'strategija nadzora kontaminacije'],
  'grade a': ['aseptic zone', 'aseptična cona', 'grade a zona'],
  'grade b': ['background', 'ozadje', 'podporno območje'],
  'grade c': ['clean area', 'čisto območje'],
  'grade d': ['general clean area', 'splošno čisto območje'],
  'hvac': ['ventilation', 'prezračevanje', 'klimatizacija', 'air handling'],
  'hepa': ['high efficiency particulate air', 'filter hepa'],
  'monitoring': ['nadzor', 'spremljanje', 'measurement', 'meritve'],
  'personnel': ['osebje', 'staff', 'operators', 'operaterji'],
  'gowning': ['oblačenje', 'garments', 'protective clothing'],
  'media fill': ['process simulation', 'simulacija procesa', 'aseptic validation'],
  'bioburden': ['microbial load', 'mikrobiološka obremenitev'],
  'sterilization': ['sterilizacija', 'autoclave', 'depyrogenation'],
  'validation': ['validacija', 'qualification', 'kvalifikacija'],
  'cleaning': ['čiščenje', 'sanitization', 'dezinfekcija', 'disinfection'],
  'isolator': ['izolator', 'rabs', 'barrier system'],
  'particle': ['delec', 'particulate', 'aerosol'],
  'pressure': ['tlak', 'differential pressure', 'cascade'],
  'temperature': ['temperatura', 'temp control', 'nadzor temperature'],
  'humidity': ['vlaga', 'relative humidity', 'rh']
}

// Expand query with synonyms
function expandQuery(query: string): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const expanded = new Set(terms)
  
  terms.forEach(term => {
    Object.entries(SYNONYMS).forEach(([key, values]) => {
      if (key === term || values.some(v => v.includes(term))) {
        expanded.add(key)
        values.forEach(v => expanded.add(v))
      }
    })
  })
  
  return Array.from(expanded)
}

// Calculate similarity score between two strings (Levenshtein distance based)
function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()
  
  // Exact match
  if (aLower === bLower) return 1.0
  
  // Contains match
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.8
  
  // Word overlap
  const aWords = new Set(aLower.split(/\s+/))
  const bWords = new Set(bLower.split(/\s+/))
  const overlap = [...aWords].filter(w => bWords.has(w)).length
  const total = Math.max(aWords.size, bWords.size)
  
  return overlap / total
}

// Semantic search with fuzzy matching and synonym expansion
export function semanticSearch(rows: Row[], query: string, threshold = 0.3): Row[] {
  if (!query.trim()) return []
  
  const expandedTerms = expandQuery(query)
  
  const scored = rows.map(row => {
    let score = 0
    const text = row.text.toLowerCase()
    const title = row.title?.toLowerCase() || ''
    
    // Check each expanded term
    expandedTerms.forEach(term => {
      // Direct match in text (highest weight)
      if (text.includes(term)) {
        score += 3
      }
      
      // Title match (medium weight)
      if (title.includes(term)) {
        score += 2
      }
      
      // Fuzzy match in text
      const words = text.split(/\s+/)
      words.forEach(word => {
        const sim = similarity(word, term)
        if (sim > threshold) {
          score += sim
        }
      })
    })
    
    // Boost if multiple terms match
    const matchedTerms = expandedTerms.filter(t => text.includes(t) || title.includes(t))
    if (matchedTerms.length > 1) {
      score *= 1.5
    }
    
    return { row, score }
  })
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.row)
}

// Search by section/category
export function searchBySection(rows: Row[], section: string): Row[] {
  const sectionLower = section.toLowerCase()
  return rows.filter(row => 
    row.section?.toLowerCase().includes(sectionLower) ||
    row.title?.toLowerCase().includes(sectionLower)
  )
}

// Search by specific standard/code reference
export function searchByStandard(rows: Row[], standard: string): Row[] {
  const patterns = [
    /annex\s*1/i,
    /iso\s*\d+/i,
    /eu\s*gmp/i,
    /grade\s*[abcd]/i,
    /fda/i,
    /ich\s*[qe]\d+/i
  ]
  
  return rows.filter(row => {
    const text = row.text + ' ' + (row.title || '')
    return patterns.some(p => p.test(text) && text.toLowerCase().includes(standard.toLowerCase()))
  })
}
