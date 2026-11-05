import React from 'react';
import { Volume2, VolumeX, Trash2 } from 'lucide-react';
import type { AudioAsset, TimelineClip, TimelineTrack } from '../../../types';
import { AudioClip } from './AudioClip';
import { Tooltip } from '../../../components/ui/Tooltip';

interface TimelineTrackLaneProps {
  track: TimelineTrack;
  trackIndex: number;
  clips: TimelineClip[];
  assetsMap: Map<string, AudioAsset>;
  pixelsPerSecond: number;
  totalWidth: number;
  selectedClipIds: Set<string>;
  onSelectClip: (e: React.MouseEvent | React.PointerEvent, clipId: string) => void;
  onClipDragStart: (e: React.PointerEvent | React.MouseEvent, clipId: string, trackId: string) => void;
  onClipTrimLeftStart: (e: React.PointerEvent | React.MouseEvent, clipId: string) => void;
  onClipTrimRightStart: (e: React.PointerEvent | React.MouseEvent, clipId: string) => void;
  onUpdateTrack: (updated: TimelineTrack) => void;
  onDeleteTrack: (trackId: string) => void;
  canDeleteTrack: boolean;
  onDropAssetOnTrack: (trackId: string, assetId: string, timelineTime: number) => void;
}

export const TimelineTrackLane: React.FC<TimelineTrackLaneProps> = ({
  track,
  trackIndex,
  clips,
  assetsMap,
  pixelsPerSecond,
  totalWidth,
  selectedClipIds,
  onSelectClip,
  onClipDragStart,
  onClipTrimLeftStart,
  onClipTrimRightStart,
  onUpdateTrack,
  onDeleteTrack,
  canDeleteTrack,
  onDropAssetOnTrack,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const assetId = e.dataTransfer.getData('text/craftsound-asset-id');
    if (!assetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const dropTime = Math.max(0, dropX / pixelsPerSecond);

    onDropAssetOnTrack(track.id, assetId, dropTime);
  };

  return (
    <div className="flex border-b border-[var(--border-default)] group/track">
      {/* Track Control Header (Left) - Responsive width */}
      <div className="w-32 sm:w-44 md:w-56 shrink-0 bg-[var(--surface-raised)] border-r border-[var(--border-default)] p-1.5 sm:p-2.5 flex flex-col justify-between select-none">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--text-primary)] truncate">
            {track.name || `Track ${trackIndex + 1}`}
          </span>

          {canDeleteTrack && (
            <Tooltip content="Delete Track">
              <button
                onClick={() => onDeleteTrack(track.id)}
                className="opacity-70 sm:opacity-0 sm:group-hover/track:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--destructive)] hover:bg-[var(--surface-base)] rounded transition-all"
                aria-label="Delete Track"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Track Mute, Solo, Volume Controls */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-1 sm:mt-2">
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              onClick={() => onUpdateTrack({ ...track, muted: !track.muted })}
              className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors border ${
                track.muted
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
              }`}
              title={track.muted ? 'Unmute Track' : 'Mute Track (M)'}
            >
              M
            </button>
            <button
              onClick={() => onUpdateTrack({ ...track, solo: !track.solo })}
              className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors border ${
                track.solo
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
              }`}
              title={track.solo ? 'Unsolo Track' : 'Solo Track (S)'}
            >
              S
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-1 flex-1 max-w-[65px] sm:max-w-[110px]">
            {track.volume === 0 || track.muted ? (
              <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--text-muted)] shrink-0 hidden xs:inline" />
            ) : (
              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--text-secondary)] shrink-0 hidden xs:inline" />
            )}
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={track.volume}
              onChange={(e) =>
                onUpdateTrack({ ...track, volume: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-[var(--border-default)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-accent)]"
              title={`Track Volume: ${Math.round(track.volume * 100)}%`}
            />
          </div>
        </div>
      </div>

      {/* Track Lane (Right) */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ width: `${totalWidth}px`, height: '72px' }}
        className="relative bg-[var(--timeline-track)] select-none overflow-hidden"
      >
        {/* Subtle background track center line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[var(--border-default)]/30 pointer-events-none" />

        {/* Clips inside track */}
        {clips.map((clip) => {
          const asset = assetsMap.get(clip.assetId);
          if (!asset) return null;

          return (
            <AudioClip
              key={clip.id}
              clip={clip}
              asset={asset}
              pixelsPerSecond={pixelsPerSecond}
              isSelected={selectedClipIds.has(clip.id)}
              onSelect={onSelectClip}
              onDragStart={onClipDragStart}
              onTrimLeftStart={onClipTrimLeftStart}
              onTrimRightStart={onClipTrimRightStart}
            />
          );
        })}
      </div>
    </div>
  );
};
