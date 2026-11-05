export function formatTime(seconds: number, includeMs = true): string {
  if (isNaN(seconds) || seconds < 0) {
    seconds = 0;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);

  const minsStr = mins.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');

  if (!includeMs) {
    return `${minsStr}:${secsStr}`;
  }

  const msStr = ms.toString().padStart(3, '0');
  return `${minsStr}:${secsStr}.${msStr}`;
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
