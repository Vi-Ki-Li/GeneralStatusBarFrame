import { StyleDefinition } from '../types';

/**
 * v8.2: 默认样式单元
 * 将旧的硬编码 Renderer CSS 转化为内置的、可供用户查看和复制的样式模板。
 * isDefault 标志用于在UI上区分它们。
 * v8.3 HTML模板注入：为每个默认样式添加了html模板，以支持新的模板渲染引擎。
 */
export const DEFAULT_STYLE_UNITS: (Omit<StyleDefinition, 'id'> & { id: string; isDefault: true })[] = [
    {
        id: 'default_numeric',
        name: '默认数值条',
        dataType: 'numeric',
        isDefault: true,
        html: `
{{progress_bar_html}}
<div class="numeric-renderer__value-group">
  <span class="numeric-renderer__value">{{current}}</span>
  {{max_html}}
  {{change_indicator_html}}
</div>`,
        css: `
.status-item-row--numeric .status-item-row__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  min-width: 0;
}
.numeric-renderer__progress-container {
  flex: 1;
  height: 8px;
  background: var(--bar-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
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
.status-item-row--numeric .status-item-row__content > .numeric-renderer__value-group:only-child {
  margin-left: auto;
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
}`
    },
    {
        id: 'default_array',
        name: '默认标签组',
        dataType: 'array',
        isDefault: true,
        html: `
<div class="array-renderer__tags-container">
  {{tags_html}}
</div>
<span class="array-renderer__count">{{count}} 项</span>`,
        css: `
.status-item-row--array .status-item-row__content {
  flex: 1;
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
  flex: 1;
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
}
.array-renderer__empty-text {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  font-style: italic;
}`
    },
    {
        id: 'default_text',
        name: '默认文本',
        dataType: 'text',
        isDefault: true,
        html: `<div class="text-renderer__value">{{value}}</div>`,
        css: `
.status-item-row--text-inline .status-item-row__content {
  flex: 1;
}
.status-item-row--text-block {
  flex-direction: column;
  align-items: flex-start;
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
  width: 100%;
}
.text-renderer__value:hover {
  color: var(--color-primary) !important;
}
.status-item-row--text-inline .text-renderer__value {
  text-align: right;
}
.status-item-row--text-block .text-renderer__value {
  text-align: left;
  background: var(--chip-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--chip-border);
}`
    },
    {
        id: 'default_object_list',
        name: '默认对象列表',
        dataType: 'list-of-objects',
        isDefault: true,
        html: `
<div class="object-list-renderer__header-content">
  <span class="object-list-renderer__count">{{count}} 项</span>
</div>
<div class="object-list-renderer__card-container">
  {{cards_html}}
</div>`,
        css: `
.status-item-row--list-of-objects {
  flex-direction: column;
  align-items: flex-start;
}
.status-item-row--list-of-objects .status-item-row__label {
  margin-bottom: 8px;
}
.status-item-row--list-of-objects .status-item-row__content {
  width: 100%;
}
.object-list-renderer__header-content {
  display: none; /* Count is now part of the label */
}
.object-list-renderer__card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-sm);
  width: 100%;
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
}`
    }
];
