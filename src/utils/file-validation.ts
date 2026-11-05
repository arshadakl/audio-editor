const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'webm', 'weba', 'opus', 'aiff'];

export function getAudioExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function isSupportedAudioFile(file: File): boolean {
  if (file.type.startsWith('audio/')) return true;
  const ext = getAudioExtension(file.name);
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}
