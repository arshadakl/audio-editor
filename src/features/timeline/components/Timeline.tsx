import React, { useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Plus } from 'lucide-react';
import type { AudioAsset, TimelineClip, TimelineTrack } from '../../../types';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrackLane } from './TimelineTrackLane';
import { Playhead } from './Playhead';
import { Tooltip } from '../../../components/ui/Tooltip';
import { calculateProjectDuration } from '../../../services/export/mix-timeline.service';

interface TimelineProps {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  assetsMap: Map<string, AudioAsset>;
  playheadTime: number;
  isPlaying: boolean;
  selectedClipIds: Set<string>;
  pixelsPerSecond: number;
  onSetPixelsPerSecond: (pps: number) => void;
  onSeek: (time: number) => void;
  onSelectClip: (e: React.MouseEvent, clipId: string) => void;
  onDeselectAll: () => void;
  onUpdateClips: (clips: TimelineClip[], historyDesc: string) => void;
  onUpdateTracks: (tracks: TimelineTrack[]) => void;
  onAddTrack: () => void;
  onDeleteTrack: (trackId: string) => void;
  onDropAssetOnTrack: (trackId: string, assetId: string, timelineTime: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  clips,
  assetsMap,
  playheadTime,
  isPlaying,
  selectedClipIds,
  pixelsPerSecond,
  onSetPixelsPerSecond,
  onSeek,
  onSelectClip,
  onDeselectAll,
  onUpdateClips,
  onUpdateTracks,
  onAddTrack,
  onDeleteTrack,
  onDropAssetOnTrack,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContentRef = useRef<HTMLDivElement | null>(null);

  const projectDuration = calculateProjectDuration(clips);
  const displayDuration = Math.max(projectDuration + 15, 30);
  const totalWidth = displayDuration * pixelsPerSecond;

  // Auto-scroll timeline to keep playhead in view during playback
  useEffect(() => {
    if (!isPlaying || !containerRef.current) return;
    const container = containerRef.current;
    const playheadPx = playheadTime * pixelsPerSecond;
    const scrollLeft = container.scrollLeft;
    const visibleWidth = container.clientWidth - 224; // subtracting track header width

    if (playheadPx > scrollLeft + visibleWidth - 80 || playheadPx < scrollLeft) {
      container.scrollLeft = playheadPx - 100;
    }
  }, [playheadTime, isPlaying, pixelsPerSecond]);

  // Fit to screen zoom handler
  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const availableWidth = containerRef.current.clientWidth - 260;
    if (availableWidth <= 0) return;
    const dur = Math.max(projectDuration, 10);
    const calculatedPps = Math.max(10, Math.min(250, availableWidth / dur));
    onSetPixelsPerSecond(calculatedPps);
  };

  // Drag Clip Handler
  const handleClipDragStart = (
    e: React.MouseEvent,
    clipId: string,
    initialTrackId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const targetClip = clips.find((c) => c.id === clipId);
    if (!targetClip) return;

    const startX = e.clientX;
    const initialStartTime = targetClip.startTime;
    let lastClips = [...clips];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSec = deltaX / pixelsPerSecond;
      const newStartTime = Math.max(0, initialStartTime + deltaSec);

      // Detect which track element is under the cursor
      const elementsUnder = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);
      let targetTrackId = initialTrackId;
      for (const el of elementsUnder) {
        const lane = el.closest('[data-track-id]');
        if (lane) {
          const tid = lane.getAttribute('data-track-id');
          if (tid) {
            targetTrackId = tid;
            break;
          }
        }
      }

      lastClips = clips.map((c) => {
        if (c.id === clipId) {
          return {
            ...c,
            startTime: Number(newStartTime.toFixed(3)),
            trackId: targetTrackId,
          };
        }
        return c;
      });

      onUpdateClips(lastClips, 'Move Clip');
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Trim Left Handler
  const handleClipTrimLeftStart = (e: React.MouseEvent, clipId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;

    const startX = e.clientX;
    const initialSourceStart = clip.sourceStart;
    const initialStartTime = clip.startTime;
    const rate = clip.playbackRate || 1;

    let lastClips = [...clips];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSec = (deltaX / pixelsPerSecond) * rate;

      // Minimum clip length 0.1s, maximum source bounds
      const newSourceStart = Math.max(
        0,
        Math.min(clip.sourceEnd - 0.1, initialSourceStart + deltaSec)
      );
      const actualDeltaSource = newSourceStart - initialSourceStart;
      const newStartTime = Math.max(0, initialStartTime + actualDeltaSource / rate);

      lastClips = clips.map((c) => {
        if (c.id === clipId) {
          return {
            ...c,
            sourceStart: Number(newSourceStart.toFixed(3)),
            startTime: Number(newStartTime.toFixed(3)),
          };
        }
        return c;
      });

      onUpdateClips(lastClips, 'Trim Left');
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Trim Right Handler
  const handleClipTrimRightStart = (e: React.MouseEvent, clipId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;
    const asset = assetsMap.get(clip.assetId);
    if (!asset) return;

    const startX = e.clientX;
    const initialSourceEnd = clip.sourceEnd;
    const rate = clip.playbackRate || 1;

    let lastClips = [...clips];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSec = (deltaX / pixelsPerSecond) * rate;

      const newSourceEnd = Math.min(
        asset.duration,
        Math.max(clip.sourceStart + 0.1, initialSourceEnd + deltaSec)
      );

      lastClips = clips.map((c) => {
        if (c.id === clipId) {
          return {
            ...c,
            sourceEnd: Number(newSourceEnd.toFixed(3)),
          };
        }
        return c;
      });

      onUpdateClips(lastClips, 'Trim Right');
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const totalTracksHeight = tracks.length * 72;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--timeline-bg)] select-none">
      {/* Sub-toolbar for zoom & track addition */}
      <div className="h-9 px-4 border-b border-[var(--border-default)] bg-[var(--surface-raised)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">Timeline</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span>{tracks.length} Tracks</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span>{clips.length} Clips</span>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip content="Add Audio Track">
            <button
              onClick={onAddTrack}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] border border-[var(--border-default)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Track</span>
            </button>
          </Tooltip>

          <div className="h-4 w-px bg-[var(--border-default)] mx-1" />

          {/* Zoom controls */}
          <Tooltip content="Zoom Out">
            <button
              onClick={() => onSetPixelsPerSecond(Math.max(10, pixelsPerSecond * 0.8))}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </Tooltip>

          <span className="text-[10px] font-mono tabular-nums px-1 text-[var(--text-muted)]">
            {Math.round(pixelsPerSecond)}px/s
          </span>

          <Tooltip content="Zoom In">
            <button
              onClick={() => onSetPixelsPerSecond(Math.min(300, pixelsPerSecond * 1.25))}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Fit Entire Project">
            <button
              onClick={handleFitToScreen}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
              aria-label="Fit Entire Project"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div
        ref={containerRef}
        onClick={(e) => {
          // Deselect clips if clicking timeline background
          if ((e.target as HTMLElement).closest('[role="button"]')) return;
          onDeselectAll();
        }}
        className="flex-1 overflow-auto relative"
      >
        <div ref={scrollContentRef} className="min-w-fit">
          {/* Header Row: Left track title spacer + Ruler */}
          <div className="sticky top-0 z-30 flex bg-[var(--surface-raised)] border-b border-[var(--border-default)] shadow-xs">
            <div className="w-56 shrink-0 border-r border-[var(--border-default)] px-3 flex items-center text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--surface-raised)]">
              Tracks / Layers
            </div>
            <TimelineRuler
              duration={displayDuration}
              pixelsPerSecond={pixelsPerSecond}
              playheadTime={playheadTime}
              onSeek={onSeek}
            />
          </div>

          {/* Tracks List Container with Playhead */}
          <div className="relative">
            {/* Playhead line running down all tracks */}
            <div className="absolute top-0 bottom-0 left-56 pointer-events-none z-30 overflow-visible">
              <Playhead
                playheadTime={playheadTime}
                pixelsPerSecond={pixelsPerSecond}
                height={totalTracksHeight}
              />
            </div>

            {tracks.map((track, idx) => (
              <div key={track.id} data-track-id={track.id}>
                <TimelineTrackLane
                  track={track}
                  trackIndex={idx}
                  clips={clips.filter((c) => c.trackId === track.id)}
                  assetsMap={assetsMap}
                  pixelsPerSecond={pixelsPerSecond}
                  totalWidth={totalWidth}
                  selectedClipIds={selectedClipIds}
                  onSelectClip={onSelectClip}
                  onClipDragStart={handleClipDragStart}
                  onClipTrimLeftStart={handleClipTrimLeftStart}
                  onClipTrimRightStart={handleClipTrimRightStart}
                  onUpdateTrack={(updated) => {
                    const newTracks = tracks.map((t) => (t.id === updated.id ? updated : t));
                    onUpdateTracks(newTracks);
                  }}
                  onDeleteTrack={onDeleteTrack}
                  canDeleteTrack={tracks.length > 1}
                  onDropAssetOnTrack={onDropAssetOnTrack}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
