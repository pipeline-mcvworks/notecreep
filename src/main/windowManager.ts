import { screen, BrowserWindow } from 'electron';
import { EdgeConfig, ScreenEdge } from '../shared/config';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute the window bounds for the given config on the primary display.
 */
export function computeBounds(config: EdgeConfig): WindowBounds {
  const { bounds: display } = screen.getPrimaryDisplay();
  const { edge, thickness } = config;

  switch (edge as ScreenEdge) {
    case 'left':
      return {
        x: display.x,
        y: display.y,
        width: thickness,
        height: display.height,
      };
    case 'right':
      return {
        x: display.x + display.width - thickness,
        y: display.y,
        width: thickness,
        height: display.height,
      };
    case 'top':
      return {
        x: display.x,
        y: display.y,
        width: display.width,
        height: thickness,
      };
    case 'bottom':
      return {
        x: display.x,
        y: display.y + display.height - thickness,
        width: display.width,
        height: thickness,
      };
    default:
      // Fallback: left edge
      return {
        x: display.x,
        y: display.y,
        width: thickness,
        height: display.height,
      };
  }
}

/**
 * Apply the computed bounds and opacity to an existing BrowserWindow.
 */
export function applyConfig(win: BrowserWindow, config: EdgeConfig): void {
  const bounds = computeBounds(config);
  win.setBounds(bounds);
  win.setOpacity(config.opacity);
  win.setAlwaysOnTop(config.alwaysOnTop, 'screen-saver');
}
