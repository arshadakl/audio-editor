import { Mp3Encoder } from '@breezystack/lamejs';
import type { Mp3Bitrate } from '../../types';

/**
 * Encodes an AudioBuffer into an MP3 Blob with progress reporting.
 */
export async function encodeMp3(
  audioBuffer: AudioBuffer,
  bitrate: Mp3Bitrate = 192,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  // Lamejs Mp3Encoder
  const encoder = new Mp3Encoder(channels, sampleRate, bitrate);
  const mp3Data: BlobPart[] = [];

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  // Frame sample size (multiple of 1152)
  const chunkSize = 1152 * 4;
  const totalChunks = Math.ceil(length / chunkSize);

  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    const start = chunkIdx * chunkSize;
    const end = Math.min(start + chunkSize, length);
    const chunkLength = end - start;

    const leftInt16 = new Int16Array(chunkLength);
    const rightInt16 = new Int16Array(chunkLength);

    for (let i = 0; i < chunkLength; i++) {
      const idx = start + i;
      // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
      let l = leftChannel[idx];
      let r = rightChannel[idx];
      l = Math.max(-1, Math.min(1, l));
      r = Math.max(-1, Math.min(1, r));

      leftInt16[i] = l < 0 ? l * 0x8000 : l * 0x7fff;
      rightInt16[i] = r < 0 ? r * 0x8000 : r * 0x7fff;
    }

    let mp3buf: Int8Array | Uint8Array;
    if (channels === 1) {
      mp3buf = encoder.encodeBuffer(leftInt16);
    } else {
      mp3buf = encoder.encodeBuffer(leftInt16, rightInt16);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf.buffer.slice(mp3buf.byteOffset, mp3buf.byteOffset + mp3buf.length) as ArrayBuffer));
    }

    if (onProgress && chunkIdx % 5 === 0) {
      const percent = Math.round(((chunkIdx + 1) / totalChunks) * 100);
      onProgress(percent);
      // Yield to UI event loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Flush remaining buffer
  const flushed = encoder.flush();
  if (flushed.length > 0) {
    mp3Data.push(new Uint8Array(flushed.buffer.slice(flushed.byteOffset, flushed.byteOffset + flushed.length) as ArrayBuffer));
  }

  onProgress?.(100);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}
