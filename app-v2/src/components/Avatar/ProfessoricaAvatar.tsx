import React from 'react'

export type ProfessoricaEmotion = 'neutral' | 'happy' | 'speaking'

/**
 * Simple, lightweight SVG avatar of a female scientist in a white lab coat.
 * - Blinks every few seconds
 * - Waves when emotion === 'speaking'
 */
export default function ProfessoricaAvatar({ emotion = 'neutral', size = 68, className, style }: { emotion?: ProfessoricaEmotion; size?: number; className?: string; style?: React.CSSProperties }) {
  const [blink, setBlink] = React.useState(false)
  React.useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 2800 + Math.random()*1200)
    return () => clearInterval(id)
  }, [])

  const isSpeaking = emotion === 'speaking'
  const eyeH = blink ? 2 : 6

  return (
    <div className={className} style={{ width: size, height: size, ...style }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
        <style>{`
          @keyframes pulse { 0%{opacity:.25; transform:scale(1)} 50%{opacity:.6; transform:scale(1.12)} 100%{opacity:.25; transform:scale(1)} }
          @keyframes breathe { 0%{transform:translateY(0)} 50%{transform:translateY(-.8px)} 100%{transform:translateY(0)} }
          @keyframes glow { 0%{filter:drop-shadow(0 0 0 rgba(139,92,246,.0))} 50%{filter:drop-shadow(0 0 8px rgba(139,92,246,.55))} 100%{filter:drop-shadow(0 0 0 rgba(139,92,246,.0))} }
          .ring { transform-origin:50px 42px; }
          .ring.speaking { animation: pulse 1.2s ease-in-out infinite; }
          .torso { transform-origin:50px 68px; animation: breathe 3.2s ease-in-out infinite; }
          .face { animation: ${isSpeaking ? 'glow 1.3s ease-in-out infinite' : 'none'} }
        `}</style>

        {/* bg */}
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <radialGradient id="halo" cx="50%" cy="42%" r="36%">
            <stop offset="0%" stopColor="rgba(167,139,250,0.9)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0)" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" rx="12" fill="url(#g)" />

        {/* AI halo when speaking */}
        <circle className={`ring ${isSpeaking ? 'speaking' : ''}`} cx="50" cy="42" r="26" fill="url(#halo)" />

        {/* hair */}
        <ellipse cx="50" cy="38" rx="26" ry="22" fill="#3b365f" />
        {/* face */}
        <g className="face">
          <circle cx="50" cy="42" r="18" fill="#ffdfc8" />
          {/* eyes */}
          <rect x="40" y={40 - eyeH / 2} width="8" height={eyeH} rx="2" fill="#1f2937" />
          <rect x="52" y={40 - eyeH / 2} width="8" height={eyeH} rx="2" fill="#1f2937" />
          {/* pupils shimmer when not blinking */}
          {!blink && (
            <>
              <circle cx="43.7" cy="40" r="1.2" fill="#fff" opacity="0.7" />
              <circle cx="55.7" cy="40" r="1.2" fill="#fff" opacity="0.7" />
            </>
          )}
          {/* mouth: closed smile + speaking mouth overlay */}
          <path d="M40 50 Q50 58 60 50" stroke="#ef476f" strokeWidth="2.5" fill="none" opacity={isSpeaking?0.2:1} />
          {isSpeaking && (
            <ellipse cx="50" cy="52" rx="6.5" ry="4.2" fill="#ef476f" opacity="0.9">
              <animate attributeName="ry" values="3.2;5.2;3.2" dur="0.45s" repeatCount="indefinite" />
            </ellipse>
          )}
        </g>

        {/* lab coat + body */}
        <g className="torso">
          <path d="M26 80 L40 56 L60 56 L74 80 Z" fill="#ffffff" stroke="#e5e7eb" />
          <rect x="47" y="56" width="6" height="10" rx="1" fill="#e5e7eb" />
          {/* shirt */}
          <path d="M40 56 L50 68 L60 56 Z" fill="#8b5cf6" />
        </g>

        {/* waving hand (more dynamic when speaking) */}
        <g>
          <circle cx="76" cy="68" r="6" fill="#ffdfc8">
            <animateTransform attributeName="transform" type="rotate" from="0 76 68" to="16 76 68" begin="0s" dur={isSpeaking? '0.5s':'2s'} repeatCount={isSpeaking ? 'indefinite' : 'indefinite'} values={isSpeaking? '0 76 68;16 76 68;0 76 68':'0 76 68;6 76 68;0 76 68'} keyTimes="0;0.5;1" />
          </circle>
          <rect x="70" y="70" width="10" height="18" rx="3" fill="#ffffff" />
        </g>

        {/* subtle sparkle particles when speaking */}
        {isSpeaking && (
          <g opacity="0.8">
            <circle cx="24" cy="78" r="1.2" fill="#a78bfa">
              <animate attributeName="cy" values="78;68" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="30" cy="84" r="1.5" fill="#06b6d4">
              <animate attributeName="cy" values="84;70" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="78" cy="82" r="1.3" fill="#a78bfa">
              <animate attributeName="cy" values="82;72" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>
    </div>
  )
}
