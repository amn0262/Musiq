import React, { useEffect, useRef } from 'react';
import { youtubeAudioService } from '../services/youtubeAudioService';
import { VisualizerStyle } from '../services/storage';

interface AudioVisualizerProps {
  isPlaying: boolean;
  style?: VisualizerStyle;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  style = 'wave',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;
    let currentAmplitude = isPlaying ? 28 : 0;

    // Persistent particles for particle mode
    const particleCount = 48;
    const particles = Array.from({ length: particleCount }, (_, idx) => ({
      x: (idx / particleCount) * 600,
      y: 100 + (Math.sin(idx * 1.5) * 40),
      radius: 1.5 + Math.random() * 2.5,
      speedX: 0.4 + Math.random() * 0.8,
      speedY: (Math.random() - 0.5) * 0.6,
      baseAlpha: 0.3 + Math.random() * 0.5,
    }));

    const updateCanvasSize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    const render = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width <= 0 || height <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth amplitude dampening/ramping
      const targetAmp = isPlaying ? 34 : 0;
      currentAmplitude += (targetAmp - currentAmplitude) * 0.08;

      // Extract real audio frequency data from Web Audio Analyser if active
      let freqFactor = 1.0;
      let bassAvg = 0;
      const freqData = youtubeAudioService.getAudioFrequencyData();
      if (freqData && isPlaying) {
        let sum = 0;
        const checkRange = Math.min(freqData.length, 36);
        for (let i = 0; i < checkRange; i++) {
          sum += freqData[i];
        }
        const avg = sum / checkRange;
        freqFactor = 0.55 + (avg / 255) * 1.7;
        bassAvg = (freqData[2] || avg) / 255;
      }

      // Phase progression (left-to-right motion)
      const speed = isPlaying ? 0.042 * freqFactor : 0.006;
      phase += speed;

      // ==========================================
      // MODE 1: HARMONIC WAVE (Flowing Glowing Wave)
      // ==========================================
      if (style === 'wave') {
        const points = Math.min(180, Math.max(90, Math.floor(width / 6)));
        const step = width / points;

        // Ghost secondary line
        if (currentAmplitude > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.lineWidth = 1.4;

          for (let i = 0; i <= points; i++) {
            const x = i * step;
            const progress = x / width;
            const envelope = Math.sin(progress * Math.PI);
            const y =
              centerY +
              Math.sin(progress * 8 - phase * 1.5) *
                Math.cos(progress * 5 - phase * 0.9) *
                (currentAmplitude * 0.65 * envelope * freqFactor);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        }

        // Primary Glowing Line
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isPlaying ? 2.6 : 1.5;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowBlur = isPlaying ? 16 : 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i <= points; i++) {
          const x = i * step;
          const progress = x / width;
          const envelope = Math.sin(progress * Math.PI);
          const harmonic1 = Math.sin(progress * 10 - phase * 2.0);
          const harmonic2 = Math.cos(progress * 16 - phase * 1.3) * 0.42;
          const harmonic3 = Math.sin(progress * 24 - phase * 2.6) * 0.22;

          const displacement =
            (harmonic1 + harmonic2 + harmonic3) * currentAmplitude * envelope * freqFactor;
          const y = centerY + displacement;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // ==========================================
      // MODE 2: SPECTRUM BARS (Mirrored Audio Bars)
      // ==========================================
      else if (style === 'bars') {
        const barCount = Math.min(48, Math.max(24, Math.floor(width / 14)));
        const totalBarWidth = barCount * 8 + (barCount - 1) * 4;
        const startX = (width - totalBarWidth) / 2;

        ctx.save();
        for (let i = 0; i < barCount; i++) {
          const x = startX + i * 12;
          const normIdx = Math.abs(i - barCount / 2) / (barCount / 2);
          const envelope = 1 - normIdx * 0.6;

          let barHeight = 4;
          if (isPlaying) {
            let dataVal = 0.5;
            if (freqData && freqData.length > 0) {
              const dataIndex = Math.floor((i / barCount) * Math.min(freqData.length, 64));
              dataVal = (freqData[dataIndex] || 100) / 255;
            } else {
              dataVal = (Math.sin(i * 0.4 + phase * 2) * 0.5 + 0.5) * 0.7;
            }
            barHeight = Math.max(4, dataVal * 48 * envelope * freqFactor);
          }

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
          ctx.shadowBlur = isPlaying ? 10 : 2;

          // Mirrored bar: grows upwards and downwards symmetrically from center
          const topY = centerY - barHeight / 2;
          ctx.beginPath();
          ctx.roundRect(x, topY, 6, barHeight, 3);
          ctx.fill();
        }
        ctx.restore();
      }

      // ==========================================
      // MODE 3: PULSING RING (Glowing Audio Circle)
      // ==========================================
      else if (style === 'circle') {
        const baseRadius = Math.min(height * 0.32, 54);
        const pulse = isPlaying ? (bassAvg * 16 + Math.sin(phase * 3) * 3) * (currentAmplitude / 34) : 0;
        const radius = baseRadius + pulse;

        ctx.save();
        // Outer faint aura ring
        if (isPlaying) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius + 14 + Math.sin(phase * 2) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Main modulated ring
        ctx.beginPath();
        const segments = 60;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          let mod = 0;
          if (isPlaying) {
            mod = Math.sin(angle * 7 + phase * 4) * 4 * (currentAmplitude / 34) * freqFactor;
          }
          const r = radius + mod;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isPlaying ? 2.8 : 1.6;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowBlur = isPlaying ? 18 : 6;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(centerX, centerY, isPlaying ? 4 + bassAvg * 3 : 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      // ==========================================
      // MODE 4: PARTICLES (Floating Audio Particles)
      // ==========================================
      else if (style === 'particles') {
        ctx.save();
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (isPlaying) {
            p.x += p.speedX * (1 + bassAvg * 1.5);
            p.y += p.speedY + Math.sin(phase + i) * 0.4;
          } else {
            p.x += 0.2;
          }

          // Wrap horizontally
          if (p.x > width + 10) p.x = -10;
          if (p.y < 10) p.y = height - 10;
          if (p.y > height - 10) p.y = 10;

          const particleY = centerY + (p.y - 100) * 0.6;
          const r = p.radius * (isPlaying ? 1 + bassAvg * 0.8 : 0.8);

          ctx.beginPath();
          ctx.arc(p.x, particleY, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.baseAlpha})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = isPlaying ? 10 : 3;
          ctx.fill();

          // Connect adjacent particles with subtle constellation lines
          if (i > 0) {
            const prevP = particles[i - 1];
            const prevY = centerY + (prevP.y - 100) * 0.6;
            const dist = Math.hypot(p.x - prevP.x, particleY - prevY);
            if (dist < 60) {
              ctx.beginPath();
              ctx.moveTo(p.x, particleY);
              ctx.lineTo(prevP.x, prevY);
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - dist / 60)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // ==========================================
      // MODE 5: HARMONIC RIBBON (Dual Flowing Ribbon)
      // ==========================================
      else if (style === 'ribbon') {
        const points = Math.min(140, Math.max(70, Math.floor(width / 8)));
        const step = width / points;

        for (let ribbonIdx = 0; ribbonIdx < 2; ribbonIdx++) {
          const offsetSign = ribbonIdx === 0 ? 1 : -1;
          const phaseOffset = ribbonIdx * 1.2;

          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = ribbonIdx === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = ribbonIdx === 0 ? (isPlaying ? 2.6 : 1.5) : 1.6;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = isPlaying ? 14 : 4;
          ctx.lineCap = 'round';

          for (let i = 0; i <= points; i++) {
            const x = i * step;
            const progress = x / width;
            const envelope = Math.sin(progress * Math.PI);

            const y =
              centerY +
              offsetSign *
                Math.sin(progress * 7 + phase * 1.8 + phaseOffset) *
                Math.cos(progress * 4 - phase * 0.9) *
                (currentAmplitude * envelope * freqFactor);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isPlaying, style]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-36 sm:h-52 overflow-hidden flex items-center justify-center relative ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
};
