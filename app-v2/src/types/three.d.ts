declare module 'three' {
  export class Scene {
    add(...object: Object3D[]): this
    remove(...object: Object3D[]): this
    clear(): void
    background: Color | null
  }

  export class Object3D {
    position: Vector3
    rotation: Euler
    scale: Vector3
    add(...object: Object3D[]): this
    remove(...object: Object3D[]): this
    traverse(callback: (object: Object3D) => void): void
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number)
    x: number
    y: number
    z: number
    set(x: number, y: number, z: number): this
    setScalar(scalar: number): this
    add(v: Vector3): this
    addVectors(a: Vector3, b: Vector3): this
    subVectors(a: Vector3, b: Vector3): this
    multiplyScalar(scalar: number): this
    distanceTo(v: Vector3): number
    clone(): Vector3
    length(): number
    normalize(): this
  }

  export class Euler {
    constructor(x?: number, y?: number, z?: number, order?: string)
    x: number
    y: number
    z: number
  }

  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material)
    geometry: BufferGeometry
    material: Material
    castShadow: boolean
    receiveShadow: boolean
  }

  export class Group extends Object3D {
    constructor()
    children: Object3D[]
  }

  export class BufferGeometry {
    dispose(): void
    setAttribute(name: string, attribute: BufferAttribute): this
    attributes: {
      position?: BufferAttribute
      [key: string]: BufferAttribute | undefined
    }
  }

  export class BufferAttribute {
    constructor(array: Float32Array | number[], itemSize: number)
    array: Float32Array | number[]
    needsUpdate: boolean
  }

  export class Material {
    dispose(): void
    opacity: number
    transparent: boolean
    side: number
  }

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: any)
    color: Color
    emissive: Color
    roughness: number
    metalness: number
    opacity: number
    transparent: boolean
  }

  export class MeshPhongMaterial extends Material {
    constructor(parameters?: any)
    color: Color
    emissive: Color
    specular: Color
    shininess: number
  }

  export class MeshBasicMaterial extends Material {
    constructor(parameters?: any)
    color: Color
  }

  export class PointsMaterial extends Material {
    constructor(parameters?: any)
    color: Color
    size: number
    blending: number
    transparent: boolean
  }

  export class Color {
    constructor(color?: string | number)
    setHex(hex: number): this
  }

  export const DoubleSide: number
  export const AdditiveBlending: number

  export class TorusKnotGeometry extends BufferGeometry {
    constructor(
      radius?: number,
      tube?: number,
      tubularSegments?: number,
      radialSegments?: number,
      p?: number,
      q?: number
    )
  }

  export class SphereGeometry extends BufferGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number)
  }

  export class BoxGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, depth?: number)
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number)
  }

  export class CylinderGeometry extends BufferGeometry {
    constructor(
      radiusTop?: number,
      radiusBottom?: number,
      height?: number,
      radialSegments?: number,
      heightSegments?: number,
      openEnded?: boolean
    )
  }

  export class Points extends Object3D {
    constructor(geometry?: BufferGeometry, material?: PointsMaterial)
    geometry: BufferGeometry
    material: PointsMaterial
  }

  export class PerspectiveCamera extends Object3D {
    constructor(fov?: number, aspect?: number, near?: number, far?: number)
    fov: number
    aspect: number
    near: number
    far: number
    updateProjectionMatrix(): void
    lookAt(vector: Vector3 | number, y?: number, z?: number): void
  }

  export class WebGLRenderer {
    constructor(parameters?: any)
    domElement: HTMLCanvasElement
    setSize(width: number, height: number): void
    setPixelRatio(value: number): void
    render(scene: Scene, camera: PerspectiveCamera): void
    dispose(): void
    shadowMap: {
      enabled: boolean
      type?: number
    }
  }

  export class AmbientLight extends Object3D {
    constructor(color?: string | number, intensity?: number)
  }

  export class PointLight extends Object3D {
    constructor(color?: string | number, intensity?: number, distance?: number, decay?: number)
  }

  export class DirectionalLight extends Object3D {
    constructor(color?: string | number, intensity?: number)
    position: Vector3
    castShadow: boolean
  }

  export class SpotLight extends Object3D {
    constructor(
      color?: string | number,
      intensity?: number,
      distance?: number,
      angle?: number,
      penumbra?: number,
      decay?: number
    )
    position: Vector3
    castShadow: boolean
  }
}
