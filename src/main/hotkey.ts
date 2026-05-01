/**
 * src/main/hotkey.ts
 *
 * Registers and unregisters the global shortcut for toggling NoteCreep.
 */

import { globalShortcut } from 'electron';

export type ToggleFn = () => void;

export class HotkeyManager {
  private currentAccelerator: string | null = null;

  /**
   * Register the global shortcut.
   * @param accelerator  Electron accelerator string, e.g. 'Ctrl+Shift+N'
   * @param onToggle     Callback invoked when the shortcut fires.
   * @returns            true if registration succeeded.
   */
  register(accelerator: string, onToggle: ToggleFn): boolean {
    // Unregister any previously registered shortcut first.
    this.unregister();

    const success = globalShortcut.register(accelerator, onToggle);
    if (success) {
      this.currentAccelerator = accelerator;
      console.log(`[hotkey] Registered global shortcut: ${accelerator}`);
    } else {
      console.error(
        `[hotkey] Failed to register global shortcut: ${accelerator}. ` +
          'It may already be in use by another application.'
      );
    }
    return success;
  }

  /** Unregister the currently active shortcut, if any. */
  unregister(): void {
    if (this.currentAccelerator) {
      globalShortcut.unregister(this.currentAccelerator);
      console.log(`[hotkey] Unregistered global shortcut: ${this.currentAccelerator}`);
      this.currentAccelerator = null;
    }
  }

  /** Unregister all shortcuts registered by this process (call on app quit). */
  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.currentAccelerator = null;
  }
}
