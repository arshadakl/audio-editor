import React from 'react';

interface PlayheadProps {
  playheadTime: number;
  pixelsPerSecond: number;
  height: number;
}

export const Playhead: React.FC<PlayheadProps> = ({
  playheadTime,
  pixelsPerSecond,
  height,
}) => {
  const leftPx = playheadTime * pixelsPerSecond;

  return (
    <div
      style={{
        left: `${leftPx}px`,
        height: `${height}px`,
      }}
      className="absolute top-0 w-0 pointer-events-none z-40 transition-none"
    >
      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-[var(--playhead)] shadow-xs" />
    </div>
  );
};
