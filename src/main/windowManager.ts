import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { NoteCreepConfig, DockEdge } from '../shared/config';

const ANIMATION_STEPS = 12;

interface Position {
  x: number;
  y: number;
}

function visiblePosition(edge: DockEdge, w: number, h: number): Position {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  switch (edge) {
    case 'right':  return { x: sw - w, y: Math.round((sh - h) / 2) };
    case 'left':   return { x: 0,      y: Math.round((sh - h) / 2) };
    case 'top':    return { x: Math.round((sw - w) / 2), y: 0 };
    case 'bottom': return { x: Math.round((sw - w) / 2), y: sh - h };
  }
}

function hiddenPosition(edge: DockEdge, w: number, h: number): Position {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  switch (edge) {
    case 'right':  return { x: sw,    y: Math.round((sh - h) / 2) };
    case 'left':   return { x: -w,    y: Math.round((sh - h) / 2) };
    case 'top':    return { x: Math.round((sw - w) / 2), y: -h };
    case 'bottom': return { x: Math.round((sw - w) / 2), y: sh };
  }
}

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

export class WindowManager {
  private win: BrowserWindow | null = null;
  private animating = false;
  private visible = false;

  constructor(private config: NoteCreepConfig) {}

  createWindow(): BrowserWindow {
    const { windowWidth, windowHeight, dockEdge, alwaysOnTop, opacity } = this.config;
    const start = hiddenPosition(dockEdge, windowWidth, windowHeight);

    this.win = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: start.x,
      y: start.y,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop,
      transparent: true,
      hasShadow: true,
      show: false,
      opacity,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    if (alwaysOnTop) {
      this.win.setAlwaysOnTop(true, 'screen-saver');
    }

    if (process.env.NODE_ENV === 'development') {
      this.win.loadURL('http://localhost:5173');
    } else {
      this.win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    }

    this.win.on('close', (event) => {
      if (!this.win?.isDestroyed()) {
        event.preventDefault();
        this.hide();
      }
    });

    if (process.env.NODE_ENV !== 'development') {
      this.win.on('blur', () => {
        if (this.visible) this.hide();
      });
    }

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
    this.visible ? this.hide() : this.show();
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

    this.animate(from, to, 0, this.config.opacity, animationDurationMs, () => {
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

    this.animate(from, to, this.config.opacity, 0, animationDurationMs, () => {
      this.win?.hide();
      this.animating = false;
    });
  }

  applyConfig(next: NoteCreepConfig): void {
    this.config = next;
    if (!this.win || this.win.isDestroyed()) return;
    this.win.setAlwaysOnTop(next.alwaysOnTop, 'screen-saver');
    this.win.setOpacity(this.visible ? next.opacity : 0);
    if (this.visible) {
      const pos = visiblePosition(next.dockEdge, next.windowWidth, next.windowHeight);
      this.win.setBounds({ x: pos.x, y: pos.y, width: next.windowWidth, height: next.windowHeight });
    }
  }

  private animate(
    fromPos: Position,
    toPos: Position,
    fromOp: number,
    toOp: number,
    durationMs: number,
    onComplete: () => void
  ): void {
    let step = 0;
    const intervalMs = Math.max(1, Math.round(durationMs / ANIMATION_STEPS));
    const tick = setInterval(() => {
      step += 1;
      const t = Math.min(step / ANIMATION_STEPS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const x = lerp(fromPos.x, toPos.x, eased);
      const y = lerp(fromPos.y, toPos.y, eased);
      const op = fromOp + (toOp - fromOp) * eased;

      if (this.win && !this.win.isDestroyed()) {
        this.win.setPosition(x, y);
        this.win.setOpacity(op);
      }

      if (step >= ANIMATION_STEPS) {
        clearInterval(tick);
        onComplete();
      }
    }, intervalMs);
  }
}
