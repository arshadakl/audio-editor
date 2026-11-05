import Dexie, { type Table } from 'dexie';
import type { Project, AudioAsset, TimelineTrack, TimelineClip } from '../../types';
import { generateId } from '../../utils/file-validation';

export class CraftSoundDatabase extends Dexie {
  projects!: Table<Project, string>;
  assets!: Table<AudioAsset, string>;
  tracks!: Table<TimelineTrack, string>;
  clips!: Table<TimelineClip, string>;

  constructor() {
    super('craftsound_audio_editor_db');
    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      assets: 'id, projectId, name, format',
      tracks: 'id, projectId, order',
      clips: 'id, projectId, assetId, trackId, startTime',
    });
  }
}

export const db = new CraftSoundDatabase();

export async function getOrCreateDefaultProject(): Promise<{
  project: Project;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  assets: AudioAsset[];
}> {
  const existingProject = await db.projects.orderBy('updatedAt').reverse().first();

  if (existingProject) {
    const [tracks, clips, assets] = await Promise.all([
      db.tracks.where('projectId').equals(existingProject.id).sortBy('order'),
      db.clips.where('projectId').equals(existingProject.id).toArray(),
      db.assets.where('projectId').equals(existingProject.id).toArray(),
    ]);

    // Ensure at least 3 tracks exist
    if (tracks.length === 0) {
      const defaultTracks: TimelineTrack[] = [
        { id: generateId('trk'), projectId: existingProject.id, name: 'Track 1', order: 0, volume: 1, muted: false, solo: false },
        { id: generateId('trk'), projectId: existingProject.id, name: 'Track 2', order: 1, volume: 1, muted: false, solo: false },
        { id: generateId('trk'), projectId: existingProject.id, name: 'Track 3', order: 2, volume: 1, muted: false, solo: false },
      ];
      await db.tracks.bulkAdd(defaultTracks);
      return { project: existingProject, tracks: defaultTracks, clips, assets };
    }

    return { project: existingProject, tracks, clips, assets };
  }

  // Create new project
  const now = Date.now();
  const newProject: Project = {
    id: generateId('proj'),
    name: 'Untitled Audio Project',
    createdAt: now,
    updatedAt: now,
  };

  const defaultTracks: TimelineTrack[] = [
    { id: generateId('trk'), projectId: newProject.id, name: 'Track 1', order: 0, volume: 1, muted: false, solo: false },
    { id: generateId('trk'), projectId: newProject.id, name: 'Track 2', order: 1, volume: 1, muted: false, solo: false },
    { id: generateId('trk'), projectId: newProject.id, name: 'Track 3', order: 2, volume: 1, muted: false, solo: false },
  ];

  await db.transaction('rw', db.projects, db.tracks, async () => {
    await db.projects.add(newProject);
    await db.tracks.bulkAdd(defaultTracks);
  });

  return { project: newProject, tracks: defaultTracks, clips: [], assets: [] };
}

export async function saveProjectMeta(project: Project): Promise<void> {
  await db.projects.put({ ...project, updatedAt: Date.now() });
}

export async function saveProjectState(
  project: Project,
  tracks: TimelineTrack[],
  clips: TimelineClip[]
): Promise<void> {
  await db.transaction('rw', db.projects, db.tracks, db.clips, async () => {
    await db.projects.put({ ...project, updatedAt: Date.now() });

    // Sync tracks
    await db.tracks.where('projectId').equals(project.id).delete();
    if (tracks.length > 0) {
      await db.tracks.bulkPut(tracks);
    }

    // Sync clips
    await db.clips.where('projectId').equals(project.id).delete();
    if (clips.length > 0) {
      await db.clips.bulkPut(clips);
    }
  });
}

export async function addAssetToDb(asset: AudioAsset): Promise<void> {
  await db.assets.put(asset);
}

export async function deleteAssetFromDb(assetId: string): Promise<void> {
  await db.transaction('rw', db.assets, db.clips, async () => {
    await db.assets.delete(assetId);
    await db.clips.where('assetId').equals(assetId).delete();
  });
}

export async function deleteProjectFromDb(projectId: string): Promise<void> {
  await db.transaction('rw', db.projects, db.assets, db.tracks, db.clips, async () => {
    await db.clips.where('projectId').equals(projectId).delete();
    await db.tracks.where('projectId').equals(projectId).delete();
    await db.assets.where('projectId').equals(projectId).delete();
    await db.projects.delete(projectId);
  });
}

export async function clearAllLocalDbData(): Promise<void> {
  await db.transaction('rw', db.projects, db.assets, db.tracks, db.clips, async () => {
    await db.clips.clear();
    await db.tracks.clear();
    await db.assets.clear();
    await db.projects.clear();
  });
}
