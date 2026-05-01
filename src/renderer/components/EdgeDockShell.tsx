import React, { ReactNode, useEffect, useState } from 'react';
import '../styles/theme.css';
import { getActiveTheme, installThemeController, ThemeScheme, toggleTheme } from '../theme';

export interface EdgeDockShellProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  edge?: 'left' | 'right';
  className?: string;
}

const getInitialTheme = (): ThemeScheme => {
  if (typeof document === 'undefined') {
    return 'light';
  }

  return getActiveTheme();
};

const ThemeIcon = ({ scheme }: { scheme: ThemeScheme }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {scheme === 'dark' ? (
      <path d="M20.5 14.3A8.2 8.2 0 0 1 9.7 3.5 8.4 8.4 0 1 0 20.5 14.3Z" />
    ) : (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.8v2M12 19.2v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.8 12h2M19.2 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </>
    )}
  </svg>
);

export const EdgeDockShell = ({
  title = 'Workspace',
  subtitle = 'Edge dock',
  actions,
  children,
  footer,
  edge = 'right',
  className,
}: EdgeDockShellProps) => {
  const [scheme, setScheme] = useState<ThemeScheme>(getInitialTheme);

  useEffect(() => {
    const uninstall = installThemeController({ shortcut: true });
    setScheme(getActiveTheme());

    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ scheme: ThemeScheme }>).detail;
      if (detail?.scheme) {
        setScheme(detail.scheme);
      }
    };

    window.addEventListener('themechange', onThemeChange);

    return () => {
      window.removeEventListener('themechange', onThemeChange);
      uninstall();
    };
  }, []);

  const shellClassName = ['edge-dock-shell', className].filter(Boolean).join(' ');
  const nextThemeLabel = scheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <main className={shellClassName} data-edge={edge}>
      <section className="edge-dock-frame" aria-label="Docked workspace">
        <header className="edge-dock-toolbar">
          <div className="edge-dock-title-group">
            {title ? <h1 className="edge-dock-title">{title}</h1> : null}
            {subtitle ? <p className="edge-dock-subtitle">{subtitle}</p> : null}
          </div>

          <div className="edge-dock-actions">
            {actions}
            <button
              className="edge-dock-icon-button edge-dock-theme-toggle"
              type="button"
              aria-label={nextThemeLabel}
              title={`${nextThemeLabel} (Ctrl+Shift+T)`}
              onClick={() => setScheme(toggleTheme())}
            >
              <ThemeIcon scheme={scheme} />
            </button>
          </div>
        </header>

        <div className="edge-dock-content">{children}</div>

        {footer ? <footer className="edge-dock-footer">{footer}</footer> : null}
      </section>
    </main>
  );
};

export default EdgeDockShell;
