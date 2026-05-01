export interface ShareNote {
  id?: string;
  title: string;
  content: string;
  html?: string;
  cloudSyncId?: string;
}

export interface CloudSyncResult {
  id: string;
  url: string;
  updated: boolean;
}

export interface CloudBackend {
  syncNote(note: ShareNote): Promise<CloudSyncResult>;
}
