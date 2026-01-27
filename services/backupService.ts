
import { StatusBarData, ItemDefinition, CategoryDefinition, StyleDefinition, Preset } from '../types';
import { LayoutSnapshot } from '../types/layout';
import { styleService } from './styleService';
import { presetService } from './presetService';
import _ from 'lodash';

// Constants for storage keys (should match other files)
const LAYOUT_SNAPSHOTS_KEY = 'th_layout_snapshots_v1';

export interface BackupManifest {
  version: string;
  timestamp: number;
  modules: {
    definitions?: { items: ItemDefinition[], categories: CategoryDefinition[] };
    styles?: StyleDefinition[];
    presets?: Preset[];
    layout_snapshots?: LayoutSnapshot[];
    global_state?: StatusBarData; // Optional full snapshot
  };
}

export interface ExportOptions {
  includeDefinitions: boolean;
  includeStyles: boolean;
  includePresets: boolean;
  includeLayouts: boolean;
  includeGlobalState: boolean;
  specificStyleIds?: string[]; // For selective export support
}

export const backupService = {
  
  /**
   * Gather all data and create a backup JSON string
   */
  createBackup(data: StatusBarData, options: ExportOptions): string {
    const manifest: BackupManifest = {
      version: '1.0',
      timestamp: Date.now(),
      modules: {}
    };

    if (options.includeDefinitions) {
      manifest.modules.definitions = {
        items: Object.values(data.item_definitions),
        categories: Object.values(data.categories)
      };
    }

    if (options.includeStyles) {
      const allStyles = styleService.getStyleDefinitions();
      // Filter if specific IDs requested (future proofing)
      manifest.modules.styles = options.specificStyleIds 
        ? allStyles.filter(s => options.specificStyleIds?.includes(s.id))
        : allStyles;
    }

    if (options.includePresets) {
      manifest.modules.presets = presetService.getPresets();
    }

    if (options.includeLayouts) {
      try {
        const storedLayouts = localStorage.getItem(LAYOUT_SNAPSHOTS_KEY);
        manifest.modules.layout_snapshots = storedLayouts ? JSON.parse(storedLayouts) : [];
      } catch (e) {
        console.error('[Backup] Failed to read layout snapshots', e);
        manifest.modules.layout_snapshots = [];
      }
    }

    if (options.includeGlobalState) {
      manifest.modules.global_state = data;
    }

    return JSON.stringify(manifest, null, 2);
  },

  /**
   * Import data from a JSON string
   * returns a report and potential new StatusBarData if definitions/global state changed
   */
  importBackup(
    jsonContent: string, 
    currentData: StatusBarData, 
    strategy: 'merge' | 'overwrite'
  ): { 
    success: boolean; 
    logs: string[]; 
    newData: StatusBarData | null; 
  } {
    const logs: string[] = [];
    let manifest: BackupManifest;
    let newData: StatusBarData = _.cloneDeep(currentData);
    let dataChanged = false;

    try {
      manifest = JSON.parse(jsonContent);
    } catch (e) {
      return { success: false, logs: ['JSON 解析失败: 文件格式错误'], newData: null };
    }

    logs.push(`开始导入 (策略: ${strategy === 'merge' ? '合并' : '覆盖'})...`);

    // 1. Import Styles
    if (manifest.modules.styles) {
      const result = styleService.importStyles(JSON.stringify(manifest.modules.styles));
      logs.push(`样式库: 成功 ${result.success}, 更新 ${result.updated}, 错误 ${result.errors}`);
    }

    // 2. Import Presets
    if (manifest.modules.presets) {
      // Manual import logic for presets as service doesn't have bulk import yet
      const newPresets = manifest.modules.presets;
      const currentPresets = presetService.getPresets();
      let updatedCount = 0;
      let addedCount = 0;

      if (strategy === 'overwrite') {
        localStorage.setItem('tavern_helper_presets_v8', JSON.stringify(newPresets)); // HARDCODED KEY WARNING
        logs.push(`预设库: 已覆盖 (${newPresets.length} 个)`);
      } else {
        newPresets.forEach(p => {
          const idx = currentPresets.findIndex(cp => cp.id === p.id);
          if (idx >= 0) {
            currentPresets[idx] = p;
            updatedCount++;
          } else {
            currentPresets.push(p);
            addedCount++;
          }
        });
        localStorage.setItem('tavern_helper_presets_v8', JSON.stringify(currentPresets));
        logs.push(`预设库: 新增 ${addedCount}, 更新 ${updatedCount}`);
      }
    }

    // 3. Import Layout Snapshots
    if (manifest.modules.layout_snapshots) {
      const newLayouts = manifest.modules.layout_snapshots;
      let currentLayouts: LayoutSnapshot[] = [];
      try {
        currentLayouts = JSON.parse(localStorage.getItem(LAYOUT_SNAPSHOTS_KEY) || '[]');
      } catch {}

      if (strategy === 'overwrite') {
        localStorage.setItem(LAYOUT_SNAPSHOTS_KEY, JSON.stringify(newLayouts));
        logs.push(`布局快照: 已覆盖 (${newLayouts.length} 个)`);
      } else {
        let added = 0;
        let updated = 0;
        newLayouts.forEach(l => {
          const idx = currentLayouts.findIndex(cl => cl.id === l.id);
          if (idx >= 0) {
            currentLayouts[idx] = l;
            updated++;
          } else {
            currentLayouts.push(l);
            added++;
          }
        });
        localStorage.setItem(LAYOUT_SNAPSHOTS_KEY, JSON.stringify(currentLayouts));
        logs.push(`布局快照: 新增 ${added}, 更新 ${updated}`);
      }
    }

    // 4. Import Definitions & Categories (Update StatusBarData)
    if (manifest.modules.definitions) {
      const { items, categories } = manifest.modules.definitions;
      
      if (strategy === 'overwrite') {
        // Dangerous: clears existing definitions
        newData.item_definitions = {};
        newData.categories = {};
        items.forEach(d => newData.item_definitions[d.key] = d);
        categories.forEach(c => newData.categories[c.key] = c);
        dataChanged = true;
        logs.push(`定义与分类: 已覆盖 (定义 ${items.length}, 分类 ${categories.length})`);
      } else {
        let defAdded = 0, defUpdated = 0;
        let catAdded = 0, catUpdated = 0;

        items.forEach(d => {
          if (newData.item_definitions[d.key]) defUpdated++; else defAdded++;
          newData.item_definitions[d.key] = d;
        });

        categories.forEach(c => {
          if (newData.categories[c.key]) catUpdated++; else catAdded++;
          newData.categories[c.key] = c;
        });

        dataChanged = true;
        logs.push(`定义: 新增 ${defAdded}, 更新 ${defUpdated}`);
        logs.push(`分类: 新增 ${catAdded}, 更新 ${catUpdated}`);
      }
    }

    // 5. Global State (Full Override)
    if (manifest.modules.global_state && strategy === 'overwrite') {
       // Only allow global state restore in overwrite mode to prevent chaos
       newData = manifest.modules.global_state;
       dataChanged = true;
       logs.push('警告: 已执行全量系统状态恢复');
    }

    return { 
      success: true, 
      logs, 
      newData: dataChanged ? newData : null 
    };
  },

  /**
   * Reset System Factory Data
   */
  getFactoryResetData(currentData: StatusBarData): StatusBarData {
      // Re-importing defaults from registry would be ideal, 
      // but here we just clear the dynamic parts while keeping structure.
      // In a real app, this should import from 'definitionRegistry'.
      // For now, we return a minimal valid structure and let App.tsx re-initialize defaults if missing.
      return {
          categories: {}, // App.tsx will re-populate defaults if empty
          item_definitions: {}, 
          id_map: { 'char_user': 'User' },
          character_meta: { 'char_user': { isPresent: true } },
          shared: {},
          characters: { 'char_user': {} },
          _meta: { message_count: 0, version: 1 }
      };
  }
};
