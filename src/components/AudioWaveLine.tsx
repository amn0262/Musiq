import React, { useEffect, useRef } from 'react';
import { youtubeAudioService } from '../services/youtubeAudioService';

interface AudioWaveLineProps {
  isPlaying: boolean;
  className?: string;
}

export const AudioWaveLine: React.FC<AudioWaveLineProps> = ({ isPlaying, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;
    let currentAmplitude = isPlaying ? 35 : 0;
    let beatPulse = 1.0;

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

      const centerY = height / 2;
      ctx.clearRect(0, 0, width, height);

      // Extract real audio frequency spectrum
      let bassEnergy = 0.5;
      let midEnergy = 0.5;
      let trebleEnergy = 0.5;
      let freqFactor = 1.0;

      const freqData = youtubeAudioService.getAudioFrequencyData();
      if (freqData && isPlaying) {
        let bSum = 0;
        let mSum = 0;
        let tSum = 0;
        const bCount = Math.min(freqData.length, 8);
        const mCount = Math.min(freqData.length, 36);
        const tCount = Math.min(freqData.length, 96);

        for (let i = 0; i < bCount; i++) bSum += freqData[i];
        for (let i = bCount; i < mCount; i++) mSum += freqData[i];
        for (let i = mCount; i < tCount; i++) tSum += freqData[i];

        bassEnergy = bCount > 0 ? (bSum / bCount) / 255 : 0.5;
        midEnergy = mCount > bCount ? (mSum / (mCount - bCount)) / 255 : 0.5;
        trebleEnergy = tCount > mCount ? (tSum / (tCount - mCount)) / 255 : 0.5;

        freqFactor = 0.7 + (bassEnergy * 1.2 + midEnergy * 0.8 + trebleEnergy * 0.5) * 0.8;
      }

      // Smooth amplitude ramping based on playback state
      const targetAmp = isPlaying ? 40 * freqFactor : 0;
      currentAmplitude += (targetAmp - currentAmplitude) * (isPlaying ? 0.16 : 0.08);

      // Musical beat impulse
      const now = performance.now();
      const beatCycle = (now % 476) / 476;
      const targetBeat = isPlaying ? 1.0 + Math.pow(Math.max(0, 1 - beatCycle * 2.5), 2) * 0.45 * bassEnergy : 1.0;
      beatPulse += (targetBeat - beatPulse) * 0.2;

      // FAST musical velocity flowing rapidly from left to right
      // Base velocity is high (0.16) and surges dynamically with audio transients
      const speed = isPlaying ? (0.16 + freqFactor * 0.09) : 0.003;
      phase += speed;

      const points = Math.min(220, Math.max(100, Math.floor(width / 4)));
      const step = width / points;

      // Peak tracker for luminous electric nodes
      let maxDisplacement = 0;
      let peakX = width / 2;
      let peakY = centerY;

      // 1. Draw Subtle Ambient Harmonic Glow Trace (Ghost Layer)
      if (currentAmplitude > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.lineWidth = 1.2;

        for (let i = 0; i <= points; i++) {
          const x = i * step;
          const progress = x / width;
          const envelope = Math.sin(progress * Math.PI);

          // Fast secondary wave traveling left to right
          const h1 = Math.sin(progress * 6 - phase * 1.6);
          const h2 = Math.cos(progress * 15 - phase * 3.2) * 0.55;
          const h3 = Math.sin(progress * 34 - phase * 5.4) * 0.32;

          const y =
            centerY +
            (h1 + h2 + h3) * (currentAmplitude * 0.7 * beatPulse * envelope);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 2. Draw Primary Core Music Wave Line (Sharp, Fast, Oscilloscope-Grade)
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isPlaying ? Math.min(3.6, 2.4 + bassEnergy * 1.2) : 1.5;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = isPlaying ? (12 + bassEnergy * 14) : 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i <= points; i++) {
        const x = i * step;
        const progress = x / width;
        const envelope = Math.sin(progress * Math.PI);

        // Multi-frequency musical acoustic spectrum:
        // - Fundamental bass frequency (fast traveling wave)
        const bassWave = Math.sin(progress * 8 - phase * 2.2);
        // - Mid-range vocal & melodic vibration
        const midWave = Math.cos(progress * 18 - phase * 4.0) * (0.55 + midEnergy * 0.3);
        // - High-frequency rapid sound wave ripples & sibilants
        const trebleWave = Math.sin(progress * 44 - phase * 7.2) * (0.28 + trebleEnergy * 0.35);
        // - Micro transient jitter (oscilloscope audio grain)
        const jitterWave = Math.cos(progress * 80 - phase * 11.0) * (0.12 * trebleEnergy);

        const displacement =
          (bassWave + midWave + trebleWave + jitterWave) *
          currentAmplitude *
          beatPulse *
          envelope;

        const y = centerY + displacement;

        if (Math.abs(displacement) > maxDisplacement) {
          maxDisplacement = Math.abs(displacement);
          peakX = x;
          peakY = y;
        }

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.restore();

      // 3. Electric Peak Accent Sparks on Heavy Beats
      if (isPlaying && maxDisplacement > 18) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(peakX, peakY, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-40 sm:h-56 overflow-hidden flex items-center justify-center relative ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
};
