"use client";

import React, { useEffect, useRef } from "react";
import { Box } from "@mui/joy";

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
}

export default function InteractiveParticleLogo({ 
  size = 400, 
  particleColor = "#F2F5FA",
  accentColor = "#2ED47A" 
}: { 
  size?: number;
  particleColor?: string;
  accentColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set high DPI scale
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const particleGap = 3.5; // Controls density
    const mouseRadius = 60; // How close to repel
    const returnForce = 0.05; // How fast they go back
    const friction = 0.9; // Slows them down

    // 1. Generate the logo shape using a hidden canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = size;
    offscreen.height = size;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    // Draw the GodsEye stylized sphere
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;

    offCtx.fillStyle = "white";
    offCtx.beginPath();
    offCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    offCtx.fill();

    // Add diagonal stripes (cut out)
    offCtx.globalCompositeOperation = "destination-out";
    offCtx.strokeStyle = "white";
    offCtx.lineWidth = size * 0.025;
    
    // Create 4-5 diagonal lines
    for (let i = -2; i <= 2; i++) {
      const shift = i * (size * 0.12);
      offCtx.beginPath();
      offCtx.moveTo(0, size - shift);
      offCtx.lineTo(size, 0 - shift);
      offCtx.stroke();
    }

    // 2. Sample the pixels to create particles
    const imageData = offCtx.getImageData(0, 0, size, size).data;
    for (let y = 0; y < size; y += particleGap) {
      for (let x = 0; x < size; x += particleGap) {
        const index = (y * size + x) * 4;
        const opacity = imageData[index + 3];

        if (opacity > 128) {
          particles.push({
            x: x,
            y: y,
            originX: x,
            originY: y,
            color: Math.random() > 0.9 ? accentColor : particleColor,
            size: Math.random() * 1.5 + 0.5,
            vx: 0,
            vy: 0,
          });
        }
      }
    }

    // 3. Animation Loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics: Repel from mouse
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseRadius) {
          const angle = Math.atan2(dy, dx);
          const force = (mouseRadius - distance) / mouseRadius;
          const pushX = Math.cos(angle) * force * 1.5;
          const pushY = Math.sin(angle) * force * 1.5;
          
          p.vx -= pushX;
          p.vy -= pushY;
        }

        // Physics: Return to origin
        p.vx += (p.originX - p.x) * returnForce;
        p.vy += (p.originY - p.y) * returnForce;

        // Apply velocities
        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx;
        p.y += p.vy;

        // Draw
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [size, particleColor, accentColor]);

  return (
    <Box sx={{ 
      position: "relative", 
      width: size + 40, 
      height: size + 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mx: "auto",
      bgcolor: "rgba(10, 12, 16, 0.4)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      borderRadius: "32px",
      backdropFilter: "blur(4px)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(46, 212, 122, 0.05)",
    }}>
      <canvas ref={canvasRef} style={{ cursor: "crosshair" }} />
    </Box>
  );
}
