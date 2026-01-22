import { ItemDefinition, LorebookEntry } from '../types';

/**
 * Generates the full content string for a lorebook entry based on a definition.
 */
export function generateLorebookContent(definition: ItemDefinition, categories: { [key: string]: any }): string {
    const { key, description, structure, separator, partSeparator, defaultCategory, type, name } = definition;
    const catDef = categories[defaultCategory || ''] || {};
    const catKey = catDef.key || defaultCategory || '';

    let valueExample = '';

    if (type === 'list-of-objects') { 
        const pSep = partSeparator || '@';
        if (structure?.parts && structure.parts.length > 0) {
            // FIX: Access 'key' property of the part object.
            valueExample = structure.parts.map(part => `{${part.key}}`).join(pSep);
        } else {
            valueExample = '{object_part_1}@{object_part_2}'; // Fallback
        }
        // Show an example of multiple objects
        const objSep = separator || '|';
        valueExample = `${valueExample}${objSep}${valueExample}`;
    } else if (structure?.parts && structure.parts.length > 0) {
        const sep = separator || (type === 'array' ? ',' : '|');
        // FIX: Access 'key' property of the part object.
        valueExample = structure.parts.map(part => `{${part.key}}`).join(sep);
    } else { 
        valueExample = type === 'array' ? `{${name || key}}` : `{${key}}`;
    }

    const formatLine = catKey && catKey !== 'Other' ? `[角色^${catKey}|${key}::${valueExample}]` : `[${catKey || '世界'}|${key}::${valueExample}]`;
    const descriptionLine = description ? `\n# 规则: ${description}` : '';
    
    return `${formatLine}${descriptionLine}`;
}

/**
 * Finds a lorebook entry based on matching rules and updates/creates it.
 */
export function findAndUpdateLorebookEntry(
  entries: LorebookEntry[],
  definition: ItemDefinition,
  newContent: string
): { updatedEntries: LorebookEntry[]; updatedEntry: LorebookEntry | null, status: 'created' | 'updated' | 'error' | 'no_change' } {
    const keyToMatch = definition.key;
    let targetIndex = -1;

    // Rule 1: Exact match on comment
    targetIndex = entries.findIndex(e => e.comment === keyToMatch);

    // Rule 2: Match comment after removing parentheses
    if (targetIndex === -1) {
        targetIndex = entries.findIndex(e => e.comment.replace(/\s*\(.*\)\s*/, '').trim() === keyToMatch);
    }

    const updatedEntries = [...entries];
    
    // Case 1: Update existing entry
    if (targetIndex !== -1) {
        if (updatedEntries[targetIndex].content === newContent) {
            return { updatedEntries, updatedEntry: updatedEntries[targetIndex], status: 'no_change' };
        }
        updatedEntries[targetIndex] = { ...updatedEntries[targetIndex], content: newContent };
        return { updatedEntries, updatedEntry: updatedEntries[targetIndex], status: 'updated' };
    }

    // Case 2: Create new entry
    const maxUid = Math.max(...entries.map(e => e.uid), 0);
    const newEntry: LorebookEntry = {
        uid: maxUid + 1,
        key: [],
        keysecondary: [],
        comment: keyToMatch,
        content: newContent,
        enabled: true,
        position: entries.length,
    };
    updatedEntries.push(newEntry);

    return { updatedEntries, updatedEntry: newEntry, status: 'created' };
}