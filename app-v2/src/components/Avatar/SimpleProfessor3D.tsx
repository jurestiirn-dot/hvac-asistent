import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export type ProfessorEmotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'mischievous' | 'thinking' | 'speaking'

type Props = {
  emotion?: ProfessorEmotion
  width?: number
  height?: number
  className?: string
  headYaw?: number // -0.5..0.5 rad suggested
}

// A lightweight 3D “professor” built from primitives, animated by lerping to target params per emotion.
// No external assets. Designed to be small and safe to ship.
export default function SimpleProfessor3D({ emotion = 'neutral', width = 72, height = 72, className, headYaw = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef({
    // current animation parameters
    browTiltL: 0,
    browTiltR: 0,
    eyeSquint: 0,
    mouthCurve: 0, // -1 frown, 0 flat, +1 smile
    mouthOpen: 0, // 0..1
    headTilt: 0,
    bounce: 0,
  })
  const headYawRef = useRef(0)
  headYawRef.current = headYaw
  const targetRef = useRef({
    browTiltL: 0,
    browTiltR: 0,
    eyeSquint: 0,
    mouthCurve: 0,
    mouthOpen: 0,
    headTilt: 0,
    bounce: 0,
  })

  useEffect(() => {
    const target = targetRef.current
    // Map emotion to target parameters
    switch (emotion) {
      case 'happy':
        target.browTiltL = -0.2
        target.browTiltR = -0.2
        target.eyeSquint = 0.15
        target.mouthCurve = 1
        target.mouthOpen = 0.15
        target.headTilt = 0.1
        target.bounce = 1
        break
      case 'sad':
        target.browTiltL = 0.25
        target.browTiltR = -0.25
        target.eyeSquint = 0.05
        target.mouthCurve = -1
        target.mouthOpen = 0.05
        target.headTilt = -0.08
        target.bounce = 0
        break
      case 'angry':
        target.browTiltL = 0.5
        target.browTiltR = -0.5
        target.eyeSquint = 0.35
        target.mouthCurve = -0.4
        target.mouthOpen = 0.1
        target.headTilt = 0
        target.bounce = 0.2
        break
      case 'mischievous':
        target.browTiltL = -0.4
        target.browTiltR = 0.2
        target.eyeSquint = 0.2
        target.mouthCurve = 0.5
        target.mouthOpen = 0.05
        target.headTilt = 0.15
        target.bounce = 0.6
        break
      case 'thinking':
        target.browTiltL = 0.25
        target.browTiltR = 0.25
        target.eyeSquint = 0.1
        target.mouthCurve = 0
        target.mouthOpen = 0.02
        target.headTilt = 0.2
        target.bounce = 0.3
        break
      case 'speaking':
        target.browTiltL = 0
        target.browTiltR = 0
        target.eyeSquint = 0.05
        target.mouthCurve = 0.2
        target.mouthOpen = 0.7
        target.headTilt = 0
        target.bounce = 0.4
        break
      default:
        target.browTiltL = 0
        target.browTiltR = 0
        target.eyeSquint = 0
        target.mouthCurve = 0
        target.mouthOpen = 0.05
        target.headTilt = 0
        target.bounce = 0.15
    }
  }, [emotion])

  useEffect(() => {
    if (!containerRef.current) return

  const T: any = THREE // loosen types to work with the project's lightweight three.d.ts stub
  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 0.4, 3.2)

  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2))
    renderer.setSize(width, height)
    containerRef.current.appendChild(renderer.domElement)

    // Lighting
  const amb = new T.AmbientLight(0xffffff, 0.7)
    scene.add(amb)
  const dir = new T.DirectionalLight(0xffffff, 0.6)
    dir.position.set(2, 3, 4)
    scene.add(dir)

    // Group for head and body
  const root = new T.Object3D()
    scene.add(root)

    // Body (lab coat)
  const body = new T.Object3D()
  const coatMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.05 })
  const shirtMat = new T.MeshStandardMaterial({ color: 0xb6c7f0, roughness: 0.8, metalness: 0.02 })
  const skinMat = new T.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.8 })
  const darkMat = new T.MeshStandardMaterial({ color: 0x20222a, roughness: 0.6 })
  const accentMat = new T.MeshStandardMaterial({ color: 0x7c3aed })

  const torso = new T.Mesh(new T.BoxGeometry(0.9, 1.1, 0.5), coatMat)
    torso.position.set(0, -0.2, 0)
    body.add(torso)

    // Shirt visible at collar
  const shirt = new T.Mesh(new T.BoxGeometry(0.6, 0.6, 0.45), shirtMat)
    shirt.position.set(0, 0.2, 0)
    body.add(shirt)

    // Simple collar triangles (planes)
  const collarGeo = new T.PlaneGeometry(0.35, 0.25)
  const collarL = new T.Mesh(collarGeo, coatMat)
    collarL.position.set(-0.2, 0.45, 0.26)
    collarL.rotation.y = Math.PI * 0.06
    body.add(collarL)
  const collarR = collarL.clone()
    collarR.position.x = 0.2
    collarR.rotation.y = -Math.PI * 0.06
    body.add(collarR)

    // Pocket with pen
  const pocket = new T.Mesh(new T.PlaneGeometry(0.25, 0.18), new T.MeshStandardMaterial({ color: 0xeeeeee }))
    pocket.position.set(0.25, 0.1, 0.26)
    body.add(pocket)
  const pen = new T.Mesh(new T.BoxGeometry(0.04, 0.14, 0.04), accentMat)
    pen.position.set(0.32, 0.2, 0.26)
    body.add(pen)

    // Arms
  const armGeo = new T.CapsuleGeometry(0.08, 0.5, 2, 8)
  const armL = new T.Mesh(armGeo, coatMat)
    armL.position.set(-0.55, 0.05, 0)
    armL.rotation.z = Math.PI * 0.15
  const armR = new T.Mesh(armGeo, coatMat)
    armR.position.set(0.55, 0.05, 0)
    armR.rotation.z = -Math.PI * 0.15
    body.add(armL); body.add(armR)

    root.add(body)

    // Head group
  const headGroup = new T.Object3D()
    headGroup.position.set(0, 0.85, 0)
    root.add(headGroup)

  const head = new T.Mesh(new T.SphereGeometry(0.38, 24, 24), skinMat)
    head.position.set(0, 0, 0)
    headGroup.add(head)

    // Hair cap
  // Types can be picky about SphereGeometry extended args, so use a scaled sphere as a cap
  const hair = new T.Mesh(new T.SphereGeometry(0.4, 24, 24), darkMat)
  hair.scale.set(1, 0.7, 1)
  hair.position.set(0, 0.12, -0.02)
    headGroup.add(hair)

    // Eyes
  const eyeGeo = new T.SphereGeometry(0.06, 16, 16)
  const eyeMat = new T.MeshStandardMaterial({ color: 0x222222 })
  const eyeL = new T.Mesh(eyeGeo, eyeMat)
  const eyeR = new T.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.14, 0.06, 0.34)
    eyeR.position.set(0.14, 0.06, 0.34)
    headGroup.add(eyeL, eyeR)

    // Brows
  const browGeo = new T.BoxGeometry(0.22, 0.04, 0.04)
  const browMat = new T.MeshStandardMaterial({ color: 0x2a2b31 })
  const browL = new T.Mesh(browGeo, browMat)
  const browR = new T.Mesh(browGeo, browMat)
    browL.position.set(-0.14, 0.18, 0.32)
    browR.position.set(0.14, 0.18, 0.32)
    headGroup.add(browL, browR)

    // Glasses
  const rimMat = new T.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.8, roughness: 0.3 })
  const ringGeo = new T.TorusGeometry(0.12, 0.01, 8, 24)
  const ringL = new T.Mesh(ringGeo, rimMat)
  const ringR = new T.Mesh(ringGeo, rimMat)
    ringL.position.set(-0.14, 0.08, 0.28)
    ringR.position.set(0.14, 0.08, 0.28)
    headGroup.add(ringL, ringR)
  const bridge = new T.Mesh(new T.BoxGeometry(0.1, 0.01, 0.02), rimMat)
    bridge.position.set(0, 0.08, 0.28)
    headGroup.add(bridge)

    // Mouth: use thin torus segment that we can rotate/scale to smile/frown
  const mouth = new T.Mesh(new T.TorusGeometry(0.12, 0.02, 8, 24, Math.PI), new T.MeshStandardMaterial({ color: 0x30323a }))
    mouth.position.set(0, -0.1, 0.32)
    headGroup.add(mouth)

    // Shadow/base
  const base = new T.Mesh(new T.CircleGeometry(0.9, 32), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }))
    base.rotation.x = -Math.PI / 2
    base.position.y = -0.9
    root.add(base)

    let running = true
    let t = 0

    function animate() {
      if (!running) return
      requestAnimationFrame(animate)
      t += 0.016

      // Smoothly approach target params
      const cur = stateRef.current
      const tar = targetRef.current
      const lerp = (a: number, b: number, s: number) => a + (b - a) * s
      const speed = 0.08
      cur.browTiltL = lerp(cur.browTiltL, tar.browTiltL, speed)
      cur.browTiltR = lerp(cur.browTiltR, tar.browTiltR, speed)
      cur.eyeSquint = lerp(cur.eyeSquint, tar.eyeSquint, speed)
      cur.mouthCurve = lerp(cur.mouthCurve, tar.mouthCurve, speed)
      cur.mouthOpen = lerp(cur.mouthOpen, tar.mouthOpen, speed)
      cur.headTilt = lerp(cur.headTilt, tar.headTilt, speed)
      cur.bounce = lerp(cur.bounce, tar.bounce, speed)

      // Idle bounce
      const bounceOffset = Math.sin(t * 2.2) * 0.03 * cur.bounce
      root.position.y = bounceOffset

      // Head tilt and micro movement
      headGroup.rotation.z = cur.headTilt
  const micro = Math.sin(t * 0.8) * 0.05 * (0.3 + cur.bounce)
  headGroup.rotation.y = micro + headYawRef.current

      // Brows
      browL.rotation.z = cur.browTiltL
      browR.rotation.z = -cur.browTiltR

      // Eyes squint via scaleY
      const eyeScale = 1 - cur.eyeSquint
      eyeL.scale.y = eyeScale
      eyeR.scale.y = eyeScale

      // Mouth smile/frown by rotating torus up/down and opening via scale
  const mouthT = (cur.mouthCurve + 1) / 2 // 0..1
  mouth.rotation.z = -0.8 + mouthT * (0.8 - -0.8)
      const openScale = 1 + cur.mouthOpen * 0.6
      mouth.scale.set(1, openScale, 1)

      // Hands subtle sway (like explaining)
      const armSwing = Math.sin(t * 1.5) * 0.15 * (0.2 + cur.bounce)
      armL.rotation.z = Math.PI * 0.15 + armSwing
      armR.rotation.z = -Math.PI * 0.15 - armSwing

      renderer.render(scene, camera)
    }
    animate()

    function onResize() {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const w = rect.width || width
      const h = rect.height || height
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      running = false
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      scene.clear()
      if (containerRef.current && renderer.domElement.parentElement === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [width, height])

  return <div className={className} ref={containerRef} style={{ width, height }} />
}
