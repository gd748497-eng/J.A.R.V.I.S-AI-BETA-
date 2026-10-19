import React, { useEffect, useRef, useState } from 'react';
import { AssistantState, HudAccentColor } from '../types';
import { speechService } from '../services/speechService';
import { soundEffects } from '../services/audioSynthesizer';

interface ArcReactorProps {
  state: AssistantState;
  accentColor: HudAccentColor;
  onClick: () => void;
  size?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  state,
  accentColor,
  onClick,
  size = 260,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Accent color mappings
  const getColorScheme = () => {
    switch (accentColor) {
      case 'gold':
        return {
          primary: '#ffb703',
          secondary: '#fb8500',
          glow: 'rgba(255, 183, 3, 0.65)',
          deepGlow: 'rgba(251, 133, 0, 0.25)',
          core: '#ffffff',
          coreRing: '#ffe3a8',
        };
      case 'crimson':
        return {
          primary: '#ff0055',
          secondary: '#d90429',
          glow: 'rgba(255, 0, 85, 0.65)',
          deepGlow: 'rgba(217, 4, 41, 0.25)',
          core: '#ffffff',
          coreRing: '#ffccd5',
        };
      case 'emerald':
        return {
          primary: '#00f5d4',
          secondary: '#00bbf9',
          glow: 'rgba(0, 245, 212, 0.65)',
          deepGlow: 'rgba(0, 187, 249, 0.25)',
          core: '#ffffff',
          coreRing: '#cbf3f0',
        };
      case 'violet':
        return {
          primary: '#b5179e',
          secondary: '#7209b7',
          glow: 'rgba(181, 23, 158, 0.65)',
          deepGlow: 'rgba(114, 9, 183, 0.25)',
          core: '#ffffff',
          coreRing: '#e0aaff',
        };
      case 'cyan':
      default:
        return {
          primary: '#00f0ff',
          secondary: '#0077ff',
          glow: 'rgba(0, 240, 255, 0.65)',
          deepGlow: 'rgba(0, 119, 255, 0.25)',
          core: '#ffffff',
          coreRing: '#d0f8ff',
        };
    }
  };

  // 3D Parallax Tilt Handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setTilt({
      x: Math.max(-1, Math.min(1, nx)) * 12,
      y: Math.max(-1, Math.min(1, ny)) * -12,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let pulseTime = 0;
    const particles: Particle[] = [];
    const maxParticles = 40;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const colors = getColorScheme();

      // State dynamics
      let rotSpeed = 0.012;
      let coreScale = 1;
      let particleIntensity = 0.2;

      if (state === 'listening') {
        rotSpeed = 0.035;
        const freq = speechService.getFrequencyData();
        const avg = freq.slice(0, 16).reduce((a, b) => a + b, 0) / 16;
        coreScale = 1 + (avg / 255) * 0.45;
        particleIntensity = 0.9;
      } else if (state === 'processing') {
        rotSpeed = 0.06;
        coreScale = 1 + Math.sin(pulseTime * 5) * 0.18;
        particleIntensity = 0.7;
      } else if (state === 'speaking') {
        rotSpeed = 0.025;
        const freq = speechService.getFrequencyData();
        const avg = freq.slice(0, 16).reduce((a, b) => a + b, 0) / 16;
        coreScale = 1 + (avg / 255) * 0.5 + Math.sin(pulseTime * 3) * 0.1;
        particleIntensity = 0.8;
      } else if (state === 'error') {
        rotSpeed = 0.005;
        colors.primary = '#ef4444';
        colors.glow = 'rgba(239, 68, 68, 0.7)';
        coreScale = 0.95 + Math.sin(pulseTime * 8) * 0.08;
      }

      angle += rotSpeed;
      pulseTime += 0.025;

      // 1. Deep Atmospheric Light Bloom (radial gradients)
      const outerGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, cx * 0.95);
      outerGlow.addColorStop(0, colors.deepGlow);
      outerGlow.addColorStop(0.4, 'rgba(0, 0, 0, 0.2)');
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, size, size);

      // 2. Active Quantum Particles
      if (Math.random() < particleIntensity && particles.length < maxParticles) {
        const pTheta = Math.random() * Math.PI * 2;
        const pRadius = cx * (0.35 + Math.random() * 0.4);
        particles.push({
          x: cx + Math.cos(pTheta) * pRadius,
          y: cy + Math.sin(pTheta) * pRadius,
          vx: Math.cos(pTheta) * (0.5 + Math.random() * 1.5),
          vy: Math.sin(pTheta) * (0.5 + Math.random() * 1.5),
          radius: 1 + Math.random() * 1.8,
          alpha: 0.8,
          life: 1,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.025;
        p.alpha = Math.max(0, p.life);

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.glow;
        ctx.fill();
      }

      // 3. Heavy Titanium Outer Chassis Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.3);

      ctx.beginPath();
      ctx.arc(0, 0, cx * 0.92, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Outer HUD Degree Calibrations
      const totalDegreeTicks = 72;
      for (let i = 0; i < totalDegreeTicks; i++) {
        const theta = (i * Math.PI * 2) / totalDegreeTicks;
        const isMajor = i % 6 === 0;
        const r1 = cx * (isMajor ? 0.86 : 0.89);
        const r2 = cx * 0.92;

        ctx.beginPath();
        ctx.moveTo(r1 * Math.cos(theta), r1 * Math.sin(theta));
        ctx.lineTo(r2 * Math.cos(theta), r2 * Math.sin(theta));
        ctx.strokeStyle = isMajor ? colors.primary : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isMajor ? 1.5 : 0.75;
        ctx.stroke();
      }
      ctx.restore();

      // 4. Counter-rotating segmented magnetic armature
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle * 0.5);

      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const start = (i * Math.PI * 2) / 3 + 0.15;
        const end = (i * Math.PI * 2) / 3 + (Math.PI * 2) / 3 - 0.15;
        ctx.arc(0, 0, cx * 0.78, start, end);
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10;
        ctx.stroke();
      }
      ctx.restore();

      // 5. Ten Segmented Mark 85 Copper Power Coils
      const numCoils = 10;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.18);

      for (let i = 0; i < numCoils; i++) {
        const theta = (i * Math.PI * 2) / numCoils;
        ctx.save();
        ctx.rotate(theta);
        ctx.translate(0, -cx * 0.62);

        // Dark node housing
        const w = cx * 0.16;
        const h = cx * 0.2;
        ctx.fillStyle = '#050a14';
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 2.5);
        ctx.fill();
        ctx.stroke();

        // Copper coil winding wraps
        ctx.shadowBlur = 0;
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 1.5;
        for (let l = -h / 2 + 3; l < h / 2 - 2; l += 3.5) {
          ctx.beginPath();
          ctx.moveTo(-w / 2 + 2, l);
          ctx.lineTo(w / 2 - 2, l);
          ctx.stroke();
        }

        ctx.restore();
      }
      ctx.restore();

      // 6. Inner Holographic Gyroscope Ring with Strobe Dashes
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle * 0.75);

      ctx.beginPath();
      ctx.arc(0, 0, cx * 0.46, 0, Math.PI * 2);
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.shadowColor = colors.primary;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 7. Radiant Palladium Central Power Core
      const coreR = cx * 0.32 * coreScale;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.2, colors.coreRing);
      coreGrad.addColorStop(0.65, colors.primary);
      coreGrad.addColorStop(1, 'rgba(0, 119, 255, 0.05)');

      ctx.save();
      ctx.shadowColor = colors.primary;
      ctx.shadowBlur = 32 * coreScale;
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // Central Stark Triangular Inlay
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const triAngle = angle * 0.4 + (i * Math.PI * 2) / 3;
        const tx = cx + Math.cos(triAngle) * (coreR * 0.65);
        const ty = cy + Math.sin(triAngle) * (coreR * 0.65);
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.stroke();

      // Micro core node center
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, accentColor, size]);

  const getStateTelemetry = () => {
    switch (state) {
      case 'listening':
        return { label: 'VOICE UPLINK // RECEIVING', statusClass: 'text-cyan-300 border-cyan-400 bg-cyan-950/70 animate-pulse' };
      case 'processing':
        return { label: 'QUANTUM CORE // THINKING', statusClass: 'text-amber-300 border-amber-400 bg-amber-950/70 animate-pulse' };
      case 'speaking':
        return { label: 'SYNTHESIS // BROADCASTING', statusClass: 'text-blue-300 border-blue-400 bg-blue-950/70 animate-pulse' };
      case 'paused':
        return { label: 'SYNTHESIS // PAUSED', statusClass: 'text-amber-300 border-amber-400 bg-amber-950/70' };
      case 'error':
        return { label: 'DIAGNOSTIC ALERT // OVERRIDE', statusClass: 'text-red-400 border-red-500 bg-red-950/70 animate-pulse' };
      case 'idle':
      default:
        return { label: 'ARC REACTOR // ONLINE', statusClass: 'text-cyan-400/80 border-cyan-500/30 bg-black/70' };
    }
  };

  const telemetry = getStateTelemetry();

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="flex flex-col items-center justify-center relative select-none perspective-[1000px]"
    >
      {/* 3D Interactive Tilting Reactor Container */}
      <div
        onClick={() => {
          soundEffects.playArcReactorPowerUp();
          onClick();
        }}
        style={{
          width: size,
          height: size,
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="relative cursor-pointer transition-transform duration-200 active:scale-95 group"
        title="Tap to speak with J.A.R.V.I.S. or interrupt current action"
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="w-full h-full drop-shadow-[0_0_35px_rgba(0,240,255,0.35)]"
        />

        {/* Ambient Holographic Target Reticle */}
        <div className="absolute inset-2 rounded-full border border-cyan-500/10 group-hover:border-cyan-400/30 transition-colors pointer-events-none" />
      </div>

      {/* Futuristic Telemetry Status Readout */}
      <div
        className={`mt-2.5 px-3.5 py-1 text-[11px] font-hud tracking-widest uppercase rounded border backdrop-blur-md ${telemetry.statusClass} hud-bracket shadow-lg`}
      >
        {telemetry.label}
      </div>
    </div>
  );
};
