import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'mischievous' | 'thinking' | 'speaking'
  width?: number
  height?: number
  headYaw?: number
  modelUrl?: string
  onUnavailable?: () => void
}

// Tries to load a GLB model and animate morph targets for basic emotions.
// If the file is missing or fails, it calls onUnavailable so the parent can fallback.
export default function HighFidelityProfessor({ emotion = 'neutral', width = 72, height = 72, headYaw = 0, modelUrl = '/src/content/avatars/professor.glb', onUnavailable }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const readyRef = useRef(false)
  const mixerRef = useRef<any>(null)
  const headRef = useRef<any>(null)
  const morphTargetsRef = useRef<Record<string, number[]>>({})

  useEffect(() => {
    let disposed = false
    ;(async () => {
      try {
        // Quick check for existence to fail fast
        const res = await fetch(modelUrl, { method: 'HEAD' })
        if (!res.ok) throw new Error('no-model')

        // Dynamic import without TS types
        const [{ GLTFLoader }] = await Promise.all([
          import('three/examples/jsm/loaders/GLTFLoader.js') as any,
        ])
        if (disposed) return

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
        camera.position.set(0, 0.4, 2.2)
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2))
        renderer.setSize(width, height)
        containerRef.current?.appendChild(renderer.domElement)

        const amb = new THREE.AmbientLight(0xffffff, 0.8)
        scene.add(amb)
        const dir = new THREE.DirectionalLight(0xffffff, 0.7)
        dir.position.set(3, 5, 4)
        scene.add(dir)

        const loader = new GLTFLoader()
        loader.load(modelUrl, (gltf: any) => {
          if (disposed) return
          const root = gltf.scene
          scene.add(root)

          // Try to find a head node and morph targets
          root.traverse((o: any) => {
            if (o.isMesh && o.morphTargetDictionary && o.morphTargetInfluences) {
              // Record dictionary for later indexes
              morphTargetsRef.current[o.name || 'mesh'] = o.morphTargetInfluences
              if (!headRef.current) headRef.current = o
            }
          })

          mixerRef.current = new (THREE as any).AnimationMixer(root)
          readyRef.current = true
        }, undefined, () => {
          onUnavailable?.()
        })

        let running = true
        let t = 0
        function animate() {
          if (!running) return
          requestAnimationFrame(animate)
          t += 0.016
          const h: any = headRef.current
          if (h) {
            // Blend head yaw with micro motion
            const micro = Math.sin(t * 0.9) * 0.05
            h.rotation.y = micro + headYaw
          }
          renderer.render(scene, camera)
        }
        animate()

        return () => {
          running = false
          disposed = true
          renderer.dispose()
          scene.clear()
          if (containerRef.current && renderer.domElement.parentElement === containerRef.current) {
            containerRef.current.removeChild(renderer.domElement)
          }
        }
      } catch (e) {
        onUnavailable?.()
      }
    })()
    return () => { disposed = true }
  }, [modelUrl, width, height, headYaw, onUnavailable])

  // Simple morph adjustments per emotion if available
  useEffect(() => {
    if (!readyRef.current) return
    const morph = morphTargetsRef.current
    const setInfluence = (name: string, v: number) => {
      for (const key in morph) {
        const arr = (morph as any)[key] as number[]
        const index = 0 // heuristic: first morph slot used uniformly
        if (arr && arr.length) arr[index] = v
      }
    }
    switch (emotion) {
      case 'speaking': setInfluence('MouthOpen', 0.7); break
      case 'happy': setInfluence('Smile', 0.8); break
      case 'sad': setInfluence('Frown', 0.8); break
      case 'angry': setInfluence('Angry', 0.5); break
      case 'mischievous': setInfluence('Smile', 0.5); break
      case 'thinking': setInfluence('MouthOpen', 0.15); break
      default: setInfluence('Neutral', 0)
    }
  }, [emotion])

  return <div ref={containerRef} style={{ width, height }} />
}
