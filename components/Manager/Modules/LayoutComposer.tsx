import React, { useState, useMemo } from 'react';
import { StatusBarData, ItemDefinition, CategoryDefinition } from '../../../types';
import * as LucideIcons from 'lucide-react';
// FIX: Import LayoutTemplate icon.
import { Search, Box, ChevronDown, Move, LayoutTemplate } from 'lucide-react';
import './LayoutComposer.css';

interface LayoutComposerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const PaletteItem: React.FC<{ definition: ItemDefinition }> = ({ definition }) => {
    const Icon = (LucideIcons as any)[definition.icon || 'Box'] || Box;
    return (
        <div className="palette-item">
            <div className="palette-item__grip">
                <Move size={14} />
            </div>
            <div className="palette-item__icon">
                <Icon size={16} />
            </div>
            <div className="palette-item__info">
                <div className="palette-item__name">{definition.name || definition.key}</div>
                {definition.name && <div className="palette-item__key">{definition.key}</div>}
            </div>
        </div>
    );
};

const PaletteCategory: React.FC<{
    category: CategoryDefinition,
    items: ItemDefinition[],
    isExpanded: boolean,
    onToggle: () => void
}> = ({ category, items, isExpanded, onToggle }) => {
    const Icon = (LucideIcons as any)[category.icon || 'Layers'] || Box;
    return (
        <div className="palette-category">
            <button className="palette-category__header" onClick={onToggle}>
                <div className="palette-category__title">
                    <Icon size={16} />
                    <span>{category.name}</span>
                </div>
                <div className="palette-category__meta">
                    <span className="palette-category__count">{items.length}</span>
                    <ChevronDown size={16} className={`palette-category__arrow ${isExpanded ? 'expanded' : ''}`} />
                </div>
            </button>
            {isExpanded && (
                <div className="palette-item-list animate-fade-in">
                    {items.map(def => <PaletteItem key={def.key} definition={def} />)}
                </div>
            )}
        </div>
    );
};


const LayoutComposer: React.FC<LayoutComposerProps> = ({ data, onUpdate }) => {
    const [search, setSearch] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const { categories, itemsByCategory } = useMemo(() => {
        const sortedCategories = (Object.values(data.categories) as CategoryDefinition[]).sort((a,b) => a.order - b.order);
        
        const groupedItems: { [key: string]: ItemDefinition[] } = {};
        const lowerSearch = search.toLowerCase();

        for (const def of Object.values(data.item_definitions) as ItemDefinition[]) {
            if (search && !(def.key.toLowerCase().includes(lowerSearch) || def.name?.toLowerCase().includes(lowerSearch))) {
                continue;
            }
            const catKey = def.defaultCategory || 'Other';
            if (!groupedItems[catKey]) {
                groupedItems[catKey] = [];
            }
            groupedItems[catKey].push(def);
        }
        
        // Filter categories that have items after search
        const finalCategories = sortedCategories.filter(cat => groupedItems[cat.key]?.length > 0);

        return { categories: finalCategories, itemsByCategory: groupedItems };
    }, [data.categories, data.item_definitions, search]);

    const handleToggleCategory = (key: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    return (
        <div className="layout-composer">
            <div className="layout-composer__palette">
                <div className="palette-header">
                    <div className="palette-search-wrapper">
                        <Search size={16} />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="搜索组件..."
                        />
                    </div>
                </div>
                <div className="palette-content">
                    {categories.map(cat => (
                        <PaletteCategory 
                            key={cat.key}
                            category={cat}
                            items={itemsByCategory[cat.key] || []}
                            isExpanded={expandedCategories.has(cat.key)}
                            onToggle={() => handleToggleCategory(cat.key)}
                        />
                    ))}
                </div>
            </div>
            <div className="layout-composer__canvas">
                <div className="canvas-placeholder">
                    <LayoutTemplate size={48} />
                    <h3>布局画布</h3>
                    <p>从左侧拖拽组件至此，<br />开始构建你的状态栏布局。</p>
                </div>
            </div>
        </div>
    );
};

export default LayoutComposer;