import React, { useState, useMemo } from 'react';
import { StatusBarData, ItemDefinition, CategoryDefinition } from '../../../types';
import { LayoutRow as LayoutRowData, LayoutItem as LayoutItemData } from '../../../types/layout';
import * as LucideIcons from 'lucide-react';
import { Search, Box, ChevronDown, Move, LayoutTemplate } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import LayoutRow from './LayoutRow';
import './LayoutComposer.css';

interface LayoutComposerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const PaletteItem: React.FC<{ definition: ItemDefinition; isOverlay?: boolean }> = ({ definition, isOverlay = false }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-item-${definition.key}`,
        data: {
            definition,
            from: 'palette',
        },
    });
    
    const Icon = (LucideIcons as any)[definition.icon || 'Box'] || Box;

    const style = {
        opacity: isDragging && !isOverlay ? 0.5 : 1,
        cursor: isOverlay ? 'grabbing' : 'grab',
    };

    return (
        <div ref={setNodeRef} style={style} className="palette-item">
            <div className="palette-item__grip" {...listeners} {...attributes}>
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
    const [layout, setLayout] = useState<LayoutRowData[]>([]);
    const [activeDragItem, setActiveDragItem] = useState<ItemDefinition | LayoutRowData | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const { setNodeRef: canvasDroppableRef } = useDroppable({
        id: 'canvas-droppable-area',
    });

    const { categories, itemsByCategory } = useMemo(() => {
        const sortedCategories = (Object.values(data.categories) as CategoryDefinition[]).sort((a,b) => a.order - b.order);
        
        const groupedItems: { [key: string]: ItemDefinition[] } = {};
        const lowerSearch = search.toLowerCase();

        for (const def of Object.values(data.item_definitions) as ItemDefinition[]) {
            if (search && !(def.key.toLowerCase().includes(lowerSearch) || def.name?.toLowerCase().includes(lowerSearch))) {
                continue;
            }
            const catKey = def.defaultCategory || 'Other';
            if (!groupedItems[catKey]) groupedItems[catKey] = [];
            groupedItems[catKey].push(def);
        }
        
        const finalCategories = sortedCategories.filter(cat => groupedItems[cat.key]?.length > 0);
        return { categories: finalCategories, itemsByCategory: groupedItems };
    }, [data.categories, data.item_definitions, search]);

    const handleToggleCategory = (key: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) newSet.delete(key);
            else newSet.add(key);
            return newSet;
        });
    };

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const itemData = active.data.current;
        if (itemData?.from === 'palette') {
            setActiveDragItem(itemData.definition as ItemDefinition);
        } else if (itemData?.from === 'canvas') {
            setActiveDragItem(itemData.row as LayoutRowData);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;
        
        const activeData = active.data.current;
        const overId = over.id;

        // --- Scenario 1: Drag from Palette to Canvas ---
        if (activeData?.from === 'palette' && overId === 'canvas-droppable-area') {
            const definition = activeData.definition as ItemDefinition;
            const newItem: LayoutItemData = { id: uuidv4(), key: definition.key };
            const newRow: LayoutRowData = { id: uuidv4(), items: [newItem] };
            setLayout(prev => [...prev, newRow]);
            return;
        }

        // --- Scenario 2: Reorder Rows in Canvas ---
        if (activeData?.from === 'canvas' && over.data.current?.from === 'canvas') {
            if (active.id !== over.id) {
                setLayout((items) => {
                    const oldIndex = items.findIndex(row => row.id === active.id);
                    const newIndex = items.findIndex(row => row.id === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                });
            }
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
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
                <div className="layout-composer__canvas" ref={canvasDroppableRef}>
                    {layout.length === 0 ? (
                        <div className="canvas-placeholder">
                            <LayoutTemplate size={48} />
                            <h3>布局画布</h3>
                            <p>从左侧拖拽组件至此，<br />开始构建你的状态栏布局。</p>
                        </div>
                    ) : (
                        <div className="canvas-content">
                            <SortableContext
                                items={layout.map(row => row.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {layout.map(row => <LayoutRow key={row.id} row={row} allDefinitions={data.item_definitions} />)}
                            </SortableContext>
                        </div>
                    )}
                </div>
            </div>
            <DragOverlay>
                {activeDragItem && (
                    'key' in activeDragItem
                    ? <PaletteItem definition={activeDragItem as ItemDefinition} isOverlay />
                    : <LayoutRow row={activeDragItem as LayoutRowData} allDefinitions={data.item_definitions} isOverlay />
                )}
            </DragOverlay>
        </DndContext>
    );
};

export default LayoutComposer;