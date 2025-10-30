// Test file to check if Three.js types are loading
import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, Mesh, MeshBasicMaterial } from 'three'

const scene = new Scene()
const camera = new PerspectiveCamera(75, 1, 0.1, 1000)
const renderer = new WebGLRenderer()

// These should have types if @types/three is working
const mesh = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshBasicMaterial({ color: 0x00ff00 })
)

console.log('Types test:', scene, camera, renderer, mesh)
