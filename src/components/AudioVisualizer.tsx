import React, { useEffect, useRef } from 'react';
import { youtubeAudioService } from '../services/youtubeAudioService';
import { VisualizerStyle } from '../services/storage';
import {
  extractFrequencyBands,
  smoothValue,
  updatePeakCaps,
  getIOSVisualizerColors,
  getPerceptualFrequencyDistribution,
  getSymmetricalSpectrum,
  AudioFrequencyBands,
} from '../utils/visualizerMath';

interface AudioVisualizerProps {
  isPlaying: boolean;
  style?: VisualizerStyle;
  className?: string;
}

interface StarParticle {
  x: number;
  y: number;
  z: number;
  pz: number;
  size: number;
  colorIndex: number;
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
    let smoothAmp = isPlaying ? 28 : 0;

    // Smoothed frequency band state
    const currentBands: AudioFrequencyBands = {
      subBass: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      overallEnergy: 0,
    };

    // Smoothed frequency bins for bar & wave point mapping
    const smoothedBins = new Float32Array(64);
    const smoothedBarHeights = new Float32Array(64);
    const smoothedRadialRays = new Float32Array(72);
    let peakCaps = new Array<number>(64).fill(0);
    let peakVelocities = new Array<number>(64).fill(0);

    // 3D Starfield particles for iTunes Galaxy mode
    const starCount = 80;
    const stars: StarParticle[] = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600,
      z: Math.random() * 800 + 1,
      pz: 800,
      size: Math.random() * 2 + 1,
      colorIndex: Math.floor(Math.random() * 4),
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

      // Extract real-time frequency data
      const rawFreqData = youtubeAudioService.getAudioFrequencyData();
      const targetBands = extractFrequencyBands(isPlaying ? rawFreqData : null);

      // Smooth frequency bands
      currentBands.subBass = smoothValue(currentBands.subBass, targetBands.subBass, 0.22);
      currentBands.bass = smoothValue(currentBands.bass, targetBands.bass, 0.2);
      currentBands.mid = smoothValue(currentBands.mid, targetBands.mid, 0.18);
      currentBands.treble = smoothValue(currentBands.treble, targetBands.treble, 0.25);
      currentBands.overallEnergy = smoothValue(
        currentBands.overallEnergy,
        targetBands.overallEnergy,
        0.2
      );

      // Smooth individual bins
      if (rawFreqData && isPlaying) {
        for (let i = 0; i < smoothedBins.length; i++) {
          const rawVal = (rawFreqData[i] || 0) / 255;
          smoothedBins[i] = smoothValue(smoothedBins[i], rawVal, 0.28);
        }
      } else {
        for (let i = 0; i < smoothedBins.length; i++) {
          smoothedBins[i] = smoothValue(smoothedBins[i], 0, 0.1);
        }
      }

      // Smooth overall amplitude
      const targetAmp = isPlaying ? 34 + currentBands.overallEnergy * 32 : 0;
      smoothAmp = smoothValue(smoothAmp, targetAmp, 0.12);

      // Motion speed reacts to tempo and energy
      const speed = isPlaying ? 0.035 + currentBands.bass * 0.045 : 0.005;
      phase += speed;

      const colors = getIOSVisualizerColors(style);

      // =========================================================================
      // 1. iOS SIRI / APPLE MUSIC DYNAMIC WAVE (Iridescent Layered Glow Wave)
      // =========================================================================
      if (style === 'wave') {
        const pointCount = Math.min(140, Math.max(70, Math.floor(width / 6)));
        const step = width / (pointCount - 1);

        // Ambient glass bloom beneath wave
        if (isPlaying && currentBands.overallEnergy > 0.1) {
          const auraGrad = ctx.createRadialGradient(
            centerX,
            centerY,
            10,
            centerX,
            centerY,
            width * 0.45
          );
          auraGrad.addColorStop(0, `rgba(168, 85, 247, ${0.15 + currentBands.subBass * 0.2})`);
          auraGrad.addColorStop(0.5, `rgba(6, 182, 212, ${0.08 + currentBands.bass * 0.12})`);
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.save();
          ctx.fillStyle = auraGrad;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }

        // Layer 1: Secondary Violet/Magenta Harmonic Wave
        if (smoothAmp > 1) {
          ctx.save();
          ctx.beginPath();
          const waveGrad2 = ctx.createLinearGradient(0, 0, width, 0);
          waveGrad2.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
          waveGrad2.addColorStop(0.5, 'rgba(168, 85, 247, 0.55)');
          waveGrad2.addColorStop(1, 'rgba(59, 130, 246, 0.4)');
          ctx.strokeStyle = waveGrad2;
          ctx.lineWidth = 2.0;

          for (let i = 0; i < pointCount; i++) {
            const x = i * step;
            const progress = x / width;
            const envelope = Math.sin(progress * Math.PI);
            const binIdx = Math.floor(progress * 30);
            const binVal = smoothedBins[binIdx] || 0;

            const y =
              centerY +
              Math.sin(progress * 7 - phase * 1.6) *
                Math.cos(progress * 4 + phase * 0.8) *
                (smoothAmp * 0.65 * envelope) +
              Math.sin(progress * 15 - phase * 2.2) * (binVal * 28 * envelope);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        }

        // Layer 2: Primary iOS Electric Cyan & Fuchsia Glowing Wave
        ctx.save();
        ctx.beginPath();
        const mainGrad = ctx.createLinearGradient(0, 0, width, 0);
        mainGrad.addColorStop(0, '#EC4899');
        mainGrad.addColorStop(0.35, '#C084FC');
        mainGrad.addColorStop(0.7, '#22D3EE');
        mainGrad.addColorStop(1, '#38BDF8');

        ctx.strokeStyle = mainGrad;
        ctx.lineWidth = isPlaying ? 3.0 : 1.6;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = isPlaying ? 18 + currentBands.bass * 14 : 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < pointCount; i++) {
          const x = i * step;
          const progress = x / width;
          const envelope = Math.sin(progress * Math.PI);

          // Map frequency bins symmetrically from center outward or left to right
          const freqIndex = Math.floor(Math.abs(progress - 0.5) * 2 * 32);
          const freqVal = smoothedBins[freqIndex] || 0;

          const harmonic1 = Math.sin(progress * 8 - phase * 2.1);
          const harmonic2 = Math.cos(progress * 14 - phase * 1.4) * 0.4;
          const ripple = Math.sin(progress * 26 + phase * 3.2) * (currentBands.treble * 0.4);

          const displacement =
            (harmonic1 + harmonic2 + ripple) * (smoothAmp * envelope) +
            (freqVal * 36 * envelope * (1 + currentBands.subBass * 0.8));

          const y = centerY + displacement;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Layer 3: Pure white intense core filament
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
      }

      // =========================================================================
      // 2. iOS STUDIO RETINA SPECTRUM BARS (Mirrored with Gravity Peak Drops)
      // =========================================================================
      else if (style === 'bars') {
        // Generous, balanced width spanning up to 92% of the canvas
        const availableWidth = Math.min(width * 0.92, width - 20);
        // Calculate balanced bar count: 32 to 64 bars depending on screen width
        const barCount = Math.min(64, Math.max(32, Math.floor(availableWidth / 11)));
        const barGap = 3.5;
        const barWidth = Math.max(3, (availableWidth - (barCount - 1) * barGap) / barCount);
        const totalWidth = barCount * barWidth + (barCount - 1) * barGap;
        const startX = (width - totalWidth) / 2;

        // Dynamic height scale: responsive to energetic music peaks (up to 85% of canvas height)
        const maxBarSpan = Math.min(height * 0.85, 240);

        // Extract perceptual frequency distribution across all frequency bands
        const rawPerceptual = getPerceptualFrequencyDistribution(
          isPlaying ? rawFreqData : null,
          barCount,
          { trebleBoost: 2.8, bassBoost: 1.3, minThreshold: 0.015 }
        );

        // Create symmetrical studio layout (bass in center, highs at flanks)
        const targetAmplitudes = getSymmetricalSpectrum(rawPerceptual);

        const currentBarHeights: number[] = new Array(barCount);

        for (let i = 0; i < barCount; i++) {
          let targetH = 6;
          if (isPlaying) {
            const rawAmp = targetAmplitudes[i] || 0;
            // Center bass emphasis + treble edge sparkle
            const normCenter = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
            const bassInfluence = normCenter * currentBands.subBass * 0.35;
            const trebleInfluence = (1 - normCenter) * currentBands.treble * 0.35;
            const energyMod = Math.sin(phase * 3.5 + i * 0.38) * (currentBands.overallEnergy * 4 + 2);

            const effectiveAmp = Math.min(1, Math.max(0.12, rawAmp * 1.25 + bassInfluence + trebleInfluence));
            targetH = Math.max(6, effectiveAmp * maxBarSpan + energyMod);
          }

          // Smooth interpolation for silky physics (rapid attack, smooth decay)
          smoothedBarHeights[i] = smoothValue(
            smoothedBarHeights[i] || 0,
            targetH,
            targetH > (smoothedBarHeights[i] || 0) ? 0.38 : 0.18
          );
          currentBarHeights[i] = smoothedBarHeights[i];
        }

        // Update floating peak hold caps with gravity physics
        const peakResult = updatePeakCaps(currentBarHeights, peakCaps, peakVelocities, 0.45);
        peakCaps = peakResult.peaks;
        peakVelocities = peakResult.velocities;

        ctx.save();

        // Ambient glass studio bloom underneath the spectrum
        if (isPlaying && currentBands.overallEnergy > 0.08) {
          const bgGlow = ctx.createRadialGradient(
            centerX,
            centerY,
            10,
            centerX,
            centerY,
            totalWidth * 0.48
          );
          bgGlow.addColorStop(0, `rgba(168, 85, 247, ${0.12 + currentBands.subBass * 0.18})`);
          bgGlow.addColorStop(0.5, `rgba(56, 189, 248, ${0.06 + currentBands.bass * 0.1})`);
          bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = bgGlow;
          ctx.fillRect(0, 0, width, height);
        }

        // Subtle baseline filament line
        ctx.beginPath();
        ctx.moveTo(startX - 10, centerY);
        ctx.lineTo(startX + totalWidth + 10, centerY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Symmetrical Retina Spectrum Bars
        for (let i = 0; i < barCount; i++) {
          const x = startX + i * (barWidth + barGap);
          const h = currentBarHeights[i];
          const topY = centerY - h / 2;

          // Apple Retina Gradient: Sky Blue tips -> Vivid Violet middle -> Hot Fuchsia center
          const grad = ctx.createLinearGradient(x, topY, x, topY + h);
          grad.addColorStop(0, '#38BDF8'); // Top Cyan/Sky Blue
          grad.addColorStop(0.25, '#818CF8'); // Indigo
          grad.addColorStop(0.5, '#C084FC'); // Purple center
          grad.addColorStop(0.75, '#EC4899'); // Fuchsia
          grad.addColorStop(1, '#F43F5E'); // Bottom Coral

          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(192, 132, 252, 0.55)';
          ctx.shadowBlur = isPlaying ? 6 + currentBands.subBass * 8 : 2;

          // Rounded capsule bar
          ctx.beginPath();
          ctx.roundRect(x, topY, barWidth, h, Math.min(barWidth / 2, 4));
          ctx.fill();

          // Floating peak cap (Apple Studio / Logic Pro Peak Meter)
          if (isPlaying && peakCaps[i] > 8) {
            const peakH = peakCaps[i];
            const peakYTop = centerY - peakH / 2 - 2;
            const peakYBottom = centerY + peakH / 2 + 1;

            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 5;

            // Top peak tick
            ctx.fillRect(x, Math.max(2, peakYTop), barWidth, 2);
            // Bottom peak tick
            ctx.fillRect(x, Math.min(height - 4, peakYBottom), barWidth, 2);
          }
        }
        ctx.restore();
      }

      // =========================================================================
      // 3. iTUNES COSMIC RADIAL PULSAR / ORB (360° Circular Spectrum & Pulsing Halo)
      // =========================================================================
      else if (style === 'circle') {
        const minDim = Math.min(width, height);
        // Expansive, cinematic base radius (scaled with viewport, not clamped to tiny 48px)
        const baseRadius = Math.max(52, Math.min(minDim * 0.22, 115));
        const bassThrob = isPlaying
          ? currentBands.subBass * 32 + currentBands.bass * 18
          : 0;
        const currentRadius = baseRadius + bassThrob;

        ctx.save();

        // 1. Concentric Bass Shockwaves expanding outwards
        if (isPlaying && currentBands.bass > 0.18) {
          // Shockwave 1: Inner ring
          const ring1Radius = currentRadius + 18 + (phase * 35) % 45;
          const alpha1 = Math.max(0, 0.35 - ((ring1Radius - currentRadius) / 55));
          ctx.beginPath();
          ctx.arc(centerX, centerY, ring1Radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha1})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Shockwave 2: Outer resonant ring
          const ring2Radius = currentRadius + 32 + (phase * 25) % 65;
          const alpha2 = Math.max(0, 0.25 - ((ring2Radius - currentRadius) / 75));
          ctx.beginPath();
          ctx.arc(centerX, centerY, ring2Radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168, 85, 247, ${alpha2})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // 2. 360-Degree Symmetrical Radial Spectrum Rays
        const rayCount = 72; // Ultra smooth 360° circle
        const halfRays = rayCount / 2;
        // Distribute perceptual frequencies across the half-circle (bass at poles, treble at flanks)
        const rawPerceptual = getPerceptualFrequencyDistribution(
          isPlaying ? rawFreqData : null,
          halfRays,
          { trebleBoost: 2.8, bassBoost: 1.3, minThreshold: 0.02 }
        );
        const halfSpectrum = getSymmetricalSpectrum(rawPerceptual);

        const maxRaySpan = Math.min(minDim * 0.28, 92);

        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 - Math.PI / 2 + phase * 0.25;

          // Mirror frequency symmetrically across left and right hemispheres
          const freqIdx = i < halfRays ? i : rayCount - 1 - i;
          const freqVal = halfSpectrum[freqIdx] || 0;

          let targetRayLen = 6;
          if (isPlaying) {
            const pulseWobble = Math.sin(phase * 4 + i * 0.45) * (currentBands.mid * 5 + 2);
            const effectiveVal = Math.max(0.12, freqVal * (1 + currentBands.overallEnergy * 0.45));
            targetRayLen = Math.max(
              6,
              effectiveVal * maxRaySpan + pulseWobble
            );
          }

          // Smooth interpolation for each ray
          smoothedRadialRays[i] = smoothValue(
            smoothedRadialRays[i] || 0,
            targetRayLen,
            targetRayLen > (smoothedRadialRays[i] || 0) ? 0.35 : 0.16
          );
          const rayLen = smoothedRadialRays[i];

          const x1 = centerX + Math.cos(angle) * currentRadius;
          const y1 = centerY + Math.sin(angle) * currentRadius;
          const x2 = centerX + Math.cos(angle) * (currentRadius + rayLen);
          const y2 = centerY + Math.sin(angle) * (currentRadius + rayLen);

          // Ray coloring: alternating chromatic cyan, violet, and electric rose
          const rayGrad = ctx.createLinearGradient(x1, y1, x2, y2);
          rayGrad.addColorStop(0, 'rgba(34, 211, 238, 0.9)');
          rayGrad.addColorStop(0.6, 'rgba(192, 132, 252, 0.95)');
          rayGrad.addColorStop(1, '#FFFFFF');

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = rayGrad;
          ctx.lineWidth = 2.4;
          ctx.lineCap = 'round';
          ctx.shadowColor = 'rgba(34, 211, 238, 0.6)';
          ctx.shadowBlur = isPlaying ? 6 + currentBands.bass * 6 : 2;
          ctx.stroke();

          // Floating starlight spark at ray tip on energetic beats
          if (isPlaying && rayLen > 14) {
            const sparkDistance = currentRadius + rayLen + 3;
            const sx = centerX + Math.cos(angle) * sparkDistance;
            const sy = centerY + Math.sin(angle) * sparkDistance;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 6;
            ctx.fill();
          }
        }

        // 3. Chromatic Coronal Ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4. Radiant Glowing Core Orb
        const coreGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          2,
          centerX,
          centerY,
          currentRadius * 0.92
        );
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        coreGrad.addColorStop(0.35, 'rgba(34, 211, 238, 0.7)');
        coreGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.35)');
        coreGrad.addColorStop(1, 'rgba(236, 72, 153, 0.05)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius * 0.92, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.shadowColor = 'rgba(34, 211, 238, 0.9)';
        ctx.shadowBlur = isPlaying ? 28 + currentBands.subBass * 22 : 8;
        ctx.fill();

        // 5. iTunes Center Jewel Diamond Glint
        const glintSize = isPlaying ? 5 + currentBands.subBass * 4 : 4;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(phase * 0.6);
        ctx.beginPath();
        ctx.moveTo(0, -glintSize * 2.2);
        ctx.lineTo(glintSize * 0.7, 0);
        ctx.lineTo(0, glintSize * 2.2);
        ctx.lineTo(-glintSize * 0.7, 0);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();

        ctx.restore();
      }

      // =========================================================================
      // 4. iTUNES GALAXY STARFIELD & NEBULA VORTEX (3D Cosmic Warp Flow)
      // =========================================================================
      else if (style === 'particles') {
        ctx.save();

        // Central Nebula Pulse
        if (isPlaying) {
          const nebulaRadius = 80 + currentBands.subBass * 60;
          const nebulaGrad = ctx.createRadialGradient(
            centerX,
            centerY,
            5,
            centerX,
            centerY,
            nebulaRadius
          );
          nebulaGrad.addColorStop(0, `rgba(244, 114, 182, ${0.25 + currentBands.bass * 0.3})`);
          nebulaGrad.addColorStop(0.5, `rgba(96, 165, 250, ${0.15 + currentBands.mid * 0.2})`);
          nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = nebulaGrad;
          ctx.fillRect(0, 0, width, height);
        }

        const warpSpeed = isPlaying ? 3.5 + currentBands.subBass * 9 + currentBands.treble * 4 : 0.8;
        const colorPalette = ['#FFFFFF', '#67E8F9', '#C084FC', '#F472B6'];

        // Render 3D Starfield
        for (let i = 0; i < stars.length; i++) {
          const star = stars[i];
          star.pz = star.z;
          star.z -= warpSpeed;

          // Wrap stars around camera
          if (star.z <= 0) {
            star.z = 800;
            star.pz = 800;
            star.x = (Math.random() - 0.5) * width * 1.5;
            star.y = (Math.random() - 0.5) * height * 1.5;
          }

          const k = 250 / star.z;
          const px = star.x * k + centerX;
          const py = star.y * k + centerY;

          const pk = 250 / star.pz;
          const prevX = star.x * pk + centerX;
          const prevY = star.y * pk + centerY;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const alpha = Math.min(1, Math.max(0.15, (800 - star.z) / 600));
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(px, py);

            ctx.strokeStyle = colorPalette[star.colorIndex];
            ctx.globalAlpha = alpha;
            ctx.lineWidth = Math.min(3, Math.max(1, (1 - star.z / 800) * 3));
            ctx.shadowColor = colorPalette[star.colorIndex];
            ctx.shadowBlur = isPlaying ? 6 : 2;
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // =========================================================================
      // 5. iOS LIQUID RIBBON FLOW (Interwoven 3D Neon Ribbons)
      // =========================================================================
      else if (style === 'ribbon') {
        const pointCount = Math.min(110, Math.max(60, Math.floor(width / 7)));
        const step = width / (pointCount - 1);

        for (let ribbonIdx = 0; ribbonIdx < 2; ribbonIdx++) {
          const offsetSign = ribbonIdx === 0 ? 1 : -1;
          const phaseOffset = ribbonIdx * 1.5;

          ctx.save();
          ctx.beginPath();

          const ribbonGrad = ctx.createLinearGradient(0, 0, width, 0);
          if (ribbonIdx === 0) {
            ribbonGrad.addColorStop(0, '#34D399'); // Emerald
            ribbonGrad.addColorStop(0.5, '#06B6D4'); // Cyan
            ribbonGrad.addColorStop(1, '#818CF8'); // Indigo
          } else {
            ribbonGrad.addColorStop(0, 'rgba(129, 140, 248, 0.7)');
            ribbonGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.7)');
            ribbonGrad.addColorStop(1, 'rgba(52, 211, 153, 0.7)');
          }

          ctx.strokeStyle = ribbonGrad;
          ctx.lineWidth = isPlaying ? 2.8 : 1.6;
          ctx.shadowColor = ribbonIdx === 0 ? 'rgba(52, 211, 153, 0.75)' : 'rgba(236, 72, 153, 0.65)';
          ctx.shadowBlur = isPlaying ? 16 + currentBands.subBass * 10 : 4;
          ctx.lineCap = 'round';

          for (let i = 0; i < pointCount; i++) {
            const x = i * step;
            const progress = x / width;
            const envelope = Math.sin(progress * Math.PI);
            const binIdx = Math.floor(progress * 28);
            const freqDisp = (smoothedBins[binIdx] || 0) * 32 * envelope;

            const y =
              centerY +
              offsetSign *
                Math.sin(progress * 6 + phase * 1.8 + phaseOffset) *
                Math.cos(progress * 3 - phase * 0.9) *
                (smoothAmp * envelope) +
              offsetSign * freqDisp;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        }
      }

      // =========================================================================
      // 6. iTUNES CLASSIC MAGNETOSPHERE / LIQUID AURORA
      // =========================================================================
      else if (style === 'aurora') {
        const pointCount = Math.min(100, Math.max(50, Math.floor(width / 8)));
        const step = width / (pointCount - 1);
        const layers = 3;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        for (let l = 0; l < layers; l++) {
          const lPhase = phase * (1.2 + l * 0.4) + l * 1.8;
          const lGrad = ctx.createLinearGradient(0, 0, width, 0);

          if (l === 0) {
            lGrad.addColorStop(0, 'rgba(6, 182, 212, 0.65)'); // Cyan
            lGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.7)'); // Purple
            lGrad.addColorStop(1, 'rgba(236, 72, 153, 0.65)'); // Pink
          } else if (l === 1) {
            lGrad.addColorStop(0, 'rgba(168, 85, 247, 0.55)');
            lGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.6)');
            lGrad.addColorStop(1, 'rgba(16, 185, 129, 0.55)');
          } else {
            lGrad.addColorStop(0, 'rgba(244, 63, 94, 0.45)');
            lGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.5)');
            lGrad.addColorStop(1, 'rgba(6, 182, 212, 0.45)');
          }

          ctx.fillStyle = lGrad;
          ctx.beginPath();
          ctx.moveTo(0, centerY);

          for (let i = 0; i < pointCount; i++) {
            const x = i * step;
            const progress = x / width;
            const envelope = Math.sin(progress * Math.PI);
            const binIdx = Math.floor(progress * 24);
            const binVal = smoothedBins[binIdx] || 0;

            const y =
              centerY +
              Math.sin(progress * 5 + lPhase) *
                Math.cos(progress * 3 - lPhase * 0.5) *
                (smoothAmp * (0.8 + l * 0.3) * envelope) +
              Math.sin(progress * 12 + lPhase) * (binVal * 30 * envelope);

            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, centerY);
          ctx.closePath();
          ctx.fill();
        }

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
