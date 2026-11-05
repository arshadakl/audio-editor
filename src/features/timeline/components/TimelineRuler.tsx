import React, { useRef } from 'react';
import { formatTime } from '../../../utils/format-time';

interface TimelineRulerProps {
  duration: number;
  pixelsPerSecond: number;
  playheadTime: number;
  onSeek: (time: number) => void;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  duration,
  pixelsPerSecond,
  playheadTime,
  onSeek,
}) => {
  const rulerRef = useRef<HTMLDivElement | null>(null);

  // Determine marker intervals based on zoom
  let majorInterval = 5; // seconds
  let minorInterval = 1;

  if (pixelsPerSecond >= 120) {
    majorInterval = 1;
    minorInterval = 0.25;
  } else if (pixelsPerSecond >= 60) {
    majorInterval = 2;
    minorInterval = 0.5;
  } else if (pixelsPerSecond >= 30) {
    majorInterval = 5;
    minorInterval = 1;
  } else if (pixelsPerSecond >= 15) {
    majorInterval = 10;
    minorInterval = 2;
  } else {
    majorInterval = 30;
    minorInterval = 5;
  }

  // Extend ruler slightly beyond duration to allow comfortable seeking and dropping
  const displayDuration = Math.max(duration + 10, 30);
  const totalWidth = displayDuration * pixelsPerSecond;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const updateTimeFromX = (clientX: number) => {
      const offsetX = clientX - rect.left;
      const time = Math.max(0, offsetX / pixelsPerSecond);
      onSeek(time);
    };

    updateTimeFromX(e.clientX);

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateTimeFromX(moveEvent.clientX);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const markers: React.ReactNode[] = [];
  const numMajorMarkers = Math.ceil(displayDuration / majorInterval);

  for (let i = 0; i <= numMajorMarkers; i++) {
    const time = i * majorInterval;
    const leftPx = time * pixelsPerSecond;

    markers.push(
      <div
        key={`maj_${time}`}
        style={{ left: `${leftPx}px` }}
        className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
      >
        <span className="text-[10px] tabular-nums font-mono text-[var(--text-secondary)] -translate-x-1/2 pt-1">
          {formatTime(time, false)}
        </span>
        <div className="w-px h-2.5 bg-[var(--border-strong)]" />
      </div>
    );

    // Minor markers
    const numMinors = Math.floor(majorInterval / minorInterval);
    for (let m = 1; m < numMinors; m++) {
      const minorTime = time + m * minorInterval;
      if (minorTime >= displayDuration) break;
      const minorLeftPx = minorTime * pixelsPerSecond;
      markers.push(
        <div
          key={`min_${minorTime}`}
          style={{ left: `${minorLeftPx}px` }}
          className="absolute bottom-0 w-px h-1.5 bg-[var(--border-default)] pointer-events-none"
        />
      );
    }
  }

  return (
    <div
      ref={rulerRef}
      onPointerDown={handlePointerDown}
      style={{ width: `${totalWidth}px` }}
      className="relative h-7 select-none cursor-pointer border-b border-[var(--border-default)] bg-[var(--surface-raised)]"
    >
      {markers}

      {/* Playhead Head in ruler */}
      <div
        style={{ left: `${playheadTime * pixelsPerSecond}px` }}
        className="absolute top-0 bottom-0 w-0 -translate-x-1/2 pointer-events-none z-30"
      >
        <div className="w-3 h-3 bg-[var(--playhead)] rotate-45 -translate-y-1 rounded-[1px] shadow-xs" />
      </div>
    </div>
  );
};
