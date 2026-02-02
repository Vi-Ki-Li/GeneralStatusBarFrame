import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleDefinition, ItemDefinition, StatusBarData } from '../../../types';
import { styleService } from '../../../services/styleService';
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits'; 
import { useToast } from '../../Toast/ToastContext';
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, DragStartEvent, DragEndEvent, DragMoveEvent, DragOverlay } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Plus, Edit2, Trash2, Palette, AlertTriangle, Check, RotateCcw, Copy, Eye, Download, Upload, ListChecks, CheckSquare, PanelLeftClose, PanelLeftOpen, LayoutList, Paintbrush, Save, AlertCircle } from 'lucide-react'; 
import StyleEditor from './StyleEditor';
import StatusBar from '../../StatusBar/StatusBar';
import ContextHelpButton from '../../Shared/ContextHelpButton'; // 此处添加1行
import _ from 'lodash';
import '../ManagerLayout.css'; // Standard styles
import './StyleManager.css'; // Module specific overrides

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
      className={`th-manager__list-item ${isSelected ? 'th-manager__list-item--active' : ''}`}
      onMouseEnter={() => !isDragging && !isSelectionMode && setPreviewingStyle(style)}
      onMouseLeave={() => setPreviewingStyle(null)}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
        <div className="th-manager__item-main">
            {isSelectionMode && (
                <div className={`style-atelier__checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <div className="style-atelier__checkbox-inner" />}
                </div>
            )}
            <span className="th-manager__item-text">{style.name}</span>
        </div>
        
        {!isSelectionMode && (
            <div className="th-manager__item-actions">
              <button onPointerDown={onButtonDown} onClick={onEdit} className="th-manager__icon-btn" title={style.isDefault ? "查看" : "编辑"}>
                {style.isDefault ? <Eye size={16}/> : <Edit2 size={16}/>}
              </button>
              <button onPointerDown={onButtonDown} onClick={onCopy} className="th-manager__icon-btn" title="复制">
                <Copy size={16}/>
              </button>
              <button 
                onPointerDown={onButtonDown} 
                onClick={onDelete} 
                className="th-manager__icon-btn th-manager__icon-btn--danger" 
                title={style.isDefault ? "默认样式无法删除" : "删除"} 
                disabled={style.isDefault}
              >
                <Trash2 size={16}/>
              </button>
            </div>
        )}
    </div>
  );
};

interface StyleManagerProps {
  isMobile: boolean;
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  styleEditRequest: string | null; 
  onStyleEditRequestProcessed: () => void;
}

const StyleManager: React.FC<StyleManagerProps> = ({ isMobile, data, onUpdate, styleEditRequest, onStyleEditRequestProcessed }) => { 
    const [userStyles, setUserStyles] = useState<StyleDefinition[]>([]); 
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<StyleDefinition | null>(null);
    const [deletingStyle, setDeletingStyle] = useState<StyleDefinition | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // Mobile View State
    const [mobileTab, setMobileTab] = useState<'library' | 'preview'>('library');
    
    const [stagedData, setStagedData] = useState<StatusBarData | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    
    const [previewingStyle, setPreviewingStyle] = useState<StyleDefinition | null>(null);
    const [draggingStyle, setDraggingStyle] = useState<StyleDefinition | null>(null);
    const [initialPreviewKeyForEditor, setInitialPreviewKeyForEditor] = useState<string | undefined>(undefined); 

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pendingBulkDeleteIds, setPendingBulkDeleteIds] = useState<string[] | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    useEffect(() => {
        loadUserStyles(); 
        setActiveThemeId(styleService.getActiveThemeId());
        setStagedData(_.cloneDeep(data)); 
    }, [data]);

    useEffect(() => {
        const handleSafeMode = () => {
            setActiveThemeId(null);
            loadUserStyles(); 
            toast.warning("安全模式触发：主题状态已重置");
        };
        window.addEventListener('th:safe-mode-triggered', handleSafeMode);
        return () => window.removeEventListener('th:safe-mode-triggered', handleSafeMode);
    }, []); 

    useEffect(() => {
        if (!stagedData || !data) {
            setHasChanges(false);
            return;
        }
        const originalDefs = data.item_definitions;
        const stagedDefs = stagedData.item_definitions;
        setHasChanges(!_.isEqual(originalDefs, stagedDefs));
    }, [stagedData, data]);

    useEffect(() => { 
        if (styleEditRequest) {
          const itemKey = styleEditRequest;
          const definition = data.item_definitions[itemKey];
          
          if (definition) {
            const styleId = definition.styleId;
            const styleToEdit = styleId ? styleService.getStyleDefinition(styleId) : null;
            
            setEditingStyle(styleToEdit);
            setInitialPreviewKeyForEditor(itemKey); 
            setIsEditorOpen(true);
          } else {
            setEditingStyle(null);
            setInitialPreviewKeyForEditor(itemKey);
            setIsEditorOpen(true);
          }
          
          onStyleEditRequestProcessed(); 
        }
      }, [styleEditRequest, data.item_definitions, onStyleEditRequestProcessed]);

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
        id: undefined, 
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

    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set()); 
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

    const handleBulkDelete = () => {
        const idsToDelete = Array.from(selectedIds).filter(id => {
            const isDefault = DEFAULT_STYLE_UNITS.some(d => d.id === id);
            return !isDefault;
        });

        if (idsToDelete.length === 0) {
            toast.info("没有可删除的自定义样式");
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
        const idsToExport = Array.from(selectedIds);
        const stylesToExport = userStyles.filter(s => idsToExport.includes(s.id));
        if (stylesToExport.length === 0 && !isSelectionMode) {
             // Export all user styles if nothing selected/not in selection mode
             const json = styleService.exportStyles(userStyles);
             downloadJson(json, 'all_user_styles.json');
        } else if (stylesToExport.length > 0) {
             const json = styleService.exportStyles(stylesToExport);
             downloadJson(json, 'selected_styles.json');
        } else {
            toast.info("请选择要导出的样式");
        }
    };
    
    const downloadJson = (json: string, filename: string) => {
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => fileInputRef.current?.click();

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
                    toast.success(`导入完成: 新增 ${result.success}, 更新 ${result.updated}`);
                }
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragStart = (event: DragStartEvent) => {
      setDraggingStyle(event.active.data.current?.style as StyleDefinition);
    };

    const handleDragMove = (event: DragMoveEvent) => {};
    
    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingStyle(null);
        const { active, over } = event;
        if (!over || !over.id || !stagedData) return;
        const styleId = active.id as string;
        const itemDefKey = over.id as string;
        
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
            <div className="th-manager">
                {isMobile && (
                    <div className="th-manager__mobile-tabs th-manager__mobile-tabs--capsule">
                        <button 
                            className={`th-manager__mobile-tab ${mobileTab === 'library' ? 'active' : ''}`}
                            onClick={() => setMobileTab('library')}
                        >
                            <LayoutList size={16} /> 样式库
                        </button>
                        <button 
                            className={`th-manager__mobile-tab ${mobileTab === 'preview' ? 'active' : ''}`}
                            onClick={() => setMobileTab('preview')}
                        >
                            <Paintbrush size={16} /> 效果预览
                        </button>
                    </div>
                )}

                <div className="th-manager__layout">
                    {/* Sidebar */}
                    <div className={`th-manager__sidebar ${isSidebarCollapsed ? 'th-manager__sidebar--collapsed' : ''} ${isMobile && mobileTab !== 'library' ? 'mobile-hidden' : ''}`}>
                        <div className="th-manager__sidebar-header">
                            <div className="th-manager__sidebar-title">
                                <Palette size={16}/> 样式工坊
                            </div>
                            <div style={{display: 'flex', gap: '4px'}}>
                                <button 
                                    onClick={handleToggleSelectionMode} 
                                    className={`th-manager__icon-btn ${isSelectionMode ? 'active' : ''}`}
                                    title={isSelectionMode ? "退出选择" : "批量管理"}
                                    style={isSelectionMode ? {color: 'var(--color-primary)'} : {}}
                                >
                                    <ListChecks size={16} />
                                </button>
                                <button 
                                    onClick={() => setIsSidebarCollapsed(true)} 
                                    className="th-manager__icon-btn desktop-only"
                                    title="收起"
                                >
                                    <PanelLeftClose size={16} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="th-manager__sidebar-content">
                            {/* Theme Section */}
                            <div className="style-atelier__group">
                                <h4 className="style-atelier__group-title">全局主题</h4>
                                {themes.map(theme => {
                                    const isActive = activeThemeId === theme.id;
                                    const isSelected = selectedIds.has(theme.id);
                                    return (
                                        <div 
                                            key={theme.id} 
                                            className={`th-manager__list-item ${isActive ? 'th-manager__list-item--active' : ''} ${isSelected ? 'selected' : ''}`}
                                            onClick={isSelectionMode ? () => handleToggleSelect(theme.id) : undefined}
                                        >
                                            <div className="th-manager__item-main">
                                                {isSelectionMode ? (
                                                    <div className={`style-atelier__checkbox ${isSelected ? 'checked' : ''}`}>
                                                        {isSelected && <div className="style-atelier__checkbox-inner" />}
                                                    </div>
                                                ) : (
                                                    <div className="th-manager__item-icon"><Palette size={16} /></div>
                                                )}
                                                <span className="th-manager__item-text">{theme.name}</span>
                                            </div>
                                            {!isSelectionMode && (
                                                <div className="th-manager__item-actions">
                                                    <button onClick={() => { setEditingStyle(theme); setIsEditorOpen(true); }} className="th-manager__icon-btn" title="编辑"><Edit2 size={16}/></button>
                                                    <button onClick={(e) => requestDelete(theme, e)} className="th-manager__icon-btn th-manager__icon-btn--danger" title="删除"><Trash2 size={16}/></button>
                                                    <button 
                                                        onClick={(e) => {e.stopPropagation(); handleApplyTheme(theme.id)}} 
                                                        className="th-manager__icon-btn"
                                                        title={isActive ? "已应用" : "应用主题"}
                                                        style={{color: isActive ? 'var(--color-success)' : undefined}}
                                                    >
                                                        <Check size={16}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Style Units */}
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
                        
                        <div className="th-manager__sidebar-footer">
                            {isSelectionMode ? (
                                <div className="style-atelier__bulk-actions">
                                    <button onClick={handleSelectAll} className="th-manager__icon-btn" title="全选/反选">
                                        <CheckSquare size={18} />
                                    </button>
                                    <div style={{flex: 1}} />
                                    <button onClick={handleExport} className="th-manager__icon-btn" title={`导出选中 (${selectedIds.size})`} disabled={selectedIds.size === 0}>
                                        <Upload size={18}/>
                                    </button>
                                    <button onClick={handleBulkDelete} className="th-manager__icon-btn th-manager__icon-btn--danger" title={`删除选中 (${selectedIds.size})`} disabled={selectedIds.size === 0}>
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            ) : (
                                <div className="style-atelier__footer-row">
                                    <button onClick={() => { setEditingStyle(null); setIsEditorOpen(true); }} className="th-manager__list-item" style={{justifyContent: 'center', color: 'var(--text-tertiary)'}}>
                                        <Plus size={16}/>
                                        <span>新建样式</span>
                                    </button>
                                    <div className="style-atelier__io-actions">
                                        <button onClick={handleImportClick} className="th-manager__icon-btn" title="导入样式">
                                            <Download size={16}/>
                                        </button>
                                        <button onClick={handleExport} className="th-manager__icon-btn" title="导出所有用户样式">
                                            <Upload size={16}/>
                                        </button>
                                    </div>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className={`th-manager__main ${isMobile && mobileTab !== 'preview' ? 'mobile-hidden' : ''}`}>
                        <div className="th-manager__main-header">
                            <div className="th-manager__main-title-group">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {isSidebarCollapsed && !isMobile && (
                                        <button 
                                            onClick={() => setIsSidebarCollapsed(false)} 
                                            className="th-manager__icon-btn desktop-only"
                                            title="展开样式库"
                                        >
                                            <PanelLeftOpen size={16} />
                                        </button>
                                    )}
                                    <h2 className="th-manager__main-title">宏观效果预览</h2>
                                    {/* Help Button - Start Add */}
                                    <ContextHelpButton 
                                        title="样式工坊帮助" 
                                        content={
                                            <>
                                                <p>在这里，您可以定义数据条目的视觉表现，或者设置全局主题。</p>
                                                <ul>
                                                    <li><strong>全局主题</strong>: 位于列表顶部，点击“勾选”图标应用。它会改变整个应用的配色、字体和圆角。</li>
                                                    <li><strong>样式单元</strong>: 创建可复用的渲染模板（如“血条样式”）。</li>
                                                    <li><strong>可视化编辑器</strong>: 新建样式时，可以使用可视化 GUI 调整颜色、边框等，无需写代码。</li>
                                                    <li><strong>应用样式</strong>: 在此界面，您可以将左侧的样式拖拽到右侧预览中的条目上，直接建立关联。</li>
                                                </ul>
                                            </>
                                        } 
                                    />
                                    {/* Help Button - End Add */}
                                </div>
                                <div className="th-manager__main-subtitle">
                                    {hasChanges && <span className="data-center__unsaved-indicator" style={{color: 'var(--color-warning)'}}>[有未保存的样式关联] </span>}
                                    从左侧拖拽样式到下方条目以应用
                                </div>
                            </div>
                        </div>
                        
                        <div className="th-manager__main-content">
                            <div className="style-atelier__preview-canvas">
                                {stagedData ? (
                                    <StatusBar data={stagedData} styleOverride={previewingStyle} />
                                ) : (
                                    <div className="style-atelier__placeholder">加载预览...</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Toolbar */}
                {hasChanges && (
                    <div className="th-manager__toolbar">
                        <div className="data-center__unsaved-prompt" style={{marginRight: 'auto'}}>
                            <AlertCircle size={18} />
                            <span>有未保存的关联更改</span>
                        </div>
                        <button onClick={handleDiscardChanges} className="btn btn--ghost">
                            <RotateCcw size={16} /> 放弃
                        </button>
                        <button onClick={handleSaveChanges} className="btn btn--primary pulse">
                            <Save size={16} /> 保存更改
                        </button>
                    </div>
                )}

                {/* Modals */}
                {deletingStyle && (
                    <div className="style-atelier__delete-overlay">
                        <div className="style-atelier__delete-modal glass-panel">
                            <h3>确认删除</h3>
                            <p>确定要删除样式 "{deletingStyle.name}" 吗？</p>
                            <div className="style-atelier__delete-actions">
                                <button className="btn btn--ghost" onClick={() => setDeletingStyle(null)}>取消</button>
                                <button className="btn btn--danger" onClick={confirmDelete}>删除</button>
                            </div>
                        </div>
                    </div>
                )}

                {pendingBulkDeleteIds && (
                    <div className="style-atelier__delete-overlay">
                        <div className="style-atelier__delete-modal glass-panel">
                            <h3>确认批量删除</h3>
                            <p>删除选中的 <strong>{pendingBulkDeleteIds.length}</strong> 个样式？</p>
                            <div className="style-atelier__delete-actions">
                                <button className="btn btn--ghost" onClick={() => setPendingBulkDeleteIds(null)}>取消</button>
                                <button className="btn btn--danger" onClick={executeBulkDelete}>全部删除</button>
                            </div>
                        </div>
                    </div>
                )}

                <StyleEditor 
                    isOpen={isEditorOpen} 
                    onClose={() => { setIsEditorOpen(false); setInitialPreviewKeyForEditor(undefined); }} 
                    onSave={handleSaveStyle} 
                    styleToEdit={editingStyle} 
                    allDefinitions={stagedData ? Object.values(stagedData.item_definitions) : []}
                    initialPreviewKey={initialPreviewKeyForEditor}
                />
            </div>
            
            <DragOverlay modifiers={[snapCenterToCursor]} zIndex={20000} style={{ pointerEvents: 'none' }}>
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