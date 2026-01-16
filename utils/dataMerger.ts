import { StatusBarData, StatusBarItem, MergeResult, StatusBarCategoryKey } from '../types';
import _ from 'lodash';

/**
 * 合并状态栏数据核心函数 (纯函数)
 * @param currentData 当前的权威数据 (SST)
 * @param updateData 解析器产生的新数据
 * @param currentMessageId 当前消息 ID
 */
export function mergeStatusBarData(
  currentData: StatusBarData,
  updateData: Partial<StatusBarData>,
  currentMessageId: number
): MergeResult {
  const resultData = _.cloneDeep(currentData);
  const warnings: string[] = [];
  const logs: string[] = [];

  // 1. 时间线收缩检测 (Timeline Retraction Detection)
  const storedMessageCount = resultData._meta?.message_count ?? 0;
  
  if (currentMessageId < storedMessageCount) {
    warnings.push(`检测到时间线收缩！当前楼层: ${currentMessageId}, 记录楼层: ${storedMessageCount}。已跳过自动更新以保护数据。`);
    return {
      data: resultData, // 返回原数据，不进行合并
      warnings,
      logs
    };
  }

  // 2. 更新元数据
  if (!resultData._meta) {
    resultData._meta = {};
  }
  resultData._meta.message_count = currentMessageId;
  resultData._meta.last_updated = new Date().toISOString();

  // 如果没有更新数据，直接返回
  if (!updateData.shared && !updateData.characters) {
    return { data: resultData, warnings, logs };
  }

  // 3. 辅助合并函数
  const mergeItemList = (
    targetList: StatusBarItem[],
    sourceList: StatusBarItem[],
    contextName: string
  ) => {
    sourceList.forEach(sourceItem => {
      const targetIndex = targetList.findIndex(item => item.key === sourceItem.key);
      const targetItem = targetIndex !== -1 ? targetList[targetIndex] : null;

      const logPrefix = `[${contextName}][${sourceItem.category}|${sourceItem.key}]`;

      // Case A: 这是一个新条目
      if (!targetItem) {
        // 检查是否是删除指令 (nil)
        if (sourceItem.values.length === 1 && sourceItem.values[0] === 'nil') {
          return;
        }
        targetList.push({ ...sourceItem }); 
        logs.push(`${logPrefix} 新增条目`);
        return;
      }

      // Case B: 更新现有条目
      
      // B1. 检查用户锁定
      if (targetItem.user_modified) {
        logs.push(`${logPrefix} 用户已锁定，跳过 AI 更新`);
        return;
      }

      // B2. 检查版本 (Source ID)
      if (sourceItem.source_id < targetItem.source_id) {
        logs.push(`${logPrefix} 更新源过旧 (src:${sourceItem.source_id} < curr:${targetItem.source_id})，跳过`);
        return;
      }

      // B3. 检查是否是删除指令
      if (sourceItem.values.length === 1 && sourceItem.values[0] === 'nil') {
        targetList.splice(targetIndex, 1);
        logs.push(`${logPrefix} 条目已移除 (nil)`);
        return;
      }

      // B4. 执行更新
      const valuesChanged = !_.isEqual(targetItem.values, sourceItem.values);
      if (valuesChanged) {
        logs.push(`${logPrefix} 更新: ${targetItem.values.join(', ')} -> ${sourceItem.values.join(', ')}`);
      }
      
      // 更新属性
      targetItem.values = sourceItem.values;
      targetItem.source_id = sourceItem.source_id;
      targetItem.originalLine = sourceItem.originalLine;
    });
  };

  // 4. 合并 Shared 数据
  if (updateData.shared) {
    if (!resultData.shared) resultData.shared = {};
    Object.keys(updateData.shared).forEach(cat => {
      const category = cat as StatusBarCategoryKey; 
      if (!resultData.shared[category]) resultData.shared[category] = [];
      
      mergeItemList(
        resultData.shared[category],
        updateData.shared[category]!,
        `Shared`
      );
    });
  }

  // 5. 合并 Characters 数据
  if (updateData.characters) {
    if (!resultData.characters) resultData.characters = {};
    Object.keys(updateData.characters).forEach(charName => {
      if (!resultData.characters[charName]) resultData.characters[charName] = {};
      
      const charUpdate = updateData.characters![charName];
      const charTarget = resultData.characters[charName];

      Object.keys(charUpdate).forEach(cat => {
        if (!charTarget[cat]) charTarget[cat] = [];

        mergeItemList(
          charTarget[cat],
          charUpdate[cat],
          `Char:${charName}`
        );
      });
    });
  }

  return {
    data: resultData,
    warnings,
    logs
  };
}