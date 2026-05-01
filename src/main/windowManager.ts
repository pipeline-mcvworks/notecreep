/**
 * src/main/windowManager.ts
 *
 * Owns the BrowserWindow lifecycle and the show/hide slide animation
 * from the docked screen edge.
 */

import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { NoteCreepConfig, DockEdge } from '../shared/config';

const ANIMATION_STEPS = 12;

interface Position {
  x: number;
  y: number;
}

/** Compute the fully-visible position for the window on the primary display. */
function visiblePosition(
  edge: DockEdge,
  winWidth: number,
  winHeight: number
): Position {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  switch (edge) {
    case 'right':
      return { x: sw - winWidth, y: Math.round((sh - winHeight) / 2) };
    case 'left':
      return { x: 0, y: Math.round((sh - winHeight) / 2) };
    case 'top':
      return { x: Math.round((sw - winWidth) / 2), y: 0 };
    case 'bottom':
      return { x: Math.round((sw - winWidth) / 2), y: sh - winHeight };
  }
}

/** Compute the off-screen starting position for the slide animation. */
function hiddenPosition(
  edge: DockEdge,
  winWidth: number,
  winHeight: number
): Position {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  switch (edge) {
    case 'right':
      return { x: sw, y: Math.round((sh - winHeight) / 2) };
    case 'left':
      return { x: -winWidth, y: Math.round((sh - winHeight) / 2) };
    case 'top':
      return { x: Math.round((sw - winWidth) / 2), y: -winHeight };
    case 'bottom':
      return { x: Math.round((sw - winWidth) / 2), y: sh };
  }
}

/** Linearly interpolate between two numbers. */
function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export class WindowManager {
  private win: BrowserWindow | null = null;
  private config: NoteCreepConfig;
  private animating = false;
  private visible = false;

  constructor(config: NoteCreepConfig) {
    this.config = config;
  }

  createWindow(): BrowserWindow {
    const { windowWidth, windowHeight, dockEdge } = this.config;
    const startPos = hiddenPosition(dockEdge, windowWidth, windowHeight);

    this.win = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: startPos.x,
      y: startPos.y,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      transparent: true,
      hasShadow: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    // Load the renderer entry point.
    if (process.env.NODE_ENV === 'development') {
      this.win.loadURL('http://localhost:3000');
    } else {
      this.win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    }

    // Hide instead of close when the user presses the OS close button.
    this.win.on('close', (event) => {
      if (!this.win?.isDestroyed()) {
        event.preventDefault();
        this.hide();
      }
    });

    // Hide when focus is lost (click-away to dismiss).
    this.win.on('blur', () => {
      if (this.visible) {
        this.hide();
      }
    });

    return this.win;
  }

  getWindow(): BrowserWindow | null {
    return this.win;
  }

  isVisible(): boolean {
    return this.visible;
  }

  toggle(): void {
    if (this.animating) return;
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    if (!this.win || this.animating || this.visible) return;
    const { windowWidth, windowHeight, dockEdge, animationDurationMs } = this.config;
    const from = hiddenPosition(dockEdge, windowWidth, windowHeight);
    const to = visiblePosition(dockEdge, windowWidth, windowHeight);

    this.animating = true;
    this.visible = true;
    this.win.setPosition(from.x, from.y);
    this.win.setOpacity(0);
    this.win.showInactive();
    this.win.focus();

    this.animate(from, to, 0, 1, animationDurationMs, () => {
      this.animating = false;
    });
  }

  hide(): void {
    if (!this.win || this.animating || !this.visible) return;
    const { windowWidth, windowHeight, dockEdge, animationDurationMs } = this.config;
    const from = visiblePosition(dockEdge, windowWidth, windowHeight);
    const to = hiddenPosition(dockEdge, windowWidth, windowHeight);

    this.animating = true;
    this.visible = false;

    this.animate(from, to, 1, 0, animationDurationMs, () => {
      this.win?.hide();
      this.animating = false;
    });
  }

  /**
   * Animate position and opacity over `durationMs` milliseconds.
   * Uses setInterval with ANIMATION_STEPS steps.
   */
  private animate(
    fromPos: Position,
    toPos: Position,
    fromOpacity: number,
    toOpacity: number,
    durationMs: number,
    onComplete: () => void
  ): void {
    let step = 0;
    const intervalMs = Math.max(1, Math.round(durationMs / ANIMATION_STEPS));

    const tick = setInterval(() => {
      step += 1;
      const t = Math.min(step / ANIMATION_STEPS, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      const x = lerp(fromPos.x, toPos.x, eased);
      const y = lerp(fromPos.y, toPos.y, eased);
      const opacity = fromOpacity + (toOpacity - fromOpacity) * eased;

      if (this.win && !this.win.isDestroyed()) {
        this.win.setPosition(x, y);
        this.win.setOpacity(opacity);
      }

      if (step >= ANIMATION_STEPS) {
        clearInterval(tick);
        onComplete();
      }
    }, intervalMs);
  }

  destroy(): void {
    if (this.win && !this.win.isDestroyed()) {
      this.win.removeAllListeners('close');
      this.win.destroy();
      this.win = null;
    }
  }
}
