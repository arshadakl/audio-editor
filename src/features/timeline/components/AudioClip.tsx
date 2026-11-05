import React, { useRef } from 'react';
import type { AudioAsset, TimelineClip } from '../../../types';
import { Waveform } from './Waveform';
import { formatDuration } from '../../../utils/format-time';

interface AudioClipProps {
  clip: TimelineClip;
  asset: AudioAsset;
  pixelsPerSecond: number;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent, clipId: string) => void;
  onDragStart: (e: React.MouseEvent, clipId: string, trackId: string) => void;
  onTrimLeftStart: (e: React.MouseEvent, clipId: string) => void;
  onTrimRightStart: (e: React.MouseEvent, clipId: string) => void;
}

export const AudioClip: React.FC<AudioClipProps> = ({
  clip,
  asset,
  pixelsPerSecond,
  isSelected,
  onSelect,
  onDragStart,
  onTrimLeftStart,
  onTrimRightStart,
}) => {
  const clipRef = useRef<HTMLDivElement | null>(null);

  const clipDuration = (clip.sourceEnd - clip.sourceStart) / (clip.playbackRate || 1);
  const leftPx = clip.startTime * pixelsPerSecond;
  const widthPx = Math.max(12, clipDuration * pixelsPerSecond);

  return (
    <div
      ref={clipRef}
      role="button"
      tabIndex={0}
      aria-label={`Audio clip: ${asset.name}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e, clip.id);
      }}
      onMouseDown={(e) => {
        // Only trigger drag if clicking the body of the clip, not the handles
        if ((e.target as HTMLElement).dataset.handle) return;
        onDragStart(e, clip.id, clip.trackId);
      }}
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`,
      }}
      className={`group absolute top-1 bottom-1 rounded border select-none cursor-grab active:cursor-grabbing overflow-hidden transition-shadow ${
        isSelected
          ? 'bg-[var(--clip-selected-bg)] border-[var(--clip-selected-border)] ring-1 ring-[var(--clip-selected-border)] shadow-sm z-20'
          : 'bg-[var(--clip-bg)] border-[var(--clip-border)] hover:border-[var(--primary-accent)] z-10'
      }`}
    >
      {/* Left Trim Handle */}
      <div
        data-handle="left"
        title="Trim Left Edge"
        onMouseDown={(e) => {
          e.stopPropagation();
          onTrimLeftStart(e, clip.id);
        }}
        className="absolute left-0 top-0 bottom-0 w-2.5 z-30 cursor-ew-resize flex items-center justify-center hover:bg-neutral-500/20 active:bg-neutral-500/40"
      >
        <div className="w-0.5 h-4 rounded-full bg-neutral-400 dark:bg-neutral-300" />
      </div>

      {/* Clip Header Label */}
      <div className="absolute top-1 left-3 right-3 flex items-center justify-between text-[11px] leading-tight font-medium pointer-events-none z-10 text-[var(--text-primary)]">
        <span className="truncate max-w-[70%] drop-shadow-xs">{asset.name}</span>
        <span className="text-[10px] tabular-nums text-[var(--text-secondary)]">
          {formatDuration(clipDuration)}
        </span>
      </div>

      {/* Waveform Visualization */}
      <div className="absolute inset-x-2.5 top-5 bottom-1 pointer-events-none">
        <Waveform
          peaks={asset.peaks}
          sourceStart={clip.sourceStart}
          sourceEnd={clip.sourceEnd}
          totalDuration={asset.duration}
          isSelected={isSelected}
        />
      </div>

      {/* Right Trim Handle */}
      <div
        data-handle="right"
        title="Trim Right Edge"
        onMouseDown={(e) => {
          e.stopPropagation();
          onTrimRightStart(e, clip.id);
        }}
        className="absolute right-0 top-0 bottom-0 w-2.5 z-30 cursor-ew-resize flex items-center justify-center hover:bg-neutral-500/20 active:bg-neutral-500/40"
      >
        <div className="w-0.5 h-4 rounded-full bg-neutral-400 dark:bg-neutral-300" />
      </div>
    </div>
  );
};
