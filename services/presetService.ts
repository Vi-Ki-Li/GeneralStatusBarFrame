import { Preset } from '../types';

const STORAGE_KEY = 'tavern_helper_presets';

export const presetService = {
  getPresets(): Preset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      console.error('[PresetService] Failed to load presets');
      return [];
    }
  },

  savePreset(preset: Preset): void {
    try {
      const presets = this.getPresets();
      const existingIndex = presets.findIndex(p => p.name === preset.name);
      
      if (existingIndex >= 0) {
        presets[existingIndex] = preset;
      } else {
        presets.push(preset);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.error('[PresetService] Failed to save preset', e);
    }
  },

  deletePreset(name: string): void {
    try {
      const presets = this.getPresets().filter(p => p.name !== name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.error('[PresetService] Failed to delete preset', e);
    }
  }
};