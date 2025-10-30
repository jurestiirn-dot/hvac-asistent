import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function ThreeAccent({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const width = ref.current.clientWidth
    const height = 200
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 15
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    ref.current.appendChild(renderer.domElement)

    // Create HVAC-themed airflow particles
    const particleCount = 800
    const particles = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30 // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15 // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 // z
      
      // Flow velocity - particles move in wave pattern (simulating airflow)
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xa78bfa,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
    
    const particleSystem = new THREE.Points(particles, particleMaterial)
    scene.add(particleSystem)

    // Add HEPA filter visualization (grid/mesh)
    const filterGeometry = new THREE.PlaneGeometry(10, 8, 20, 16)
    const filterMaterial = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    })
    const filter = new THREE.Mesh(filterGeometry, filterMaterial)
    filter.position.z = -5
    scene.add(filter)

    const light = new THREE.DirectionalLight(0xffffff, 0.5)
    light.position.set(5, 5, 5)
    scene.add(light)
    const amb = new THREE.AmbientLight(0x404040)
    scene.add(amb)

    let mounted = true
    let time = 0
    
    function animate() {
      if (!mounted) return
      time += 0.01
      
      // Animate particles (airflow effect)
  const posAttr = particleSystem.geometry.attributes.position as THREE.BufferAttribute | undefined
  if (!posAttr) { requestAnimationFrame(animate); return }
  const positions = posAttr.array as Float32Array
      
      for (let i = 0; i < particleCount; i++) {
        // Create wave/flow pattern
        positions[i * 3] += velocities[i * 3] + Math.sin(time + i * 0.1) * 0.005
        positions[i * 3 + 1] += velocities[i * 3 + 1] + Math.cos(time + i * 0.15) * 0.003
        positions[i * 3 + 2] += velocities[i * 3 + 2]
        
        // Wrap around (continuous flow)
        if (positions[i * 3] > 15) positions[i * 3] = -15
        if (positions[i * 3] < -15) positions[i * 3] = 15
        if (positions[i * 3 + 1] > 8) positions[i * 3 + 1] = -8
        if (positions[i * 3 + 1] < -8) positions[i * 3 + 1] = 8
        if (positions[i * 3 + 2] > 10) positions[i * 3 + 2] = -10
        if (positions[i * 3 + 2] < -10) positions[i * 3 + 2] = 10
      }
      
  posAttr.needsUpdate = true
      
      // Subtle filter animation (breathing effect)
      filter.rotation.z = Math.sin(time * 0.5) * 0.02
      filter.material.opacity = 0.12 + Math.sin(time) * 0.03
      
      // Gentle camera movement
      camera.position.x = Math.sin(time * 0.3) * 0.5
      camera.position.y = Math.cos(time * 0.2) * 0.3
      camera.lookAt(0, 0, 0)
      
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    function onResize() {
      if (!ref.current) return
      const w = ref.current.clientWidth
      renderer.setSize(w, height)
      camera.aspect = w / height
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      mounted = false
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      scene.clear()
      if (ref.current && ref.current.contains(renderer.domElement)) ref.current.removeChild(renderer.domElement)
    }
  }, [])

  return <div className={className} ref={ref} style={{ width: '100%', height: 200, opacity: 0.7 }} />
}
