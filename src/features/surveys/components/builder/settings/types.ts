export interface SettingsProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}
