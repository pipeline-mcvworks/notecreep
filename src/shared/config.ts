/**
 * Shared types and defaults for edge-dock configuration.
 * Used by both the main process and the renderer (via IPC).
 */

export type ScreenEdge = 'left' | 'right' | 'top' | 'bottom';

export interface EdgeConfig {
  /** Which screen edge the panel is docked to */
  edge: ScreenEdge;
  /**
   * Thickness of the panel perpendicular to the docked edge (px).
   * For left/right edges this is the width; for top/bottom it is the height.
   */
  thickness: number;
  /** Opacity of the window (0.0 – 1.0) */
  opacity: number;
  /** Always keep the window on top of other windows */
  alwaysOnTop: boolean;
}

export const DEFAULT_CONFIG: EdgeConfig = {
  edge: 'left',
  thickness: 48,
  opacity: 1.0,
  alwaysOnTop: true,
};
