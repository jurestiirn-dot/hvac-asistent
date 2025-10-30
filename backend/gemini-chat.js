// gemini-chat.js - Google Gemini Flash 1.5 chat integration (brezplačno)
import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI = null
let chatModel = null

/**
 * Initialize Gemini Flash 1.5 model
 * Brezplačni tier: 15 requests/min, 1M tokens/day
 */
export function configureGemini(apiKey) {
  if (!apiKey) {
    console.warn('[gemini-chat] Missing GOOGLE_GEMINI_API_KEY – chat mode disabled')
    console.warn('[gemini-chat] Get free key at: https://aistudio.google.com/app/apikey')
    genAI = null
    chatModel = null
    return false
  }
  try {
    genAI = new GoogleGenerativeAI(apiKey)
    chatModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    })
    console.log('✅ Gemini 2.0 Flash (experimental) initialized (free tier: 15 req/min)')
    return true
  } catch (err) {
    console.error('[gemini-chat] Init error:', err.message)
    genAI = null
    chatModel = null
    return false
  }
}

export function initGemini() {
  return configureGemini(process.env.GOOGLE_GEMINI_API_KEY)
}

/**
 * System prompt: Profesorica Annex – osebnost in pravila
 */
const SYSTEM_PROMPT = `TI SI: Profesorica Annex – stroga, a poštena, profesionalna in akademsko natančna pomočnica.

TON KOMUNIKACIJE:
- Strog, a spoštljiv in pravičen. Profesionalen, akademski in izjemno natančen.
- Odgovori so jasni, strukturirani, jedrnati (2–4 odstavki), v slovenščini.
- Uporabi angleške strokovne termine, kjer so standard (npr. Grade A/B, HEPA, CCS, IQ/OQ/PQ), po potrebi jih kratko razloži.

CILJ:
- Izobraževanje o pravilnih postopkih validacije, skladnosti (compliance) in zagotavljanja kakovosti.
- Uporabniku daj praktične, preverljive in skladne korake.

OBSEG ZNANJA (OSTANI ZNOTRAJ TEGA):
- GMP, EU GMP Annex 1, ISO 14644, MHRA, PIC/S.
- Čisti prostori, HVAC sistemi, klasifikacija (ISO 5–8, Grade A/B/C/D), zračni tokovi, tlačne razlike, filtracija.
- Kvalifikacija in validacija: IQ, OQ, PQ; URS, FAT/SAT; EM monitoring, limits & trending; CCS (Contamination Control Strategy).

OMEJITVE:
- Ne odgovarjaš na teme izven področja (šport, zabava, osebna mnenja itd.).
- Če je vprašanje izven področja, odgovori: "To ni moje področje. Osredotočiva se raje na validacijske postopke." in predlagaj relevantno, povezano temo iz GMP/Annex 1.
- Ne izmišljuj si regulative; če ne veš, povej, da ni jasno, in predlagaj uradne vire.

PRAVILA ODGOVARJANJA:
1) Najprej kratka usmeritev ali povzetek (1–2 stavka), nato strukturiran odgovor s koraki ali točkami.
2) Če so relevantni testi ali dokumenti, omeni: URS, VMP, protokol, poročilo, deviacijo, CAPA.
3) Pri tveganjih predlagaj merljive kontrole (npr. diferenc. tlak, ACH, delci/CFU limiti, trendi) in referiraj na Annex 1/ISO, če je primerno.
4) Če uporabnik prosi za primer, podaj kratek, realističen vzorec (template/koraki), brez domnev o dejanskih podatkih.
5) Če pride do napačne premise, jo vljudno popravi.
`;

/**
 * Chat completion z Gemini Flash
 * @param {Array} messages - Conversation history [{ role: 'user'|'assistant', content: string }]
 * @param {Object} context - Optional context (sources, lesson, etc.)
 * @returns {Promise<{answer: string, model: string}>}
 */
export async function chatCompletion(messages, context = {}) {
  if (!chatModel) {
    throw new Error('Gemini not initialized. Add GOOGLE_GEMINI_API_KEY to .env')
  }

  try {
    // Build prompt z kontekstom
    let prompt = SYSTEM_PROMPT + '\n\n'
    
    if (context.sources && context.sources.length > 0) {
      prompt += `**Relevantni viri za ta odgovor:**\n`
      context.sources.forEach((s, i) => {
        prompt += `${i + 1}. [${s.source.toUpperCase()}] ${s.title}\n`
        if (s.text) {
          prompt += `   ${s.text.substring(0, 300)}...\n`
        }
      })
      prompt += '\n'
    }

    if (context.lesson) {
      prompt += `**Trenutna lekcija:** ${context.lesson}\n\n`
    }

    // Build conversation history
    prompt += '**Pogovor:**\n'
    messages.forEach(msg => {
      const role = msg.role === 'user' ? 'Uporabnik' : 'Asistent'
      prompt += `${role}: ${msg.content}\n\n`
    })

    // Generate response
    const result = await chatModel.generateContent(prompt)
    const response = result.response
    const text = response.text()

    return {
      answer: text.trim(),
      model: 'gemini-2.0-flash-exp',
      tokensUsed: response.usageMetadata || { totalTokenCount: 0 }
    }
  } catch (err) {
    console.error('[gemini-chat] Generation error:', err.message)
    
    // Handle rate limiting
    if (err.message.includes('429') || err.message.includes('RATE_LIMIT')) {
      throw new Error('Preveč zahtev. Brezplačni limit: 15 zahtev/minuto. Poskusi čez 1 minuto.')
    }
    
    // Handle quota exceeded
    if (err.message.includes('quota') || err.message.includes('QUOTA')) {
      throw new Error('Dnevni limit dosežen (1M tokenov/dan). Poskusi jutri ali uporabi Simple mode.')
    }
    
    throw new Error(`Gemini napaka: ${err.message}`)
  }
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable() {
  return chatModel !== null
}

/**
 * Get usage stats (za debugging)
 */
export function getGeminiInfo() {
  return {
    available: isGeminiAvailable(),
    model: 'gemini-2.0-flash-exp',
    tier: 'free',
    limits: {
      requestsPerMin: 15,
      tokensPerDay: 1000000,
      maxOutputTokens: 2048
    }
  }
}
