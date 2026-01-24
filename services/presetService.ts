import { Preset } from '../types';
import { v4 as uuidv4 } from 'uuid'; // 此处添加1行

const STORAGE_KEY = 'tavern_helper_presets_v8'; // v8.0: 新的存储键

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

  savePreset(preset: Preset): Preset { // 此处开始修改
    try {
      const presets = this.getPresets();
      
      if (preset.id) {
        // Update existing
        const existingIndex = presets.findIndex(p => p.id === preset.id);
        if (existingIndex >= 0) {
          presets[existingIndex] = preset;
        } else {
          presets.push(preset); // Should not happen if ID exists, but as a fallback
        }
      } else {
        // Create new
        const newPreset = { ...preset, id: uuidv4() };
        presets.push(newPreset);
        preset = newPreset; // Return the preset with the new ID
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      return preset;
    } catch (e) {
      console.error('[PresetService] Failed to save preset', e);
      throw e; // Re-throw to be caught by UI
    }
  }, // 此处完成修改

  deletePreset(id: string): void {
    try {
      const presets = this.getPresets().filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.error('[PresetService] Failed to delete preset', e);
      throw e;
    }
  }
};