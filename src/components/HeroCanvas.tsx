'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const CLAN = ['#8B1A1A','#C8960C','#4A5E3A','#2C5F7A','#7A3B6B','#8B5E1A','#1A4A3A']

function starSegs(cx: number, cy: number, R: number, r: number, n: number) {
  const pts: [number, number][] = []
  for (let i = 0; i < n * 2; i++) {
    const angle = (Math.PI / n) * i - Math.PI / 2
    const rad = i % 2 === 0 ? R : r
    pts.push([cx + rad * Math.cos(angle), cy + rad * Math.sin(angle)])
  }
  return pts
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return

    const W = window.innerWidth
    const H = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.set(0, 0, 5)

    scene.add(new THREE.AmbientLight(0xfff8f0, 0.55))
    const pl = new THREE.PointLight(0xC8960C, 1.4, 100)
    pl.position.set(3, 4, 5)
    scene.add(pl)
    const fl = new THREE.PointLight(0x2C5F7A, 0.38, 80)
    fl.position.set(-4, -2, 3)
    scene.add(fl)

    const N = 7, R = 1.35, r = 0.55, depth = 0.22
    const star = new THREE.Group()
    const pts = starSegs(0, 0, R, r, N)

    for (let i = 0; i < N; i++) {
      const shape = new THREE.Shape()
      const tip = pts[i * 2]
      const il = pts[(i * 2 - 1 + N * 2) % (N * 2)]
      const ir = pts[(i * 2 + 1) % (N * 2)]
      shape.moveTo(0, 0)
      shape.lineTo(il[0], il[1])
      shape.lineTo(tip[0], tip[1])
      shape.lineTo(ir[0], ir[1])
      shape.closePath()
      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
      const mat = new THREE.MeshPhongMaterial({
        color: CLAN[i],
        shininess: 60,
        specular: new THREE.Color(0x888866),
      })
      star.add(new THREE.Mesh(geo, mat))
    }
    scene.add(star)

    let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0
    const onMouseMove = (e: MouseEvent) => {
      targetRY = ((e.clientX / window.innerWidth) - 0.5) * 0.6
      targetRX = -((e.clientY / window.innerHeight) - 0.5) * 0.4
    }
    document.addEventListener('mousemove', onMouseMove)

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', resize)

    let rafId: number
    const clock = new THREE.Clock()
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      star.rotation.z = t * 0.12
      curRX += (targetRX - curRX) * 0.04
      curRY += (targetRY - curRY) * 0.04
      star.rotation.x = curRX
      star.rotation.y = curRY
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      renderer.dispose()
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas id="hero-canvas" ref={canvasRef} />
}
