import React, { useEffect, useRef } from 'react'

interface ParticleEffectProps {
  type: 'correct' | 'incorrect' | 'celebration'
  trigger: boolean
}

export function ParticleEffect({ type, trigger }: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (!trigger) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      life: number
      color: string
      size: number
    }> = []
    
    // Create particles based on type
    const particleCount = type === 'celebration' ? 100 : 30
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    
    const colors = type === 'correct' 
      ? ['#10b981', '#34d399', '#6ee7b7']
      : type === 'incorrect'
      ? ['#ef4444', '#f87171', '#fca5a5']
      : ['#7c3aed', '#a78bfa', '#06b6d4', '#22c55e']
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = type === 'celebration' ? 5 + Math.random() * 5 : 3 + Math.random() * 3
      
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'celebration' ? 2 : 0),
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4
      })
    }
    
    let animationId: number
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((p, index) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1 // gravity
        p.life -= 0.01
        
        if (p.life <= 0) {
          particles.splice(index, 1)
          return
        }
        
        // Draw particle with glow
        ctx.save()
        ctx.globalAlpha = p.life
        
        // Glow effect
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        gradient.addColorStop(0, p.color)
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fill()
        
        // Core particle
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.restore()
      })
      
      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate)
      }
    }
    
    animate()
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [trigger, type])
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  )
}

// Floating score animation
export function ScoreFloater({ score, total, position }: { score: number; total: number; position: { x: number; y: number } }) {
  const percentage = (score / total) * 100
  const passed = percentage >= 55
  
  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: passed ? '#10b981' : '#ef4444',
          textShadow: `0 0 20px ${passed ? '#10b981' : '#ef4444'}`,
          animation: 'floatUp 2s ease-out forwards'
        }}
      >
        {percentage.toFixed(0)}%
      </div>
      <style>
        {`
          @keyframes floatUp {
            0% {
              opacity: 0;
              transform: translateY(0) scale(0.5);
            }
            50% {
              opacity: 1;
              transform: translateY(-50px) scale(1.2);
            }
            100% {
              opacity: 0;
              transform: translateY(-100px) scale(0.8);
            }
          }
        `}
      </style>
    </div>
  )
}

// Ripple effect on click
export function ClickRipple({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width: 0,
        height: 0,
        borderRadius: '50%',
        border: '2px solid #7c3aed',
        animation: 'ripple 0.6s ease-out',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      <style>
        {`
          @keyframes ripple {
            0% {
              width: 0;
              height: 0;
              opacity: 1;
              margin-left: 0;
              margin-top: 0;
            }
            100% {
              width: 200px;
              height: 200px;
              opacity: 0;
              margin-left: -100px;
              margin-top: -100px;
            }
          }
        `}
      </style>
    </div>
  )
}
