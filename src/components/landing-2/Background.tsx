import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

const Background = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const gridSize = 30;
    const lines: Line[] = [];
    const numLines = 50;
    // Orange/gold colors for laser effect
    const colors = ['#FF6B00', '#FF8C00', '#FFB800', '#00F2FF'];

    // Offscreen canvas for static grid (performance optimization)
    let gridCanvas: OffscreenCanvas | HTMLCanvasElement;
    let gridCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    
    if (typeof OffscreenCanvas !== 'undefined') {
      gridCanvas = new OffscreenCanvas(width, height);
      gridCtx = gridCanvas.getContext('2d');
    } else {
      gridCanvas = document.createElement('canvas');
      gridCanvas.width = width;
      gridCanvas.height = height;
      gridCtx = gridCanvas.getContext('2d');
    }

    class Line {
      x: number;
      y: number;
      length: number;
      speed: number;
      color: string;
      angle: number; // Random direction in radians

      constructor() {
        this.reset(true);
        this.x = 0;
        this.y = 0;
        this.length = 0;
        this.speed = 0;
        this.color = '';
        this.angle = 0;
        this.reset(true);
      }

      reset(initial = false) {
        this.angle = Math.random() * Math.PI * 2; // Random angle 0-360 degrees
        this.length = Math.random() * 150 + 80;
        this.speed = Math.random() * 3 + 1.5; // Faster for laser effect
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        if (initial) {
          // Spawn anywhere on screen initially
          this.x = Math.random() * width;
          this.y = Math.random() * height;
        } else {
          // Spawn from edges when resetting
          const edge = Math.floor(Math.random() * 4);
          switch (edge) {
            case 0: // Top
              this.x = Math.random() * width;
              this.y = -this.length;
              this.angle = Math.random() * Math.PI * 0.5 + Math.PI * 0.25; // Downward
              break;
            case 1: // Right
              this.x = width + this.length;
              this.y = Math.random() * height;
              this.angle = Math.random() * Math.PI * 0.5 + Math.PI * 0.75; // Leftward
              break;
            case 2: // Bottom
              this.x = Math.random() * width;
              this.y = height + this.length;
              this.angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // Upward
              break;
            case 3: // Left
              this.x = -this.length;
              this.y = Math.random() * height;
              this.angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // Rightward
              break;
          }
        }
      }

      draw() {
        if (!ctx) return;
        const endX = this.x + Math.cos(this.angle) * this.length;
        const endY = this.y + Math.sin(this.angle) * this.length;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        // Slight glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Reset when off screen
        const margin = this.length + 50;
        if (
          this.x < -margin ||
          this.x > width + margin ||
          this.y < -margin ||
          this.y > height + margin
        ) {
          this.reset(false);
        }
      }
    }

    function createLines() {
      for (let i = 0; i < numLines; i++) {
        lines.push(new Line());
      }
    }

    function drawGridToCache() {
      if (!gridCtx) return;
      gridCtx.clearRect(0, 0, width, height);
      gridCtx.strokeStyle = '#111111';
      gridCtx.lineWidth = 0.5;
      
      for (let i = 0; i < width; i += gridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(i, 0);
        gridCtx.lineTo(i, height);
        gridCtx.stroke();
      }
      for (let i = 0; i < height; i += gridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, i);
        gridCtx.lineTo(width, i);
        gridCtx.stroke();
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      
      // Draw cached grid
      ctx.drawImage(gridCanvas, 0, 0);
      
      // Draw and update lines
      lines.forEach(line => {
        line.update();
        line.draw();
      });
      
      requestAnimationFrame(animate);
    }

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
      // Resize offscreen canvas
      if (gridCanvas) {
        gridCanvas.width = width;
        gridCanvas.height = height;
        drawGridToCache();
      }
    };

    window.addEventListener('resize', handleResize);

    createLines();
    drawGridToCache();
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 -z-10 bg-pure-black"
    />
  );
};

export default Background;
