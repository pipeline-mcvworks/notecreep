import * as React from 'react';
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  type DockEdge,
  type NoteCreepConfig,
  type ThemeMode,
} from '../../../shared/config';

export interface SettingsPanelProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  config?: NoteCreepConfig;
  onConfigChange?: (config: NoteCreepConfig) => void | Promise<void>;
}

const dockEdgeOptions: Array<{ value: DockEdge; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
];

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function readConfig(): NoteCreepConfig {
  try {
    return loadConfig();
  } catch (err) {
    console.warn('[settings] Failed to read config, using defaults:', err);
    return { ...DEFAULT_CONFIG };
  }
}

function applyImmediateConfig(config: NoteCreepConfig): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.noteCreepDockEdge = config.dockEdge;
    document.documentElement.dataset.noteCreepTheme = config.theme;
    document.documentElement.style.colorScheme = config.theme === 'system' ? '' : config.theme;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('notecreep:config-changed', { detail: config }));
  }
}

export function SettingsPanel({
  isOpen,
  onOpenChange,
  config: controlledConfig,
  onConfigChange,
}: SettingsPanelProps): JSX.Element | null {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [config, setConfig] = React.useState<NoteCreepConfig>(() => controlledConfig ?? readConfig());

  const panelIsOpen = isOpen ?? internalOpen;

  const setPanelOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (isOpen === undefined) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isOpen, onOpenChange],
  );

  const persistConfig = React.useCallback(
    (nextConfig: NoteCreepConfig) => {
      if (onConfigChange) {
        void Promise.resolve(onConfigChange(nextConfig));
        return;
      }

      saveConfig(nextConfig);
    },
    [onConfigChange],
  );

  const updateConfigValue = React.useCallback(
    <Key extends keyof NoteCreepConfig>(key: Key, value: NoteCreepConfig[Key]) => {
      const nextConfig = { ...config, [key]: value };
      setConfig(nextConfig);
      applyImmediateConfig(nextConfig);
      persistConfig(nextConfig);
    },
    [config, persistConfig],
  );

  React.useEffect(() => {
    if (!controlledConfig) {
      return;
    }

    setConfig(controlledConfig);
    applyImmediateConfig(controlledConfig);
  }, [controlledConfig]);

  React.useEffect(() => {
    applyImmediateConfig(config);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      const shortcutModifierPressed = event.ctrlKey || event.metaKey;
      if (!shortcutModifierPressed || event.key !== ',') {
        return;
      }

      event.preventDefault();
      setPanelOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPanelOpen]);

  React.useEffect(() => {
    if (!panelIsOpen || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panelIsOpen, setPanelOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPanelOpen(false);
  };

  if (!panelIsOpen) {
    return null;
  }

  return (
    <div style={styles.backdrop} role="presentation" onMouseDown={() => setPanelOpen(false)}>
      <section
        aria-labelledby="notecreep-settings-title"
        role="dialog"
        aria-modal="true"
        style={styles.panel}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header style={styles.header}>
          <div>
            <h2 id="notecreep-settings-title" style={styles.title}>
              Settings
            </h2>
            <p style={styles.subtitle}>Adjust NoteCreep behavior and sync settings.</p>
          </div>
          <button type="button" aria-label="Close settings" style={styles.iconButton} onClick={() => setPanelOpen(false)}>
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Dock edge</span>
            <select
              value={config.dockEdge}
              onChange={(event) => updateConfigValue('dockEdge', event.target.value as DockEdge)}
              style={styles.input}
            >
              {dockEdgeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span style={styles.helpText}>Applied immediately to dock-aware UI.</span>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Global hotkey</span>
            <input
              type="text"
              value={config.hotkey}
              onChange={(event) => updateConfigValue('hotkey', event.target.value)}
              placeholder={DEFAULT_CONFIG.hotkey}
              spellCheck={false}
              style={styles.input}
            />
            <span style={styles.helpText}>Saved to config and used on restart by the shortcut registrar.</span>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Theme</span>
            <select
              value={config.theme}
              onChange={(event) => updateConfigValue('theme', event.target.value as ThemeMode)}
              style={styles.input}
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span style={styles.helpText}>Applied immediately via document theme attributes.</span>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>GitHub Gist token</span>
            <input
              type="password"
              value={config.gistToken}
              onChange={(event) => updateConfigValue('gistToken', event.target.value)}
              placeholder="ghp_..."
              autoComplete="off"
              spellCheck={false}
              style={styles.input}
            />
            <span style={styles.helpText}>Stored locally in the app config for Gist sync.</span>
          </label>

          <footer style={styles.footer}>
            <button type="button" style={styles.secondaryButton} onClick={() => setPanelOpen(false)}>
              Cancel
            </button>
            <button type="submit" style={styles.primaryButton}>
              Done
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default SettingsPanel;

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    width: 'min(460px, 100%)',
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
  form: {
    display: 'grid',
    gap: 18,
    padding: '16px 24px 24px',
  },
  field: {
    display: 'grid',
    gap: 8,
  },
  label: {
    fontWeight: 700,
    fontSize: 13,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 10,
    border: '1px solid rgba(148, 163, 184, 0.38)',
    background: 'var(--notecreep-input-bg, rgba(15, 23, 42, 0.76))',
    color: 'inherit',
    padding: '10px 12px',
    fontSize: 14,
    outline: 'none',
  },
  helpText: {
    color: 'var(--notecreep-muted-fg, #cbd5e1)',
    fontSize: 12,
    lineHeight: 1.4,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 6,
  },
  primaryButton: {
    border: 0,
    borderRadius: 10,
    padding: '10px 16px',
    cursor: 'pointer',
    background: 'var(--notecreep-accent, #60a5fa)',
    color: '#0f172a',
    fontWeight: 700,
  },
  secondaryButton: {
    border: '1px solid rgba(148, 163, 184, 0.38)',
    borderRadius: 10,
    padding: '10px 16px',
    cursor: 'pointer',
    background: 'transparent',
    color: 'inherit',
    fontWeight: 700,
  },
};
