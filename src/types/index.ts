export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface AudioAsset {
  id: string;
  projectId: string;
  name: string;
  format: string;
  size: number;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  peaks: number[]; // Normalized waveform peak data (0 to 1)
  blob: Blob;
}

export interface TimelineTrack {
  id: string;
  projectId: string;
  name: string;
  order: number;
  volume: number; // 0 to 1.5
  muted: boolean;
  solo: boolean;
}

export interface TimelineClip {
  id: string;
  projectId: string;
  assetId: string;
  trackId: string;
  startTime: number; // Start position on the timeline in seconds
  sourceStart: number; // Offset from start of original audio in seconds
  sourceEnd: number; // Offset from end of original audio in seconds
  volume: number; // Clip gain 0 to 2
  playbackRate: number; // default 1
}

export type ExportFormat = 'mp3' | 'wav';
export type Mp3Bitrate = 128 | 192 | 256 | 320;
export type WavBitDepth = 16 | 24;
export type WavSampleRate = 44100 | 48000;

export interface ExportSettings {
  format: ExportFormat;
  mp3Bitrate: Mp3Bitrate;
  wavBitDepth: WavBitDepth;
  wavSampleRate: WavSampleRate;
  fileName: string;
}

export interface ExportProgressInfo {
  stage: 'idle' | 'preparing' | 'mixing' | 'encoding' | 'finalizing' | 'completed' | 'error';
  percent: number;
  message: string;
  error?: string;
  blob?: Blob;
  downloadUrl?: string;
  outputSize?: number;
}

export interface HistorySnapshot {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  description: string;
}
