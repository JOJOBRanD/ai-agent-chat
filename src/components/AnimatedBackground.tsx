"use client";

import { useRef, useEffect, useCallback } from "react";
import { useChatStore } from "@/lib/store";

/**
 * Particle background with colored particles + mouse magnetism.
 *
 * - Each particle has an individual color from a theme palette
 * - Near the mouse, particles glow brighter and gain a soft halo
 * - Connection lines inherit the color blend of connected particles
 * - Light / dark mode auto-switches palette
 */

// Each particle's color is defined by RGB channels + a hue category
interface ParticleColor {
  r: number;
  g: number;
  b: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  color: ParticleColor;      // individual tint
  glowColor: ParticleColor;  // brighter version for mouse proximity
}

// Light mode palette — soft pastels
const LIGHT_PALETTE: ParticleColor[] = [
  { r: 99, g: 102, b: 241 },   // indigo
  { r: 139, g: 92, b: 246 },   // violet
  { r: 168, g: 85, b: 247 },   // purple
  { r: 236, g: 72, b: 153 },   // pink
  { r: 59, g: 130, b: 246 },   // blue
  { r: 14, g: 165, b: 233 },   // sky
  { r: 20, g: 184, b: 166 },   // teal
  { r: 120, g: 120, b: 160 },  // neutral (some particles stay subtle)
];

// Dark mode palette — brighter, more saturated
const DARK_PALETTE: ParticleColor[] = [
  { r: 129, g: 140, b: 248 },  // indigo
  { r: 167, g: 139, b: 250 },  // violet
  { r: 192, g: 132, b: 252 },  // purple
  { r: 244, g: 114, b: 182 },  // pink
  { r: 96, g: 165, b: 250 },   // blue
  { r: 56, g: 189, b: 248 },   // sky
  { r: 45, g: 212, b: 191 },   // teal
  { r: 180, g: 180, b: 210 },  // neutral
];

const CONFIG = {
  density: 0.00012,
  sizeMin: 1.2,
  sizeMax: 3.2,
  speedMax: 0.35,
  magnetRadius: 180,
  magnetStrength: 0.015,
  opacityMin: 0.12,
  opacityMax: 0.50,
  opacityBoost: 0.45,
  /** Glow halo radius multiplier when near mouse */
  glowRadius: 4,
  /** Glow halo max opacity */
  glowOpacity: 0.18,
  connectionDistance: 110,
  connectionOpacity: 0.18,
};

function pickColor(palette: ParticleColor[]): ParticleColor {
  return palette[Math.floor(Math.random() * palette.length)];
}

/** Make a brighter version for glow effect */
function brighten(c: ParticleColor, amount: number): ParticleColor {
  return {
    r: Math.min(255, c.r + amount),
    g: Math.min(255, c.g + amount),
    b: Math.min(255, c.b + amount),
  };
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const theme = useChatStore((s) => s.theme);

  const initParticles = useCallback((w: number, h: number) => {
    const isDark = document.documentElement.classList.contains("dark");
    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
    const count = Math.floor(w * h * CONFIG.density);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const baseOpacity = CONFIG.opacityMin + Math.random() * (CONFIG.opacityMax - CONFIG.opacityMin);
      const color = pickColor(palette);
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2 * CONFIG.speedMax,
        vy: (Math.random() - 0.5) * 2 * CONFIG.speedMax,
        size: CONFIG.sizeMin + Math.random() * (CONFIG.sizeMax - CONFIG.sizeMin),
        opacity: baseOpacity,
        baseOpacity,
        color,
        glowColor: brighten(color, 60),
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(w, h);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const { x: mx, y: my } = mouseRef.current;

      // Subtle base ambient glow spots
      const isDark = document.documentElement.classList.contains("dark");
      const g1a = isDark ? 0.035 : 0.045;
      const g2a = isDark ? 0.025 : 0.035;

      const glow1 = ctx.createRadialGradient(w * 0.2, h * 0.25, 0, w * 0.2, h * 0.25, w * 0.5);
      glow1.addColorStop(0, `rgba(99,102,241,${g1a})`);
      glow1.addColorStop(1, "transparent");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, w, h);

      const glow2 = ctx.createRadialGradient(w * 0.8, h * 0.75, 0, w * 0.8, h * 0.75, w * 0.45);
      glow2.addColorStop(0, `rgba(168,85,247,${g2a})`);
      glow2.addColorStop(1, "transparent");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);

      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Mouse magnetism + glow proximity
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let proximity = 0; // 0 = far, 1 = touching mouse

        if (dist < CONFIG.magnetRadius && dist > 0) {
          proximity = 1 - dist / CONFIG.magnetRadius;
          const force = proximity * CONFIG.magnetStrength;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
          p.opacity = Math.min(1, p.baseOpacity + CONFIG.opacityBoost * proximity);
        } else {
          p.opacity += (p.baseOpacity - p.opacity) * 0.05;
        }

        // Damping
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > CONFIG.speedMax * 2) {
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        const { r, g, b } = p.color;
        const gl = p.glowColor;

        // Glow halo when near mouse
        if (proximity > 0.1) {
          const glowR = p.size * CONFIG.glowRadius * proximity;
          const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          glowGrad.addColorStop(0, `rgba(${gl.r},${gl.g},${gl.b},${CONFIG.glowOpacity * proximity})`);
          glowGrad.addColorStop(1, `rgba(${gl.r},${gl.g},${gl.b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
        ctx.fill();

        // Connection lines — enhanced when near mouse
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cx = p.x - p2.x;
          const cy = p.y - p2.y;
          const cd = cx * cx + cy * cy;

          // Check if the midpoint of this connection is near the mouse
          const midX = (p.x + p2.x) / 2;
          const midY = (p.y + p2.y) / 2;
          const mdx = mx - midX;
          const mdy = my - midY;
          const midDist = Math.sqrt(mdx * mdx + mdy * mdy);
          const mouseNear = midDist < CONFIG.magnetRadius;
          const mouseProximity = mouseNear ? 1 - midDist / CONFIG.magnetRadius : 0;

          // Expand connection distance near mouse
          const connDist = CONFIG.connectionDistance + (mouseNear ? 60 * mouseProximity : 0);
          const maxD = connDist * connDist;

          if (cd < maxD) {
            // Base alpha + boost near mouse
            const baseAlpha = (1 - cd / maxD) * CONFIG.connectionOpacity;
            const alpha = baseAlpha + mouseProximity * 0.25;
            // Line width: thicker near mouse
            const lw = 0.5 + mouseProximity * 1.2;
            // Blend colors of the two connected particles
            const mr = (r + p2.color.r) >> 1;
            const mg = (g + p2.color.g) >> 1;
            const mb = (b + p2.color.b) >> 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${mr},${mg},${mb},${alpha})`;
            ctx.lineWidth = lw;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [initParticles, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
