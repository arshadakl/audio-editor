import type { AudioAsset } from '../../types';
import { generateId, getAudioExtension } from '../../utils/file-validation';

// In-memory cache of decoded AudioBuffers keyed by assetId
const bufferCache = new Map<string, AudioBuffer>();

let sharedAudioContext: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioContextClass();
  }
  return sharedAudioContext;
}

/**
 * Extract normalized waveform peaks from an AudioBuffer.
 * Produces an array of values between 0 and 1.
 */
export function extractPeaks(audioBuffer: AudioBuffer, targetBuckets = 800): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const totalSamples = channelData.length;
  const bucketSize = Math.max(1, Math.floor(totalSamples / targetBuckets));
  const peaks: number[] = [];

  for (let i = 0; i < targetBuckets; i++) {
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, totalSamples);
    if (start >= totalSamples) break;

    let max = 0;
    for (let j = start; j < end; j++) {
      const absVal = Math.abs(channelData[j]);
      if (absVal > max) {
        max = absVal;
      }
    }
    // Clamped peak value
    peaks.push(Math.min(1, max));
  }

  return peaks;
}

/**
 * Decodes an audio file, generates waveform peaks, caches the AudioBuffer,
 * and returns the AudioAsset record ready for persistence.
 */
export async function decodeAudioFile(file: File, projectId: string): Promise<AudioAsset> {
  const ctx = getSharedAudioContext();
  const arrayBuffer = await file.arrayBuffer();

  // Clone arrayBuffer because decodeAudioData detaches the buffer in some browsers
  const bufferCopy = arrayBuffer.slice(0);

  let decodedBuffer: AudioBuffer;
  try {
    decodedBuffer = await ctx.decodeAudioData(bufferCopy);
  } catch (err) {
    throw new Error(
      `Unable to decode "${file.name}". Format may be unsupported or file corrupted.`
    );
  }

  const assetId = generateId('asset');
  bufferCache.set(assetId, decodedBuffer);

  const peaks = extractPeaks(decodedBuffer, 800);
  const format = getAudioExtension(file.name) || (file.type.split('/')[1] || 'audio');

  const asset: AudioAsset = {
    id: assetId,
    projectId,
    name: file.name,
    format: format.toUpperCase(),
    size: file.size,
    duration: decodedBuffer.duration,
    sampleRate: decodedBuffer.sampleRate,
    numberOfChannels: decodedBuffer.numberOfChannels,
    peaks,
    blob: file,
  };

  return asset;
}

/**
 * Retrieves the AudioBuffer from cache, or decodes it from the asset's stored Blob if not cached.
 */
export async function getAudioBufferForAsset(asset: AudioAsset): Promise<AudioBuffer> {
  const cached = bufferCache.get(asset.id);
  if (cached) {
    return cached;
  }

  const ctx = getSharedAudioContext();
  const arrayBuffer = await asset.blob.arrayBuffer();
  const decoded = await ctx.decodeAudioData(arrayBuffer);
  bufferCache.set(asset.id, decoded);
  return decoded;
}

/**
 * Clears the buffer cache for memory management.
 */
export function removeCachedBuffer(assetId: string): void {
  bufferCache.delete(assetId);
}

export function clearBufferCache(): void {
  bufferCache.clear();
}
