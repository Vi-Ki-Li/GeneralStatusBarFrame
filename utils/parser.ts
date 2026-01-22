import { ParsedUpdate, ItemDefinition, StatusBarItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 正则表达式定义 (支持 [角色^分类|键::值])
const REGEX_NEW_FORMAT = /\[([^^|::\[\]]+)\^([a-zA-Z0-9_-]+)\|([^^|::\[\]]+)::([^\]^::\[\]]*)\]/;
const REGEX_OLD_FORMAT = /\[([a-zA-Z0-9_-]+)\|(.*?)::(.*)\]/;

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
 * v6.6 Refactor: Definition-Driven Parsing
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
    let match = line.match(REGEX_NEW_FORMAT) || line.match(REGEX_OLD_FORMAT);
    
    if (!match) return;

    let isCharacterScoped = line.match(REGEX_NEW_FORMAT);
    const charName = isCharacterScoped ? match[1].trim() : null;
    const category = isCharacterScoped ? match[2].trim() : match[1].trim();
    const key = isCharacterScoped ? match[3].trim() : match[2].trim();
    const valueString = isCharacterScoped ? match[4].trim() : match[3].trim();

    if (!valueString.trim()) return;

    // --- Meta指令拦截 ---
    if (charName && (category.toLowerCase() === 'meta' || category.toLowerCase() === 'system')) {
      const boolVal = parseBoolean(valueString);
      if (boolVal !== undefined) {
        if (!result.meta) result.meta = {};
        if (!result.meta[charName]) result.meta[charName] = {};
        
        if (key.toLowerCase() === 'present' || key.toLowerCase() === 'visible') {
           result.meta[charName].isPresent = boolVal;
        }
      }
      return; // Meta指令不应作为数据条目
    }
    // ------------------

    const def = definitions[key];
    // FIX: Initialize `values` property to satisfy the type requirement.
    const item: Omit<StatusBarItem, 'values'> & { values: string[] | Array<Record<string, string>> } = {
      key,
      values: [],
      source_id: sourceMessageId,
      user_modified: false,
      originalLine: line,
      category,
      _uuid: uuidv4()
    };

    if (def?.type === 'list-of-objects') {
      const objectSeparator = def.separator || '|';
      const partSeparator = def.partSeparator || '@';
      const partKeys = def.structure?.parts.map(p => p.key) || [];

      if (partKeys.length > 0) {
        item.values = valueString.split(objectSeparator).map(objStr => {
          const parts = objStr.split(partSeparator);
          const obj: Record<string, string> = {};
          partKeys.forEach((partKey, index) => {
            obj[partKey] = (parts[index] || '').trim();
          });
          return obj;
        });
      } else {
        item.values = [valueString]; // Fallback if no structure defined
      }
    } else {
      const separator = def?.separator || '|';
      item.values = valueString.split(separator).map(v => v.trim());
    }
    
    if (charName) {
      if (!result.characters[charName]) result.characters[charName] = {};
      if (!result.characters[charName][category]) result.characters[charName][category] = [];
      result.characters[charName][category].push(item as StatusBarItem);
    } else {
      if (!result.shared[category]) result.shared[category] = [];
      result.shared[category].push(item as StatusBarItem);
    }
  });

  return result;
}