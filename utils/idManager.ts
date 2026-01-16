import { CharacterMap } from '../types';

/**
 * 生成一个新的唯一 ID
 */
export function generateCharacterId(prefix: string = 'char'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 根据名字查找 ID，如果不存在则创建新 ID 并更新映射
 * @returns { id: string, isNew: boolean }
 */
export function resolveCharacterId(
  map: CharacterMap, 
  name: string
): { id: string; isNew: boolean; updatedMap: CharacterMap } {
  
  // 1. 特殊处理 User
  if (name.toLowerCase() === 'user' || name === '{{user}}') {
    return { 
      id: 'char_user', 
      isNew: !map['char_user'], 
      updatedMap: { ...map, 'char_user': 'User' } 
    };
  }

  // 2. 查找现有 ID (反向查找: Value -> Key)
  const existingId = Object.keys(map).find(key => map[key] === name);
  if (existingId) {
    return { id: existingId, isNew: false, updatedMap: map };
  }

  // 3. 创建新 ID
  const newId = generateCharacterId();
  const newMap = { ...map, [newId]: name };
  
  return { id: newId, isNew: true, updatedMap: newMap };
}

/**
 * 根据 ID 获取名字
 */
export function getCharacterName(map: CharacterMap, id: string): string {
  if (id === 'char_user') return 'User';
  return map[id] || `Unknown(${id})`;
}