import React, { useState } from 'react';
import { Download, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog } from '../../../components/ui/Dialog';
import type {
  ExportFormat,
  ExportProgressInfo,
  ExportSettings,
  Mp3Bitrate,
  WavBitDepth,
  WavSampleRate,
} from '../../../types';
import { formatFileSize } from '../../../utils/format-file-size';
import { formatTime } from '../../../utils/format-time';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectDuration: number;
  onStartExport: (settings: ExportSettings) => Promise<void>;
  exportProgress: ExportProgressInfo;
  onResetExport: () => void;
  onDeleteProjectData: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  projectDuration,
  onStartExport,
  exportProgress,
  onResetExport,
  onDeleteProjectData,
}) => {
  const defaultFileName = `audio-project-${new Date()
    .toISOString()
    .slice(0, 16)
    .replace('T', '-')
    .replace(':', '-')}`;

  const [fileName, setFileName] = useState(defaultFileName);
  const [format, setFormat] = useState<ExportFormat>('mp3');
  const [mp3Bitrate, setMp3Bitrate] = useState<Mp3Bitrate>(192);
  const [wavBitDepth, setWavBitDepth] = useState<WavBitDepth>(16);
  const [wavSampleRate, setWavSampleRate] = useState<WavSampleRate>(44100);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showCleanupPrompt, setShowCleanupPrompt] = useState(false);

  const isExporting =
    exportProgress.stage !== 'idle' &&
    exportProgress.stage !== 'completed' &&
    exportProgress.stage !== 'error';

  const handleExportClick = async () => {
    setHasDownloaded(false);
    setShowCleanupPrompt(false);
    await onStartExport({
      format,
      mp3Bitrate,
      wavBitDepth,
      wavSampleRate,
      fileName: fileName.trim() || defaultFileName,
    });
  };

  const handleDownload = () => {
    if (!exportProgress.downloadUrl) return;
    const a = document.createElement('a');
    a.href = exportProgress.downloadUrl;
    a.download = `${fileName.trim() || 'audio-export'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setHasDownloaded(true);
    setShowCleanupPrompt(true);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!isExporting) onClose();
      }}
      title="Export Audio"
      description={`Project duration: ${formatTime(projectDuration, false)}`}
      maxWidth="max-w-md"
    >
      {exportProgress.stage === 'idle' ? (
        <div className="space-y-4">
          {/* File Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              File Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded text-xs border border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-accent)]"
                placeholder="audio-project"
              />
              <span className="text-xs font-mono font-medium text-[var(--text-muted)]">
                .{format}
              </span>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Audio Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('mp3')}
                className={`p-3 rounded border text-left transition-all ${
                  format === 'mp3'
                    ? 'border-[var(--primary-accent)] bg-[var(--surface-raised)] ring-1 ring-[var(--primary-accent)]'
                    : 'border-[var(--border-default)] bg-[var(--surface-base)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="text-xs font-semibold text-[var(--text-primary)]">MP3</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Compressed, smaller file size
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('wav')}
                className={`p-3 rounded border text-left transition-all ${
                  format === 'wav'
                    ? 'border-[var(--primary-accent)] bg-[var(--surface-raised)] ring-1 ring-[var(--primary-accent)]'
                    : 'border-[var(--border-default)] bg-[var(--surface-base)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="text-xs font-semibold text-[var(--text-primary)]">WAV</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Uncompressed, studio quality
                </div>
              </button>
            </div>
          </div>

          {/* Quality Settings */}
          {format === 'mp3' ? (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Bitrate
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {([128, 192, 256, 320] as Mp3Bitrate[]).map((br) => (
                  <button
                    key={br}
                    type="button"
                    onClick={() => setMp3Bitrate(br)}
                    className={`py-1.5 rounded text-xs font-mono transition-colors border ${
                      mp3Bitrate === br
                        ? 'border-[var(--primary-accent)] bg-[var(--primary-accent)] text-white dark:text-neutral-900 font-semibold'
                        : 'border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {br} kbps
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Bit Depth
                </label>
                <select
                  value={wavBitDepth}
                  onChange={(e) => setWavBitDepth(Number(e.target.value) as WavBitDepth)}
                  className="w-full px-2.5 py-1.5 rounded text-xs border border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-primary)]"
                >
                  <option value={16}>16-bit PCM (Standard CD)</option>
                  <option value={24}>24-bit PCM (Studio HD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Sample Rate
                </label>
                <select
                  value={wavSampleRate}
                  onChange={(e) => setWavSampleRate(Number(e.target.value) as WavSampleRate)}
                  className="w-full px-2.5 py-1.5 rounded text-xs border border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-primary)]"
                >
                  <option value={44100}>44.1 kHz</option>
                  <option value={48000}>48.0 kHz</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border-default)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExportClick}
              disabled={projectDuration <= 0}
              className="px-4 py-1.5 rounded text-xs font-semibold text-white bg-[var(--primary-accent)] hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              Start Export
            </button>
          </div>
        </div>
      ) : exportProgress.stage === 'error' ? (
        <div className="space-y-4 text-center py-2">
          <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Export Failed</h4>
            <p className="text-xs text-red-500 mt-1">{exportProgress.error || exportProgress.message}</p>
          </div>
          <button
            type="button"
            onClick={onResetExport}
            className="px-4 py-1.5 rounded text-xs font-medium text-[var(--text-primary)] bg-[var(--surface-raised)] border border-[var(--border-default)]"
          >
            Try Again
          </button>
        </div>
      ) : exportProgress.stage === 'completed' ? (
        <div className="space-y-4 py-2">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Export Ready!</h4>
            <p className="text-xs text-[var(--text-secondary)]">
              {fileName}.{format} · {exportProgress.outputSize ? formatFileSize(exportProgress.outputSize) : ''}
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-semibold text-white bg-[var(--primary-accent)] hover:opacity-90 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>{hasDownloaded ? 'Download Again' : 'Download Audio File'}</span>
            </button>

            <button
              type="button"
              onClick={onResetExport}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Configure Different Settings</span>
            </button>
          </div>

          {/* Cleanup prompt after confirmed export */}
          {showCleanupPrompt && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] space-y-2">
              <p className="text-xs text-[var(--text-primary)] font-medium">
                Your audio has been exported successfully. Would you like to clear this project's local audio files?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-card)] border border-[var(--border-default)]"
                >
                  Keep Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteProjectData();
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded text-xs text-white bg-[var(--destructive)] hover:opacity-90 font-medium"
                >
                  Delete Project Data
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Progress View */
        <div className="space-y-4 py-4 text-center">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              {exportProgress.message}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Format: {format.toUpperCase()} · Stage: {exportProgress.stage}
            </p>
          </div>

          <div className="w-full h-2 rounded-full bg-[var(--border-default)] overflow-hidden">
            <div
              style={{ width: `${exportProgress.percent}%` }}
              className="h-full bg-[var(--primary-accent)] transition-all duration-150"
            />
          </div>

          <div className="text-xs font-mono tabular-nums text-[var(--text-secondary)]">
            {exportProgress.percent}%
          </div>
        </div>
      )}
    </Dialog>
  );
};
