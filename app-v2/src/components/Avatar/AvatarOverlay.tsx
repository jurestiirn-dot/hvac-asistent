import React from 'react'
import ProfessorAvatar from './ProfessorAvatar'
import { useAvatar } from '../../contexts/AvatarContext'

export default function AvatarOverlay() {
  const { state } = useAvatar()
  const [yaw, setYaw] = React.useState(0)
  const ref = React.useRef<HTMLDivElement | null>(null)

  // Compute head yaw towards lookAt target, relative to avatar center
  React.useEffect(() => {
    if (!ref.current || !state.lookAt) { setYaw(0); return }
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = state.lookAt.x - cx
    const dy = state.lookAt.y - cy
    // Map screen vector to yaw (-0.5..0.5 rad)
    const angle = Math.atan2(dx, Math.abs(dy) + 1)
    const clamped = Math.max(-0.5, Math.min(0.5, angle))
    setYaw(clamped)
  }, [state.lookAt, state.pos.x, state.pos.y])

  // Only show the floating overlay during quiz mode to avoid overlapping
  if (!state.visible || state.mode !== 'quiz') return null
  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: Math.round(state.pos.x),
        top: Math.round(state.pos.y),
        transform: 'translate(-50%, -50%)',
        // Keep below the assistant panel (zIndex ~1199) and the toggle button (~1200)
        zIndex: 1100,
        pointerEvents: 'none',
      }}
    >
      <ProfessorAvatar emotion={state.emotion} size={76} headYaw={yaw} />
    </div>
  )
}
