import { useEffect, useRef } from 'react'

interface Point {
  x: number
  y: number
}

interface ChartLine {
  points: Point[]
  speed: number
  opacity: number
  offsetY: number
  color: string
  lineWidth: number
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = 0
    let height = 0

    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width
      canvas!.height = height
    }

    resize()
    window.addEventListener('resize', resize)

    const lineCount = 5
    const segmentCount = 80
    const lines: ChartLine[] = []

    const colors = [
      'rgba(254, 178, 2, 0.15)',
      'rgba(254, 178, 2, 0.08)',
      'rgba(225, 222, 205, 0.12)',
      'rgba(255, 255, 255, 0.06)',
      'rgba(254, 178, 2, 0.10)',
    ]

    for (let i = 0; i < lineCount; i++) {
      const points: Point[] = []
      for (let j = 0; j <= segmentCount; j++) {
        points.push({
          x: (j / segmentCount) * width,
          y: Math.random() * height,
        })
      }
      lines.push({
        points,
        speed: 0.3 + Math.random() * 0.5,
        opacity: 1,
        offsetY: (height / (lineCount + 1)) * (i + 1),
        color: colors[i % colors.length],
        lineWidth: 1.5 + Math.random() * 1.5,
      })
    }

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = []
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 1 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.2,
      })
    }

    let time = 0

    function animate() {
      ctx!.clearRect(0, 0, width, height)
      time += 0.005

      for (const line of lines) {
        ctx!.beginPath()
        ctx!.strokeStyle = line.color
        ctx!.lineWidth = line.lineWidth

        for (let j = 0; j <= segmentCount; j++) {
          const x = (j / segmentCount) * (width + 200) - 100
          const wave1 = Math.sin((j * 0.08) + time * line.speed * 2) * 60
          const wave2 = Math.sin((j * 0.04) + time * line.speed * 1.3) * 40
          const wave3 = Math.cos((j * 0.06) + time * line.speed * 0.8) * 25
          const y = line.offsetY + wave1 + wave2 + wave3

          if (j === 0) {
            ctx!.moveTo(x, y)
          } else {
            const prevX = ((j - 1) / segmentCount) * (width + 200) - 100
            const prevWave1 = Math.sin(((j - 1) * 0.08) + time * line.speed * 2) * 60
            const prevWave2 = Math.sin(((j - 1) * 0.04) + time * line.speed * 1.3) * 40
            const prevWave3 = Math.cos(((j - 1) * 0.06) + time * line.speed * 0.8) * 25
            const prevY = line.offsetY + prevWave1 + prevWave2 + prevWave3

            const cpX = (prevX + x) / 2
            ctx!.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2)
          }
        }
        ctx!.stroke()

        ctx!.beginPath()
        const gradY = line.offsetY - 80
        const gradient = ctx!.createLinearGradient(0, gradY, 0, gradY + 250)
        gradient.addColorStop(0, 'transparent')
        gradient.addColorStop(0.5, line.color.replace(/[\d.]+\)$/, '0.03)'))
        gradient.addColorStop(1, 'transparent')
        ctx!.fillStyle = gradient

        for (let j = 0; j <= segmentCount; j++) {
          const x = (j / segmentCount) * (width + 200) - 100
          const wave1 = Math.sin((j * 0.08) + time * line.speed * 2) * 60
          const wave2 = Math.sin((j * 0.04) + time * line.speed * 1.3) * 40
          const wave3 = Math.cos((j * 0.06) + time * line.speed * 0.8) * 25
          const y = line.offsetY + wave1 + wave2 + wave3

          if (j === 0) ctx!.moveTo(x, y)
          else ctx!.lineTo(x, y)
        }
        ctx!.lineTo(width + 100, height + 100)
        ctx!.lineTo(-100, height + 100)
        ctx!.closePath()
        ctx!.fill()
      }

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(254, 178, 2, ${p.opacity})`
        ctx!.fill()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  )
}
