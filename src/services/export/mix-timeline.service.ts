import type { AudioAsset, ExportProgressInfo, ExportSettings, TimelineClip, TimelineTrack } from '../../types';
import { getAudioBufferForAsset } from '../audio/audio-decoder.service';
import { encodeMp3 } from './mp3-encoder.service';
import { encodeWav } from './wav-encoder.service';

/**
 * Calculates total project duration from the active clips on the timeline.
 */
export function calculateProjectDuration(clips: TimelineClip[]): number {
  if (clips.length === 0) return 0;

  let maxEnd = 0;
  for (const clip of clips) {
    const rate = clip.playbackRate || 1;
    const clipDuration = (clip.sourceEnd - clip.sourceStart) / rate;
    const clipEnd = clip.startTime + clipDuration;
    if (clipEnd > maxEnd) {
      maxEnd = clipEnd;
    }
  }

  return maxEnd;
}

/**
 * Renders the entire timeline offline and encodes it to the chosen format (MP3 or WAV).
 */
export async function renderAndExportTimeline(
  clips: TimelineClip[],
  tracks: TimelineTrack[],
  assetsMap: Map<string, AudioAsset>,
  settings: ExportSettings,
  onProgress: (info: ExportProgressInfo) => void
): Promise<{ blob: Blob; url: string; size: number }> {
  if (clips.length === 0) {
    throw new Error('Timeline is empty. Please add at least one audio clip before exporting.');
  }

  const duration = calculateProjectDuration(clips);
  if (duration <= 0.05) {
    throw new Error('Project duration is too short to export.');
  }

  // 1. Preparing timeline
  onProgress({
    stage: 'preparing',
    percent: 10,
    message: 'Preparing timeline tracks and clips...',
  });

  const sampleRate = settings.format === 'wav' ? settings.wavSampleRate : 44100;
  const numChannels = 2; // Stereo output
  const totalSamples = Math.ceil(duration * sampleRate);

  // Setup OfflineAudioContext
  const OfflineAudioCtxClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  const offlineCtx = new OfflineAudioCtxClass(numChannels, totalSamples, sampleRate);

  const hasSolo = tracks.some((t) => t.solo);
  const trackMap = new Map<string, TimelineTrack>();
  for (const t of tracks) {
    trackMap.set(t.id, t);
  }

  // Load and schedule each clip
  for (const clip of clips) {
    const track = trackMap.get(clip.trackId);
    if (!track) continue;
    if (track.muted) continue;
    if (hasSolo && !track.solo) continue;

    const asset = assetsMap.get(clip.assetId);
    if (!asset) continue;

    const buffer = await getAudioBufferForAsset(asset);
    const rate = clip.playbackRate || 1;
    const sourceOffset = clip.sourceStart;
    const playDuration = (clip.sourceEnd - clip.sourceStart) / rate;

    if (playDuration <= 0) continue;

    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.playbackRate.value = rate;

    const gainNode = offlineCtx.createGain();
    const effectiveGain = (clip.volume ?? 1) * (track.volume ?? 1);
    gainNode.gain.value = Math.max(0, effectiveGain);

    sourceNode.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    sourceNode.start(clip.startTime, sourceOffset, playDuration);
  }

  // 2. Mixing audio
  onProgress({
    stage: 'mixing',
    percent: 30,
    message: 'Rendering multitrack mix...',
  });

  const renderedBuffer = await offlineCtx.startRendering();

  // 3. Encoding
  let resultBlob: Blob;

  if (settings.format === 'wav') {
    onProgress({
      stage: 'encoding',
      percent: 60,
      message: `Encoding uncompressed ${settings.wavBitDepth}-bit WAV (${sampleRate} Hz)...`,
    });

    resultBlob = encodeWav(renderedBuffer, settings.wavBitDepth);
  } else {
    onProgress({
      stage: 'encoding',
      percent: 45,
      message: `Encoding MP3 at ${settings.mp3Bitrate} kbps...`,
    });

    resultBlob = await encodeMp3(renderedBuffer, settings.mp3Bitrate, (encodingPercent) => {
      onProgress({
        stage: 'encoding',
        percent: 45 + Math.floor(encodingPercent * 0.45),
        message: `Encoding MP3 (${encodingPercent}%)...`,
      });
    });
  }

  // 4. Finalizing
  onProgress({
    stage: 'finalizing',
    percent: 95,
    message: 'Finalizing audio export...',
  });

  const url = URL.createObjectURL(resultBlob);

  onProgress({
    stage: 'completed',
    percent: 100,
    message: 'Export complete!',
    blob: resultBlob,
    downloadUrl: url,
    outputSize: resultBlob.size,
  });

  return { blob: resultBlob, url, size: resultBlob.size };
}
