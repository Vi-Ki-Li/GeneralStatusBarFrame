import { StyleDefinition } from '../types';

/**
 * v9.0: Default Style Units
 * High-quality, theme-aware default styles for fallback rendering.
 * REFACTOR NOTE: These now include the label structure explicitly.
 */
export const DEFAULT_STYLE_UNITS: (Omit<StyleDefinition, 'id'> & { id: string; isDefault: true })[] = [
    {
        id: 'default_numeric',
        name: '默认数值条',
        dataType: 'numeric',
        isDefault: true,
        html: `
<div class="status-item-row__label" data-target-selector=".status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    {{progress_bar_html}}
    <div class="numeric-renderer__value-group" data-target-selector=".numeric-renderer__value-group">
      {{value_html}}
      {{max_html}}
      {{change_indicator_html}}
    </div>
    {{sub_row_html}}
</div>`,
        css: `
.status-item-row--numeric .status-item-row__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.numeric-renderer__progress-container {
  width: 100%;
  height: 6px;
  background: var(--bar-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.numeric-renderer__progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s var(--ease-out-back), background-color 0.3s ease;
  background-color: var(--dynamic-bar-color, var(--color-primary));
}
.numeric-renderer__value-group {
  display: flex;
  align-items: baseline;
  gap: 6px;
  width: 100%;
  justify-content: flex-end;
}
.numeric-renderer__value {
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  color: var(--text-primary);
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
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: right;
  width: 100%;
}`
    },
    {
        id: 'default_array',
        name: '默认标签组',
        dataType: 'array',
        isDefault: true,
        html: `
<div class="status-item-row__label" data-target-selector=".status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="array-renderer__tags-container" data-target-selector=".array-renderer__tags-container">
      {{tags_html}}
    </div>
</div>`,
        css: `
.array-renderer__tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  flex: 1;
}
.array-renderer__tag-chip {
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  background: var(--chip-bg);
  border: 1px solid var(--chip-border);
  color: var(--text-secondary);
  transition: var(--transition-fast);
  cursor: pointer;
}
.array-renderer__tag-chip:hover {
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
        html: `
<div class="status-item-row__label" data-target-selector=".status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="text-renderer__value" data-target-selector=".text-renderer__value">{{value}}</div>
</div>`,
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
}
.text-renderer__value {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  width: 100%;
  transition: color 0.2s;
}
.text-renderer__value:hover {
  color: var(--text-primary);
}
.status-item-row--text-inline .text-renderer__value {
  text-align: right;
}
.status-item-row--text-block .text-renderer__value {
  text-align: left;
  background: var(--chip-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);
}`
    },
    {
        id: 'default_object_list',
        name: '默认对象列表',
        dataType: 'list-of-objects',
        isDefault: true,
        html: `
<div class="status-item-row__label" data-target-selector=".status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="object-list-renderer__card-container" data-target-selector=".object-list-renderer__card-container">{{cards_html}}</div>
</div>`,
        css: `
.status-item-row--list-of-objects {
  flex-direction: column;
  align-items: flex-start;
}
.status-item-row--list-of-objects .status-item-row__content {
  width: 100%;
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