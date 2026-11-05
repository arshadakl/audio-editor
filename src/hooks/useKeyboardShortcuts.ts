import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onTogglePlay: () => void;
  onSplitClip: () => void;
  onDeleteClip: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectAll: () => void;
  onDeselect: () => void;
  onHome: () => void;
  onEnd: () => void;
  onMovePlayhead: (deltaSec: number) => void;
}

export function useKeyboardShortcuts({
  onTogglePlay,
  onSplitClip,
  onDeleteClip,
  onUndo,
  onRedo,
  onSelectAll,
  onDeselect,
  onHome,
  onEnd,
  onMovePlayhead,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      // Space: Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
        return;
      }

      // Ctrl + Shift + B: Split selected clip at playhead
      if (isModifier && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        onSplitClip();
        return;
      }

      // Undo: Ctrl+Z
      if (isModifier && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((isModifier && e.shiftKey && (e.key === 'z' || e.key === 'Z')) || (isModifier && (e.key === 'y' || e.key === 'Y'))) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Select All: Ctrl+A
      if (isModifier && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        onSelectAll();
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteClip();
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onDeselect();
        return;
      }

      // Home
      if (e.key === 'Home') {
        e.preventDefault();
        onHome();
        return;
      }

      // End
      if (e.key === 'End') {
        e.preventDefault();
        onEnd();
        return;
      }

      // Left arrow (move backward 1s)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onMovePlayhead(-1);
        return;
      }

      // Right arrow (move forward 1s)
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onMovePlayhead(1);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onTogglePlay,
    onSplitClip,
    onDeleteClip,
    onUndo,
    onRedo,
    onSelectAll,
    onDeselect,
    onHome,
    onEnd,
    onMovePlayhead,
  ]);
}
