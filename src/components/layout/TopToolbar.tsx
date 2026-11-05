import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Scissors,
  Trash2,
  Undo2,
  Redo2,
  Sun,
  Moon,
  Download,
  Check,
  MousePointer,
  FolderX,
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface TopToolbarProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  saveStatus: 'saved' | 'saving';
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hasSelectedClips: boolean;
  onSplitAtPlayhead: () => void;
  onDeleteSelectedClips: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onOpenExport: () => void;
  onOpenDeleteProject: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  projectName,
  onUpdateProjectName,
  saveStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasSelectedClips,
  onSplitAtPlayhead,
  onDeleteSelectedClips,
  isDarkTheme,
  onToggleTheme,
  onOpenExport,
  onOpenDeleteProject,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (tempName.trim()) {
      onUpdateProjectName(tempName.trim());
    } else {
      setTempName(projectName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setTempName(projectName);
      setIsEditingName(false);
    }
  };

  return (
    <header className="h-12 border-b border-[var(--border-default)] bg-[var(--surface-raised)] px-4 flex items-center justify-between gap-4 select-none">
      {/* Left: App Logo + Project Name + Save Status */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--primary-accent)] flex items-center justify-center text-white dark:text-neutral-900 shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-[var(--text-primary)]">
            CraftSound
          </span>
        </div>

        <span className="text-[var(--text-muted)] text-xs">/</span>

        {/* Project Name editable */}
        {isEditingName ? (
          <input
            type="text"
            value={tempName}
            autoFocus
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="px-2 py-0.5 text-xs font-medium rounded border border-[var(--primary-accent)] bg-[var(--surface-base)] text-[var(--text-primary)] focus:outline-none"
          />
        ) : (
          <button
            onClick={() => {
              setTempName(projectName);
              setIsEditingName(true);
            }}
            className="text-xs font-medium text-[var(--text-primary)] hover:underline truncate max-w-[180px] text-left cursor-text"
            title="Click to rename project"
          >
            {projectName}
          </button>
        )}

        {/* Save status badge */}
        <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] ml-1">
          {saveStatus === 'saving' ? (
            <span>Saving...</span>
          ) : (
            <>
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Saved locally</span>
            </>
          )}
        </div>
      </div>

      {/* Center: Edit Tools */}
      <div className="flex items-center gap-1">
        <Tooltip content="Undo" shortcut="Ctrl+Z">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Redo" shortcut="Ctrl+Shift+Z">
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="h-4 w-px bg-[var(--border-default)] mx-1" />

        <Tooltip content="Selection Tool">
          <button
            className="p-1.5 rounded text-[var(--primary-accent)] bg-[var(--surface-base)] border border-[var(--border-default)]"
            aria-label="Selection Tool"
          >
            <MousePointer className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Split Selected Clip at Playhead" shortcut="Ctrl+Shift+B">
          <button
            onClick={onSplitAtPlayhead}
            disabled={!hasSelectedClips}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Split selected clip at playhead"
          >
            <Scissors className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Delete Selected Clip" shortcut="Del">
          <button
            onClick={onDeleteSelectedClips}
            disabled={!hasSelectedClips}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--destructive)] hover:bg-[var(--surface-base)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Delete selected clip"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Right: Theme Toggle, Project Menu, Export CTA */}
      <div className="flex items-center gap-2 shrink-0">
        <Tooltip content="Project Options & Cleanup">
          <button
            onClick={onOpenDeleteProject}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
            aria-label="Project Options"
          >
            <FolderX className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-base)] transition-colors"
            aria-label="Toggle Theme"
          >
            {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </Tooltip>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white bg-[var(--primary-accent)] hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audio</span>
        </button>
      </div>
    </header>
  );
};
