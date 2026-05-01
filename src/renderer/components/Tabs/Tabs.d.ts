import { ComponentType, ReactNode } from 'react';
import { TabNote } from '../../hooks/useNotes';

export interface TabStripProps {
  notes: TabNote[];
  activeNoteId: string | null;
  activeNote?: TabNote | null;
  selectNote?: (id: string) => void;
  createNote?: () => void;
  closeNote?: (id: string | null) => void;
  renameNote?: (id: string, title: string) => void;
  updateNoteContent?: (id: string, content: string) => void;
  reorderNote?: (sourceId: string, targetId: string) => void;
  cycleNote?: (direction: number) => void;
  renderEditor?: ((note: TabNote | null) => ReactNode) | false;
  className?: string;
  ariaLabel?: string;
}

export const TabStrip: ComponentType<TabStripProps>;
export const Tabs: ComponentType<TabStripProps>;
declare const _default: ComponentType<TabStripProps>;
export default _default;
