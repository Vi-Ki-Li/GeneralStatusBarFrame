import { StyleDefinition } from '../types';

/**
 * v8.2: 默认样式单元
 * 将旧的硬编码 Renderer CSS 转化为内置的、可供用户查看和复制的样式模板。
 * isDefault 标志用于在UI上区分它们。
 */
export const DEFAULT_STYLE_UNITS: (Omit<StyleDefinition, 'id'> & { id: string; isDefault: true })[] = [
    {
        id: 'default_numeric',
        name: '默认数值条',
        dataType: 'numeric',
        isDefault: true,
        css: `
/* Numeric Renderer Specific */
.status-item-row--numeric {
  cursor: pointer;
  transition: background 0.2s;
  border-radius: var(--radius-sm);
  padding-right: var(--spacing-xs);
  padding-left: var(--spacing-xs);
  margin-left: calc(-1 * var(--spacing-xs));
  margin-right: calc(-1 * var(--spacing-xs));
  
  /* Change to column to support sub-row */
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}

.numeric-renderer__main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.status-item-row--numeric:hover {
  background: rgba(0,0,0,0.03);
}

body.dark-mode .status-item-row--numeric:hover {
  background: rgba(255,255,255,0.05);
}

.numeric-renderer__progress-container {
  flex: 1;
  margin: 0 var(--spacing-md);
  height: 8px;
  background: var(--bar-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.numeric-renderer__progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s var(--ease-out-back), background-color 0.3s ease;
}

.numeric-renderer__value-group {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 60px;
  justify-content: flex-end;
}

.numeric-renderer__value {
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
}

.numeric-renderer__value-max {
  color: var(--text-tertiary);
  font-size: 0.8em;
}

.numeric-renderer__change-indicator {
  font-size: var(--font-size-xs);
  padding: 1px 4px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}

/* --- Description & Reason Sub-row --- */
.numeric-renderer__sub-row {
  display: flex;
  gap: 6px;
  font-size: 0.75rem;
  padding-left: 2px;
  opacity: 0.8;
  align-items: center;
}

.numeric-renderer__description {
  color: var(--text-secondary);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.numeric-renderer__reason {
  color: var(--text-tertiary);
}

/* --- Grid Layout Overrides --- */
.layout--grid .status-item-row {
  border-bottom: none !important;
  background: rgba(0,0,0,0.02);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.layout--grid .status-item-row:hover {
  background: rgba(0,0,0,0.04);
  border-color: var(--chip-border);
}

.layout--grid .status-item-row__label {
  font-size: 0.8rem;
  opacity: 0.8;
}

.layout--grid .numeric-renderer__progress-container {
  width: 100%;
  margin: 4px 0;
}
        `
    },
    {
        id: 'default_array',
        name: '默认标签组',
        dataType: 'array',
        isDefault: true,
        css: `
/* Array Renderer Specific */
.status-item-row--array {
  display: block;
}

.array-renderer__header {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.array-renderer__count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.array-renderer__tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.array-renderer__tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  background: var(--chip-bg);
  border: 1px solid var(--chip-border);
  color: var(--text-primary);
  transition: var(--transition-fast);
  cursor: pointer;
}

.array-renderer__tag-chip:hover {
  transform: translateY(-1px);
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(var(--color-primary), 0.1);
}

.array-renderer__empty-text {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  font-style: italic;
}

/* Grid layout inherits from numeric */

/* --- Tags Layout Overrides --- */
.layout--tags .status-item-row {
  display: inline-flex;
  border-bottom: none !important;
  background: var(--chip-bg);
  border: 1px solid var(--chip-border);
  padding: 4px 10px;
  border-radius: var(--radius-md);
  width: auto;
  gap: var(--spacing-sm);
  margin-bottom: 0;
}

.layout--tags .status-item-row__label {
  min-width: 0;
  font-size: 0.8rem;
  margin-bottom: 0 !important;
}

.layout--tags .array-renderer__header {
  display: contents; /* Makes header elements part of the parent flex container */
}

.layout--tags .array-renderer__tags-container,
.layout--tags .array-renderer__count {
  display: none; /* Hide these in tag mode */
}
        `
    },
    {
        id: 'default_text',
        name: '默认文本',
        dataType: 'text',
        isDefault: true,
        css: `
/* Text Renderer Specific */
.status-item-row--text-inline {
  align-items: center;
  flex-direction: row;
}

.status-item-row--text-block {
  align-items: flex-start;
  flex-direction: column;
}

.status-item-row--text-block .status-item-row__label {
  margin-bottom: 4px;
  width: 100%;
}

.text-renderer__value {
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.5;
  cursor: pointer;
  transition: color 0.2s;
}

.text-renderer__value:hover {
  color: var(--color-primary) !important;
  text-decoration: underline;
}

.status-item-row--text-inline .text-renderer__value {
  text-align: right;
  width: auto;
}

.status-item-row--text-block .text-renderer__value {
  text-align: left;
  width: 100%;
  background: var(--chip-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--chip-border);
}
        `
    },
    {
        id: 'default_object_list',
        name: '默认对象列表',
        dataType: 'list-of-objects',
        isDefault: true,
        css: `
.status-item-row--object-list {
  display: block; /* Override flex from base class */
}

.object-list-renderer__header {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.object-list-renderer__count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.object-list-renderer__card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-sm);
}

.object-card {
  background: var(--chip-bg);
  border: 1px solid var(--chip-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.object-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.object-card__property {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  gap: var(--spacing-sm);
}

.object-card__label {
  color: var(--text-secondary);
  white-space: nowrap;
}

.object-card__value {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.object-list-renderer__empty-text {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  font-style: italic;
}
        `
    }
];
