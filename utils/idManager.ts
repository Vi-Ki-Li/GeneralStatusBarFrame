import { CharacterMap, StatusBarData } from '../types';

/**
 * 解析角色标识符 (ID First 策略)
 * @param map 当前的 ID 映射表
 * @param identifier 可能是 ID (char_001) 或 名字 (Eria)
 */
export function resolveCharacterId(
  map: CharacterMap, 
  identifier: string
): { id: string; isNew: boolean; updatedMap: CharacterMap } {
  
  // 1. 特殊处理 User
  if (identifier.toLowerCase() === 'user' || identifier === '{{user}}') {
    return { 
      id: 'char_user', 
      isNew: !map['char_user'], 
      updatedMap: { ...map, 'char_user': 'User' } 
    };
  }

  // 2. 检查 identifier 是否已经是存在的 ID (ID 优先匹配)
  // map 的结构是 { ID: Name }
  if (Object.prototype.hasOwnProperty.call(map, identifier)) {
    return { id: identifier, isNew: false, updatedMap: map };
  }

  // 3. 检查 identifier 是否是某个 ID 对应的 Name (兼容旧格式/反向查找)
  const existingId = Object.keys(map).find(key => map[key] === identifier);
  if (existingId) {
    return { id: existingId, isNew: false, updatedMap: map };
  }

  // 4. 视为全新 ID
  // 既然没匹配到 ID 也没匹配到名字，我们信任这个 identifier 就是新的 ID (例如来自 AI 的 [char_new^...])
  // 初始时，在 map 中将其显示名设为 ID 本身，后续通过 [CP|名字] 更新
  const newMap = { ...map, [identifier]: identifier };
  
  return { id: identifier, isNew: true, updatedMap: newMap };
}

/**
 * 基础映射获取 (Fallback)
 */
export function getCharacterName(map: CharacterMap, id: string): string {
  if (id === 'char_user') return 'User';
  return map[id] || id; // 如果没有映射，直接显示 ID
}

/**
 * 权威显示名称解析
 * 优先读取 SST 数据中的 [CP|名字] 条目，未找到才回退到映射表
 */
export function resolveDisplayName(data: StatusBarData, id: string): string {
  // 1. 尝试从角色数据中读取
  const charData = data.characters?.[id];
  if (charData) {
    const targetKeys = ['Name', '名字', '姓名', '角色名'];
    
    // Helper to search in a specific category
    const findInCat = (cat: string) => {
        const items = charData[cat];
        if (!items) return null;
        const found = items.find(item => targetKeys.includes(item.key) && item.values[0]);
        // FIX: Add type assertion to string because a name item should always have a string value.
        return found ? found.values[0] as string : null;
    };

    // 先查 CP
    let name = findInCat('CP');
    if (name) return name;
  }

  // 2. 回退到 ID 映射
  return getCharacterName(data.id_map, id);
}