import type { AudioAsset, TimelineClip, TimelineTrack } from '../../types';
import { getSharedAudioContext, getAudioBufferForAsset } from './audio-decoder.service';

interface ActiveNode {
  sourceNode: AudioBufferSourceNode;
  gainNode: GainNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: ActiveNode[] = [];
  private isPlaying = false;
  private currentPlayhead = 0;
  private playbackStartCtxTime = 0;
  private playheadAtCtxStart = 0;
  private animFrameId: number | null = null;
  private projectDuration = 0;
  private globalPlaybackRate = 1;
  private masterVolume = 1;

  private onTimeUpdate?: (time: number) => void;
  private onStateChange?: (playing: boolean) => void;

  constructor() {
    // Context is initialized on first user interaction
  }

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = getSharedAudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setCallbacks(callbacks: {
    onTimeUpdate?: (time: number) => void;
    onStateChange?: (playing: boolean) => void;
  }) {
    this.onTimeUpdate = callbacks.onTimeUpdate;
    this.onStateChange = callbacks.onStateChange;
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1.5, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public setGlobalPlaybackRate(rate: number) {
    this.globalPlaybackRate = rate;
  }

  public getCurrentPlayhead(): number {
    if (!this.isPlaying || !this.ctx) {
      return this.currentPlayhead;
    }
    const elapsed = (this.ctx.currentTime - this.playbackStartCtxTime) * this.globalPlaybackRate;
    return this.playheadAtCtxStart + elapsed;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Stops all active audio source nodes immediately.
   */
  public stopActiveNodes(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    for (const node of this.activeNodes) {
      try {
        node.sourceNode.stop();
        node.sourceNode.disconnect();
        node.gainNode.disconnect();
      } catch {
        // Node might have already finished
      }
    }
    this.activeNodes = [];
  }

  /**
   * Starts playback from seekTime across all tracks and clips.
   */
  public async play(
    seekTime: number,
    clips: TimelineClip[],
    tracks: TimelineTrack[],
    assetsMap: Map<string, AudioAsset>,
    projectDuration: number
  ): Promise<void> {
    const ctx = this.initContext();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.stopActiveNodes();

    this.projectDuration = Math.max(0.1, projectDuration);
    this.currentPlayhead = Math.max(0, seekTime);

    // If starting at or past project end, loop to beginning
    if (this.currentPlayhead >= this.projectDuration) {
      this.currentPlayhead = 0;
    }

    this.playheadAtCtxStart = this.currentPlayhead;
    this.playbackStartCtxTime = ctx.currentTime;
    this.isPlaying = true;
    this.onStateChange?.(true);

    const hasSolo = tracks.some((t) => t.solo);
    const trackMap = new Map<string, TimelineTrack>();
    for (const t of tracks) {
      trackMap.set(t.id, t);
    }

    // Schedule all eligible clips
    for (const clip of clips) {
      const track = trackMap.get(clip.trackId);
      if (!track) continue;

      // Track mute/solo evaluation
      if (track.muted) continue;
      if (hasSolo && !track.solo) continue;

      const asset = assetsMap.get(clip.assetId);
      if (!asset) continue;

      const rate = (clip.playbackRate || 1) * this.globalPlaybackRate;
      const clipDurationTimeline = (clip.sourceEnd - clip.sourceStart) / rate;
      const clipEndTimeline = clip.startTime + clipDurationTimeline;

      // If clip ends before our playhead, skip
      if (clipEndTimeline <= this.currentPlayhead) {
        continue;
      }

      let scheduleTimeCtx = 0;
      let sourceOffset = 0;
      let durationToPlay = 0;

      if (clip.startTime <= this.currentPlayhead) {
        // Clip is actively under the playhead
        const elapsedTimeline = this.currentPlayhead - clip.startTime;
        sourceOffset = clip.sourceStart + elapsedTimeline * rate;
        durationToPlay = clip.sourceEnd - sourceOffset;
        scheduleTimeCtx = ctx.currentTime;
      } else {
        // Clip starts in the future
        const delayTimeline = (clip.startTime - this.currentPlayhead) / this.globalPlaybackRate;
        scheduleTimeCtx = ctx.currentTime + delayTimeline;
        sourceOffset = clip.sourceStart;
        durationToPlay = clip.sourceEnd - clip.sourceStart;
      }

      if (durationToPlay <= 0) continue;

      try {
        const audioBuffer = await getAudioBufferForAsset(asset);
        if (!this.isPlaying) return; // Player was stopped while loading buffer

        const sourceNode = ctx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.playbackRate.value = rate;

        const gainNode = ctx.createGain();
        const effectiveGain = (clip.volume ?? 1) * (track.volume ?? 1);
        gainNode.gain.value = Math.max(0, effectiveGain);

        sourceNode.connect(gainNode);
        if (this.masterGain) {
          gainNode.connect(this.masterGain);
        }

        sourceNode.start(scheduleTimeCtx, sourceOffset, durationToPlay);
        this.activeNodes.push({ sourceNode, gainNode });
      } catch (err) {
        console.error('Error starting clip playback:', err);
      }
    }

    this.startAnimationLoop();
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.currentPlayhead = this.getCurrentPlayhead();
    this.isPlaying = false;
    this.stopActiveNodes();
    this.onStateChange?.(false);
    this.onTimeUpdate?.(this.currentPlayhead);
  }

  public stop(): void {
    this.isPlaying = false;
    this.currentPlayhead = 0;
    this.stopActiveNodes();
    this.onStateChange?.(false);
    this.onTimeUpdate?.(0);
  }

  public seek(time: number, isPlaying: boolean, clips: TimelineClip[], tracks: TimelineTrack[], assetsMap: Map<string, AudioAsset>, projectDuration: number): void {
    this.currentPlayhead = Math.max(0, time);
    this.onTimeUpdate?.(this.currentPlayhead);

    if (isPlaying) {
      this.play(this.currentPlayhead, clips, tracks, assetsMap, projectDuration);
    } else {
      this.stopActiveNodes();
    }
  }

  private startAnimationLoop(): void {
    const loop = () => {
      if (!this.isPlaying || !this.ctx) return;

      const now = this.getCurrentPlayhead();
      this.currentPlayhead = now;
      this.onTimeUpdate?.(now);

      if (now >= this.projectDuration) {
        this.stop();
        return;
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }
}

export const audioEngine = new AudioEngine();
