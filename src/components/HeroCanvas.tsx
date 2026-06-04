'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const CLAN = ['#8B1A1A','#C8960C','#4A5E3A','#2C5F7A','#7A3B6B','#8B5E1A','#1A4A3A']

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 0, 5)

    const updateCamera = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    updateCamera()
    const positionStar = () => {
      const halfH = camera.position.z * Math.tan((camera.fov * Math.PI) / 360)
      grp.position.x = halfH * camera.aspect * 0.3
    }
    const resize = () => { updateCamera(); positionStar() }
    window.addEventListener('resize', resize)

    scene.add(new THREE.AmbientLight(0xfff8f0, 0.3))

    // Primary: bright warm white from top-right
    const key = new THREE.DirectionalLight(0xfff5e0, 3.2)
    key.position.set(6, 8, 5)
    scene.add(key)

    // Gold-tinted point light near the top-right to add specularity
    const pl = new THREE.PointLight(0xC8960C, 3.5, 40)
    pl.position.set(5, 6, 4)
    scene.add(pl)

    // Cool blue fill from bottom-left, kept dim so shadows stay deep
    const fl = new THREE.PointLight(0x2C5F7A, 0.5, 60)
    fl.position.set(-5, -3, 3)
    scene.add(fl)

    const grp = new THREE.Group()
    scene.add(grp)

    const R = 1.5, r = 0.68, depth = 0.3, n = 7
    const st = (Math.PI * 2) / n, ht = st / 2

    for (let i = 0; i < n; i++) {
      const oa = i * st - Math.PI / 2
      const tip = new THREE.Vector2(R * Math.cos(oa), R * Math.sin(oa))
      const lft = new THREE.Vector2(r * Math.cos(oa - ht), r * Math.sin(oa - ht))
      const rgt = new THREE.Vector2(r * Math.cos(oa + ht), r * Math.sin(oa + ht))
      const shape = new THREE.Shape([new THREE.Vector2(0, 0), lft, tip, rgt])
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.03,
        bevelSegments: 2,
      })
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(CLAN[i]),
        roughness: 0.22,
        metalness: 0.72,
      })
      grp.add(new THREE.Mesh(geo, mat))
    }
    positionStar()
    let mx = 0, my = 0, tx = 0, ty = 0
    const onMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    document.addEventListener('mousemove', onMouseMove)

    let rafId: number
    let t = 0
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      t += 0.012
      tx += (mx - tx) * 0.055
      ty += (my - ty) * 0.055
      grp.rotation.y += 0.0025 + tx * 0.018
      grp.rotation.x += (-ty * 0.35 - grp.rotation.x) * 0.08
      grp.rotation.z += (tx * 0.12 - grp.rotation.z) * 0.06
      const b = 1 + Math.sin(t) * 0.024
      grp.scale.setScalar(b)
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
