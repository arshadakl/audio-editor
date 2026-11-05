import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type {
  Project,
  AudioAsset,
  TimelineTrack,
  TimelineClip,
  ExportProgressInfo,
  ExportSettings,
  HistorySnapshot,
} from './types';
import {
  getOrCreateDefaultProject,
  saveProjectMeta,
  saveProjectState,
  addAssetToDb,
  deleteAssetFromDb,
  deleteProjectFromDb,
  clearAllLocalDbData,
} from './services/database/db';
import {
  decodeAudioFile,
  removeCachedBuffer,
  clearBufferCache,
} from './services/audio/audio-decoder.service';
import { audioEngine } from './services/audio/audio-engine.service';
import {
  calculateProjectDuration,
  renderAndExportTimeline,
} from './services/export/mix-timeline.service';
import { createDemoAudioAsset } from './services/audio/demo-audio.service';
import { generateId } from './utils/file-validation';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { TopToolbar } from './components/layout/TopToolbar';
import { AudioLibraryPanel } from './features/audio-library/components/AudioLibraryPanel';
import { Timeline } from './features/timeline/components/Timeline';
import { PlaybackControls } from './features/playback/components/PlaybackControls';
import { ExportDialog } from './features/export/components/ExportDialog';
import { DeleteProjectDialog } from './features/project/components/DeleteProjectDialog';

export default function App() {
  // Theme State
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('craftsound_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('craftsound_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('craftsound_theme', 'light');
    }
  }, [isDarkTheme]);

  // Project & Persistence State
  const [project, setProject] = useState<Project | null>(null);
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [assets, setAssets] = useState<AudioAsset[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isImporting, setIsImporting] = useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Playback & Timeline State
  const [playheadTime, setPlayheadTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(50);
  const [masterVolume, setMasterVolume] = useState<number>(1);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Dialogs
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgressInfo>({
    stage: 'idle',
    percent: 0,
    message: '',
  });

  // Assets Map lookup for quick reference
  const assetsMap = useMemo(() => {
    const map = new Map<string, AudioAsset>();
    for (const a of assets) {
      map.set(a.id, a);
    }
    return map;
  }, [assets]);

  const projectDuration = useMemo(() => {
    return calculateProjectDuration(clips);
  }, [clips]);

  // Audio Engine Callbacks
  useEffect(() => {
    audioEngine.setCallbacks({
      onTimeUpdate: (time) => setPlayheadTime(time),
      onStateChange: (playing) => setIsPlaying(playing),
    });
  }, []);

  // Sync master volume and speed with engine
  useEffect(() => {
    audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    audioEngine.setGlobalPlaybackRate(playbackRate);
  }, [playbackRate]);

  // Initial Load from Dexie DB
  useEffect(() => {
    let isMounted = true;
    getOrCreateDefaultProject()
      .then(({ project: loadedProject, tracks: loadedTracks, clips: loadedClips, assets: loadedAssets }) => {
        if (!isMounted) return;
        setProject(loadedProject);
        setTracks(loadedTracks);
        setClips(loadedClips);
        setAssets(loadedAssets);
        setHistory([{ tracks: loadedTracks, clips: loadedClips, description: 'Initial' }]);
        setHistoryIndex(0);
        setIsInitialized(true);
      })
      .catch((err) => {
        console.error('Failed to initialize database:', err);
        setIsInitialized(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Autosave to IndexedDB (debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerAutoSave = useCallback(
    (currentProject: Project, currentTracks: TimelineTrack[], currentClips: TimelineClip[]) => {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveProjectState(currentProject, currentTracks, currentClips);
          setSaveStatus('saved');
        } catch (err) {
          console.error('Failed to autosave project state:', err);
          setSaveStatus('saved');
        }
      }, 350);
    },
    []
  );

  // Push History Snapshot for Undo/Redo
  const pushHistory = useCallback(
    (newTracks: TimelineTrack[], newClips: TimelineClip[], description: string) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const next = [...sliced, { tracks: newTracks, clips: newClips, description }];
        if (next.length > 50) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(49, prev + 1));
    },
    [historyIndex]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetSnapshot = history[targetIndex];
      setTracks(targetSnapshot.tracks);
      setClips(targetSnapshot.clips);
      setHistoryIndex(targetIndex);
      if (project) {
        triggerAutoSave(project, targetSnapshot.tracks, targetSnapshot.clips);
      }
      if (isPlaying) audioEngine.stop();
    }
  }, [historyIndex, history, project, triggerAutoSave, isPlaying]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetSnapshot = history[targetIndex];
      setTracks(targetSnapshot.tracks);
      setClips(targetSnapshot.clips);
      setHistoryIndex(targetIndex);
      if (project) {
        triggerAutoSave(project, targetSnapshot.tracks, targetSnapshot.clips);
      }
      if (isPlaying) audioEngine.stop();
    }
  }, [historyIndex, history, project, triggerAutoSave, isPlaying]);

  // Playback Toggle
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play(playheadTime, clips, tracks, assetsMap, projectDuration);
    }
  }, [isPlaying, playheadTime, clips, tracks, assetsMap, projectDuration]);

  // Stop Playback
  const handleStop = useCallback(() => {
    audioEngine.stop();
  }, []);

  // Seek Playhead
  const handleSeek = useCallback(
    (time: number) => {
      audioEngine.seek(time, isPlaying, clips, tracks, assetsMap, projectDuration);
    },
    [isPlaying, clips, tracks, assetsMap, projectDuration]
  );

  // Skip Backward / Forward
  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(0, playheadTime - 5);
    handleSeek(newTime);
  }, [playheadTime, handleSeek]);

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(projectDuration, playheadTime + 5);
    handleSeek(newTime);
  }, [playheadTime, projectDuration, handleSeek]);

  // Update Project Name
  const handleUpdateProjectName = useCallback(
    async (name: string) => {
      if (!project) return;
      const updated = { ...project, name };
      setProject(updated);
      await saveProjectMeta(updated);
    },
    [project]
  );

  // Import Audio Files
  const handleImportFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!project) return;
      setIsImporting(true);

      try {
        const newAssets: AudioAsset[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const decodedAsset = await decodeAudioFile(file, project.id);
          await addAssetToDb(decodedAsset);
          newAssets.push(decodedAsset);
        }

        setAssets((prev) => [...prev, ...newAssets]);

        // Auto place the first imported clip on Track 1 if timeline is completely empty
        if (clips.length === 0 && newAssets.length > 0 && tracks.length > 0) {
          const firstAsset = newAssets[0];
          const initialClip: TimelineClip = {
            id: generateId('clip'),
            projectId: project.id,
            assetId: firstAsset.id,
            trackId: tracks[0].id,
            startTime: 0,
            sourceStart: 0,
            sourceEnd: firstAsset.duration,
            volume: 1,
            playbackRate: 1,
          };
          const nextClips = [initialClip];
          setClips(nextClips);
          pushHistory(tracks, nextClips, 'Auto-add initial clip');
          triggerAutoSave(project, tracks, nextClips);
        }
      } finally {
        setIsImporting(false);
      }
    },
    [project, clips.length, tracks, pushHistory, triggerAutoSave]
  );

  // Load Demo Audio
  const handleLoadDemoSounds = useCallback(async () => {
    if (!project) return;
    setIsImporting(true);

    try {
      const melody = await createDemoAudioAsset('melody', project.id);
      const chords = await createDemoAudioAsset('chords', project.id);
      const perc = await createDemoAudioAsset('percussion', project.id);

      await Promise.all([addAssetToDb(melody), addAssetToDb(chords), addAssetToDb(perc)]);
      setAssets((prev) => [...prev, melody, chords, perc]);

      // Populate tracks with demo arrangement
      if (tracks.length >= 3) {
        const demoClips: TimelineClip[] = [
          {
            id: generateId('clip'),
            projectId: project.id,
            assetId: melody.id,
            trackId: tracks[0].id,
            startTime: 0,
            sourceStart: 0,
            sourceEnd: melody.duration,
            volume: 1,
            playbackRate: 1,
          },
          {
            id: generateId('clip'),
            projectId: project.id,
            assetId: chords.id,
            trackId: tracks[1].id,
            startTime: 0,
            sourceStart: 0,
            sourceEnd: chords.duration,
            volume: 0.9,
            playbackRate: 1,
          },
          {
            id: generateId('clip'),
            projectId: project.id,
            assetId: perc.id,
            trackId: tracks[2].id,
            startTime: 2.0,
            sourceStart: 0,
            sourceEnd: perc.duration,
            volume: 0.85,
            playbackRate: 1,
          },
        ];

        setClips(demoClips);
        pushHistory(tracks, demoClips, 'Load Demo Project');
        triggerAutoSave(project, tracks, demoClips);
      }
    } catch (err) {
      console.error('Failed to generate demo tracks:', err);
    } finally {
      setIsImporting(false);
    }
  }, [project, tracks, pushHistory, triggerAutoSave]);

  // Add Asset to Timeline
  const handleAddClipToTimeline = useCallback(
    (assetId: string) => {
      if (!project || tracks.length === 0) return;
      const asset = assetsMap.get(assetId);
      if (!asset) return;

      const targetTrackId = tracks[0].id;
      // Position at current playhead
      const newClip: TimelineClip = {
        id: generateId('clip'),
        projectId: project.id,
        assetId: asset.id,
        trackId: targetTrackId,
        startTime: Number(playheadTime.toFixed(3)),
        sourceStart: 0,
        sourceEnd: asset.duration,
        volume: 1,
        playbackRate: 1,
      };

      const nextClips = [...clips, newClip];
      setClips(nextClips);
      setSelectedClipIds(new Set([newClip.id]));
      pushHistory(tracks, nextClips, 'Add Clip to Timeline');
      triggerAutoSave(project, tracks, nextClips);
    },
    [project, tracks, assetsMap, playheadTime, clips, pushHistory, triggerAutoSave]
  );

  // Drop Asset on Specific Track Lane
  const handleDropAssetOnTrack = useCallback(
    (trackId: string, assetId: string, timelineTime: number) => {
      if (!project) return;
      const asset = assetsMap.get(assetId);
      if (!asset) return;

      const newClip: TimelineClip = {
        id: generateId('clip'),
        projectId: project.id,
        assetId: asset.id,
        trackId,
        startTime: Number(timelineTime.toFixed(3)),
        sourceStart: 0,
        sourceEnd: asset.duration,
        volume: 1,
        playbackRate: 1,
      };

      const nextClips = [...clips, newClip];
      setClips(nextClips);
      setSelectedClipIds(new Set([newClip.id]));
      pushHistory(tracks, nextClips, 'Drop Clip on Track');
      triggerAutoSave(project, tracks, nextClips);
    },
    [project, assetsMap, clips, tracks, pushHistory, triggerAutoSave]
  );

  // Delete Asset from Library
  const handleDeleteAsset = useCallback(
    async (assetId: string) => {
      await deleteAssetFromDb(assetId);
      removeCachedBuffer(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      const nextClips = clips.filter((c) => c.assetId !== assetId);
      setClips(nextClips);
      if (project) {
        pushHistory(tracks, nextClips, 'Delete Asset');
        triggerAutoSave(project, tracks, nextClips);
      }
    },
    [clips, project, tracks, pushHistory, triggerAutoSave]
  );

  // Add Audio Track
  const handleAddTrack = useCallback(() => {
    if (!project) return;
    const newTrack: TimelineTrack = {
      id: generateId('trk'),
      projectId: project.id,
      name: `Track ${tracks.length + 1}`,
      order: tracks.length,
      volume: 1,
      muted: false,
      solo: false,
    };
    const nextTracks = [...tracks, newTrack];
    setTracks(nextTracks);
    pushHistory(nextTracks, clips, 'Add Track');
    triggerAutoSave(project, nextTracks, clips);
  }, [project, tracks, clips, pushHistory, triggerAutoSave]);

  // Delete Track
  const handleDeleteTrack = useCallback(
    (trackId: string) => {
      if (tracks.length <= 1 || !project) return;
      const nextTracks = tracks.filter((t) => t.id !== trackId);
      const nextClips = clips.filter((c) => c.trackId !== trackId);
      setTracks(nextTracks);
      setClips(nextClips);
      pushHistory(nextTracks, nextClips, 'Delete Track');
      triggerAutoSave(project, nextTracks, nextClips);
    },
    [tracks, project, clips, pushHistory, triggerAutoSave]
  );

  // Update Tracks (mute, solo, volume)
  const handleUpdateTracks = useCallback(
    (newTracks: TimelineTrack[]) => {
      setTracks(newTracks);
      if (project) {
        triggerAutoSave(project, newTracks, clips);
      }
    },
    [project, clips, triggerAutoSave]
  );

  // Update Clips (from drag or trim)
  const handleUpdateClips = useCallback(
    (newClips: TimelineClip[], historyDesc: string) => {
      setClips(newClips);
      if (project) {
        pushHistory(tracks, newClips, historyDesc);
        triggerAutoSave(project, tracks, newClips);
      }
    },
    [project, tracks, pushHistory, triggerAutoSave]
  );

  // Select Clip
  const handleSelectClip = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      if (e.shiftKey) {
        setSelectedClipIds((prev) => {
          const next = new Set(prev);
          if (next.has(clipId)) next.delete(clipId);
          else next.add(clipId);
          return next;
        });
      } else {
        setSelectedClipIds(new Set([clipId]));
      }
    },
    []
  );

  // Select All Clips
  const handleSelectAll = useCallback(() => {
    setSelectedClipIds(new Set(clips.map((c) => c.id)));
  }, [clips]);

  // Deselect All
  const handleDeselectAll = useCallback(() => {
    setSelectedClipIds(new Set());
  }, []);

  // Split Clip at Playhead (Ctrl + Shift + B)
  const handleSplitAtPlayhead = useCallback(() => {
    if (selectedClipIds.size === 0 || !project) return;

    let splitHappened = false;
    const nextClips: TimelineClip[] = [];

    for (const clip of clips) {
      if (selectedClipIds.has(clip.id)) {
        const rate = clip.playbackRate || 1;
        const clipDuration = (clip.sourceEnd - clip.sourceStart) / rate;
        const clipEnd = clip.startTime + clipDuration;

        // Check if playhead is strictly within clip boundaries (at least 0.05s from edges)
        if (playheadTime > clip.startTime + 0.05 && playheadTime < clipEnd - 0.05) {
          const splitOffsetTimeline = playheadTime - clip.startTime;
          const splitOffsetSource = splitOffsetTimeline * rate;

          const clip1: TimelineClip = {
            ...clip,
            sourceEnd: Number((clip.sourceStart + splitOffsetSource).toFixed(3)),
          };

          const clip2: TimelineClip = {
            id: generateId('clip'),
            projectId: clip.projectId,
            assetId: clip.assetId,
            trackId: clip.trackId,
            startTime: Number(playheadTime.toFixed(3)),
            sourceStart: Number((clip.sourceStart + splitOffsetSource).toFixed(3)),
            sourceEnd: clip.sourceEnd,
            volume: clip.volume,
            playbackRate: clip.playbackRate,
          };

          nextClips.push(clip1, clip2);
          splitHappened = true;
          continue;
        }
      }
      nextClips.push(clip);
    }

    if (splitHappened) {
      setClips(nextClips);
      pushHistory(tracks, nextClips, 'Split Clip');
      triggerAutoSave(project, tracks, nextClips);
    }
  }, [selectedClipIds, project, clips, playheadTime, tracks, pushHistory, triggerAutoSave]);

  // Delete Selected Clips
  const handleDeleteSelectedClips = useCallback(() => {
    if (selectedClipIds.size === 0 || !project) return;
    const nextClips = clips.filter((c) => !selectedClipIds.has(c.id));
    setClips(nextClips);
    setSelectedClipIds(new Set());
    pushHistory(tracks, nextClips, 'Delete Selected Clips');
    triggerAutoSave(project, tracks, nextClips);
  }, [selectedClipIds, project, clips, tracks, pushHistory, triggerAutoSave]);

  // Move Playhead (Home, End, Arrows)
  const handleHome = useCallback(() => {
    handleSeek(0);
  }, [handleSeek]);

  const handleEnd = useCallback(() => {
    handleSeek(projectDuration);
  }, [handleSeek, projectDuration]);

  const handleMovePlayhead = useCallback(
    (deltaSec: number) => {
      handleSeek(Math.max(0, playheadTime + deltaSec));
    },
    [handleSeek, playheadTime]
  );

  // Wire Keyboard Shortcuts
  useKeyboardShortcuts({
    onTogglePlay: handleTogglePlay,
    onSplitClip: handleSplitAtPlayhead,
    onDeleteClip: handleDeleteSelectedClips,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSelectAll: handleSelectAll,
    onDeselect: handleDeselectAll,
    onHome: handleHome,
    onEnd: handleEnd,
    onMovePlayhead: handleMovePlayhead,
  });

  // Export Timeline
  const handleStartExport = async (settings: ExportSettings) => {
    try {
      await renderAndExportTimeline(
        clips,
        tracks,
        assetsMap,
        settings,
        (progressInfo) => {
          setExportProgress(progressInfo);
        }
      );
    } catch (err: unknown) {
      setExportProgress({
        stage: 'error',
        percent: 0,
        message: 'Export failed.',
        error: err instanceof Error ? err.message : 'Unknown error during export.',
      });
    }
  };

  // Delete Current Project
  const handleDeleteCurrentProject = async () => {
    if (!project) return;
    audioEngine.stop();
    await deleteProjectFromDb(project.id);
    clearBufferCache();

    // Re-initialize a blank project
    const { project: newProj, tracks: newTracks, clips: newClips, assets: newAssets } =
      await getOrCreateDefaultProject();

    setProject(newProj);
    setTracks(newTracks);
    setClips(newClips);
    setAssets(newAssets);
    setSelectedClipIds(new Set());
    setPlayheadTime(0);
    setHistory([{ tracks: newTracks, clips: newClips, description: 'Initial' }]);
    setHistoryIndex(0);
  };

  // Clear All Local IndexedDB Data
  const handleClearAllLocalData = async () => {
    audioEngine.stop();
    await clearAllLocalDbData();
    clearBufferCache();

    const { project: newProj, tracks: newTracks, clips: newClips, assets: newAssets } =
      await getOrCreateDefaultProject();

    setProject(newProj);
    setTracks(newTracks);
    setClips(newClips);
    setAssets(newAssets);
    setSelectedClipIds(new Set());
    setPlayheadTime(0);
    setHistory([{ tracks: newTracks, clips: newClips, description: 'Initial' }]);
    setHistoryIndex(0);
  };

  if (!isInitialized || !project) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--surface-base)] text-xs text-[var(--text-secondary)]">
        Loading CraftSound Audio Studio...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--surface-base)] text-[var(--text-primary)]">
      {/* Top Application Toolbar */}
      <TopToolbar
        projectName={project.name}
        onUpdateProjectName={handleUpdateProjectName}
        saveStatus={saveStatus}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        hasSelectedClips={selectedClipIds.size > 0}
        onSplitAtPlayhead={handleSplitAtPlayhead}
        onDeleteSelectedClips={handleDeleteSelectedClips}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenDeleteProject={() => setIsDeleteProjectOpen(true)}
      />

      {/* Main Workspace Area (Audio Library + Timeline) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Audio Library Panel */}
        <AudioLibraryPanel
          assets={assets}
          onImportFiles={handleImportFiles}
          onAddClipToTimeline={handleAddClipToTimeline}
          onDeleteAsset={handleDeleteAsset}
          onLoadDemoSounds={handleLoadDemoSounds}
          isImporting={isImporting}
        />

        {/* Center: Multitrack Timeline Workspace */}
        <Timeline
          tracks={tracks}
          clips={clips}
          assetsMap={assetsMap}
          playheadTime={playheadTime}
          isPlaying={isPlaying}
          selectedClipIds={selectedClipIds}
          pixelsPerSecond={pixelsPerSecond}
          onSetPixelsPerSecond={setPixelsPerSecond}
          onSeek={handleSeek}
          onSelectClip={handleSelectClip}
          onDeselectAll={handleDeselectAll}
          onUpdateClips={handleUpdateClips}
          onUpdateTracks={handleUpdateTracks}
          onAddTrack={handleAddTrack}
          onDeleteTrack={handleDeleteTrack}
          onDropAssetOnTrack={handleDropAssetOnTrack}
        />
      </div>

      {/* Bottom Playback Toolbar */}
      <PlaybackControls
        isPlaying={isPlaying}
        playheadTime={playheadTime}
        totalDuration={projectDuration}
        volume={masterVolume}
        playbackRate={playbackRate}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        onSeek={handleSeek}
        onSetVolume={setMasterVolume}
        onSetPlaybackRate={setPlaybackRate}
        onSkipBackward={handleSkipBackward}
        onSkipForward={handleSkipForward}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectDuration={projectDuration}
        onStartExport={handleStartExport}
        exportProgress={exportProgress}
        onResetExport={() =>
          setExportProgress({ stage: 'idle', percent: 0, message: '' })
        }
        onDeleteProjectData={handleDeleteCurrentProject}
      />

      {/* Project Deletion / Database Clear Dialog */}
      <DeleteProjectDialog
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        projectName={project.name}
        onDeleteCurrentProject={handleDeleteCurrentProject}
        onClearAllLocalData={handleClearAllLocalData}
      />
    </div>
  );
}
