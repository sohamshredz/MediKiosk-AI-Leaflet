import React, { useEffect, useRef, useState } from 'react';

export const Medical3DBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Subtle floating clinical node particles
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 2 + 1.2,
      opacity: Math.random() * 0.35 + 0.15
    }));

    let pulseOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle clinical grid lines
      const gridSize = 40;
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.04)'; // faint teal
      ctx.lineWidth = 1;

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 2. Draw subtle clinical telemetry pulse wave at bottom/center
      pulseOffset += 0.015;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.09)'; // soft teal pulse
      ctx.lineWidth = 1.5;

      const baselineY = height * 0.65;
      for (let x = 0; x < width; x += 4) {
        const normalizedX = (x / width) * 12 + pulseOffset;
        const wave1 = Math.sin(normalizedX) * 14;
        const wave2 = Math.cos(normalizedX * 0.5) * 8;
        // Occasional ECG spike
        const spikeTrigger = Math.sin(normalizedX * 0.3);
        const spike = spikeTrigger > 0.85 ? Math.sin((normalizedX - 0.85) * 20) * 28 : 0;
        const y = baselineY + wave1 + wave2 + spike;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 3. Draw interconnected faint clinical nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(13, 148, 136, ${p.opacity * 0.4})`;
        ctx.fill();

        // Connect nearby particles with faint line
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`; // soft sky blue connector
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Soft Ambient Radial Gradient Blobs for depth */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />
      
      {/* Light dot grid overlay */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15, 118, 110, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Dynamic Canvas Layer */}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

