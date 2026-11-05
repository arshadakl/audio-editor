import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Dialog } from '../../../components/ui/Dialog';

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onDeleteCurrentProject: () => Promise<void>;
  onClearAllLocalData: () => Promise<void>;
}

export const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  isOpen,
  onClose,
  projectName,
  onDeleteCurrentProject,
  onClearAllLocalData,
}) => {
  const [mode, setMode] = useState<'menu' | 'confirmProject' | 'confirmAll'>('menu');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReset = () => {
    setMode('menu');
    setIsProcessing(false);
    onClose();
  };

  const handleConfirmProject = async () => {
    setIsProcessing(true);
    try {
      await onDeleteCurrentProject();
      handleReset();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAll = async () => {
    setIsProcessing(true);
    try {
      await onClearAllLocalData();
      handleReset();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleReset}
      title="Project Storage & Management"
      description="Manage local storage and project files"
      maxWidth="max-w-md"
    >
      {mode === 'menu' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-secondary)]">
            All your audio files and timeline edits are stored privately in your browser's IndexedDB. Choose an action below:
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setMode('confirmProject')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-base)] hover:border-[var(--destructive)] hover:bg-[var(--surface-raised)] transition-all text-left"
            >
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Delete Current Project
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Deletes "{projectName}" and its timeline tracks and audio files.
                </div>
              </div>
              <Trash2 className="w-4 h-4 text-[var(--destructive)] shrink-0 ml-2" />
            </button>

            <button
              onClick={() => setMode('confirmAll')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all text-left"
            >
              <div>
                <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Clear All Local Application Data
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Wipes all application IndexedDB databases, cached audio, and projects.
                </div>
              </div>
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 ml-2" />
            </button>
          </div>

          <div className="pt-3 border-t border-[var(--border-default)] flex justify-end">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {mode === 'confirmProject' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--text-primary)] space-y-1">
              <p className="font-semibold">Are you sure you want to delete this project?</p>
              <p className="text-[var(--text-secondary)] text-[11px]">
                This will permanently delete "{projectName}", all timeline tracks, clips, and associated audio files from your browser.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
            <button
              onClick={() => setMode('menu')}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Back
            </button>
            <button
              onClick={handleConfirmProject}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-[var(--destructive)] hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? 'Deleting...' : 'Yes, Delete Project'}
            </button>
          </div>
        </div>
      )}

      {mode === 'confirmAll' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--text-primary)] space-y-1">
              <p className="font-semibold text-red-600 dark:text-red-400">
                Warning: Clear all CraftSound IndexedDB data?
              </p>
              <p className="text-[var(--text-secondary)] text-[11px]">
                This will permanently delete all projects and audio assets from this browser. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
            <button
              onClick={() => setMode('menu')}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Back
            </button>
            <button
              onClick={handleConfirmAll}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isProcessing ? 'Clearing...' : 'Clear Everything'}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
