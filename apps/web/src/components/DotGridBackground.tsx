'use client';

import { useEffect, useRef } from 'react';

export default function DotGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    
    // Mouse tracking
    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const DOT_SPACING = 30;
    const DOT_RADIUS = 1.5;
    const REPEL_RADIUS = 150;
    
    interface Dot {
      ox: number; // original x
      oy: number; // original y
      x: number;
      y: number;
    }

    let dots: Dot[] = [];

    const initDots = () => {
      dots = [];
      for (let x = 15; x < width; x += DOT_SPACING) {
        for (let y = 15; y < height; y += DOT_SPACING) {
          const jitterX = (Math.random() - 0.5) * 16;
          const jitterY = (Math.random() - 0.5) * 16;
          dots.push({ 
            ox: x + jitterX, 
            oy: y + jitterY, 
            x: x + jitterX, 
            y: y + jitterY 
          });
        }
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const parent = canvas.parentElement;
        if (parent) {
          width = parent.clientWidth || 300;
          height = parent.clientHeight || 300;
        } else {
          const { width: entryWidth, height: entryHeight } = entry.contentRect;
          width = entryWidth || 300;
          height = entryHeight || 300;
        }
        canvas.width = width;
        canvas.height = height;
        initDots();
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Slightly darker wine/rose color for better visibility and premium contrast
      ctx.fillStyle = 'rgba(215, 55, 115, 0.65)'; 

      dots.forEach(dot => {
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = dot.ox;
        let targetY = dot.oy;

        // Wave animation
        const time = Date.now() / 900;
        const idleX = dot.ox + Math.cos(time + dot.oy * 0.02) * 8;
        const idleY = dot.oy + Math.sin(time + dot.ox * 0.015) * 12;

        targetX = idleX;
        targetY = idleY;

        // Mouse repel force relative to CURRENT positions for smoother tracking
        const dxMouse = mouse.x - dot.x;
        const dyMouse = mouse.y - dot.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < REPEL_RADIUS && distMouse > 0) {
          const force = (REPEL_RADIUS - distMouse) / REPEL_RADIUS;
          targetX = dot.x - (dxMouse / distMouse) * force * 22;
          targetY = dot.y - (dyMouse / distMouse) * force * 22;
        }

        const springDx = targetX - dot.x;
        const springDy = targetY - dot.y;
        dot.x += springDx * 0.06;
        dot.y += springDy * 0.06;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}
