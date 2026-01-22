import { StatusBarData, StatusBarItem, MergeResult, ParsedUpdate } from '../types';
import { resolveCharacterId } from './idManager';
import _ from 'lodash';

/**
 * 辅助函数：解析布尔值
 */
function parseBoolean(val: string): boolean | undefined {
  const lower = val.toLowerCase().trim();
  if (['true', 'on', 'yes', '1'].includes(lower)) return true;
  if (['false', 'off', 'no', '0'].includes(lower)) return false;
  return undefined;
}

/**
 * 同步函数：扫描 Character Data 中的 Meta 条目，并同步到 character_meta 
 * 用于确保 UI 编辑（DataCenter）或 AI 数据更新能正确反映到逻辑层。
 */
export function syncMetaFromData(data: StatusBarData): string[] {
    const logs: string[] = [];
    if (!data.characters) return logs;
    if (!data.character_meta) data.character_meta = {};

    Object.keys(data.characters).forEach(charId => {
        const charData = data.characters[charId];
        // 查找 Meta 或 System 分类
        const metaItems = [...(charData['Meta'] || []), ...(charData['System'] || [])];
        
        // 查找 Present 或 Visible 条目
        const presentItem = metaItems.find(i => ['present', 'visible'].includes(i.key.toLowerCase()));
        
        if (presentItem && presentItem.values[0]) {
            // FIX: Add type assertion to string because meta items should always contain string values.
            const boolVal = parseBoolean(presentItem.values[0] as string);
            if (boolVal !== undefined) {
                if (!data.character_meta![charId]) data.character_meta![charId] = { isPresent: true };
                
                // 仅当发生变化时更新 (避免不必要的重渲染或副作用)
                if (data.character_meta![charId].isPresent !== boolVal) {
                    data.character_meta![charId].isPresent = boolVal;
                    logs.push(`[SyncMeta] ${charId} 同步状态: ${boolVal} (From: ${presentItem.key})`);
                }
            }
        }
    });
    return logs;
}

/**
 * 合并状态栏数据 (集成 ID 管理)
 */
export function mergeStatusBarData(
  currentData: StatusBarData,
  parsedUpdate: ParsedUpdate,
  currentMessageId: number
): MergeResult {
  const resultData = _.cloneDeep(currentData);
  const warnings: string[] = [];
  const logs: string[] = [];

  // 初始化必要结构
  if (!resultData.id_map) resultData.id_map = {};
  if (!resultData.categories) resultData.categories = {};
  if (!resultData.item_definitions) resultData.item_definitions = {};
  if (!resultData.character_meta) resultData.character_meta = {};

  // 1. 时间线收缩检测
  const storedMessageCount = resultData._meta?.message_count ?? 0;
  if (currentMessageId < storedMessageCount) {
    warnings.push(`检测到时间线收缩！当前: ${currentMessageId}, 记录: ${storedMessageCount}。跳过更新。`);
    return { data: resultData, warnings, logs };
  }

  // 2. 更新元数据
  if (!resultData._meta) resultData._meta = {};
  resultData._meta.message_count = currentMessageId;
  resultData._meta.last_updated = new Date().toISOString();

  // 3. 辅助合并函数 (Item Level)
  const mergeItemList = (
    targetList: StatusBarItem[],
    sourceList: StatusBarItem[],
    contextName: string
  ) => {
    sourceList.forEach(sourceItem => {
      const targetIndex = targetList.findIndex(item => item.key === sourceItem.key);
      const targetItem = targetIndex !== -1 ? targetList[targetIndex] : null;
      const logPrefix = `[${contextName}][${sourceItem.category}|${sourceItem.key}]`;

      // Case A: 新增
      if (!targetItem) {
        if (sourceItem.values[0] === 'nil') return;
        targetList.push({ ...sourceItem });
        logs.push(`${logPrefix} 新增条目`);
        return;
      }

      // Case B: 更新
      if (targetItem.user_modified) {
        logs.push(`${logPrefix} 用户锁定，跳过`);
        return;
      }
      if (sourceItem.source_id < targetItem.source_id) {
        // logs.push(`${logPrefix} 数据过旧，跳过`); 
        return;
      }
      if (sourceItem.values[0] === 'nil') {
        targetList.splice(targetIndex, 1);
        logs.push(`${logPrefix} 已移除`);
        return;
      }

      if (!_.isEqual(targetItem.values, sourceItem.values)) {
        logs.push(`${logPrefix} 更新: ${JSON.stringify(targetItem.values)} -> ${JSON.stringify(sourceItem.values)}`);
      }
      targetItem.values = sourceItem.values;
      targetItem.source_id = sourceItem.source_id;
      targetItem.originalLine = sourceItem.originalLine;
    });
  };

  // 4. 合并 Shared 数据
  Object.keys(parsedUpdate.shared).forEach(cat => {
    if (!resultData.shared) resultData.shared = {};
    if (!resultData.shared[cat]) resultData.shared[cat] = [];
    mergeItemList(resultData.shared[cat], parsedUpdate.shared[cat], 'Shared');
  });

  // 5. 合并 Characters 数据 (关键：ID 转换)
  Object.keys(parsedUpdate.characters).forEach(charName => {
    // 解析 ID
    const { id, isNew, updatedMap } = resolveCharacterId(resultData.id_map, charName);
    
    // 如果发现了新角色或 ID 映射更新了，应用到结果中
    if (isNew) {
      resultData.id_map = updatedMap;
      logs.push(`[System] 注册新角色映射: ${charName} -> ${id}`);
    }

    // 确保角色数据容器存在
    if (!resultData.characters[id]) resultData.characters[id] = {};
    const charTarget = resultData.characters[id];
    const charSource = parsedUpdate.characters[charName];

    Object.keys(charSource).forEach(cat => {
      if (!charTarget[cat]) charTarget[cat] = [];
      mergeItemList(charTarget[cat], charSource[cat], `Char:${charName}`);
    });
  });

  // 6. 合并 Meta 数据 (v6.4: 主要依赖数据同步，但也保留 Meta 指令的优先权)
  if (parsedUpdate.meta) {
    Object.keys(parsedUpdate.meta).forEach(charName => {
        const { id, isNew, updatedMap } = resolveCharacterId(resultData.id_map, charName);
        if (isNew) resultData.id_map = updatedMap;

        // 初始化 meta
        if (!resultData.character_meta) resultData.character_meta = {};
        if (!resultData.character_meta[id]) resultData.character_meta[id] = { isPresent: true };

        const updates = parsedUpdate.meta![charName];
        
        // 处理 isPresent
        if (updates.isPresent !== undefined) {
            const oldState = resultData.character_meta[id].isPresent;
            if (oldState !== updates.isPresent) {
                resultData.character_meta[id].isPresent = updates.isPresent;
                logs.push(`[MetaDirect] ${charName} (${id}) 在场状态变更: ${updates.isPresent}`);
            }
        }
    });
  }

  // 7. 最后一步：执行全量元数据同步 (v6.4 新增)
  // 这确保了如果数据条目 ([Meta|Present::false]) 进入了 characters 列表，
  // character_meta 也会被相应更新。
  const syncLogs = syncMetaFromData(resultData);
  logs.push(...syncLogs);

  return { data: resultData, warnings, logs };
}