import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  peaks: number[];
  sourceStart: number;
  sourceEnd: number;
  totalDuration: number;
  isSelected?: boolean;
  className?: string;
}

export const Waveform: React.FC<WaveformProps> = ({
  peaks,
  sourceStart,
  sourceEnd,
  totalDuration,
  isSelected = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks || peaks.length === 0 || totalDuration <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(10, Math.floor(rect.width));
    const height = Math.max(10, Math.floor(rect.height));

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Calculate which portion of peaks to render based on trim
    const startFrac = Math.max(0, Math.min(1, sourceStart / totalDuration));
    const endFrac = Math.max(0, Math.min(1, sourceEnd / totalDuration));

    const startIndex = Math.floor(startFrac * peaks.length);
    const endIndex = Math.min(peaks.length, Math.ceil(endFrac * peaks.length));
    const slicedPeaks = peaks.slice(startIndex, endIndex);

    if (slicedPeaks.length === 0) {
      ctx.restore();
      return;
    }

    const centerY = height / 2;
    const maxBarHeight = height * 0.42;

    // Pick waveform color
    const isDark = document.documentElement.classList.contains('dark');
    if (isSelected) {
      ctx.fillStyle = isDark ? '#CBE8F7' : '#1B4A68';
    } else {
      ctx.fillStyle = isDark ? '#83B9D5' : '#477A98';
    }

    // Draw bars
    const barWidth = 2;
    const gap = 1;
    const step = barWidth + gap;
    const numBars = Math.floor(width / step);

    for (let i = 0; i < numBars; i++) {
      const peakIdx = Math.floor((i / numBars) * slicedPeaks.length);
      const val = slicedPeaks[peakIdx] || 0.05;
      const barH = Math.max(2, val * maxBarHeight);

      const x = i * step;
      const y = centerY - barH;
      const h = barH * 2;

      ctx.fillRect(x, y, barWidth, h);
    }

    ctx.restore();
  }, [peaks, sourceStart, sourceEnd, totalDuration, isSelected]);

  return <canvas ref={canvasRef} className={`w-full h-full block pointer-events-none ${className}`} />;
};
