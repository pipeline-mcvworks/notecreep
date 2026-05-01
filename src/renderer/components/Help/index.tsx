import * as React from 'react';

export interface KeyboardShortcut {
  keys: string;
  description: string;
  group?: string;
}

export interface ShortcutHelpOverlayProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  appHotkey?: string;
  shortcuts?: KeyboardShortcut[];
  title?: string;
}

function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

function modifierKeyLabel(): string {
  return isApplePlatform() ? '⌘' : 'Ctrl';
}

export function getDefaultKeyboardShortcuts(appHotkey = isApplePlatform() ? 'Command+Shift+N' : 'Ctrl+Shift+N'): KeyboardShortcut[] {
  const modifier = modifierKeyLabel();

  return [
    {
      keys: appHotkey,
      description: 'Show or hide NoteCreep from anywhere.',
      group: 'Global',
    },
    {
      keys: `${modifier}+,`,
      description: 'Open settings.',
      group: 'Application',
    },
    {
      keys: `${modifier}+/`,
      description: 'Open keyboard shortcut help.',
      group: 'Application',
    },
    {
      keys: 'Esc',
      description: 'Close the active settings or help overlay.',
      group: 'Application',
    },
  ];
}

function groupShortcuts(shortcuts: KeyboardShortcut[]): Array<[string, KeyboardShortcut[]]> {
  const groups = new Map<string, KeyboardShortcut[]>();

  shortcuts.forEach((shortcut) => {
    const group = shortcut.group ?? 'Shortcuts';
    const existing = groups.get(group) ?? [];
    existing.push(shortcut);
    groups.set(group, existing);
  });

  return Array.from(groups.entries());
}

export function ShortcutHelpOverlay({
  isOpen,
  onOpenChange,
  appHotkey,
  shortcuts,
  title = 'Keyboard shortcuts',
}: ShortcutHelpOverlayProps): JSX.Element | null {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const overlayIsOpen = isOpen ?? internalOpen;

  const setOverlayOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (isOpen === undefined) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isOpen, onOpenChange],
  );

  const allShortcuts = React.useMemo(
    () => shortcuts ?? getDefaultKeyboardShortcuts(appHotkey),
    [appHotkey, shortcuts],
  );

  const groupedShortcuts = React.useMemo(() => groupShortcuts(allShortcuts), [allShortcuts]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      const shortcutModifierPressed = event.ctrlKey || event.metaKey;

      if (shortcutModifierPressed && event.key === '/') {
        event.preventDefault();
        setOverlayOpen(true);
        return;
      }

      if (overlayIsOpen && event.key === 'Escape') {
        event.preventDefault();
        setOverlayOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overlayIsOpen, setOverlayOpen]);

  if (!overlayIsOpen) {
    return null;
  }

  return (
    <div style={styles.backdrop} role="presentation" onMouseDown={() => setOverlayOpen(false)}>
      <section
        aria-labelledby="notecreep-shortcut-help-title"
        role="dialog"
        aria-modal="true"
        style={styles.panel}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header style={styles.header}>
          <div>
            <h2 id="notecreep-shortcut-help-title" style={styles.title}>
              {title}
            </h2>
            <p style={styles.subtitle}>Quick reference for every keyboard shortcut used by NoteCreep.</p>
          </div>
          <button type="button" aria-label="Close shortcut help" style={styles.iconButton} onClick={() => setOverlayOpen(false)}>
            ×
          </button>
        </header>

        <div style={styles.content}>
          {groupedShortcuts.map(([group, groupShortcuts]) => (
            <section key={group} style={styles.group}>
              <h3 style={styles.groupTitle}>{group}</h3>
              <dl style={styles.shortcutList}>
                {groupShortcuts.map((shortcut) => (
                  <div key={`${group}-${shortcut.keys}-${shortcut.description}`} style={styles.shortcutRow}>
                    <dt style={styles.keys}>
                      {shortcut.keys.split('+').map((key, index, parts) => (
                        <React.Fragment key={`${shortcut.keys}-${key}-${index}`}>
                          <kbd style={styles.key}>{key}</kbd>
                          {index < parts.length - 1 ? <span style={styles.plus}>+</span> : null}
                        </React.Fragment>
                      ))}
                    </dt>
                    <dd style={styles.description}>{shortcut.description}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ShortcutHelpOverlay;

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    width: 'min(560px, 100%)',
    maxHeight: 'min(720px, calc(100vh - 48px))',
    overflow: 'auto',
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.32)',
    background: 'var(--notecreep-panel-bg, #111827)',
    color: 'var(--notecreep-panel-fg, #f9fafb)',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    padding: '22px 24px 8px',
  },
  title: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.2,
  },
  subtitle: {
    margin: '6px 0 0',
    color: 'var(--notecreep-muted-fg, #cbd5e1)',
    fontSize: 13,
  },
  iconButton: {
    border: 0,
    borderRadius: 999,
    width: 32,
    height: 32,
    cursor: 'pointer',
    background: 'rgba(148, 163, 184, 0.18)',
    color: 'inherit',
    fontSize: 24,
    lineHeight: '28px',
  },
  content: {
    display: 'grid',
    gap: 20,
    padding: '16px 24px 24px',
  },
  group: {
    display: 'grid',
    gap: 10,
  },
  groupTitle: {
    margin: 0,
    color: 'var(--notecreep-muted-fg, #cbd5e1)',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  shortcutList: {
    display: 'grid',
    gap: 10,
    margin: 0,
  },
  shortcutRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(130px, max-content) 1fr',
    alignItems: 'center',
    gap: 16,
  },
  keys: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    margin: 0,
  },
  key: {
    minWidth: 24,
    borderRadius: 6,
    border: '1px solid rgba(148, 163, 184, 0.42)',
    background: 'rgba(15, 23, 42, 0.72)',
    color: 'inherit',
    padding: '4px 7px',
    textAlign: 'center',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 12,
    boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.12)',
  },
  plus: {
    color: 'var(--notecreep-muted-fg, #cbd5e1)',
    fontSize: 12,
  },
  description: {
    margin: 0,
    color: 'var(--notecreep-panel-fg, #f9fafb)',
    fontSize: 14,
    lineHeight: 1.4,
  },
};
