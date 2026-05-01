import React, { useCallback, useMemo, useRef, useState } from 'react';

export interface ShareNote {
  id?: string;
  title: string;
  content: string;
  html?: string;
  cloudSyncId?: string;
}

export interface ShareCloudSyncResult {
  id: string;
  url: string;
  updated: boolean;
}

interface ShareApi {
  email?: (note: ShareNote) => Promise<void> | void;
  cloudSync?: (note: ShareNote) => Promise<ShareCloudSyncResult>;
}

declare global {
  interface Window {
    shareApi?: ShareApi;
    electron?: {
      share?: ShareApi;
    };
  }
}

export interface ShareButtonProps {
  note: ShareNote | null;
  disabled?: boolean;
  className?: string;
  onEmailShared?: () => void;
  onCloudSyncSuccess?: (result: ShareCloudSyncResult) => void;
  onCloudSyncError?: (error: Error) => void;
}

function getShareApi(): ShareApi | undefined {
  return window.shareApi ?? window.electron?.share;
}

function buildMailto(note: ShareNote): string {
  const subject = encodeURIComponent(note.title || 'Untitled note');
  const body = encodeURIComponent(note.content || '');
  return `mailto:?subject=${subject}&body=${body}`;
}

async function shareByEmail(note: ShareNote): Promise<void> {
  const api = getShareApi();

  if (api?.email) {
    await api.email(note);
    return;
  }

  window.location.href = buildMailto(note);
}

async function shareByCloudSync(note: ShareNote): Promise<ShareCloudSyncResult> {
  const api = getShareApi();

  if (!api?.cloudSync) {
    throw new Error('Cloud sync is not available in this build.');
  }

  return api.cloudSync(note);
}

export function ShareButton({
  note,
  disabled = false,
  className,
  onEmailShared,
  onCloudSyncSuccess,
  onCloudSyncError,
}: ShareButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const isDisabled = disabled || !note;

  const showToast = useCallback((message: string) => {
    setToast(message);

    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current);
    }

    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 4500);
  }, []);

  const buttonLabel = useMemo(() => {
    if (isSyncing) {
      return 'Sharing…';
    }

    return 'Share';
  }, [isSyncing]);

  const handleEmail = useCallback(async () => {
    if (!note) {
      return;
    }

    setIsOpen(false);
    await shareByEmail(note);
    onEmailShared?.();
  }, [note, onEmailShared]);

  const handleCloudSync = useCallback(async () => {
    if (!note || isSyncing) {
      return;
    }

    setIsOpen(false);
    setIsSyncing(true);

    try {
      const result = await shareByCloudSync(note);
      showToast(`Synced to cloud: ${result.url}`);
      onCloudSyncSuccess?.(result);
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      showToast(normalizedError.message);
      onCloudSyncError?.(normalizedError);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, note, onCloudSyncError, onCloudSyncSuccess, showToast]);

  return (
    <div className={className} style={{ display: 'inline-block', position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isDisabled || isSyncing}
        onClick={() => setIsOpen((current) => !current)}
      >
        {buttonLabel}
      </button>

      {isOpen && !isDisabled ? (
        <div
          role="menu"
          aria-label="Share note"
          style={{
            background: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-border, #d0d7de)',
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(140, 149, 159, 0.2)',
            minWidth: 160,
            padding: 4,
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 20,
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleEmail}
            style={{ display: 'block', padding: '8px 10px', textAlign: 'left', width: '100%' }}
          >
            Email
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleCloudSync}
            disabled={isSyncing}
            style={{ display: 'block', padding: '8px 10px', textAlign: 'left', width: '100%' }}
          >
            Cloud Sync
          </button>
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          style={{
            background: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-border, #d0d7de)',
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(140, 149, 159, 0.2)',
            marginTop: 8,
            maxWidth: 320,
            padding: '8px 10px',
            position: 'absolute',
            right: 0,
            top: '100%',
            zIndex: 19,
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
