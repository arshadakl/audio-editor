import { encodeWav } from '../export/wav-encoder.service';
import { decodeAudioFile } from './audio-decoder.service';
import type { AudioAsset } from '../../types';

/**
 * Generates high quality synthesized musical tracks for immediate testing and demonstration.
 */
export async function createDemoAudioAsset(
  type: 'melody' | 'chords' | 'percussion',
  projectId: string
): Promise<AudioAsset> {
  const sampleRate = 44100;
  let duration = 6.0;
  let name = 'Demo Audio';

  if (type === 'melody') {
    duration = 8.0;
    name = 'Melody Theme (C Major).wav';
  } else if (type === 'chords') {
    duration = 8.0;
    name = 'Warm Pad Chords.wav';
  } else {
    duration = 6.0;
    name = 'Rhythm Percussion.wav';
  }

  const OfflineAudioCtxClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  const offlineCtx = new OfflineAudioCtxClass(2, Math.ceil(duration * sampleRate), sampleRate);

  if (type === 'melody') {
    // Sequence of notes in C Major: C4, E4, G4, B4, C5, G4, E4, C4
    const notes = [261.63, 329.63, 392.0, 493.88, 523.25, 392.0, 329.63, 261.63];
    const noteDuration = 0.95;

    notes.forEach((freq, idx) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, offlineCtx.currentTime);

      const startTime = idx * 1.0;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  } else if (type === 'chords') {
    // Lush ambient chords
    const chordFrequencies = [
      [261.63, 329.63, 392.0], // C
      [220.0, 261.63, 329.63], // Am
      [174.61, 220.0, 261.63], // F
      [196.0, 246.94, 293.66], // G
    ];

    chordFrequencies.forEach((chord, chordIdx) => {
      const chordStart = chordIdx * 2.0;
      chord.forEach((freq) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, offlineCtx.currentTime);

        gain.gain.setValueAtTime(0, chordStart);
        gain.gain.linearRampToValueAtTime(0.18, chordStart + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 1.95);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(chordStart);
        osc.stop(chordStart + 2.0);
      });
    });
  } else {
    // Crisp percussion / clicks rhythm
    for (let t = 0; t < duration; t += 0.5) {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(t % 1 === 0 ? 140 : 280, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = encodeWav(renderedBuffer, 16);
  const file = new File([wavBlob], name, { type: 'audio/wav' });

  return await decodeAudioFile(file, projectId);
}
