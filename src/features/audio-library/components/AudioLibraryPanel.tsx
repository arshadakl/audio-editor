import React, { useRef, useState } from 'react';
import { Upload, Plus, Trash2, Music, Sparkles, AlertCircle } from 'lucide-react';
import type { AudioAsset } from '../../../types';
import { formatDuration } from '../../../utils/format-time';
import { formatFileSize } from '../../../utils/format-file-size';
import { isSupportedAudioFile } from '../../../utils/file-validation';
import { Waveform } from '../../timeline/components/Waveform';
import { Tooltip } from '../../../components/ui/Tooltip';

interface AudioLibraryPanelProps {
  assets: AudioAsset[];
  onImportFiles: (files: FileList | File[]) => Promise<void>;
  onAddClipToTimeline: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onLoadDemoSounds: () => Promise<void>;
  isImporting: boolean;
}

export const AudioLibraryPanel: React.FC<AudioLibraryPanelProps> = ({
  assets,
  onImportFiles,
  onAddClipToTimeline,
  onDeleteAsset,
  onLoadDemoSounds,
  isImporting,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isSupportedAudioFile(file)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setErrorMessage('Unsupported format. Please select MP3, WAV, OGG, FLAC, M4A, or AAC.');
      return;
    }

    try {
      await onImportFiles(validFiles);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error decoding audio file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-72 shrink-0 border-r border-[var(--border-default)] bg-[var(--surface-base)] flex flex-col h-full select-none transition-colors ${
        isDragOver ? 'ring-2 ring-inset ring-[var(--primary-accent)]' : ''
      }`}
    >
      {/* Header */}
      <div className="h-12 px-4 border-b border-[var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-[var(--primary-accent)]" />
          <h2 className="text-xs font-semibold text-[var(--text-primary)]">Audio Library</h2>
        </div>
        <span className="text-[11px] tabular-nums font-medium text-[var(--text-muted)]">
          {assets.length} {assets.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {/* Import Action Area */}
      <div className="p-3 border-b border-[var(--border-default)] space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.webm,.opus,.aiff"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
            e.target.value = '';
          }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-medium text-[var(--text-primary)] bg-[var(--surface-raised)] border border-[var(--border-strong)] hover:bg-[var(--surface-card)] hover:border-[var(--primary-accent)] transition-all cursor-pointer disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
          <span>{isImporting ? 'Importing & Decoding...' : 'Import Audio Files'}</span>
        </button>

        {assets.length === 0 && (
          <button
            onClick={onLoadDemoSounds}
            disabled={isImporting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-[var(--surface-raised)] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Demo Sound Tracks</span>
          </button>
        )}

        {errorMessage && (
          <div className="flex items-start gap-1.5 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Assets List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {assets.length === 0 ? (
          <div className="h-44 border border-dashed border-[var(--border-strong)] rounded-lg p-4 flex flex-col items-center justify-center text-center">
            <Upload className="w-6 h-6 text-[var(--text-muted)] mb-2" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">Drop audio files here</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Supports MP3, WAV, OGG, FLAC, M4A, AAC
            </p>
          </div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/craftsound-asset-id', asset.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className="group p-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--primary-accent)] transition-all cursor-grab active:cursor-grabbing shadow-2xs"
            >
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate" title={asset.name}>
                    {asset.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
                    <span className="font-semibold text-[var(--text-secondary)]">{asset.format}</span>
                    <span>·</span>
                    <span className="tabular-nums">{formatDuration(asset.duration)}</span>
                    <span>·</span>
                    <span>{formatFileSize(asset.size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip content="Add to Timeline">
                    <button
                      onClick={() => onAddClipToTimeline(asset.id)}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
                      aria-label="Add to Timeline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete File">
                    <button
                      onClick={() => onDeleteAsset(asset.id)}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--destructive)] hover:bg-[var(--surface-raised)]"
                      aria-label="Delete File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Waveform preview thumbnail */}
              <div className="h-6 w-full bg-[var(--surface-base)] rounded overflow-hidden px-1">
                <Waveform
                  peaks={asset.peaks}
                  sourceStart={0}
                  sourceEnd={asset.duration}
                  totalDuration={asset.duration}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drag instruction footer */}
      {assets.length > 0 && (
        <div className="p-2.5 border-t border-[var(--border-default)] text-[10px] text-[var(--text-muted)] text-center">
          Drag audio cards onto any timeline track
        </div>
      )}
    </div>
  );
};
