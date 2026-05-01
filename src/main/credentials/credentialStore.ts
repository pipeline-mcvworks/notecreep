import { app, safeStorage } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface CredentialRecord {
  service: string;
  account: string;
  value: string;
  updatedAt: string;
}

interface StoredCredentialRecord {
  service: string;
  account: string;
  encryptedValue: string;
  updatedAt: string;
}

interface CredentialFile {
  version: 1;
  credentials: StoredCredentialRecord[];
}

const DEFAULT_FILE_NAME = 'share-credentials.json';

function credentialKey(service: string, account: string): string {
  return `${service}:${account}`;
}

export class CredentialStore {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(app.getPath('userData'), 'credentials', DEFAULT_FILE_NAME);
  }

  async setCredential(service: string, account: string, value: string): Promise<void> {
    this.assertSafeStorageAvailable();

    const file = await this.readFile();
    const encryptedValue = safeStorage.encryptString(value).toString('base64');
    const key = credentialKey(service, account);
    const nextRecord: StoredCredentialRecord = {
      service,
      account,
      encryptedValue,
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = file.credentials.findIndex((record) => credentialKey(record.service, record.account) === key);

    if (existingIndex >= 0) {
      file.credentials[existingIndex] = nextRecord;
    } else {
      file.credentials.push(nextRecord);
    }

    await this.writeFile(file);
  }

  async getCredential(service: string, account: string): Promise<string | null> {
    this.assertSafeStorageAvailable();

    const file = await this.readFile();
    const record = file.credentials.find((candidate) => candidate.service === service && candidate.account === account);

    if (!record) {
      return null;
    }

    try {
      return safeStorage.decryptString(Buffer.from(record.encryptedValue, 'base64'));
    } catch {
      return null;
    }
  }

  async hasCredential(service: string, account: string): Promise<boolean> {
    const value = await this.getCredential(service, account);
    return value !== null && value.length > 0;
  }

  async deleteCredential(service: string, account: string): Promise<void> {
    const file = await this.readFile();
    const nextCredentials = file.credentials.filter((record) => !(record.service === service && record.account === account));

    if (nextCredentials.length === file.credentials.length) {
      return;
    }

    await this.writeFile({ ...file, credentials: nextCredentials });
  }

  private assertSafeStorageAvailable(): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure credential storage is not available on this device.');
    }
  }

  private async readFile(): Promise<CredentialFile> {
    try {
      const raw = await fs.promises.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as CredentialFile;

      if (parsed.version !== 1 || !Array.isArray(parsed.credentials)) {
        return { version: 1, credentials: [] };
      }

      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { version: 1, credentials: [] };
      }

      throw error;
    }
  }

  private async writeFile(file: CredentialFile): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    await fs.promises.writeFile(this.filePath, `${JSON.stringify(file, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  }
}
