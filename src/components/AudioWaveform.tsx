import React, { useEffect, useRef } from 'react';
import { AssistantState, HudAccentColor } from '../types';
import { speechService } from '../services/speechService';

interface AudioWaveformProps {
  state: AssistantState;
  accentColor: HudAccentColor;
  height?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  state,
  accentColor,
  height = 36,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getBarColor = () => {
    switch (accentColor) {
      case 'gold':
        return { primary: '#ffb703', glow: 'rgba(255, 183, 3, 0.6)' };
      case 'crimson':
        return { primary: '#ff0055', glow: 'rgba(255, 0, 85, 0.6)' };
      case 'emerald':
        return { primary: '#00f5d4', glow: 'rgba(0, 245, 212, 0.6)' };
      case 'violet':
        return { primary: '#b5179e', glow: 'rgba(181, 23, 158, 0.6)' };
      case 'cyan':
      default:
        return { primary: '#00f0ff', glow: 'rgba(0, 240, 255, 0.6)' };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    const numBars = 48;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;
      const barWidth = (w / numBars) * 0.55;
      const gap = (w / numBars) * 0.45;
      const colorScheme = getBarColor();

      const freqData = speechService.getFrequencyData();
      phase += 0.04;

      // Draw subtle baseline horizontal laser
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      for (let i = 0; i < numBars; i++) {
        // Mirrored center distribution
        const distFromCenter = Math.abs(i - numBars / 2) / (numBars / 2);
        let barHeight = 3;

        if (state === 'listening' || state === 'speaking') {
          const sample = freqData[i % freqData.length] || 0;
          barHeight = Math.max(3, (sample / 255) * (h * 0.9) * (1 - distFromCenter * 0.4));
        } else if (state === 'processing') {
          // Flowing sinewave pattern
          barHeight = 4 + (Math.sin(phase * 3 + i * 0.25) + 1) * 0.5 * (h * 0.6) * (1 - distFromCenter * 0.3);
        } else {
          // Idle gentle shimmer
          barHeight = 3 + Math.sin(phase * 1.5 + i * 0.2) * 2;
        }

        const x = i * (barWidth + gap) + gap / 2;
        const halfH = barHeight / 2;

        const grad = ctx.createLinearGradient(0, centerY - halfH, 0, centerY + halfH);
        grad.addColorStop(0, colorScheme.primary);
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(1, colorScheme.primary);

        ctx.fillStyle = grad;
        ctx.shadowColor = colorScheme.glow;
        ctx.shadowBlur = state !== 'idle' ? 8 : 2;

        ctx.beginPath();
        ctx.roundRect(x, centerY - halfH, barWidth, barHeight, 1.5);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, accentColor]);

  return (
    <div className="w-full flex items-center justify-center px-4 py-1">
      <canvas
        ref={canvasRef}
        width={420}
        height={height}
        className="w-full max-w-md h-9 block"
      />
    </div>
  );
};
