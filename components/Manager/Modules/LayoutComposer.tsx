
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StatusBarData, ItemDefinition, CategoryDefinition, StatusBarItem } from '../../../types';
import { LayoutNode, LayoutSnapshot } from '../../../types/layout';
import StyledItemRenderer from '../../StatusBar/Renderers/StyledItemRenderer';
import LayoutInspector from './LayoutInspector';
import DraggablePanel from '../../Shared/DraggablePanel';
import ContextHelpButton from '../../Shared/ContextHelpButton';
import * as LucideIcons from 'lucide-react';
import { Search, Box, ChevronDown, Move, LayoutTemplate, Columns, Trash2, GripVertical, Plus, PlusCircle, Layout, ArrowDownToLine, X as XIcon, Save, Download, FileJson, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen, BringToFront, Settings } from 'lucide-react';
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
import { useToast } from '../../Toast/ToastContext';
import '../ManagerLayout.css';
import './LayoutComposer.css';

interface LayoutComposerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  isMobile: boolean;
}

interface DragDataState {
    from?: string;
    key?: string;
    type?: string;
    node?: LayoutNode;
}

const CREATE_ROW_ZONE_ID = 'layout-create-row-zone';
const LAYOUT_SNAPSHOTS_KEY = 'th_layout_snapshots_v1';

// ... (getPreviewItem helper) ...
const getPreviewItem = (def: ItemDefinition, data: StatusBarData): StatusBarItem => {
    if (data.shared) {
        for (const catKey in data.shared) {
            const found = data.shared[catKey].find(i => i.key === def.key);
            if (found) return found;
        }
    }
    if (data.characters) {
        const charKeys = Object.keys(data.characters);
        for (const charId of charKeys) {
            const charData = data.characters[charId];
            for (const catKey in charData) {
                const found = charData[catKey].find(i => i.key === def.key);
                if (found) return found;
            }
        }
    }
    const mockItem: StatusBarItem = {
        key: def.key,
        values: [],
        category: def.defaultCategory || 'Mock',
        source_id: 0,
        user_modified: false,
        _uuid: `preview-${def.key}`
    };
    if (def.type === 'numeric') {
        const parts = def.structure?.parts || [];
        const values = new Array(parts.length).fill('');
        const setVal = (k: string, v: string) => {
            const idx = parts.findIndex(p => p.key === k);
            if (idx > -1) values[idx] = v;
        };
        if (parts.length > 0) {
            setVal('current', '75');
            setVal('max', '100');
            setVal('change', '-5');
            setVal('reason', '战斗');
            setVal('description', '轻伤');
        } else {
            mockItem.values = ['75', '100'];
            return mockItem;
        }
        mockItem.values = values;
    } else if (def.type === 'array') {
        mockItem.values = ['标签 A', '标签 B'];
    } else if (def.type === 'list-of-objects') {
        const obj1: Record<string, string> = {};
        const obj2: Record<string, string> = {};
        (def.structure?.parts || []).forEach(p => {
            obj1[p.key] = `示例${p.label}`;
            obj2[p.key] = `示例${p.label}2`;
        });
        mockItem.values = [obj1, obj2];
    } else {
        mockItem.values = ['预览文本内容...'];
    }
    return mockItem;
};

// ... (PaletteItem component) ...
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
    const style = { opacity: isDragging ? 0.5 : 1, cursor: 'grab', touchAction: 'none' as const };

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

// ... (LayoutCreatorZone) ...
const LayoutCreatorZone: React.FC = () => {
    const { setNodeRef, isOver } = useDroppable({
        id: CREATE_ROW_ZONE_ID,
        data: { type: 'creator_zone' }
    });

    return (
        <div ref={setNodeRef} className={`layout-composer__drop-zone ${isOver ? 'active' : ''}`}>
            <ArrowDownToLine size={24} />
            <span>拖拽组件至此创建新行</span>
        </div>
    );
};

// ... (ColumnResizer) ...
const ColumnResizer: React.FC<{ onResize: (deltaPercent: number) => void }> = ({ onResize }) => {
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        let lastX = e.clientX;
        const parentElement = (e.target as HTMLElement).parentElement;
        const parentWidth = parentElement?.offsetWidth || 1000;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const deltaPixels = currentX - lastX;
            if (deltaPixels === 0) return;
            const deltaPercent = (deltaPixels / parentWidth) * 100;
            onResize(deltaPercent);
            lastX = currentX;
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };

        document.body.style.cursor = 'col-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="layout-resizer" onMouseDown={handleMouseDown} />
    );
};

// ... (LayoutRowDraggable) ...
const LayoutRowDraggable: React.FC<{ 
    node: LayoutNode; 
    onSelect: (e: React.MouseEvent) => void;
    isSelected: boolean;
    children: React.ReactNode;
    isOverlay?: boolean;
    onDelete: () => void;
}> = ({ node, onSelect, isSelected, children, isOverlay, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: node.id,
        data: { type: 'row', node },
    });

    const style: React.CSSProperties = { 
        transform: CSS.Transform.toString(transform), 
        transition, 
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none',
        ...(node.props?.style || {})
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`layout-row ${isOverlay ? 'overlay' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
        >
            <div className="layout-row__handle" {...listeners} {...attributes} title="拖动行排序">
                <GripVertical size={16} />
            </div>
            {!isOverlay && (
                <button 
                    className="layout-hover-delete row-delete" 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    onPointerDown={(e) => e.stopPropagation()} 
                    title="删除行"
                >
                    <XIcon size={14} />
                </button>
            )}
            <div className="layout-row__columns">
                {children}
            </div>
        </div>
    );
};

// ... (LayoutColumnDroppable) ...
const LayoutColumnDroppable: React.FC<{ 
    node: LayoutNode; 
    items: LayoutNode[];
    allDefinitions: { [key: string]: ItemDefinition };
    allCategories: { [key: string]: CategoryDefinition };
    data: StatusBarData;
    selectedId: string | null;
    onSelectNode: (id: string) => void;
    isGlobalDragging: boolean;
    onSetSplitIntent: (intent: { colId: string, side: 'left' | 'right' } | null) => void;
    splitIntent: { colId: string, side: 'left' | 'right' } | null;
    onDelete: () => void;
    onDeleteItem: (itemId: string) => void;
}> = ({ node, items, allDefinitions, allCategories, data, selectedId, onSelectNode, isGlobalDragging, onSetSplitIntent, splitIntent, onDelete, onDeleteItem }) => {
    const { setNodeRef } = useDroppable({
        id: node.id,
        data: { type: 'col', node },
    });

    const isSelected = selectedId === node.id;
    const style: React.CSSProperties = { 
        flex: node.props?.width ? `${node.props.width}%` : 1,
        ...(node.props?.style || {})
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isGlobalDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = offsetX / rect.width;

        if (percent < 0.2) {
            if (splitIntent?.colId !== node.id || splitIntent?.side !== 'left') {
                onSetSplitIntent({ colId: node.id, side: 'left' });
            }
        } else if (percent > 0.8) {
            if (splitIntent?.colId !== node.id || splitIntent?.side !== 'right') {
                onSetSplitIntent({ colId: node.id, side: 'right' });
            }
        } else {
            if (splitIntent?.colId === node.id) {
                onSetSplitIntent(null);
            }
        }
    };

    const handleMouseLeave = () => {
        if (isGlobalDragging && splitIntent?.colId === node.id) {
            onSetSplitIntent(null);
        }
    };

    const isSplitTarget = splitIntent?.colId === node.id;

    return (
        <div 
            ref={setNodeRef} 
            className={`layout-column ${isSelected ? 'selected' : ''}`} 
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node.id);
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {isSplitTarget && splitIntent?.side === 'left' && <div className="layout-column__split-indicator left" />}
            {isSplitTarget && splitIntent?.side === 'right' && <div className="layout-column__split-indicator right" />}
            
            <button 
                className="layout-hover-delete col-delete" 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                onPointerDown={(e) => e.stopPropagation()}
                title="删除列"
            >
                <Trash2 size={12} />
            </button>

            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.length === 0 ? (
                    <div className="layout-column__empty">空列 - 拖拽组件至此</div>
                ) : (
                    items.map(item => (
                        <LayoutItemSortable 
                            key={item.id} 
                            node={item} 
                            allDefinitions={allDefinitions} 
                            allCategories={allCategories}
                            data={data}
                            isSelected={selectedId === item.id}
                            onSelect={(e) => {
                                e.stopPropagation();
                                onSelectNode(item.id);
                            }}
                            onDelete={() => onDeleteItem(item.id)}
                        />
                    ))
                )}
            </SortableContext>
        </div>
    );
};

// ... (LayoutItemSortable) ...
const LayoutItemSortable: React.FC<{ 
    node: LayoutNode; 
    allDefinitions: { [key: string]: ItemDefinition };
    allCategories: { [key: string]: CategoryDefinition };
    data: StatusBarData;
    isSelected?: boolean;
    onSelect?: (e: React.MouseEvent) => void;
    isOverlay?: boolean;
    onDelete?: () => void;
}> = ({ node, allDefinitions, allCategories, data, isSelected, onSelect, isOverlay, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: node.id,
        data: { type: node.type, node },
    });

    const style: React.CSSProperties = { 
        transform: CSS.Transform.toString(transform), 
        transition, 
        opacity: isDragging ? 0.6 : 1,
        touchAction: 'none',
        ...(node.props?.style || {})
    };
    
    const renderContent = () => {
        if (node.type === 'item' && node.data?.key) {
            const def = allDefinitions[node.data.key];
            if (!def) return <div className="palette-item">未知组件: {node.data.key}</div>;
            const previewItem = getPreviewItem(def, data);
            return (
                <StyledItemRenderer 
                    item={previewItem} 
                    definition={def} 
                    onInteract={() => {}}
                />
            );
        } 
        
        if (node.type === 'category' && node.data?.key) {
            const def = allCategories[node.data.key];
            const Icon = def?.icon ? (LucideIcons as any)[def.icon] || LayoutTemplate : LayoutTemplate;
            return (
                <div className="layout-category-placeholder">
                    <div className="layout-category-placeholder__info">
                        <Icon size={18} className="layout-category-placeholder__icon" />
                        <span>{def?.name || node.data.key} (分类)</span>
                    </div>
                </div>
            );
        }
        return <div>未知节点</div>;
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`layout-item-wrapper ${isOverlay ? 'overlay' : ''} ${isSelected ? 'selected' : ''}`} 
            {...attributes} 
            {...listeners}
            onClick={onSelect}
        >
            {renderContent()}
            {!isOverlay && onDelete && (
                <button 
                    className="layout-hover-delete item-delete" 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    onPointerDown={(e) => e.stopPropagation()} 
                    title="移除组件"
                >
                    <XIcon size={12} />
                </button>
            )}
        </div>
    );
};

// ... (SnapshotManagerModal) ...
const SnapshotManagerModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onLoad: (layout: LayoutNode[]) => void; 
    currentLayout: LayoutNode[] 
}> = ({ isOpen, onClose, onLoad, currentLayout }) => {
    const [snapshots, setSnapshots] = useState<LayoutSnapshot[]>([]);
    const [newName, setNewName] = useState('');
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem(LAYOUT_SNAPSHOTS_KEY);
            setSnapshots(stored ? JSON.parse(stored) : []);
            setNewName('');
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!newName.trim()) return;
        const newSnapshot: LayoutSnapshot = {
            id: uuidv4(),
            name: newName.trim(),
            layout: currentLayout,
            timestamp: Date.now(),
        };
        const updated = [...snapshots, newSnapshot];
        setSnapshots(updated);
        localStorage.setItem(LAYOUT_SNAPSHOTS_KEY, JSON.stringify(updated));
        setNewName('');
        toast.success('布局快照已保存');
    };

    const handleDelete = (id: string) => {
        const updated = snapshots.filter(s => s.id !== id);
        setSnapshots(updated);
        localStorage.setItem(LAYOUT_SNAPSHOTS_KEY, JSON.stringify(updated));
    };

    const handleLoad = (layout: LayoutNode[]) => {
        if (confirm("加载快照将覆盖当前布局，确定吗？")) {
            onLoad(layout);
            onClose();
            toast.success('布局已加载');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="layout-snapshot-modal-overlay" onClick={onClose}>
            <div className="layout-snapshot-modal glass-panel" onClick={e => e.stopPropagation()}>
                <div className="layout-snapshot-header">
                    <h3>布局快照管理</h3>
                    <button onClick={onClose}><XIcon size={20}/></button>
                </div>
                
                <div className="layout-snapshot-save-row">
                    <input 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                        placeholder="新快照名称..." 
                        className="layout-snapshot-input"
                    />
                    <button onClick={handleSave} disabled={!newName.trim()} className="btn btn--primary">
                        <Save size={16} /> 保存当前
                    </button>
                </div>

                <div className="layout-snapshot-list">
                    {snapshots.length === 0 ? (
                        <div className="layout-snapshot-empty">暂无保存的布局</div>
                    ) : (
                        snapshots.map(s => (
                            <div key={s.id} className="layout-snapshot-item">
                                <div className="layout-snapshot-info">
                                    <span className="name">{s.name}</span>
                                    <span className="date">{new Date(s.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="layout-snapshot-actions">
                                    <button onClick={() => handleLoad(s.layout)} className="btn btn--ghost" title="加载"><Download size={16}/></button>
                                    <button onClick={() => handleDelete(s.id)} className="btn btn--ghost delete" title="删除"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---
const LayoutComposer: React.FC<LayoutComposerProps> = ({ data, onUpdate, isMobile }) => {
    const [layout, setLayout] = useState<LayoutNode[]>(data.layout || []);
    const [activeDragData, setActiveDragData] = useState<DragDataState | null>(null);
    const [search, setSearch] = useState('');
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [dragSplitIntent, setDragSplitIntent] = useState<{ colId: string, side: 'left' | 'right' } | null>(null);
    const [showSnapshotModal, setShowSnapshotModal] = useState(false);
    
    // UI State for Panels
    // Fix: Default leftOpen based on device
    const [leftOpen, setLeftOpen] = useState(!isMobile);
    const [inspectorMode, setInspectorMode] = useState<'docked' | 'floating' | 'hidden'>('docked');
    
    // Initialize inspector mode based on screen width
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1000) {
                if (inspectorMode === 'docked') setInspectorMode('hidden');
            } else {
                if (inspectorMode === 'hidden') setInspectorMode('docked');
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mobile override
    useEffect(() => {
        if (isMobile) {
            setInspectorMode('hidden');
            setLeftOpen(false); // Default close on mobile start
        }
    }, [isMobile]);

    // Auto-open inspector when selecting a node (if hidden)
    useEffect(() => {
        if (selectedNodeId && inspectorMode === 'hidden') {
            setInspectorMode('floating');
        }
    }, [selectedNodeId]);
    
    useEffect(() => {
        if (data.layout) setLayout(data.layout);
    }, [data.layout]);

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

    const { categories, itemsByCategory } = useMemo(() => {
        const sortedCats = (Object.values(data.categories) as CategoryDefinition[]).sort((a,b) => a.order - b.order);
        const lowerSearch = search.toLowerCase();
        
        const filteredCategories: CategoryDefinition[] = [];
        const filteredItemsByCat: Record<string, ItemDefinition[]> = {};

        sortedCats.forEach(cat => {
            const allDefinitions = Object.values(data.item_definitions) as ItemDefinition[];
            const catItems = allDefinitions.filter(def => {
                const itemCat = def.defaultCategory || 'Other';
                return itemCat === cat.key;
            });

            const matchingItems = catItems.filter(def => 
                !search || 
                def.key.toLowerCase().includes(lowerSearch) || 
                (def.name && def.name.toLowerCase().includes(lowerSearch))
            );

            const catNameMatches = cat.name.toLowerCase().includes(lowerSearch) || cat.key.toLowerCase().includes(lowerSearch);

            if (!search || catNameMatches || matchingItems.length > 0) {
                filteredCategories.push(cat);
                filteredItemsByCat[cat.key] = matchingItems;
            }
        });
        
        return { categories: filteredCategories, itemsByCategory: filteredItemsByCat };
    }, [data, search]);

    const allDefinitionsMap = useMemo(() => {
        const map: {[key:string]: ItemDefinition} = {};
        (Object.values(data.item_definitions) as ItemDefinition[]).forEach(d => map[d.key] = d);
        return map;
    }, [data.item_definitions]);

    const findNodeById = (nodes: LayoutNode[], id: string): LayoutNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const findParentId = (nodes: LayoutNode[], childId: string): string | null => {
        for (const node of nodes) {
            if (node.children?.some(c => c.id === childId)) return node.id;
            if (node.children) {
                const found = findParentId(node.children, childId);
                if (found) return found;
            }
        }
        return null;
    };

    const updateLayout = (newLayout: LayoutNode[]) => {
        setLayout(newLayout);
        onUpdate({ ...data, layout: newLayout });
    };

    const deleteNode = (id: string) => {
        const filterNodes = (nodes: LayoutNode[]): LayoutNode[] => {
            return nodes.filter(n => n.id !== id).map(n => ({
                ...n,
                children: n.children ? filterNodes(n.children) : undefined
            }));
        };
        const newLayout = filterNodes(layout);
        updateLayout(newLayout);
        if (selectedNodeId === id) setSelectedNodeId(null);
    };

    const handleNodeUpdate = (id: string, updates: Partial<LayoutNode>) => {
        const updateRecursive = (nodes: LayoutNode[]): LayoutNode[] => {
            return nodes.map(node => {
                if (node.id === id) {
                    return { ...node, ...updates };
                }
                if (node.children) {
                    return { ...node, children: updateRecursive(node.children) };
                }
                return node;
            });
        };
        updateLayout(updateRecursive(layout));
    };

    const addColumnToRow = (rowId: string) => {
        const newLayout = layout.map(row => {
            if (row.id !== rowId) return row;
            const currentCols = row.children || [];
            const newCol: LayoutNode = {
                id: uuidv4(),
                type: 'col',
                children: [],
                props: { width: 100 / (currentCols.length + 1) }
            };
            const newChildren = [...currentCols, newCol].map(c => ({
                ...c,
                props: { ...c.props, width: 100 / (currentCols.length + 1) }
            }));
            return { ...row, children: newChildren };
        });
        updateLayout(newLayout);
    };

    const removeColumnFromRow = (rowId: string) => {
        const newLayout = layout.map(row => {
            if (row.id !== rowId) return row;
            const currentCols = row.children || [];
            if (currentCols.length <= 1) return row;
            
            const newChildren = currentCols.slice(0, -1).map(c => ({
                ...c,
                props: { ...c.props, width: 100 / (currentCols.length - 1) }
            }));
            return { ...row, children: newChildren };
        });
        updateLayout(newLayout);
    };

    const handleColumnResize = (rowId: string, leftColIndex: number, deltaPercent: number) => {
        setLayout(prevLayout => {
            const newLayout = _.cloneDeep(prevLayout);
            const row = newLayout.find(r => r.id === rowId);
            if (!row || !row.children) return prevLayout;

            const leftCol = row.children[leftColIndex];
            const rightCol = row.children[leftColIndex + 1];

            if (leftCol && rightCol) {
                if (!leftCol.props) leftCol.props = {};
                if (!rightCol.props) rightCol.props = {};
                
                const currentLeftWidth = leftCol.props.width || (100 / row.children.length);
                const currentRightWidth = rightCol.props.width || (100 / row.children.length);

                const newLeftWidth = Math.max(10, currentLeftWidth + deltaPercent);
                const newRightWidth = Math.max(10, currentRightWidth - deltaPercent);

                if (newLeftWidth >= 10 && newRightWidth >= 10) {
                    leftCol.props.width = newLeftWidth;
                    rightCol.props.width = newRightWidth;
                }
            }
            onUpdate({ ...data, layout: newLayout }); 
            return newLayout;
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragData(event.active.data.current as DragDataState);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragData(null);
        const currentSplitIntent = dragSplitIntent;
        setDragSplitIntent(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;
        
        if (activeData?.from === 'palette' && over.id === CREATE_ROW_ZONE_ID) {
            const newItemNode: LayoutNode = {
                id: uuidv4(),
                type: activeData.type,
                data: { key: activeData.key }
            };
            const newCol: LayoutNode = {
                id: uuidv4(),
                type: 'col',
                children: [newItemNode],
                props: { width: 100 }
            };
            const newRow: LayoutNode = {
                id: uuidv4(),
                type: 'row',
                children: [newCol],
                props: { style: { gap: '8px' } }
            };
            
            const newLayout = [...layout, newRow];
            updateLayout(newLayout);
            setSelectedNodeId(newRow.id);
            return;
        }

        if (currentSplitIntent) {
            const { colId, side } = currentSplitIntent;
            let nodeToInsert: LayoutNode;
            
            if (activeData?.from === 'palette') {
                nodeToInsert = {
                    id: uuidv4(),
                    type: activeData.type,
                    data: { key: activeData.key }
                };
            } else if (activeData?.type === 'item' || activeData?.type === 'category') {
                const sourceColId = findParentId(layout, active.id as string);
                if (!sourceColId) return;
                const sourceRow = layout.find(r => r.children?.some(c => c.id === sourceColId));
                const sourceCol = sourceRow?.children?.find(c => c.id === sourceColId);
                const item = sourceCol?.children?.find(c => c.id === active.id);
                if (item) {
                    nodeToInsert = { ...item };
                } else {
                    return;
                }
            } else {
                return;
            }

            const performSplit = (nodes: LayoutNode[]): LayoutNode[] => {
                let processedNodes = nodes;
                if (activeData?.from !== 'palette') {
                     processedNodes = nodes.map(row => ({
                        ...row,
                        children: row.children?.map(col => ({
                            ...col,
                            children: col.children?.filter(c => c.id !== active.id) || []
                        }))
                    }));
                }

                return processedNodes.map(row => {
                    const targetColIndex = row.children?.findIndex(c => c.id === colId);
                    if (targetColIndex === undefined || targetColIndex === -1 || !row.children) return row;

                    const targetCol = row.children[targetColIndex];
                    const currentWidth = targetCol.props?.width || (100 / row.children.length);
                    const halfWidth = currentWidth / 2;
                    
                    const updatedTargetCol = { ...targetCol, props: { ...targetCol.props, width: halfWidth } };
                    const newCol: LayoutNode = { 
                        id: uuidv4(), 
                        type: 'col', 
                        children: [nodeToInsert], 
                        props: { width: halfWidth } 
                    };

                    const newChildren = [...row.children];
                    if (side === 'left') {
                        newChildren.splice(targetColIndex, 1, newCol, updatedTargetCol);
                    } else {
                        newChildren.splice(targetColIndex, 1, updatedTargetCol, newCol);
                    }
                    return { ...row, children: newChildren };
                });
            };

            const newLayout = performSplit(layout);
            updateLayout(newLayout);
            setSelectedNodeId(nodeToInsert.id);
            return;
        }

        if (activeData?.type === 'row' && overData?.type === 'row') {
            const oldIndex = layout.findIndex(n => n.id === active.id);
            const newIndex = layout.findIndex(n => n.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const newLayout = arrayMove(layout, oldIndex, newIndex);
                updateLayout(newLayout);
            }
            return;
        }

        if (activeData?.from === 'palette' && (overData?.type === 'col' || overData?.type === 'item' || overData?.type === 'category')) {
            const targetColId = overData?.type === 'col' ? (over.id as string) : findParentId(layout, over.id as string);
            if (!targetColId) return;

            const newNode: LayoutNode = {
                id: uuidv4(),
                type: activeData.type,
                data: { key: activeData.key }
            };

            const insertNodeIntoCol = (nodes: LayoutNode[], colId: string, node: LayoutNode, refId: string): LayoutNode[] => {
                return nodes.map(row => {
                    if (!row.children) return row;
                    const newCols = row.children.map(col => {
                        if (col.id !== colId) return col;
                        const newChildren = col.children ? [...col.children] : [];
                        if (refId === colId) {
                            newChildren.push(node);
                        } else {
                            const index = newChildren.findIndex(c => c.id === refId);
                            if (index !== -1) newChildren.splice(index, 0, node);
                            else newChildren.push(node);
                        }
                        return { ...col, children: newChildren };
                    });
                    return { ...row, children: newCols };
                });
            };

            const newLayout = insertNodeIntoCol(layout, targetColId, newNode, over.id as string);
            updateLayout(newLayout);
            setSelectedNodeId(newNode.id);
            return;
        }

        if ((activeData?.type === 'item' || activeData?.type === 'category') && (overData?.type === 'item' || overData?.type === 'category')) {
             const activeId = active.id as string;
             const overId = over.id as string;
             
             const sourceParentId = findParentId(layout, activeId);
             const targetParentId = findParentId(layout, overId);

             if (sourceParentId && targetParentId) {
                 const newLayout = _.cloneDeep(layout);
                 let nodeToMove: LayoutNode | null = null;
                 
                 for (const row of newLayout) {
                     if (!row.children) continue;
                     for (const col of row.children) {
                         if (col.id === sourceParentId) {
                             const idx = col.children?.findIndex(c => c.id === activeId);
                             if (idx !== undefined && idx !== -1) {
                                 nodeToMove = col.children![idx];
                                 col.children!.splice(idx, 1);
                             }
                         }
                     }
                 }
                 
                 if (nodeToMove) {
                    for (const row of newLayout) {
                        if (!row.children) continue;
                        for (const col of row.children) {
                            if (col.id === targetParentId) {
                                const idx = col.children?.findIndex(c => c.id === overId);
                                if (idx !== undefined && idx !== -1) {
                                    col.children!.splice(idx, 0, nodeToMove);
                                } else {
                                    col.children!.push(nodeToMove);
                                }
                            }
                        }
                    }
                    updateLayout(newLayout);
                 }
             }
        }
    };

    const selectedNode = selectedNodeId ? findNodeById(layout, selectedNodeId) : null;

    const inspectorPanel = (
        <LayoutInspector 
            node={selectedNode} 
            onUpdate={handleNodeUpdate} 
            onDelete={(id) => deleteNode(id)}
            allDefinitions={allDefinitionsMap}
            onSelectParent={(id) => setSelectedNodeId(id)}
            onAddColumn={() => selectedNode?.type === 'row' && addColumnToRow(selectedNode.id)}
            onRemoveColumn={() => selectedNode?.type === 'row' && removeColumnFromRow(selectedNode.id)}
            onClose={() => setInspectorMode('hidden')}
            onToggleDock={() => setInspectorMode(inspectorMode === 'docked' ? 'floating' : 'docked')}
            isDocked={inspectorMode === 'docked'}
        />
    );

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
        >
            <div className="th-manager">
                {isMobile && (
                    <div className="layout-composer__mobile-header">
                        <button 
                            className={`layout-composer__mobile-toggle ${leftOpen ? 'active' : ''}`}
                            onClick={() => setLeftOpen(!leftOpen)}
                        >
                            <span>组件库</span>
                            <ChevronDown size={14} style={{transform: leftOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}} />
                        </button>
                        <div className="layout-composer__mobile-title">Layout Canvas</div>
                        <button 
                            className="layout-composer__mobile-action"
                            onClick={() => setInspectorMode(inspectorMode === 'floating' ? 'hidden' : 'floating')}
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                )}

                <div className="th-manager__layout">
                    {/* Left Sidebar (Palette) */}
                    <div className={`th-manager__sidebar ${!leftOpen && !isMobile ? 'th-manager__sidebar--collapsed' : ''} ${isMobile ? 'mobile-overlay' : ''} ${isMobile && !leftOpen ? 'closed' : ''}`}>
                        <div className="th-manager__sidebar-header">
                            <div className="th-manager__sidebar-title">
                                <Box size={16} /> <span>组件库</span>
                            </div>
                            <div style={{display: 'flex', gap: '4px'}}>
                                <button onClick={() => setShowSnapshotModal(true)} className="th-manager__icon-btn" title="快照管理"><Save size={16}/></button>
                                {!isMobile && (
                                    <button onClick={() => setLeftOpen(!leftOpen)} className="th-manager__icon-btn desktop-only" title={leftOpen ? "收起" : "展开"}>
                                        <PanelLeftClose size={16}/>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="th-manager__sidebar-content">
                            <div className="palette-search">
                                <Search size={14} />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索组件..." />
                            </div>
                            <div className="palette-content">
                                {categories.map(cat => (
                                    <div key={cat.key} className="palette-section">
                                        <div className="palette-section-header" onClick={() => toggleCat(cat.key)}>
                                            {expandedCats.has(cat.key) ? <ChevronDown size={14}/> : <ChevronDown size={14} style={{transform:'rotate(-90deg)'}}/>}
                                            {cat.name}
                                        </div>
                                        {expandedCats.has(cat.key) && (
                                        <div className="palette-list">
                                            <PaletteItem 
                                                definition={{key: cat.key, name: cat.name, icon: cat.icon, type: 'text'} as ItemDefinition} 
                                                type="category" 
                                                label={`${cat.name} (分类)`} 
                                            />
                                            {(itemsByCategory[cat.key] || []).map(def => (
                                                <PaletteItem key={def.key} definition={def} type="item" />
                                            ))}
                                        </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="th-manager__main" onClick={() => setSelectedNodeId(null)}>
                        {!isMobile && (
                            <div className="th-manager__main-header" style={{ minHeight: '60px', padding: '0 var(--spacing-lg)' }}>
                                <div className="th-manager__main-title-group" style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                                    {!leftOpen && (
                                        <button onClick={() => setLeftOpen(true)} className="th-manager__icon-btn desktop-only" style={{marginRight: '8px'}}>
                                            <PanelLeftOpen size={16} />
                                        </button>
                                    )}
                                    <h2 className="th-manager__main-title" style={{fontSize: '1rem'}}>
                                        Layout Canvas
                                    </h2>
                                    <ContextHelpButton 
                                        title="布局编排帮助" 
                                        content={
                                            <>
                                                <p>所见即所得地设计状态栏的布局结构。</p>
                                                <ul>
                                                    <li><strong>基础概念</strong>: 布局由“行”(Row)、“列”(Col) 和“组件”(Item) 组成。</li>
                                                    <li><strong>创建行</strong>: 从左侧组件库拖拽一个组件到中央的虚线框区域，会自动创建包含该组件的新行。</li>
                                                    <li><strong>分列</strong>: 将组件拖拽到现有列的边缘（左右两侧），会显示蓝色指示条，释放后将该列一分为二。</li>
                                                    <li><strong>属性调整</strong>: 点击画布中的任意元素，右侧面板会显示其属性。</li>
                                                </ul>
                                            </>
                                        } 
                                    />
                                    {inspectorMode === 'hidden' && (
                                        <button 
                                            onClick={() => setInspectorMode('docked')} 
                                            className="btn btn--ghost" 
                                            title="打开属性面板"
                                            style={{marginLeft: 'auto'}}
                                        >
                                            属性面板 <PanelRightOpen size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="th-manager__main-content" style={{ padding: 0, flexDirection: 'column', overflow: 'hidden' }}>
                            <div className="layout-composer__canvas-area">
                                <div className="layout-composer__canvas">
                                    <LayoutCreatorZone />
                                    <SortableContext items={layout.map(row => row.id)} strategy={verticalListSortingStrategy}>
                                        {layout.map(row => (
                                            <LayoutRowDraggable 
                                                key={row.id} 
                                                node={row} 
                                                onSelect={(e) => { e.stopPropagation(); setSelectedNodeId(row.id); }}
                                                isSelected={selectedNodeId === row.id}
                                                onDelete={() => deleteNode(row.id)}
                                            >
                                                {row.children?.map((col, colIndex) => (
                                                    <React.Fragment key={col.id}>
                                                        <LayoutColumnDroppable 
                                                            node={col}
                                                            items={col.children || []}
                                                            allDefinitions={allDefinitionsMap}
                                                            allCategories={data.categories}
                                                            data={data}
                                                            selectedId={selectedNodeId}
                                                            onSelectNode={setSelectedNodeId}
                                                            isGlobalDragging={!!activeDragData}
                                                            onSetSplitIntent={setDragSplitIntent}
                                                            splitIntent={dragSplitIntent}
                                                            onDelete={() => deleteNode(col.id)}
                                                            onDeleteItem={(itemId) => deleteNode(itemId)}
                                                        />
                                                        {colIndex < (row.children?.length || 0) - 1 && (
                                                            <ColumnResizer onResize={(delta) => handleColumnResize(row.id, colIndex, delta)} />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </LayoutRowDraggable>
                                        ))}
                                    </SortableContext>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Pane (Inspector) - Now a sibling of Main Content */}
                    <div className={`layout-composer__right-sidebar ${inspectorMode === 'docked' ? 'open' : 'closed'}`}>
                        <div className="layout-composer__inspector-wrapper">
                            {inspectorMode === 'docked' && inspectorPanel}
                        </div>
                    </div>
                </div>
            </div>

            {inspectorMode === 'floating' && (
                <DraggablePanel 
                    title="属性检查器" 
                    onClose={() => setInspectorMode('hidden')}
                    initialPosition={{ x: window.innerWidth - 320, y: 100 }}
                    className="layout-inspector-panel"
                    extraControls={
                        !isMobile && (
                            <button 
                                onClick={() => setInspectorMode('docked')} 
                                className="draggable-panel__btn" 
                                title="停靠面板"
                            >
                                <BringToFront size={14} />
                            </button>
                        )
                    }
                >
                    <LayoutInspector 
                        node={selectedNode} 
                        onUpdate={handleNodeUpdate} 
                        onDelete={(id) => deleteNode(id)}
                        allDefinitions={allDefinitionsMap}
                        onSelectParent={(id) => setSelectedNodeId(id)}
                        onAddColumn={() => selectedNode?.type === 'row' && addColumnToRow(selectedNode.id)}
                        onRemoveColumn={() => selectedNode?.type === 'row' && removeColumnFromRow(selectedNode.id)}
                    />
                </DraggablePanel>
            )}

            <SnapshotManagerModal 
                isOpen={showSnapshotModal} 
                onClose={() => setShowSnapshotModal(false)} 
                onLoad={updateLayout} 
                currentLayout={layout}
            />

            <DragOverlay modifiers={[snapCenterToCursor]} style={{ pointerEvents: 'none' }}>
                {activeDragData ? (
                    activeDragData.from === 'palette' ? (
                        <PaletteItem 
                            definition={{
                                key: activeDragData.key || 'unknown',
                                name: activeDragData.key || 'unknown',
                                type: 'text',
                            } as ItemDefinition} 
                            type={(activeDragData.type as 'item' | 'category') || 'item'} 
                            isOverlay 
                        />
                    ) : activeDragData.node ? (
                         <div className="layout-item-wrapper overlay">
                             {activeDragData.node.type === 'row' ? '行移动...' : '组件移动...'}
                         </div>
                    ) : null
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default LayoutComposer;
