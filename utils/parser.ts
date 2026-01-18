
import { ParsedUpdate, ItemDefinition } from '../types';

// 正则表达式定义 (支持 [角色^分类|键::值])
const REGEX_NEW_FORMAT = /\[([^^|::\[\]]+)\^([a-zA-Z0-9_-]+)\|([^^|::\[\]]+)::([^\]^::\[\]]*)\]/;
const REGEX_OLD_FORMAT = /\[([a-zA-Z0-9_-]+)\|(.*?)::(.*)\]/;

/**
 * 解析值字符串
 * @param valueString 原始值字符串
 * @param separator 自定义分隔符 (默认为 |)
 */
function parseValues(valueString: string, separator: string = '|'): string[] {
  if (!separator) separator = '|';
  return valueString.split(separator).map(v => v.trim());
}

/**
 * 解析布尔值
 */
function parseBoolean(val: string): boolean | undefined {
  const lower = val.toLowerCase().trim();
  if (['true', 'on', 'yes', '1'].includes(lower)) return true;
  if (['false', 'off', 'no', '0'].includes(lower)) return false;
  return undefined;
}

/**
 * 解析状态栏文本
 * v6.2: 需要传入 definitions 以支持自定义分隔符
 * v6.3: 支持 Meta 指令解析
 * v6.4: Meta 指令现在同时作为数据条目穿透
 */
export function parseStatusBarText(
  text: string, 
  sourceMessageId: number,
  definitions: { [key: string]: ItemDefinition } = {}
): ParsedUpdate {
  const result: ParsedUpdate = {
    shared: {},
    characters: {},
    meta: {}
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

      // --- Meta指令拦截 (v6.4: 不再 Return，而是继续执行) ---
      if (category.toLowerCase() === 'meta' || category.toLowerCase() === 'system') {
        const boolVal = parseBoolean(valueString);
        if (boolVal !== undefined) {
          if (!result.meta) result.meta = {};
          if (!result.meta[charName]) result.meta[charName] = {};
          
          if (key.toLowerCase() === 'present' || key.toLowerCase() === 'visible') {
             result.meta[charName].isPresent = boolVal;
          }
        }
        // 注意：此处不再 return，允许 Meta 数据作为普通条目进入 result.characters
      }
      // ------------------

      // 查找定义以获取分隔符
      const def = definitions[key];
      const separator = def?.separator || '|';
      const values = parseValues(valueString, separator);

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

      const def = definitions[key];
      const separator = def?.separator || '|';
      const values = parseValues(valueString, separator);

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
