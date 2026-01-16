import { StatusBarData, StatusBarItem, StatusBarCategoryKey } from '../types';

// 正则表达式定义
const REGEX_NEW_FORMAT = /\[([^^|::\[\]]+)\^([a-zA-Z]{2})\|([^^|::\[\]]+)::([^\]^::\[\]]*)\]/;
const REGEX_OLD_FORMAT = /\[(.*)\|(.*?)::(.*)\]/;

/**
 * 解析单个值字符串，处理 '@' 分隔符 (e.g. "80@100")
 */
function parseValues(valueString: string): string[] {
  const parts = valueString.split('|').map(v => v.trim());
  // 暂时保留旧逻辑的处理方式，但为了类型安全，这里返回扁平化的字符串数组
  // 如果需要处理嵌套数组 (e.g. [['80', '100'], '-5']), 我们可能需要调整 StatusBarItem 的定义
  // 目前 StatusBarItem.values 定义为 string[]，所以我们将 '@' 分隔的值保持原样，
  // 或者在此处拆分？旧逻辑是: if include '@' -> split.
  // 为了兼容现有 Types，我们暂时保持原样，但在渲染层处理 '@'。
  // 或者，更好的方式是标准化为 string[]，如果遇到 @，则保持为 "80@100" 字符串，UI 层去解析。
  return parts; 
}

/**
 * 解析状态栏文本核心函数
 * @param text 原始文本 (通常来自 AI 回复或 WorldInfo)
 * @param sourceMessageId 来源消息 ID (用于版本控制)
 */
export function parseStatusBarText(text: string, sourceMessageId: number): Partial<StatusBarData> {
  if (!text) return { shared: {}, characters: {} };

  const lines = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

  const result: Partial<StatusBarData> = {
    shared: {},
    characters: {},
  };

  lines.forEach(line => {
    // 1. 尝试匹配新格式: [角色^分类|键::值]
    let match = line.match(REGEX_NEW_FORMAT);
    
    if (match) {
      const charName = match[1].trim();
      const category = match[2].trim() as StatusBarCategoryKey;
      const key = match[3].trim();
      const valueString = match[4].trim();
      const values = parseValues(valueString);

      // 初始化角色数据结构
      if (!result.characters![charName]) {
        result.characters![charName] = {};
      }
      if (!result.characters![charName][category]) {
        result.characters![charName][category] = [];
      }

      result.characters![charName][category]!.push({
        key,
        values,
        source_id: sourceMessageId,
        user_modified: false,
        originalLine: line,
        category
      });
      return;
    }

    // 2. 尝试匹配旧格式: [分类|键::值] (通常用于共享数据)
    match = line.match(REGEX_OLD_FORMAT);
    if (match) {
      const category = match[1].trim() as StatusBarCategoryKey;
      const key = match[2].trim();
      const valueString = match[3].trim();
      const values = parseValues(valueString);

      // 仅允许特定的共享分类
      if (['ST', 'WP', 'MI'].includes(category)) {
        if (!result.shared![category]) {
          result.shared![category] = [];
        }
        result.shared![category]!.push({
          key,
          values,
          source_id: sourceMessageId,
          user_modified: false,
          originalLine: line,
          category
        });
      } else {
        // console.warn(`[Parser] Detected old format for character category '${category}' in line: ${line}`);
        // 可以在这里做向后兼容，但建议鼓励新格式
      }
    }
  });

  return result;
}

/**
 * 辅助函数：判断数据是否为空
 */
export function isEmptyUpdate(data: Partial<StatusBarData>): boolean {
  const hasShared = data.shared && Object.keys(data.shared).length > 0;
  const hasChars = data.characters && Object.keys(data.characters).length > 0;
  return !hasShared && !hasChars;
}
