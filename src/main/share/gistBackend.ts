import * as https from 'node:https';
import { CredentialStore } from '../credentials';
import type { CloudBackend, CloudSyncResult, ShareNote } from './types';

const GITHUB_API_HOST = 'api.github.com';
const GIST_TOKEN_SERVICE = 'github-gist';
const GIST_TOKEN_ACCOUNT = 'token';

interface GitHubGistResponse {
  id: string;
  html_url: string;
}

interface GitHubApiError {
  message?: string;
  errors?: Array<{ message?: string }>;
}

function sanitizeFileName(title: string, fallbackId?: string): string {
  const base = (title || fallbackId || 'note')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120);

  return `${base || 'note'}.md`;
}

function renderGistContent(note: ShareNote): string {
  const title = note.title?.trim();

  if (!title) {
    return note.content || '';
  }

  return `# ${title}\n\n${note.content || ''}`;
}

function requestJson<T>(method: 'POST' | 'PATCH', path: string, token: string, payload: unknown): Promise<T> {
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: GITHUB_API_HOST,
        method,
        path,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(body),
          'Content-Type': 'application/json',
          'User-Agent': 'electron-note-share',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const statusCode = response.statusCode ?? 0;

          if (statusCode < 200 || statusCode >= 300) {
            let message = `GitHub Gist request failed with status ${statusCode}.`;

            try {
              const parsed = JSON.parse(raw) as GitHubApiError;
              if (parsed.message) {
                message = parsed.message;
              }
            } catch {
              if (raw) {
                message = raw;
              }
            }

            reject(new Error(message));
            return;
          }

          try {
            resolve(JSON.parse(raw) as T);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

export class GitHubGistBackend implements CloudBackend {
  private readonly credentialStore: CredentialStore;

  constructor(credentialStore = new CredentialStore()) {
    this.credentialStore = credentialStore;
  }

  static tokenService = GIST_TOKEN_SERVICE;
  static tokenAccount = GIST_TOKEN_ACCOUNT;

  async syncNote(note: ShareNote): Promise<CloudSyncResult> {
    const token = await this.credentialStore.getCredential(GIST_TOKEN_SERVICE, GIST_TOKEN_ACCOUNT);

    if (!token) {
      throw new Error('A GitHub Gist token is required before cloud sync can be used.');
    }

    const filename = sanitizeFileName(note.title, note.id);
    const payload = {
      description: note.title || 'Shared note',
      public: false,
      files: {
        [filename]: {
          content: renderGistContent(note),
        },
      },
    };

    const isUpdate = Boolean(note.cloudSyncId);
    const response = await requestJson<GitHubGistResponse>(
      isUpdate ? 'PATCH' : 'POST',
      isUpdate ? `/gists/${encodeURIComponent(note.cloudSyncId as string)}` : '/gists',
      token,
      payload,
    );

    return {
      id: response.id,
      url: response.html_url,
      updated: isUpdate,
    };
  }
}
