import React, { useState, useMemo } from 'react';
import { StatusBarData, ItemDefinition, CategoryDefinition } from '../../../types';
import { LayoutNode } from '../../../types/layout';
import * as LucideIcons from 'lucide-react';
import { Search, Box, ChevronDown, Move, LayoutTemplate, Columns, Trash2, GripVertical, Plus } from 'lucide-react';
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
  DragOverEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import './LayoutComposer.css';

interface LayoutComposerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

// --- Component: Palette Item ---
const PaletteItem: React.FC<{ definition: ItemDefinition; type: 'item' | 'category'; label?: string; isOverlay?: boolean }> = ({ definition, type, label, isOverlay }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${definition.key}`,
        data: {
            type: type,
            key: definition.key,
            from: 'palette',
        },
    });
    
    const Icon = (LucideIcons as any)[definition.icon || 'Box'] || Box;
    const style = { opacity: isDragging ? 0.5 : 1, cursor: 'grab' };

    return (
        <div ref={setNodeRef} style={style} className={`palette-item ${isOverlay ? 'overlay' : ''}`} {...listeners} {...attributes}>
            <div className="palette-item__icon"><Icon size={16} /></div>
            <div className="palette-item__info">
                <div className="palette-item__name">{label || definition.name || definition.key}</div>
                <div className="palette-item__key">{type === 'category' ? '分类容器' : definition.key}</div>
            </div>
        </div>
    );
};

// --- Component: Layout Element (Row) ---
const LayoutRowDraggable: React.FC<{ 
    node: LayoutNode; 
    onDelete: (id: string) => void; 
    children: React.ReactNode;
    isOverlay?: boolean;
}> = ({ node, onDelete, children, isOverlay }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: node.id,
        data: { type: 'row', node },
    });

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

    return (
        <div ref={setNodeRef} style={style} className={`layout-row ${isOverlay ? 'overlay' : ''}`}>
            <div className="layout-row__handle" {...listeners} {...attributes} title="拖动行排序">
                <GripVertical size={16} />
            </div>
            <div className="layout-row__columns">
                {children}
            </div>
            <button className="layout-row__delete" onClick={() => onDelete(node.id)} title="删除整行">
                <Trash2 size={14} />
            </button>
        </div>
    );
};

// --- Component: Layout Column (Droppable) ---
const LayoutColumnDroppable: React.FC<{ 
    node: LayoutNode; 
    items: LayoutNode[];
    allDefinitions: { [key: string]: ItemDefinition };
    allCategories: { [key: string]: CategoryDefinition };
    onDeleteItem: (itemId: string) => void;
}> = ({ node, items, allDefinitions, allCategories, onDeleteItem }) => {
    const { setNodeRef } = useDroppable({
        id: node.id,
        data: { type: 'col', node },
    });

    return (
        <div ref={setNodeRef} className="layout-column" style={{ flex: node.props?.width ? `${node.props.width}%` : 1 }}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.length === 0 ? (
                    <div className="layout-column__empty">空列</div>
                ) : (
                    items.map(item => (
                        <LayoutItemSortable 
                            key={item.id} 
                            node={item} 
                            allDefinitions={allDefinitions} 
                            allCategories={allCategories}
                            onDelete={() => onDeleteItem(item.id)} 
                        />
                    ))
                )}
            </SortableContext>
        </div>
    );
};

// --- Component: Layout Item (Sortable inside Column) ---
const LayoutItemSortable: React.FC<{ 
    node: LayoutNode; 
    allDefinitions: { [key: string]: ItemDefinition };
    allCategories: { [key: string]: CategoryDefinition };
    onDelete: () => void;
    isOverlay?: boolean;
}> = ({ node, allDefinitions, allCategories, onDelete, isOverlay }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: node.id,
        data: { type: node.type, node },
    });

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
    
    let def: ItemDefinition | CategoryDefinition | undefined;
    let Icon = Box;
    let label = '';
    let subLabel = '';

    if (node.type === 'item' && node.data?.key) {
        def = allDefinitions[node.data.key];
        label = def?.name || node.data.key;
        subLabel = node.data.key;
        Icon = def?.icon ? (LucideIcons as any)[def.icon] || Box : Box;
    } else if (node.type === 'category' && node.data?.key) {
        def = allCategories[node.data.key];
        label = def?.name || node.data.key;
        subLabel = '分类容器';
        Icon = def?.icon ? (LucideIcons as any)[def.icon] || Box : LayoutTemplate;
    }

    return (
        <div ref={setNodeRef} style={style} className={`layout-item ${node.type} ${isOverlay ? 'overlay' : ''}`} {...attributes} {...listeners}>
            <div className="layout-item__content">
                <Icon size={14} className="layout-item__icon" />
                <div className="layout-item__text">
                    <span className="layout-item__name">{label}</span>
                    <span className="layout-item__key">{subLabel}</span>
                </div>
            </div>
            {!isOverlay && (
                <button className="layout-item__delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                    <Trash2 size={12} />
                </button>
            )}
        </div>
    );
};


// --- Main Component ---
const LayoutComposer: React.FC<LayoutComposerProps> = ({ data, onUpdate }) => {
    const [layout, setLayout] = useState<LayoutNode[]>(data.layout || []);
    const [activeDragData, setActiveDragData] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const toggleCat = (key: string) => {
        setExpandedCats(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    // Filter Items
    const { categories, itemsByCategory } = useMemo(() => {
        const sortedCats = (Object.values(data.categories) as CategoryDefinition[]).sort((a,b) => a.order - b.order);
        const grouped: Record<string, ItemDefinition[]> = {};
        const lowerSearch = search.toLowerCase();
        
        Object.values(data.item_definitions).forEach(def => {
            if (search && !def.key.toLowerCase().includes(lowerSearch) && !def.name?.toLowerCase().includes(lowerSearch)) return;
            const cat = def.defaultCategory || 'Other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(def);
        });
        
        return { categories: sortedCats, itemsByCategory: grouped };
    }, [data, search]);

    // Actions
    const addRow = (cols: number) => {
        const newCols: LayoutNode[] = Array.from({ length: cols }).map(() => ({
            id: uuidv4(),
            type: 'col',
            children: [],
            props: { width: Math.floor(100 / cols) }
        }));
        const newRow: LayoutNode = {
            id: uuidv4(),
            type: 'row',
            children: newCols
        };
        const newLayout = [...layout, newRow];
        setLayout(newLayout);
        onUpdate({ ...data, layout: newLayout });
    };

    const deleteNode = (id: string) => {
        // Recursive delete
        const filterNodes = (nodes: LayoutNode[]): LayoutNode[] => {
            return nodes.filter(n => n.id !== id).map(n => ({
                ...n,
                children: n.children ? filterNodes(n.children) : undefined
            }));
        };
        const newLayout = filterNodes(layout);
        setLayout(newLayout);
        onUpdate({ ...data, layout: newLayout });
    };

    // Drag Logic
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragData(event.active.data.current);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        // Logic for moving items BETWEEN columns during drag is complex.
        // For simplicity in this version, we handle reordering in DragEnd.
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragData(null);
        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;
        
        // 1. Reorder Rows
        if (activeData?.type === 'row' && overData?.type === 'row') {
            const oldIndex = layout.findIndex(n => n.id === active.id);
            const newIndex = layout.findIndex(n => n.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const newLayout = arrayMove(layout, oldIndex, newIndex);
                setLayout(newLayout);
                onUpdate({ ...data, layout: newLayout });
            }
            return;
        }

        // 2. Drop Item/Category from Palette to Column
        if (activeData?.from === 'palette' && (overData?.type === 'col' || overData?.type === 'item' || overData?.type === 'category')) {
            const targetColId = overData.type === 'col' ? over.id : findParentColId(layout, over.id);
            if (!targetColId) return;

            const newNode: LayoutNode = {
                id: uuidv4(),
                type: activeData.type, // item or category
                data: { key: activeData.key }
            };

            const newLayout = insertNodeIntoCol(layout, targetColId, newNode, over.id);
            setLayout(newLayout);
            onUpdate({ ...data, layout: newLayout });
            return;
        }

        // 3. Move Item between Columns or Reorder within Column
        if ((activeData?.type === 'item' || activeData?.type === 'category') && activeData.from !== 'palette') {
             const targetColId = overData?.type === 'col' ? over.id : findParentColId(layout, over.id);
             const sourceColId = findParentColId(layout, active.id);
             
             if (!targetColId || !sourceColId) return;

             // Remove from source, insert into target
             const newLayout = moveNode(layout, active.id, sourceColId, targetColId, over.id);
             setLayout(newLayout);
             onUpdate({ ...data, layout: newLayout });
        }
    };

    // Helpers
    const findParentColId = (nodes: LayoutNode[], itemId: string): string | null => {
        for (const row of nodes) {
            if (row.children) {
                for (const col of row.children) {
                    if (col.id === itemId) return col.id; // It is a col
                    if (col.children?.some(child => child.id === itemId)) return col.id;
                }
            }
        }
        return null;
    };

    const insertNodeIntoCol = (nodes: LayoutNode[], colId: string, newNode: LayoutNode, overId: string): LayoutNode[] => {
        return nodes.map(row => {
            if (!row.children) return row;
            const newCols = row.children.map(col => {
                if (col.id !== colId) return col;
                const newChildren = col.children ? [...col.children] : [];
                if (overId === colId) {
                    newChildren.push(newNode); // Append to end if dropped on col
                } else {
                    const index = newChildren.findIndex(c => c.id === overId);
                    if (index !== -1) newChildren.splice(index, 0, newNode);
                    else newChildren.push(newNode);
                }
                return { ...col, children: newChildren };
            });
            return { ...row, children: newCols };
        });
    };

    const moveNode = (nodes: LayoutNode[], itemId: string, sourceColId: string, targetColId: string, overId: string): LayoutNode[] => {
        let nodeToMove: LayoutNode | null = null;
        
        // 1. Extract
        const withoutNode = nodes.map(row => ({
            ...row,
            children: row.children?.map(col => {
                if (col.id !== sourceColId) return col;
                const childToMove = col.children?.find(c => c.id === itemId);
                if (childToMove) nodeToMove = childToMove;
                return { ...col, children: col.children?.filter(c => c.id !== itemId) || [] };
            })
        }));

        if (!nodeToMove) return nodes;

        // 2. Insert
        return insertNodeIntoCol(withoutNode, targetColId, nodeToMove, overId);
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
    };

    return (
        <div className="layout-composer">
            <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragStart={handleDragStart} 
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
            >
                <div className="layout-composer__palette">
                    <div className="palette-section">
                        <div className="palette-header">布局组件</div>
                        <div className="palette-grid">
                            <button className="palette-btn" onClick={() => addRow(1)}><Columns size={16}/> 1栏</button>
                            <button className="palette-btn" onClick={() => addRow(2)}><Columns size={16}/> 2栏</button>
                            <button className="palette-btn" onClick={() => addRow(3)}><Columns size={16}/> 3栏</button>
                        </div>
                    </div>
                    
                    <div className="palette-section flex-grow">
                        <div className="palette-header">
                            <span>数据组件</span>
                            <div className="palette-search"><Search size={12} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索..." /></div>
                        </div>
                        <div className="palette-content">
                            {categories.map(cat => (
                                <div key={cat.key} className="palette-category-group">
                                    <div className="palette-category-header" onClick={() => toggleCat(cat.key)}>
                                        <span>{cat.name}</span>
                                        <ChevronDown size={14} className={expandedCats.has(cat.key) ? 'rotate-180' : ''} />
                                    </div>
                                    {expandedCats.has(cat.key) && (
                                        <div className="palette-category-items">
                                            {/* Draggable Category Container */}
                                            <PaletteItem definition={cat as any} type="category" label={`[分类] ${cat.name}`} />
                                            {/* Draggable Individual Items */}
                                            {itemsByCategory[cat.key]?.map(def => (
                                                <PaletteItem key={def.key} definition={def} type="item" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="layout-composer__canvas">
                    <SortableContext items={layout.map(n => n.id)} strategy={verticalListSortingStrategy}>
                        {layout.length === 0 ? (
                            <div className="canvas-empty-state">
                                <LayoutTemplate size={48} />
                                <p>画布为空，请从左侧添加行或组件</p>
                            </div>
                        ) : (
                            <div className="canvas-rows">
                                {layout.map(row => (
                                    <LayoutRowDraggable key={row.id} node={row} onDelete={deleteNode}>
                                        {row.children?.map(col => (
                                            <LayoutColumnDroppable 
                                                key={col.id} 
                                                node={col} 
                                                items={col.children || []} 
                                                allDefinitions={data.item_definitions}
                                                allCategories={data.categories}
                                                onDeleteItem={deleteNode}
                                            />
                                        ))}
                                    </LayoutRowDraggable>
                                ))}
                            </div>
                        )}
                    </SortableContext>
                </div>

                <DragOverlay dropAnimation={dropAnimation} modifiers={[snapCenterToCursor]}>
                    {activeDragData ? (
                        activeDragData.from === 'palette' ? (
                            <PaletteItem 
                                definition={{ key: activeDragData.key } as any} 
                                type={activeDragData.type} 
                                isOverlay 
                                label={activeDragData.type === 'category' ? `[分类] ${activeDragData.key}` : activeDragData.key}
                            />
                        ) : activeDragData.type === 'row' ? (
                            <div className="layout-row overlay">Row Preview</div>
                        ) : (
                            <LayoutItemSortable 
                                node={activeDragData.node} 
                                allDefinitions={data.item_definitions} 
                                allCategories={data.categories}
                                onDelete={() => {}} 
                                isOverlay
                            />
                        )
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default LayoutComposer;