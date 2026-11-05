import React from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatTime } from '../../../utils/format-time';
import { Tooltip } from '../../../components/ui/Tooltip';

interface PlaybackControlsProps {
  isPlaying: boolean;
  playheadTime: number;
  totalDuration: number;
  volume: number;
  playbackRate: number;
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onSetVolume: (vol: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  playheadTime,
  totalDuration,
  volume,
  playbackRate,
  onTogglePlay,
  onStop,
  onSeek,
  onSetVolume,
  onSetPlaybackRate,
  onSkipBackward,
  onSkipForward,
}) => {
  const progressPercent = totalDuration > 0 ? Math.min(100, (playheadTime / totalDuration) * 100) : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(fraction * totalDuration);
  };

  return (
    <div className="h-14 border-t border-[var(--border-default)] bg-[var(--surface-raised)] px-4 flex items-center justify-between gap-4 select-none">
      {/* Left: Time and Progress */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="font-mono text-xs tabular-nums font-semibold tracking-tight text-[var(--text-primary)]">
          <span>{formatTime(playheadTime, true)}</span>
          <span className="text-[var(--text-muted)] mx-1">/</span>
          <span className="text-[var(--text-secondary)] font-normal">{formatTime(totalDuration, true)}</span>
        </div>
      </div>

      {/* Center: Main Playback Controls */}
      <div className="flex items-center gap-1.5">
        <Tooltip content="Rewind to Beginning" shortcut="Home">
          <button
            onClick={onStop}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
            aria-label="Stop and rewind"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip content="Skip 5s Backward" shortcut="←">
          <button
            onClick={onSkipBackward}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
            aria-label="Skip backward"
          >
            <SkipBack className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content={isPlaying ? 'Pause' : 'Play'} shortcut="Space">
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--primary-accent)] text-white hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-neutral-900 dark:text-neutral-950" />
            ) : (
              <Play className="w-4 h-4 fill-current text-neutral-900 dark:text-neutral-950 translate-x-0.5" />
            )}
          </button>
        </Tooltip>

        <Tooltip content="Skip 5s Forward" shortcut="→">
          <button
            onClick={onSkipForward}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
            aria-label="Skip forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Mini progress bar scrubber */}
        <div
          onClick={handleProgressBarClick}
          className="w-36 sm:w-56 h-2 bg-[var(--border-default)] rounded-full cursor-pointer relative overflow-hidden ml-3 group"
          title="Click to seek"
        >
          <div
            style={{ width: `${progressPercent}%` }}
            className="absolute top-0 bottom-0 left-0 bg-[var(--primary-accent)] transition-all duration-75"
          />
        </div>
      </div>

      {/* Right: Rate & Volume */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Playback speed toggle */}
        <div className="flex items-center gap-1 bg-[var(--surface-card)] border border-[var(--border-default)] rounded p-0.5 text-[11px] font-mono">
          {[0.5, 1, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => onSetPlaybackRate(rate)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                playbackRate === rate
                  ? 'bg-[var(--primary-accent)] text-white dark:text-neutral-900 font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Master volume slider */}
        <div className="flex items-center gap-1.5 w-28">
          <button
            onClick={() => onSetVolume(volume > 0 ? 0 : 1)}
            className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={volume}
            onChange={(e) => onSetVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-[var(--border-default)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-accent)]"
            title={`Master Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>
    </div>
  );
};
