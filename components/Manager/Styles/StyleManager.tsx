import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleDefinition, ItemDefinition, StatusBarData } from '../../../types';
import { styleService } from '../../../services/styleService';
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits'; 
import { useToast } from '../../Toast/ToastContext';
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, DragStartEvent, DragEndEvent, DragMoveEvent, DragOverlay } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Plus, Edit2, Trash2, Palette, AlertTriangle, Check, X as XIcon, Paintbrush, Loader, Save, RotateCcw, Copy, Eye, Download, Upload, ListChecks, CheckSquare } from 'lucide-react'; 
import StyleEditor from './StyleEditor';
import StatusBar from '../../StatusBar/StatusBar';
import _ from 'lodash';
import './StyleManager.css';

// 子组件：可拖拽的样式单元
const DraggableStyleUnit: React.FC<{ 
  style: StyleDefinition & { isDefault?: boolean };
  setPreviewingStyle: (style: StyleDefinition | null) => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: (e: React.MouseEvent) => void;
  // Selection Props
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}> = ({ style, setPreviewingStyle, onEdit, onCopy, onDelete, isSelectionMode, isSelected, onToggleSelect }) => {
  // Disable drag if in selection mode
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ 
      id: style.id, 
      data: { style },
      disabled: isSelectionMode 
  });

  const styleProp: React.CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  const onButtonDown = (e: React.PointerEvent) => e.stopPropagation();

  const handleClick = (e: React.MouseEvent) => {
      if (isSelectionMode) {
          e.stopPropagation();
          onToggleSelect();
      }
  };

  return (
    <div
      ref={setNodeRef}
      style={styleProp}
      onMouseEnter={() => !isDragging && !isSelectionMode && setPreviewingStyle(style)}
      onMouseLeave={() => setPreviewingStyle(null)}
      onClick={handleClick}
    >
      <div 
        className={`style-atelier__item-wrapper ${isSelected ? 'selected' : ''}`}
        {...listeners}
        {...attributes}
      >
        {isSelectionMode && (
            <div className="style-atelier__checkbox">
                {isSelected && <div className="style-atelier__checkbox-inner" />}
            </div>
        )}
        <div className="style-atelier__item-main">
          <span className="style-atelier__item-name">{style.name}</span>
        </div>
        
        {!isSelectionMode && (
            <div className="style-atelier__item-actions">
              <button onPointerDown={onButtonDown} onClick={onEdit} className="btn btn--ghost" title={style.isDefault ? "查看" : "编辑"}>
                {style.isDefault ? <Eye size={14}/> : <Edit2 size={14}/>}
              </button>
              <button onPointerDown={onButtonDown} onClick={onCopy} className="btn btn--ghost btn--copy" title="复制">
                <Copy size={14}/>
              </button>
              <button onPointerDown={onButtonDown} onClick={onDelete} className="btn btn--ghost btn--delete" title={style.isDefault ? "默认样式无法删除" : "删除"} disabled={style.isDefault}>
                <Trash2 size={14}/>
              </button>
            </div>
        )}
      </div>
    </div>
  );
};

interface StyleManagerProps {
  isMobile: boolean;
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const StyleManager: React.FC<StyleManagerProps> = ({ isMobile, data, onUpdate }) => {
    const [userStyles, setUserStyles] = useState<StyleDefinition[]>([]); 
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<StyleDefinition | null>(null);
    const [deletingStyle, setDeletingStyle] = useState<StyleDefinition | null>(null);
    
    const [stagedData, setStagedData] = useState<StatusBarData | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    
    const [previewingStyle, setPreviewingStyle] = useState<StyleDefinition | null>(null);
    const [draggingStyle, setDraggingStyle] = useState<StyleDefinition | null>(null);

    // --- Selection Mode State ---
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pendingBulkDeleteIds, setPendingBulkDeleteIds] = useState<string[] | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    useEffect(() => {
        loadUserStyles(); 
        setActiveThemeId(styleService.getActiveThemeId());
        setStagedData(_.cloneDeep(data)); // Initial sync
    }, [data]);

    useEffect(() => {
        if (!stagedData || !data) {
            setHasChanges(false);
            return;
        }
        const originalDefs = data.item_definitions;
        const stagedDefs = stagedData.item_definitions;
        setHasChanges(!_.isEqual(originalDefs, stagedDefs));
    }, [stagedData, data]);

    const loadUserStyles = () => { 
        setUserStyles(styleService.getStyleDefinitions()); 
    };

    const handleSaveStyle = (style: StyleDefinition) => {
        try {
            styleService.saveStyleDefinition(style);
            loadUserStyles(); 
            toast.success(`样式 "${style.name}" 已保存`);
        } catch (e) { toast.error("保存样式失败"); }
    };

    const handleCopyStyle = (styleToCopy: StyleDefinition) => { 
      const newStyle: Partial<StyleDefinition> = {
        ..._.cloneDeep(styleToCopy),
        id: undefined, // Let save handler generate new ID
        name: `${styleToCopy.name}-副本`,
      };
      delete (newStyle as any).isDefault;
      setEditingStyle(newStyle as StyleDefinition);
      setIsEditorOpen(true);
    };
    
    const handleSaveChanges = () => {
        if (stagedData) {
            onUpdate(stagedData);
            toast.success("样式关联已保存");
        }
    };

    const handleDiscardChanges = () => {
        setStagedData(_.cloneDeep(data));
        toast.info("已放弃更改");
    };

    const requestDelete = (style: StyleDefinition, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingStyle(style);
    };

    const confirmDelete = () => {
        if (deletingStyle) {
            try {
                styleService.deleteStyleDefinition(deletingStyle.id);
                loadUserStyles(); 
                if (activeThemeId === deletingStyle.id) setActiveThemeId(null);
                toast.info(`样式 "${deletingStyle.name}" 已删除`);
                setDeletingStyle(null);
            } catch (e) { toast.error("删除样式失败"); }
        }
    };

    const handleApplyTheme = (themeId: string) => {
        if (activeThemeId === themeId) {
            styleService.clearActiveTheme();
            setActiveThemeId(null);
            toast.info("已恢复默认主题");
        } else {
            styleService.applyTheme(themeId);
            setActiveThemeId(themeId);
            toast.success("主题已应用");
        }
    };

    // --- Selection Logic ---
    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set()); // Clear selection on toggle
    };

    const allVisibleStyles = useMemo(() => {
        return [...DEFAULT_STYLE_UNITS, ...userStyles];
    }, [userStyles]);

    const handleSelectAll = () => {
        if (selectedIds.size === allVisibleStyles.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allVisibleStyles.map(s => s.id)));
        }
    };

    // --- Bulk Operations ---
    const handleBulkDelete = () => {
        const idsToDelete = Array.from(selectedIds).filter(id => {
            const isDefault = DEFAULT_STYLE_UNITS.some(d => d.id === id);
            return !isDefault;
        });

        if (idsToDelete.length === 0) {
            toast.info("没有可删除的自定义样式 (默认样式不可删除)");
            return;
        }

        setPendingBulkDeleteIds(idsToDelete);
    };

    const executeBulkDelete = () => {
        if (!pendingBulkDeleteIds) return;
        
        try {
            styleService.deleteStyleDefinitions(pendingBulkDeleteIds);
            loadUserStyles();
            setSelectedIds(new Set());
            toast.success(`已删除 ${pendingBulkDeleteIds.length} 个样式`);
        } catch (e) {
            toast.error("批量删除失败");
        } finally {
            setPendingBulkDeleteIds(null);
        }
    };

    const handleExport = () => {
        try {
            // Determine styles to export
            let stylesToExport: StyleDefinition[];
            
            if (isSelectionMode && selectedIds.size > 0) {
                // In selection mode, find all selected styles (including defaults if selected)
                stylesToExport = allVisibleStyles.filter(s => selectedIds.has(s.id));
            } else {
                // Default behavior: Export only User Styles (storage content)
                stylesToExport = styleService.getStyleDefinitions();
            }

            if (stylesToExport.length === 0) {
                toast.info("没有可导出的样式");
                return;
            }

            const json = styleService.exportStyles(stylesToExport);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tavern_styles_${new Date().toISOString().slice(0, 10)}${isSelectionMode ? '_subset' : ''}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`成功导出 ${stylesToExport.length} 个样式`);
            
            if (isSelectionMode) {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
            }
        } catch (e) {
            toast.error("导出失败");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const result = styleService.importStyles(content);
                if (result.errors === -1) {
                    toast.error("导入失败: 格式错误");
                } else {
                    loadUserStyles();
                    toast.success(`导入完成: 新增 ${result.success}, 更新 ${result.updated}`, {
                        description: result.errors > 0 ? `跳过 ${result.errors} 个无效项` : undefined
                    });
                }
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragStart = (event: DragStartEvent) => {
      setDraggingStyle(event.active.data.current?.style as StyleDefinition);
    };

    const handleDragMove = (event: DragMoveEvent) => {
        // No-op
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingStyle(null);
        const { active, over } = event;
    
        if (!over || !over.id || !stagedData) return;
    
        const styleId = active.id as string;
        const itemDefKey = over.id as string;
    
        // V9.2: REMOVED COMPATIBILITY CHECK
        // Allow any style to be dropped on any item.
        
        setStagedData(prevData => {
            if (!prevData) return null;
            const newData = _.cloneDeep(prevData);
            if (newData.item_definitions[itemDefKey]) {
                newData.item_definitions[itemDefKey].styleId = styleId;
            }
            return newData;
        });
    };

    const { themes, styleUnits } = useMemo(() => {
        const themes: StyleDefinition[] = [];
        const units: StyleDefinition[] = [];
        userStyles.forEach(style => { 
            if (style.dataType === 'theme') themes.push(style);
            else units.push(style);
        });
        return { themes, styleUnits: units };
    }, [userStyles]); 

    const groupedStyleUnits = useMemo(() => {
        const allUnits = [...DEFAULT_STYLE_UNITS, ...styleUnits]; 
        return allUnits.reduce((acc, style) => { 
            const type = style.dataType || 'other';
            if (!acc[type]) acc[type] = [];
            acc[type].push(style);
            return acc;
        }, {} as Record<string, StyleDefinition[]>);
    }, [styleUnits]);

    const groupOrder = ['numeric', 'array', 'list-of-objects', 'text', 'other'];
    const groupLabels = {
        numeric: '数值样式',
        array: '标签组',
        'list-of-objects': '对象列表',
        text: '文本样式',
        other: '其他',
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
            <div className={`style-atelier ${isSelectionMode ? 'selection-mode' : ''}`}>
                <div className="style-atelier__sidebar">
                    <div className="style-atelier__sidebar-header">
                        <div className="style-atelier__header-left">
                            <Palette size={18}/>
                            <h3>样式库</h3>
                        </div>
                        <button 
                            onClick={handleToggleSelectionMode} 
                            className={`style-atelier__selection-toggle ${isSelectionMode ? 'active' : ''}`}
                            title={isSelectionMode ? "退出选择" : "批量管理"}
                        >
                            <ListChecks size={18} />
                        </button>
                    </div>
                    
                    <div className="style-atelier__style-list">
                        <div className="style-atelier__group style-atelier__theme-section">
                            <h4 className="style-atelier__group-title">全局主题</h4>
                            {themes.map(theme => {
                                const isActive = activeThemeId === theme.id;
                                const isSelected = selectedIds.has(theme.id);
                                return (
                                    <div 
                                        key={theme.id} 
                                        className={`theme-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                                        onClick={isSelectionMode ? () => handleToggleSelect(theme.id) : undefined}
                                    >
                                        {isSelectionMode && (
                                            <div className="style-atelier__checkbox">
                                                {isSelected && <div className="style-atelier__checkbox-inner" />}
                                            </div>
                                        )}
                                        <div className="theme-item__info">
                                            <Palette size={14} />
                                            <span className="theme-item__name">{theme.name}</span>
                                        </div>
                                        {!isSelectionMode && (
                                            <div className="theme-item__actions">
                                                <button onClick={() => { setEditingStyle(theme); setIsEditorOpen(true); }} className="btn btn--ghost" title="编辑"><Edit2 size={14}/></button>
                                                <button onClick={(e) => requestDelete(theme, e)} className="btn btn--ghost btn--delete" title="删除"><Trash2 size={14}/></button>
                                                <button onClick={() => handleApplyTheme(theme.id)} className={`theme-item__apply-btn ${isActive ? 'active' : ''}`}>
                                                    <Check size={14}/>
                                                    <span>{isActive ? '已应用' : '应用'}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {groupOrder.map(groupKey => (
                            groupedStyleUnits[groupKey] && (
                                <div key={groupKey} className="style-atelier__group">
                                    <h4 className="style-atelier__group-title">{groupLabels[groupKey as keyof typeof groupLabels]}</h4>
                                    {groupedStyleUnits[groupKey].map(style => (
                                        <DraggableStyleUnit 
                                            key={style.id}
                                            style={style as StyleDefinition & { isDefault?: boolean }}
                                            setPreviewingStyle={setPreviewingStyle}
                                            onEdit={() => { setEditingStyle(style); setIsEditorOpen(true); }}
                                            onCopy={() => handleCopyStyle(style)}
                                            onDelete={(e) => requestDelete(style, e)}
                                            isSelectionMode={isSelectionMode}
                                            isSelected={selectedIds.has(style.id)}
                                            onToggleSelect={() => handleToggleSelect(style.id)}
                                        />
                                    ))}
                                </div>
                            )
                        ))}
                    </div>
                    
                    <div className="style-atelier__sidebar-footer">
                        {isSelectionMode ? (
                            <div className="style-atelier__footer-row style-atelier__bulk-actions">
                                <button onClick={handleSelectAll} className="style-atelier__io-btn" title="全选/反选">
                                    <CheckSquare size={16} />
                                </button>
                                <button onClick={handleExport} className="style-atelier__io-btn" title={`导出选中 (${selectedIds.size})`} disabled={selectedIds.size === 0}>
                                    <Download size={16}/>
                                </button>
                                <button onClick={handleBulkDelete} className="style-atelier__io-btn delete" title={`删除选中 (${selectedIds.size})`} disabled={selectedIds.size === 0}>
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ) : (
                            <div className="style-atelier__footer-row">
                                <button onClick={() => { setEditingStyle(null); setIsEditorOpen(true); }} className="style-atelier__add-btn">
                                    <Plus size={16}/> 新建
                                </button>
                                <div className="style-atelier__io-actions">
                                    <button onClick={handleImportClick} className="style-atelier__io-btn" title="导入样式">
                                        <Upload size={16}/>
                                    </button>
                                    <button onClick={handleExport} className="style-atelier__io-btn" title="导出所有用户样式">
                                        <Download size={16}/>
                                    </button>
                                </div>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept=".json" 
                            onChange={handleFileChange} 
                        />
                    </div>
                </div>

                <div className="style-atelier__main-preview">
                    <div className="style-atelier__preview-header">
                        <Paintbrush size={16}/>
                        <h4>宏观效果预览</h4>
                    </div>
                    <div className="style-atelier__preview-canvas">
                        {stagedData ? (
                            <StatusBar data={stagedData} styleOverride={previewingStyle} />
                        ) : (
                            <div className="style-atelier__placeholder">加载预览...</div>
                        )}
                    </div>
                </div>

                {deletingStyle && (
                    <div className="style-atelier__delete-overlay">
                        <div className="style-atelier__delete-modal glass-panel">
                            <div className="style-atelier__delete-header">
                                <AlertTriangle size={24} /><h3>确认删除</h3>
                            </div>
                            <p>您确定要删除样式 "{deletingStyle.name}" 吗？此操作不可撤销。</p>
                            <div className="style-atelier__delete-actions">
                                <button className="btn btn--ghost" onClick={() => setDeletingStyle(null)}>取消</button>
                                <button className="btn btn--danger" onClick={confirmDelete}><Trash2 size={16} /> 删除</button>
                            </div>
                        </div>
                    </div>
                )}

                {pendingBulkDeleteIds && (
                    <div className="style-atelier__delete-overlay">
                        <div className="style-atelier__delete-modal glass-panel">
                            <div className="style-atelier__delete-header">
                                <AlertTriangle size={24} /><h3>确认批量删除</h3>
                            </div>
                            <p>您确定要删除选中的 <strong>{pendingBulkDeleteIds.length}</strong> 个样式吗？此操作不可撤销。</p>
                            <div className="style-atelier__delete-actions">
                                <button className="btn btn--ghost" onClick={() => setPendingBulkDeleteIds(null)}>取消</button>
                                <button className="btn btn--danger" onClick={executeBulkDelete}><Trash2 size={16} /> 全部删除</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {hasChanges && (
                    <div className="style-atelier__action-bar glass-panel animate-slide-up">
                        <span className="style-atelier__action-bar-prompt">
                            您有未保存的更改
                        </span>
                        <div className="style-atelier__action-bar-buttons">
                            <button onClick={handleDiscardChanges} className="btn btn--ghost">
                                <RotateCcw size={16} /> 放弃
                            </button>
                            <button onClick={handleSaveChanges} className="btn btn--primary pulse">
                                <Save size={16} /> 保存更改
                            </button>
                        </div>
                    </div>
                )}


                <StyleEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveStyle} styleToEdit={editingStyle} allDefinitions={stagedData ? Object.values(stagedData.item_definitions) : []} />
            </div>
            
            <DragOverlay modifiers={[snapCenterToCursor]} zIndex={20000}>
                {draggingStyle ? (
                    <div className="style-atelier__drag-overlay">
                        <Palette size={14} />
                        <span>{draggingStyle.name}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default StyleManager;