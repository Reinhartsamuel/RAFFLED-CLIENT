import { useEffect, useRef } from 'react'

interface AnimatedBackgroundProps {
  lineCount?: number
  opacity?: number
  colors?: string[]
  className?: string
}

const AnimatedBackground = ({
  lineCount = 35,
  opacity = 0.7,
  colors = ['#FF6B00', '#FF8C00', '#FFB800'],
  className = '',
}: AnimatedBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let animationId: number
    canvas.width = width
    canvas.height = height

    const gridSize = 40

    // Offscreen canvas for cached static grid
    let gridCanvas: OffscreenCanvas | HTMLCanvasElement
    let gridCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null

    if (typeof OffscreenCanvas !== 'undefined') {
      gridCanvas = new OffscreenCanvas(width, height)
      gridCtx = gridCanvas.getContext('2d')
    } else {
      gridCanvas = document.createElement('canvas')
      ;(gridCanvas as HTMLCanvasElement).width = width
      ;(gridCanvas as HTMLCanvasElement).height = height
      gridCtx = (gridCanvas as HTMLCanvasElement).getContext('2d')
    }

    class Line {
      x: number = 0
      y: number = 0
      length: number = 0
      speed: number = 0
      color: string = ''
      angle: number = 0
      alpha: number = 0

      constructor() {
        this.reset(true)
      }

      reset(initial = false) {
        this.angle = Math.random() * Math.PI * 2
        this.length = Math.random() * 120 + 60
        this.speed = Math.random() * 2 + 0.8
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.alpha = Math.random() * 0.5 + 0.1

        if (initial) {
          this.x = Math.random() * width
          this.y = Math.random() * height
        } else {
          const edge = Math.floor(Math.random() * 4)
          switch (edge) {
            case 0:
              this.x = Math.random() * width
              this.y = -this.length
              this.angle = Math.random() * Math.PI * 0.5 + Math.PI * 0.25
              break
            case 1:
              this.x = width + this.length
              this.y = Math.random() * height
              this.angle = Math.random() * Math.PI * 0.5 + Math.PI * 0.75
              break
            case 2:
              this.x = Math.random() * width
              this.y = height + this.length
              this.angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25
              break
            default:
              this.x = -this.length
              this.y = Math.random() * height
              this.angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25
              break
          }
        }
      }

      draw() {
        if (!ctx) return
        const endX = this.x + Math.cos(this.angle) * this.length
        const endY = this.y + Math.sin(this.angle) * this.length

        const grad = ctx.createLinearGradient(this.x, this.y, endX, endY)
        grad.addColorStop(0, `${this.color}00`)
        grad.addColorStop(0.4, `${this.color}${Math.round(this.alpha * 255).toString(16).padStart(2, '0')}`)
        grad.addColorStop(1, `${this.color}00`)

        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.shadowColor = this.color
        ctx.shadowBlur = 6
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      update() {
        this.x += Math.cos(this.angle) * this.speed
        this.y += Math.sin(this.angle) * this.speed

        const margin = this.length + 50
        if (
          this.x < -margin ||
          this.x > width + margin ||
          this.y < -margin ||
          this.y > height + margin
        ) {
          this.reset(false)
        }
      }
    }

    function drawGridToCache() {
      if (!gridCtx) return
      gridCtx.clearRect(0, 0, width, height)
      gridCtx.strokeStyle = 'rgba(255,255,255,0.025)'
      gridCtx.lineWidth = 0.5

      for (let i = 0; i <= width; i += gridSize) {
        gridCtx.beginPath()
        gridCtx.moveTo(i, 0)
        gridCtx.lineTo(i, height)
        gridCtx.stroke()
      }
      for (let i = 0; i <= height; i += gridSize) {
        gridCtx.beginPath()
        gridCtx.moveTo(0, i)
        gridCtx.lineTo(width, i)
        gridCtx.stroke()
      }
    }

    const lines: Line[] = Array.from({ length: lineCount }, () => new Line())
    drawGridToCache()

    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
      ctx.globalAlpha = opacity
      ctx.drawImage(gridCanvas, 0, 0)
      ctx.globalAlpha = 1

      lines.forEach(line => {
        line.update()
        line.draw()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      if ('width' in gridCanvas) {
        gridCanvas.width = width
        gridCanvas.height = height
      }
      drawGridToCache()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [lineCount, opacity, colors])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full bg-[#050505] ${className}`}
      style={{ zIndex: -1 }}
    />
  )
}

export default AnimatedBackground
