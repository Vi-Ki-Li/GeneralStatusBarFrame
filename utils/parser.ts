import { ParsedUpdate } from '../types';

// 正则表达式定义 (支持 [角色^分类|键::值])
// 分类现在可以是任意字符串，不再限制枚举
const REGEX_NEW_FORMAT = /\[([^^|::\[\]]+)\^([a-zA-Z0-9_-]+)\|([^^|::\[\]]+)::([^\]^::\[\]]*)\]/;
const REGEX_OLD_FORMAT = /\[([a-zA-Z0-9_-]+)\|(.*?)::(.*)\]/;

/**
 * 解析值字符串
 */
function parseValues(valueString: string): string[] {
  // 目前简单的按 | 分割，后续可根据 Definitions 里的分隔符配置进行优化
  return valueString.split('|').map(v => v.trim());
}

/**
 * 解析状态栏文本
 * 注意：此时返回的结构中，characters 的键仍然是 Name，需要 Merger 阶段转换为 ID
 */
export function parseStatusBarText(text: string, sourceMessageId: number): ParsedUpdate {
  const result: ParsedUpdate = {
    shared: {},
    characters: {},
  };

  if (!text) return result;

  const lines = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

  lines.forEach(line => {
    // 1. 尝试匹配完整格式: [角色^分类|键::值]
    let match = line.match(REGEX_NEW_FORMAT);
    
    if (match) {
      const charName = match[1].trim();
      const category = match[2].trim();
      const key = match[3].trim();
      const valueString = match[4].trim();
      const values = parseValues(valueString);

      if (!result.characters[charName]) {
        result.characters[charName] = {};
      }
      if (!result.characters[charName][category]) {
        result.characters[charName][category] = [];
      }

      result.characters[charName][category].push({
        key,
        values,
        source_id: sourceMessageId,
        user_modified: false,
        originalLine: line,
        category
      });
      return;
    }

    // 2. 尝试匹配旧格式: [分类|键::值] (视为共享数据)
    match = line.match(REGEX_OLD_FORMAT);
    if (match) {
      const category = match[1].trim();
      const key = match[2].trim();
      const valueString = match[3].trim();
      const values = parseValues(valueString);

      // 所有的旧格式都归入 Shared，不再过滤是否是 ST/WP/MI
      // 定义驱动意味着我们接受任何分类
      if (!result.shared[category]) {
        result.shared[category] = [];
      }
      
      result.shared[category].push({
        key,
        values,
        source_id: sourceMessageId,
        user_modified: false,
        originalLine: line,
        category
      });
    }
  });

  return result;
}