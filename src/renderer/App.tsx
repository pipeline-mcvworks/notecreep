import React, { useEffect, useState, useCallback } from 'react';
import { EdgeConfig, ScreenEdge, DEFAULT_CONFIG } from '../shared/config';

// Type declaration for the contextBridge API exposed by preload.ts
declare global {
  interface Window {
    edgeConfig: {
      getConfig: () => Promise<EdgeConfig>;
      setConfig: (config: EdgeConfig) => Promise<void>;
    };
  }
}

const EDGES: ScreenEdge[] = ['left', 'right', 'top', 'bottom'];

export default function App(): React.ReactElement {
  const [config, setConfigState] = useState<EdgeConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    window.edgeConfig
      .getConfig()
      .then((cfg) => {
        setConfigState(cfg);
        setStatus('ready');
      })
      .catch((err) => {
        console.error('Failed to load config:', err);
        setStatus('error');
      });
  }, []);

  const handleEdgeChange = useCallback(
    async (edge: ScreenEdge) => {
      const next: EdgeConfig = { ...config, edge };
      setConfigState(next);
      try {
        await window.edgeConfig.setConfig(next);
      } catch (err) {
        console.error('Failed to save config:', err);
      }
    },
    [config]
  );

  const handleThicknessChange = useCallback(
    async (thickness: number) => {
      const next: EdgeConfig = { ...config, thickness };
      setConfigState(next);
      try {
        await window.edgeConfig.setConfig(next);
      } catch (err) {
        console.error('Failed to save config:', err);
      }
    },
    [config]
  );

  if (status === 'loading') {
    return <div className="panel panel--loading">Loading…</div>;
  }

  if (status === 'error') {
    return <div className="panel panel--error">Failed to load configuration.</div>;
  }

  return (
    <div className={`panel panel--${config.edge}`}>
      <div className="panel__header">EdgeDock</div>

      <section className="panel__section">
        <label className="panel__label">Edge</label>
        <div className="panel__edge-buttons">
          {EDGES.map((e) => (
            <button
              key={e}
              className={`edge-btn${config.edge === e ? ' edge-btn--active' : ''}`}
              onClick={() => handleEdgeChange(e)}
              aria-pressed={config.edge === e}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      <section className="panel__section">
        <label className="panel__label" htmlFor="thickness-input">
          Thickness: {config.thickness}px
        </label>
        <input
          id="thickness-input"
          type="range"
          min={24}
          max={400}
          step={4}
          value={config.thickness}
          onChange={(e) => handleThicknessChange(Number(e.target.value))}
          className="panel__slider"
        />
      </section>
    </div>
  );
}
