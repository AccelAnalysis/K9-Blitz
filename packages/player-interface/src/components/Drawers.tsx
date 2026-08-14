import type { ReactNode } from "react";
import type { BoardSpaceView, GameHistoryEntryView } from "../model";

interface DrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

function Drawer({ title, open, onClose, children }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="drawer-heading">
          <h2>{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label={`Close ${title}`}>×</button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function HistoryDrawer({ open, history, onClose }: { open: boolean; history: GameHistoryEntryView[]; onClose: () => void }) {
  return (
    <Drawer title="Game history" open={open} onClose={onClose}>
      <ol className="history-list">
        {[...history].reverse().map((entry) => (
          <li key={entry.id}>
            <span>Turn {entry.turn}</span>
            <p>{entry.message}</p>
          </li>
        ))}
      </ol>
    </Drawer>
  );
}

export function HelpDrawer({
  open,
  space,
  onClose,
}: {
  open: boolean;
  space: BoardSpaceView | undefined;
  onClose: () => void;
}) {
  return (
    <Drawer title="Rules & help" open={open} onClose={onClose}>
      {space ? (
        <div className="help-copy">
          <p className="eyebrow">Contextual board help</p>
          <h3>{space.label}</h3>
          <p>{space.helpText || "No authoritative rule text has been supplied for this space yet."}</p>
        </div>
      ) : (
        <div className="help-copy">
          <h3>How to use the digital table</h3>
          <p>Pan or pinch/scroll the board, select a space for contextual help, and use the highlighted action at the bottom of the screen.</p>
          <p>Gameplay rules are intentionally supplied by the rules engine. This interface does not invent unresolved K9 Blitz rules.</p>
        </div>
      )}
    </Drawer>
  );
}

export interface ExperienceSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  reducedMotion: boolean;
}

export function SettingsDrawer({
  open,
  settings,
  onSettings,
  onClose,
}: {
  open: boolean;
  settings: ExperienceSettings;
  onSettings: (settings: ExperienceSettings) => void;
  onClose: () => void;
}) {
  const toggle = (key: keyof ExperienceSettings) => onSettings({ ...settings, [key]: !settings[key] });
  return (
    <Drawer title="Experience settings" open={open} onClose={onClose}>
      <div className="settings-list">
        <label><span><strong>Sound effects</strong><small>Dice, cards, rewards and game cues</small></span><input type="checkbox" checked={settings.soundEnabled} onChange={() => toggle("soundEnabled")} /></label>
        <label><span><strong>Music</strong><small>Background and celebration music</small></span><input type="checkbox" checked={settings.musicEnabled} onChange={() => toggle("musicEnabled")} /></label>
        <label><span><strong>Reduced motion</strong><small>Use simpler movement and transition feedback</small></span><input type="checkbox" checked={settings.reducedMotion} onChange={() => toggle("reducedMotion")} /></label>
      </div>
    </Drawer>
  );
}
