import React from 'react'
import Lottie from 'lottie-react'
import SimpleProfessor3D, { ProfessorEmotion } from './SimpleProfessor3D'
import HighFidelityProfessor from './HighFidelityProfessor'

type Props = {
  emotion?: ProfessorEmotion
  size?: number
  className?: string
  style?: React.CSSProperties
  headYaw?: number
  modelUrl?: string
}

// Chooses Lottie animation if a matching JSON exists, otherwise falls back to the 3D primitive avatar.
export default function ProfessorAvatar({ emotion = 'neutral', size = 68, className, style, headYaw = 0, modelUrl = '/src/content/avatars/professor.glb' }: Props) {
  const [data, setData] = React.useState<any | null>(null)
  const [loadedKey, setLoadedKey] = React.useState<string>('')
  const [useHiFi, setUseHiFi] = React.useState<boolean>(false)

  React.useEffect(() => {
    let mounted = true
    const key = `professor-${emotion}`
    setLoadedKey(key)
    // Look for optional per-emotion Lottie files: /src/content/animations/avatars/professor-happy.json
    fetch(`/src/content/animations/avatars/${key}.json`)
      .then(r => (r.ok ? r.json() : Promise.reject('no-file')))
      .then(json => { if (mounted && loadedKey === key) setData(json) })
      .catch(() => { if (mounted && loadedKey === key) setData(null) })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion])

  // Probe for GLB once
  React.useEffect(() => {
    let alive = true
    fetch(modelUrl, { method: 'HEAD' })
      .then(r => { if (!alive) return; setUseHiFi(r.ok) })
      .catch(() => { if (!alive) return; setUseHiFi(false) })
    return () => { alive = false }
  }, [modelUrl])

  return (
    <div className={className} style={{ width: size, height: size, ...style }}>
      {useHiFi ? (
        <HighFidelityProfessor emotion={emotion} width={size} height={size} headYaw={headYaw} modelUrl={modelUrl} onUnavailable={() => setUseHiFi(false)} />
      ) : data ? (
        <Lottie animationData={data} loop={emotion !== 'speaking'} style={{ width: size, height: size }} />
      ) : (
        <SimpleProfessor3D emotion={emotion} width={size} height={size} headYaw={headYaw} />
      )}
    </div>
  )
}
