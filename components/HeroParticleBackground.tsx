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
  phaseX: number;
  phaseY: number;
}

export default function HeroParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 2); // Limit to 2 for performance

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    setupCanvas();

    const particles: Particle[] = [];
    const mouseRadius = 90;
    const returnForce = 0.04;
    const friction = 0.92;

    const generateParticles = () => {
      particles.length = 0;

      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      const centerX = width / 2;
      const centerY = height / 2;

      const logoImg = new Image();
      logoImg.src = "/GodsEye.png";
      logoImg.onload = () => {
        offCtx.clearRect(0, 0, width, height);
        offCtx.fillStyle = "white";

        /*
        // 1. Draw Logo Shape (to be filled with particles)
        const logoTargetSize = 130;
        const logoY = centerY - 270; // Pushed higher
        offCtx.drawImage(
          logoImg,
          centerX - logoTargetSize / 2,
          logoY,
          logoTargetSize,
          logoTargetSize
        );

        // 1. Draw Structural Third Eye (Sophisticated Proportions)
        const eyeW = 75;
        const eyeH = 110;
        const eyeX = centerX;
        const eyeY = logoY + logoTargetSize / 2;

        offCtx.save();
        offCtx.fillStyle = "white";

        // --- 1.1 Solid Shell (Base Structure) ---
        offCtx.beginPath();
        offCtx.moveTo(eyeX, eyeY - eyeH / 2);
        offCtx.quadraticCurveTo(eyeX + eyeW / 2, eyeY, eyeX, eyeY + eyeH / 2);
        offCtx.quadraticCurveTo(eyeX - eyeW / 2, eyeY, eyeX, eyeY - eyeH / 2);
        offCtx.fill();

        // --- 1.2 "Structural Void" Border & Carving ---
        offCtx.globalCompositeOperation = "destination-out";
        offCtx.strokeStyle = "rgba(0,0,0,1)";

        // A. THE BORDER HALO (Ensures shell visibility)
        offCtx.lineWidth = 3.5;
        offCtx.beginPath();
        offCtx.moveTo(eyeX, eyeY - eyeH / 2);
        offCtx.quadraticCurveTo(eyeX + eyeW / 2, eyeY, eyeX, eyeY + eyeH / 2);
        offCtx.quadraticCurveTo(eyeX - eyeW / 2, eyeY, eyeX, eyeY - eyeH / 2);
        offCtx.stroke();

        // B. Internal Vertical Divider
        offCtx.lineWidth = 1.8;
        offCtx.beginPath();
        offCtx.moveTo(eyeX, eyeY - eyeH / 2);
        offCtx.quadraticCurveTo(eyeX - eyeW / 6, eyeY, eyeX, eyeY + eyeH / 2);
        offCtx.stroke();

        // C. Internal Iris Rim (Smaller, more defined)
        offCtx.beginPath();
        offCtx.arc(eyeX, eyeY, 13, 0, Math.PI * 2);
        offCtx.stroke();

        // --- 1.3 Pupil (Positive core - smaller) ---
        offCtx.globalCompositeOperation = "source-over";
        offCtx.beginPath();
        offCtx.arc(eyeX, eyeY, 4.5, 0, Math.PI * 2);
        offCtx.fill();

        offCtx.restore();
        */

        // 2. Draw Text Shape (to be filled with particles)
        offCtx.font = `900 ${width < 600 ? "4rem" : "6.5rem"} var(--font-array)`;
        offCtx.textAlign = "center";
        offCtx.textBaseline = "middle";
        offCtx.fillText("GodsEye", centerX, centerY + 20);

        // EXTRA Step: Text Halo
        offCtx.save();
        offCtx.globalCompositeOperation = "destination-out";
        offCtx.strokeStyle = "rgba(0,0,0,1)";
        offCtx.lineWidth = 2.5;
        offCtx.strokeText("GodsEye", centerX, centerY + 20);
        offCtx.restore();

        // 3. Sample pixels (Particles FORM the shapes)
        const imageData = offCtx.getImageData(0, 0, width, height).data;
        const gap = width < 600 ? 3.5 : 2.5; // Ultra-high resolution

        for (let y = 0; y < height; y += gap) {
          for (let x = 0; x < width; x += gap) {
            const index = (Math.floor(y) * width + Math.floor(x)) * 4;
            const opacity = imageData[index + 3];

            // 1. High-Density Brand Particles
            if (opacity > 128) {
              particles.push({
                x, y, originX: x, originY: y,
                color: Math.random() > 0.8 ? "rgba(255,255,255,0.4)" : "#FFFFFF",
                size: Math.random() * 1.5 + 0.5,
                vx: 0, vy: 0,
                phaseX: Math.random() * 1000,
                phaseY: Math.random() * 1000,
              });
            }
            // 2. High-Density Background Atmosphere (Restored & Boosted)
            else if (Math.random() > 0.93) {
              particles.push({
                x, y, originX: x, originY: y,
                color: "rgba(242, 245, 250, 0.35)",
                size: Math.random() * 1.5 + 0.4,
                vx: 0, vy: 0,
                phaseX: Math.random() * 1000,
                phaseY: Math.random() * 1000,
              });
            }
          }
        }
      };
    };

    generateParticles();

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const time = Date.now() / 1200; // Refined shimmer speed

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // --- 1. Dynamic Oscillation & Star-Flow ---
        // We increase amplitude to 2.8 for visceral visible shimmer
        const driftX = Math.sin(time + p.phaseX) * 2.8;
        const driftY = Math.cos(time + p.phaseY) * 2.8;
        const targetX = p.originX + driftX;
        const targetY = p.originY + driftY;

        // --- 2. Physics & MouseRepulsion ---
        const dx = mx - p.x;
        const dy = my - p.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < mouseRadius * mouseRadius) {
          const dist = Math.sqrt(distSq);
          const angle = Math.atan2(dy, dx);
          const force = (mouseRadius - dist) / mouseRadius;
          p.vx -= Math.cos(angle) * force * 3.5; // Stronger repulsion
          p.vy -= Math.sin(angle) * force * 3.5;
        }

        // --- 3. Return to Origin (with memory) ---
        p.vx += (targetX - p.x) * returnForce;
        p.vy += (targetY - p.y) * returnForce;
        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx;
        p.y += p.vy;

        // --- 4. Infinite Drift/Wraparound for Stars ---
        // Slowly shifting the origin itself creates a cosmic drift
        p.originX += 0.05; // Constant slow flow to the right
        if (p.originX > width) p.originX = 0;
        if (p.originX < 0) p.originX = width;
        if (p.originY > height) p.originY = 0;
        if (p.originY < 0) p.originY = height;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const onResize = () => {
      setupCanvas();
      generateParticles();
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <Box sx={{
      position: "absolute",
      inset: 0,
      zIndex: 0,
      overflow: "hidden",
      pointerEvents: "none",
      "&::after": {
        content: '""',
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, transparent 70%, #0D0F14 100%)",
        zIndex: 1,
      }
    }}>
      <canvas ref={canvasRef} style={{ pointerEvents: "auto" }} />
    </Box>
  );
}
