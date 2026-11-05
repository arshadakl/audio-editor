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

  const handleSeekFromPointer = (clientX: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(fraction * totalDuration);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSeekFromPointer(e.clientX, e.currentTarget);
  };

  const cyclePlaybackRate = () => {
    const rates = [0.5, 1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    onSetPlaybackRate(nextRate);
  };

  return (
    <div className="relative border-t border-[var(--border-default)] bg-[var(--surface-raised)] select-none shrink-0">
      {/* Top full-width scrub line (Touch & click seekable) */}
      <div
        onClick={handleProgressBarClick}
        className="w-full h-1.5 bg-[var(--border-default)] hover:h-2.5 transition-all duration-150 cursor-pointer relative overflow-hidden group"
        title="Tap or drag to seek"
      >
        <div
          style={{ width: `${progressPercent}%` }}
          className="absolute top-0 bottom-0 left-0 bg-[var(--primary-accent)] group-hover:brightness-110 transition-all duration-75"
        />
      </div>

      <div className="h-13 sm:h-14 px-2 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Time and Progress */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="font-mono text-[11px] sm:text-xs tabular-nums font-semibold tracking-tight text-[var(--text-primary)]">
            <span>{formatTime(playheadTime, true)}</span>
            <span className="text-[var(--text-muted)] mx-0.5 sm:mx-1">/</span>
            <span className="text-[var(--text-secondary)] font-normal hidden xs:inline sm:inline">
              {formatTime(totalDuration, true)}
            </span>
          </div>
        </div>

        {/* Center: Main Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Tooltip content="Rewind to Beginning" shortcut="Home">
            <button
              onClick={onStop}
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] active:scale-95 transition-all"
              aria-label="Stop and rewind"
            >
              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Skip 5s Backward" shortcut="←">
            <button
              onClick={onSkipBackward}
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] active:scale-95 transition-all"
              aria-label="Skip backward"
            >
              <SkipBack className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </Tooltip>

          <Tooltip content={isPlaying ? 'Pause' : 'Play'} shortcut="Space">
            <button
              onClick={onTogglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[var(--primary-accent)] text-white hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-neutral-900 dark:text-neutral-950" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-neutral-900 dark:text-neutral-950 translate-x-0.5" />
              )}
            </button>
          </Tooltip>

          <Tooltip content="Skip 5s Forward" shortcut="→">
            <button
              onClick={onSkipForward}
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] active:scale-95 transition-all"
              aria-label="Skip forward"
            >
              <SkipForward className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </Tooltip>

          {/* Desktop inline progress bar scrubber */}
          <div
            onClick={handleProgressBarClick}
            className="hidden md:block w-36 lg:w-48 h-2 bg-[var(--border-default)] rounded-full cursor-pointer relative overflow-hidden ml-2 group"
            title="Click to seek"
          >
            <div
              style={{ width: `${progressPercent}%` }}
              className="absolute top-0 bottom-0 left-0 bg-[var(--primary-accent)] transition-all duration-75"
            />
          </div>
        </div>

        {/* Right: Rate & Volume */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile playback speed button (cycles rate on tap) */}
          <button
            onClick={cyclePlaybackRate}
            className="sm:hidden px-1.5 py-1 rounded bg-[var(--surface-card)] border border-[var(--border-default)] text-[10px] font-mono font-bold text-[var(--text-secondary)] active:scale-95"
            title="Tap to cycle playback speed"
          >
            {playbackRate}x
          </button>

          {/* Desktop playback speed toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-[var(--surface-card)] border border-[var(--border-default)] rounded p-0.5 text-[11px] font-mono">
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
          <div className="flex items-center gap-1 sm:gap-1.5 w-18 sm:w-28">
            <button
              onClick={() => onSetVolume(volume > 0 ? 0 : 1)}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0"
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--text-muted)]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
    </div>
  );
};
