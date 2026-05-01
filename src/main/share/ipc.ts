import { ipcMain, shell } from 'electron';
import { CredentialStore } from '../credentials';
import { GitHubGistBackend } from './gistBackend';
import type { CloudBackend, CloudSyncResult, ShareNote } from './types';

export const SHARE_EMAIL_CHANNEL = 'share:email';
export const SHARE_CLOUD_SYNC_CHANNEL = 'share:cloud-sync';
export const SHARE_SET_GIST_TOKEN_CHANNEL = 'share:credentials:set-gist-token';
export const SHARE_HAS_GIST_TOKEN_CHANNEL = 'share:credentials:has-gist-token';
export const SHARE_CLEAR_GIST_TOKEN_CHANNEL = 'share:credentials:clear-gist-token';

interface RegisterShareIpcHandlersOptions {
  credentialStore?: CredentialStore;
  cloudBackend?: CloudBackend;
}

function encodeMailtoValue(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

function buildMailtoUrl(note: ShareNote): string {
  const subject = encodeMailtoValue(note.title || 'Untitled note');
  const body = encodeURIComponent(note.content || '');
  return `mailto:?subject=${subject}&body=${body}`;
}

function validateNote(note: ShareNote): void {
  if (!note || typeof note !== 'object') {
    throw new Error('A note is required to share.');
  }

  if (typeof note.title !== 'string') {
    throw new Error('The note title must be a string.');
  }

  if (typeof note.content !== 'string') {
    throw new Error('The note content must be a string.');
  }
}

export function registerShareIpcHandlers(options: RegisterShareIpcHandlersOptions = {}): () => void {
  const credentialStore = options.credentialStore ?? new CredentialStore();
  const cloudBackend = options.cloudBackend ?? new GitHubGistBackend(credentialStore);

  ipcMain.handle(SHARE_EMAIL_CHANNEL, async (_event, note: ShareNote): Promise<void> => {
    validateNote(note);
    await shell.openExternal(buildMailtoUrl(note));
  });

  ipcMain.handle(SHARE_CLOUD_SYNC_CHANNEL, async (_event, note: ShareNote): Promise<CloudSyncResult> => {
    validateNote(note);
    return cloudBackend.syncNote(note);
  });

  ipcMain.handle(SHARE_SET_GIST_TOKEN_CHANNEL, async (_event, token: string): Promise<void> => {
    if (typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('A GitHub Gist token is required.');
    }

    await credentialStore.setCredential(GitHubGistBackend.tokenService, GitHubGistBackend.tokenAccount, token.trim());
  });

  ipcMain.handle(SHARE_HAS_GIST_TOKEN_CHANNEL, async (): Promise<boolean> => {
    return credentialStore.hasCredential(GitHubGistBackend.tokenService, GitHubGistBackend.tokenAccount);
  });

  ipcMain.handle(SHARE_CLEAR_GIST_TOKEN_CHANNEL, async (): Promise<void> => {
    await credentialStore.deleteCredential(GitHubGistBackend.tokenService, GitHubGistBackend.tokenAccount);
  });

  return () => {
    ipcMain.removeHandler(SHARE_EMAIL_CHANNEL);
    ipcMain.removeHandler(SHARE_CLOUD_SYNC_CHANNEL);
    ipcMain.removeHandler(SHARE_SET_GIST_TOKEN_CHANNEL);
    ipcMain.removeHandler(SHARE_HAS_GIST_TOKEN_CHANNEL);
    ipcMain.removeHandler(SHARE_CLEAR_GIST_TOKEN_CHANNEL);
  };
}
