'use client';

import { useEffect, useRef, useState } from 'react';

interface InteractiveDotTextProps {
  text: string;
}

interface Particle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export default function InteractiveDotText({ text }: InteractiveDotTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    const mouse = { x: -1000, y: -1000 };
    let isHovered = false;
    let hoverOpacity = 0;

    const getWordCoordinates = (word: string, w: number, h: number) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return [];

      const points: { x: number; y: number }[] = [];

      tempCtx.fillStyle = '#000';
      // Responsive font size based on width
      const fontSize = Math.min(54, Math.floor(w / (word.length * 0.65)));
      tempCtx.font = `bold ${fontSize}px Georgia, serif`;
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      
      // Draw filled text
      tempCtx.fillText(word, w / 2, h / 2);
      
      // Draw stroked text to make letters slightly thicker and ensure thin strokes stand out clearly
      tempCtx.strokeStyle = '#000';
      tempCtx.lineWidth = 1.5;
      tempCtx.strokeText(word, w / 2, h / 2);

      const imgData = tempCtx.getImageData(0, 0, w, h).data;
      const step = 2; // reduced step to 2 to significantly increase dot density for crystal-clear text formation

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const pixelX = Math.min(w - 1, Math.floor(x));
          const pixelY = Math.min(h - 1, Math.floor(y));
          const alpha = imgData[(pixelY * w + pixelX) * 4 + 3];
          if (alpha > 128) {
            // Add slight randomness to coordinates for organic text lines
            points.push({ 
              x: x + (Math.random() - 0.5) * 1.5, 
              y: y + (Math.random() - 0.5) * 1.5 
            });
          }
        }
      }
      return points;
    };

    const updateSize = () => {
      if (!canvas || !containerRef.current) return;
      width = containerRef.current.clientWidth || 350;
      height = containerRef.current.clientHeight || 150;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    const initParticles = () => {
      const textPoints = getWordCoordinates(text, width, height);
      particles = [];

      // Determine dot count. Ensure at least enough dots to cover text coordinates
      const dotCount = Math.max(textPoints.length, 120);

      for (let i = 0; i < dotCount; i++) {
        // Place original idle positions randomly, leaving top margins to prevent overlap
        const ox = Math.random() * width;
        const oy = 25 + Math.random() * (height - 35);

        // Assign corresponding text target coordinate (loop if dots exceed text points)
        const targetPoint = textPoints[i % textPoints.length] || { 
          x: Math.random() * width, 
          y: Math.random() * height 
        };

        particles.push({
          x: ox,
          y: oy,
          ox: ox,
          oy: oy,
          tx: targetPoint.x,
          ty: targetPoint.y,
          vx: 0,
          vy: 0,
          radius: 1.0 + Math.random() * 0.8, // smaller dots
          // Softer rose color to match the background dot grid seamlessly
          color: 'rgba(215, 55, 115, 0.4)'
        });
      }
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      isHovered = false;
      setHovered(false);
    };

    const handleMouseEnter = () => {
      isHovered = true;
      setHovered(true);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mouseenter', handleMouseEnter);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Smoothly ease the opacity based on hover state (slower fade-in and fade-out)
      if (isHovered) {
        hoverOpacity += (1 - hoverOpacity) * 0.04;
      } else {
        hoverOpacity += (0 - hoverOpacity) * 0.04;
      }

      // If opacity is practically zero, skip rendering particles to prevent any visible cutoff box
      if (hoverOpacity > 0.01) {
        particles.forEach((p) => {
          if (isHovered) {
            // Smooth easing attraction to text target coordinates (much slower, premium fluid gathering)
            p.x += (p.tx - p.x) * 0.025;
            p.y += (p.ty - p.y) * 0.025;
            p.vx = 0;
            p.vy = 0;
          } else {
            // Disperse/idle floating animation when fading out
            const time = Date.now() / 900;
            const idleX = p.ox + Math.cos(time + p.oy * 0.02) * 12;
            const idleY = p.oy + Math.sin(time + p.ox * 0.015) * 15;

            let targetX = idleX;
            let targetY = idleY;

            // Repel force if mouse is nearby
            const dxMouse = mouse.x - p.x;
            const dyMouse = mouse.y - p.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
            if (distMouse < 80 && distMouse > 0) {
              const force = (80 - distMouse) / 80;
              targetX = p.x - (dxMouse / distMouse) * force * 20;
              targetY = p.y - (dyMouse / distMouse) * force * 20;
            }

            const dx = targetX - p.x;
            const dy = targetY - p.y;
            p.vx += dx * 0.05;
            p.vy += dy * 0.05;
            p.vx *= 0.8;
            p.vy *= 0.8;
            p.x += p.vx;
            p.y += p.vy;
          }

          ctx.beginPath();
          // Fade alpha from 0 to 0.98 based on hover opacity
          const alpha = hoverOpacity * 0.98;
          ctx.fillStyle = `rgba(165, 12, 55, ${alpha})`;
          
          // Hover state gets larger radius for high readability, idle gets smaller radius
          const r = isHovered ? p.radius + 0.6 : p.radius;
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', updateSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [text]);

  return (
    <div ref={containerRef} className="w-full h-full relative group cursor-pointer flex flex-col justify-center items-center">
      <canvas ref={canvasRef} className="w-full h-full block z-10" />
      <div className={`absolute bottom-2 text-[10px] tracking-widest uppercase text-muted-foreground/60 transition-opacity duration-300 pointer-events-none select-none ${hovered ? 'opacity-0' : 'opacity-100'}`}>
        ✨ Hover to reveal magic
      </div>
    </div>
  );
}
