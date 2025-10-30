import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProfessoricaAvatar from './Avatar/ProfessoricaAvatar'
import { chatCompletion, isChatAvailable, setChatApiKey, type ChatMessage } from '../services/chat'
import { useAuth } from '../context/AuthContext'


export default function ProfesoricaAnnex(){
  const { isAuthenticated } = useAuth()
  
  // Ne prikaži komponente, če uporabnik ni prijavljen
  if (!isAuthenticated) return null

  const [open, setOpen] = React.useState(false)
  const [fullScreen, setFullScreen] = React.useState(false)
  const [chatAvailable, setChatAvailable] = React.useState(false)
  const [conversation, setConversation] = React.useState<Array<ChatMessage>>([])
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [emotion, setEmotion] = React.useState<'neutral'|'happy'|'speaking'>('neutral')
  const [lastTokens, setLastTokens] = React.useState<number|null>(null)
  const [soundEnabled, setSoundEnabled] = React.useState(true)
  const [voiceEnabled, setVoiceEnabled] = React.useState(false)
  const [voices, setVoices] = React.useState<any[]>([])
  const [voiceURI, setVoiceURI] = React.useState<string | null>(null)
  const [isListening, setIsListening] = React.useState(false)
  const [isSpeaking, setIsSpeaking] = React.useState(false)
  const recognitionRef = React.useRef<any>(null)

  React.useEffect(()=>{ isChatAvailable().then(setChatAvailable).catch(()=>setChatAvailable(false)) }, [])

  // Persist conversation locally
  React.useEffect(()=>{
    try {
      const raw = localStorage.getItem('profesorica_chat_v1')
      if (raw) setConversation(JSON.parse(raw))
      const soundPref = localStorage.getItem('profesorica_sound')
      if (soundPref !== null) setSoundEnabled(soundPref === 'true')
      const voicePref = localStorage.getItem('profesorica_voice')
      if (voicePref !== null) setVoiceEnabled(voicePref === 'true')
      const savedURI = localStorage.getItem('profesorica_voice_uri')
      if (savedURI) setVoiceURI(savedURI)
    } catch {}
  }, [])

  // Load available voices and keep in sync
  React.useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices() || []
      setVoices(list)
      if (voiceURI && !list.some(v => v.voiceURI === voiceURI)) {
        // previously saved voice no longer available
        setVoiceURI(null)
      }
    }
    loadVoices()
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
    const t = setTimeout(loadVoices, 300)
    return () => { clearTimeout(t) }
  }, [voiceURI])
  React.useEffect(()=>{
    try {
      localStorage.setItem('profesorica_chat_v1', JSON.stringify(conversation.slice(-30)))
      // Clean up old gender preference (no longer used)
      localStorage.removeItem('profesorica_voice_gender')
    } catch {}
  }, [conversation])

  React.useEffect(()=>{
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && fullScreen) setFullScreen(false) }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [fullScreen])

  // Audio notification helper
  const playNotificationSound = React.useCallback(() => {
    if (!soundEnabled) return
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.frequency.value = 800
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)
      osc.start(audioCtx.currentTime)
      osc.stop(audioCtx.currentTime + 0.2)
    } catch {}
  }, [soundEnabled])

  const toggleSound = () => {
    const newVal = !soundEnabled
    setSoundEnabled(newVal)
    localStorage.setItem('profesorica_sound', String(newVal))
  }

  const toggleVoice = () => {
    const newVal = !voiceEnabled
    setVoiceEnabled(newVal)
    localStorage.setItem('profesorica_voice', String(newVal))
    if (!newVal && isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Text-to-Speech
  const speakText = React.useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    
    const list = window.speechSynthesis.getVoices()
    let selectedVoice: any = null
    
    // If user explicitly selected a voice, use it
    if (voiceURI) {
      selectedVoice = list.find(v => v.voiceURI === voiceURI) || null
    }
    
    // Otherwise look for Microsoft Lado (Slovenian male voice) - only reliable Slovenian voice
    if (!selectedVoice) {
      // Microsoft Lado is the standard Slovenian TTS voice
      selectedVoice = list.find(v => 
        v.name.includes('Lado') && v.lang?.toLowerCase().startsWith('sl')
      )
      
      // Fallback: any Slovenian voice
      if (!selectedVoice) {
        selectedVoice = list.find(v => v.lang?.toLowerCase().startsWith('sl'))
      }
      
      // Last resort: English voice (but warn user)
      if (!selectedVoice) {
        console.warn('[TTS] Ni slovenskega glasu! Dodajte Microsoft Lado v Windows nastavitvah.')
        selectedVoice = list.find(v => v.lang?.toLowerCase().startsWith('en'))
      }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice
      console.log('[TTS] Using voice:', selectedVoice.name, selectedVoice.lang)
    }
    
    utterance.lang = 'sl-SI'
    utterance.rate = 1.0
    utterance.pitch = 1.0 // neutral pitch for Lado
    utterance.volume = 0.9
    
    utterance.onstart = () => { setIsSpeaking(true); setEmotion('speaking') }
    utterance.onend = () => { setIsSpeaking(false); setEmotion('neutral') }
    utterance.onerror = () => { setIsSpeaking(false); setEmotion('neutral') }
    
    window.speechSynthesis.speak(utterance)
  }, [voiceEnabled, voiceURI])

  // Speech-to-Text
  const startListening = React.useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Prepoznava govora ni podprta v tem brskalniku. Uporabi Chrome ali Edge.')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.lang = 'sl-SI'
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      
      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setEmotion('happy')
      }
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
        setEmotion('neutral')
      }
      
      recognitionRef.current.onerror = () => {
        setIsListening(false)
        setEmotion('neutral')
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
        setEmotion('neutral')
      }
    }
    
    recognitionRef.current.start()
  }, [])

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setEmotion('neutral')
  }

  const send = React.useCallback(async () => {
    const q = input.trim(); if (!q || sending) return
    setSending(true); setEmotion('speaking')
    const history: ChatMessage[] = [...conversation, { role: 'user' as const, content: q }]
    setConversation(history)
    try {
      const res = await chatCompletion(history)
      const a: ChatMessage = { role: 'assistant', content: res.answer }
      setConversation(prev => [...prev, a])
      setLastTokens(res.tokensUsed?.totalTokenCount ?? null)
      playNotificationSound()
      speakText(res.answer)
    } catch (err: any) {
      setConversation(prev => [...prev, { role:'assistant', content: `Napaka: ${err?.message || 'neznano'}` }])
    } finally {
      setSending(false); setInput(''); setEmotion('neutral')
    }
  }, [input, sending, conversation, playNotificationSound, speakText])

  return (
    <div style={{ position: 'fixed', left: 32, bottom: 146, zIndex: 1200 }}>
      {!open && (
        <div style={{ position:'relative' }}>
          <button
            onClick={()=> setOpen(true)}
            style={{
              width: 102,
              height: 102,
              borderRadius: '50%',
              background: 'radial-gradient(60% 60% at 50% 40%, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)',
              border: '3px solid rgba(255,255,255,0.22)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 6px rgba(124,58,237,0.18), 0 14px 36px rgba(2,6,23,0.7), 0 0 24px rgba(99,102,241,0.35)'
            }}
            title="Profesorica Annex (AI)"
          >
            <ProfessoricaAvatar emotion={emotion} size={84} />
          </button>
          {/* AI badge + glow */}
          <span style={{ position:'absolute', right:-2, bottom:-2, background:'#0ea5e9', color:'#021018', fontWeight:800, fontSize:11, padding:'4px 8px', borderRadius:999, border:'2px solid #0b1220', boxShadow:'0 6px 16px rgba(14,165,233,0.6)' }}>AI</span>
          <span style={{ position:'absolute', inset:-10, borderRadius:999, pointerEvents:'none', boxShadow:'0 0 30px 12px rgba(99,102,241,0.35)' }} />
          <style>{`@keyframes pulseAI{0%{box-shadow:0 0 0 0 rgba(99,102,241,0.35)}70%{box-shadow:0 0 0 14px rgba(99,102,241,0)}100%{box-shadow:0 0 0 0 rgba(99,102,241,0)}}`}</style>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            onClick={()=> setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position:'fixed', inset:0, background:'rgba(2,6,23,0.38)', backdropFilter:'blur(2px)', zIndex: 1400 }}
          >
            <motion.div
              onClick={(e)=> e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type:'spring', damping: 20, stiffness: 240 }}
              style={fullScreen ? { position:'absolute', inset:24, background:'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))', border:'2px solid rgba(124,58,237,0.5)', borderRadius:20, overflow:'hidden', boxShadow:'0 30px 70px rgba(124,58,237,0.3), 0 10px 30px rgba(0,0,0,0.5)' } : { position:'absolute', bottom: 130, right: 32, width:'min(640px,94vw)', background:'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))', border:'2px solid rgba(124,58,237,0.5)', borderRadius:20, overflow:'hidden', boxShadow:'0 30px 70px rgba(124,58,237,0.3), 0 10px 30px rgba(0,0,0,0.5)' }}
            >
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'2px solid rgba(124,58,237,0.4)', background: fullScreen ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.08))' : 'rgba(124,58,237,0.08)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <ProfessoricaAvatar emotion={emotion} size={fullScreen ? 64 : 54} />
                  <div>
                    <div style={{ fontWeight:800, fontSize: fullScreen ? 24 : 18, background:'linear-gradient(90deg, #a78bfa, #06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Profesorica Annex</div>
                    <div style={{ fontSize: fullScreen ? 15 : 13, color:'#94a3b8', fontWeight:500 }}>
                      {fullScreen ? 'GMP • EU Annex 1 • ISO 14644 • Validacija • Kvalifikacija' : 'AI pomočnica (pogovor)'}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap: 'wrap' }}>
                  {lastTokens && (
                    <div style={{ fontSize:11, color:'#64748b', padding:'4px 8px', border:'1px solid rgba(148,163,184,0.2)', borderRadius:6, background:'rgba(15,23,42,0.6)' }}>
                      {lastTokens} tokens
                    </div>
                  )}
                  <button className={'button'} onClick={toggleSound} title={soundEnabled ? 'Izklopi zvok' : 'Vklopi zvok'}>
                    {soundEnabled ? '🔔' : '🔕'}
                  </button>
                  <button className={'button'} onClick={toggleVoice} title={voiceEnabled ? 'Izklopi glas AI' : 'Vklopi glas AI'}>
                    {voiceEnabled ? '🗣️' : '🔇'}
                  </button>
                  <button className={'button'} onClick={()=>{ setConversation([]); setLastTokens(null); }}>Počisti</button>
                  <button className={'button'} onClick={()=> setFullScreen(fs=>!fs)}>{fullScreen ? '🗗 Zapusti' : '⛶ Celozaslonsko'}</button>
                  <button className={'button'} onClick={()=> setOpen(false)}>✕ Zapri</button>
                </div>
              </div>

              {/* Chat area */}
              <div style={{ padding: fullScreen ? 24 : 16, display:'grid', gridTemplateRows:'1fr auto', gap: fullScreen ? 18 : 12, height: fullScreen ? 'calc(100% - 102px)' : 420 }}>
                {/* Messages */}
                <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap: fullScreen ? 14 : 10, paddingRight:8 }}>
                  {conversation.length===0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap: fullScreen ? 16 : 12, padding: fullScreen ? 24 : 0 }}>
                      <div style={{ color:'#94a3b8', fontSize: fullScreen ? 15 : 13, marginBottom:8, lineHeight:1.6 }}>
                        {fullScreen ? (
                          <>
                            <div style={{ fontSize:18, fontWeight:700, color:'#a78bfa', marginBottom:12 }}>
                              🎓 Dobrodošli pri validacijski učiteljici
                            </div>
                            <div style={{ marginBottom:16 }}>
                              Specializirana sem za EU GMP Annex 1, ISO 14644, kvalifikacijo čistih prostorov, HVAC sistemov in procesov aseptične proizvodnje.
                            </div>
                            <div style={{ fontSize:13, color:'#64748b', marginBottom:12 }}>
                              Izberite temo ali vprašajte:
                            </div>
                          </>
                        ) : (
                          'Začni pogovor s klikom na primer vprašanja ali vpiši svoje:'
                        )}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns: fullScreen ? 'repeat(2, 1fr)' : '1fr', gap: fullScreen ? 12 : 10 }}>
                        {[
                          { q: 'Razloži razliko med Grade A in Grade B', icon: '🏭', category: 'Klasifikacija' },
                          { q: 'Kdaj potrebujemo Media Fill validacijo?', icon: '🧪', category: 'Validacija' },
                          { q: 'Kako pravilno preverimo HEPA filtre?', icon: '💨', category: 'HVAC' },
                          { q: 'Kakšne so zahteve za diferencialni tlak?', icon: '📊', category: 'Parametri' },
                          ...(fullScreen ? [
                            { q: 'Razloži Contamination Control Strategy', icon: '🛡️', category: 'CCS' },
                            { q: 'Kako izvesti IQ, OQ, PQ kvalifikacijo?', icon: '✅', category: 'Kvalifikacija' }
                          ] : [])
                        ].map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => { setInput(prompt.q); setTimeout(() => send(), 50); }}
                            style={{
                              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.08))',
                              border: '1px solid rgba(124,58,237,0.3)',
                              borderRadius: fullScreen ? 12 : 10,
                              padding: fullScreen ? '16px 18px' : '12px 14px',
                              color: '#a78bfa',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: fullScreen ? 14 : 13,
                              transition: 'all 0.2s',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => { 
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.20), rgba(99,102,241,0.14))';
                              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => { 
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.08))';
                              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {fullScreen && (
                              <div style={{ fontSize:10, fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                                {prompt.icon} {prompt.category}
                              </div>
                            )}
                            <div>{fullScreen ? '' : '💡 '}{prompt.q}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {conversation.map((m, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        alignSelf: m.role==='user' ? 'end' : 'start', 
                        maxWidth: fullScreen ? '70%' : '80%', 
                        background: m.role==='user' 
                          ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' 
                          : 'linear-gradient(135deg,#6d28d9,#a78bfa)', 
                        color:'#fff', 
                        padding: fullScreen ? '14px 16px' : '10px 12px', 
                        borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', 
                        border:'1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        fontSize: fullScreen ? 15 : 14,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {m.content}
                    </div>
                  ))}
                  {sending && (
                    <div style={{ alignSelf: 'start', display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ fontSize: fullScreen ? 13 : 12, color:'#a78bfa', fontWeight:600, paddingLeft:4 }}>
                        Razmišljam...
                      </div>
                      <div style={{ 
                        maxWidth: '80%', 
                        background:'linear-gradient(135deg,#6d28d9,#a78bfa)', 
                        color:'#fff', 
                        padding: fullScreen ? '14px 16px' : '10px 12px', 
                        borderRadius:'16px 16px 16px 4px', 
                        border:'1px solid rgba(255,255,255,0.15)', 
                        display:'inline-flex', 
                        gap:5, 
                        boxShadow:'0 0 24px rgba(124,58,237,0.5)'
                      }}>
                        <span style={{ width: fullScreen ? 8 : 6, height: fullScreen ? 8 : 6, borderRadius:999, background:'#fff', opacity:.8, animation:'bounce 1s infinite' }} />
                        <span style={{ width: fullScreen ? 8 : 6, height: fullScreen ? 8 : 6, borderRadius:999, background:'#fff', opacity:.8, animation:'bounce 1s .15s infinite' }} />
                        <span style={{ width: fullScreen ? 8 : 6, height: fullScreen ? 8 : 6, borderRadius:999, background:'#fff', opacity:.8, animation:'bounce 1s .3s infinite' }} />
                        <style>{`@keyframes bounce{0%{transform:translateY(0)}50%{transform:translateY(-5px)}100%{transform:translateY(0)}}`}</style>
                      </div>
                    </div>
                  )}
                </div>
                {/* Input area */}
                <div style={{ display:'flex', gap: fullScreen ? 12 : 8, alignItems:'center' }}>
                  <button
                    className="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={sending}
                    title={isListening ? 'Ustavi snemanje' : 'Govori vprašanje'}
                    style={{ 
                      padding: fullScreen ? '14px 16px' : '10px 12px', 
                      background: isListening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined,
                      fontSize: fullScreen ? 16 : 14
                    }}
                  >
                    {isListening ? '⏹️' : '🎤'}
                  </button>
                  <input 
                    value={input} 
                    onChange={e=> setInput(e.target.value)} 
                    onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send() } }} 
                    placeholder={chatAvailable? (isListening ? 'Poslušam...' : (fullScreen ? 'Vprašajte o GMP, Annex 1, ISO 14644, validaciji, kvalifikaciji…' : 'Vpiši ali govori vprašanje…')) : 'Vnesi ključ in vprašanje…'} 
                    style={{ 
                      flex:1, 
                      padding: fullScreen ? '14px 16px' : '12px 14px', 
                      background:'#0b1220', 
                      color:'#fff', 
                      border:'2px solid rgba(148,163,184,0.3)', 
                      borderRadius: fullScreen ? 12 : 10,
                      fontSize: fullScreen ? 15 : 14,
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }} 
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)'}
                  />
                  {chatAvailable ? (
                    <button 
                      className="button" 
                      disabled={sending || isListening} 
                      onClick={send}
                      style={{ 
                        padding: fullScreen ? '14px 24px' : '12px 18px',
                        fontSize: fullScreen ? 15 : 14,
                        fontWeight: 700
                      }}
                    >
                      {sending? '⏳ Pošiljam…' : '📤 Pošlji'}
                    </button>
                  ) : (
                    <button 
                      className="button" 
                      onClick={async ()=>{
                        const key = window.prompt('Prilepi Google Gemini API ključ (ne shrani se trajno, samo za to sejo):')
                        if (!key) return
                        const ok = await setChatApiKey(key)
                        setChatAvailable(ok)
                      }}
                      style={{ padding: fullScreen ? '14px 20px' : '12px 16px' }}
                    >
                      🔑 Nastavi ključ
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
