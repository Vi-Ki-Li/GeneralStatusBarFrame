

import React, { useState, useEffect, useMemo } from 'react';
import { StyleDefinition, ItemDefinition, StatusBarData } from '../../../types';
import { styleService } from '../../../services/styleService';
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits'; // 此处添加1行
import { useToast } from '../../Toast/ToastContext';
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, DragStartEvent, DragEndEvent, DragMoveEvent, DragOverlay } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Plus, Edit2, Trash2, Palette, AlertTriangle, Check, X as XIcon, Paintbrush, Loader, Save, RotateCcw, Copy, Eye } from 'lucide-react'; // 此处修改1行
import StyleEditor from './StyleEditor';
import StatusBar from '../../StatusBar/StatusBar';
import _ from 'lodash';
import './StyleManager.css';

// 子组件：可拖拽的样式单元
const DraggableStyleUnit: React.FC<{ // 此处开始修改22行
  style: StyleDefinition & { isDefault?: boolean };
  setPreviewingStyle: (style: StyleDefinition | null) => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ style, setPreviewingStyle, onEdit, onCopy, onDelete }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: style.id, data: { style } });

  const styleProp: React.CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  const onButtonDown = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={styleProp}
      onMouseEnter={() => !isDragging && setPreviewingStyle(style)}
      onMouseLeave={() => setPreviewingStyle(null)}
    >
      <div 
        className="style-atelier__item-wrapper"
        {...listeners}
        {...attributes}
      >
        <div className="style-atelier__item-main">
          <span className="style-atelier__item-name">{style.name}</span>
        </div>
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
      </div>
    </div>
  );
}; // 此处完成修改

interface StyleManagerProps {
  isMobile: boolean;
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const StyleManager: React.FC<StyleManagerProps> = ({ isMobile, data, onUpdate }) => {
    const [userStyles, setUserStyles] = useState<StyleDefinition[]>([]); // 此处修改1行
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<StyleDefinition | null>(null);
    const [deletingStyle, setDeletingStyle] = useState<StyleDefinition | null>(null);
    
    const [stagedData, setStagedData] = useState<StatusBarData | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    
    const [previewingStyle, setPreviewingStyle] = useState<StyleDefinition | null>(null);
    const [draggingStyle, setDraggingStyle] = useState<StyleDefinition | null>(null);

    const toast = useToast();

    useEffect(() => {
        loadUserStyles(); // 此处修改1行
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

    const loadUserStyles = () => { // 此处修改1行
        setUserStyles(styleService.getStyleDefinitions()); // 此处修改1行
    };

    const handleSaveStyle = (style: StyleDefinition) => {
        try {
            styleService.saveStyleDefinition(style);
            loadUserStyles(); // 此处修改1行
            toast.success(`样式 "${style.name}" 已保存`);
        } catch (e) { toast.error("保存样式失败"); }
    };

    const handleCopyStyle = (styleToCopy: StyleDefinition) => { // 此处开始添加9行
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
                loadUserStyles(); // 此处修改1行
                if (activeThemeId === deletingStyle.id) setActiveThemeId(null);
                toast.info(`样式 "${deletingStyle.name}" 已删除`);
                setDeletingStyle(null);
            } catch (e) { toast.error("删除样式失败"); }
        }
    };

    // 新增：处理应用主题的逻辑
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
    
        const allStyles = [...DEFAULT_STYLE_UNITS, ...userStyles]; // 此处修改1行
        const style = allStyles.find(s => s.id === styleId); // 此处修改1行
        const definition = stagedData.item_definitions[itemDefKey];
    
        if (!style || !definition) return;
    
        let isCompatible = false;
        if (style.dataType === 'numeric' && definition.type === 'numeric') isCompatible = true;
        else if (style.dataType === 'array' && definition.type === 'array') isCompatible = true;
        else if (style.dataType === 'list-of-objects' && (definition.type === 'array' || definition.type === 'list-of-objects')) isCompatible = true; // 兼容
        else if (style.dataType === 'text' && definition.type === 'text') isCompatible = true;
    
        if (!isCompatible) {
            toast.warning(`样式 "${style.name}" 与条目 "${definition.name || definition.key}" 不兼容`);
            return;
        }
    
        setStagedData(prevData => {
            if (!prevData) return null;
            const newData = _.cloneDeep(prevData);
            newData.item_definitions[itemDefKey].styleId = styleId;
            return newData;
        });
    };

    const { themes, styleUnits } = useMemo(() => {
        const themes: StyleDefinition[] = [];
        const units: StyleDefinition[] = [];
        userStyles.forEach(style => { // 此处修改1行
            if (style.dataType === 'theme') themes.push(style);
            else units.push(style);
        });
        return { themes, styleUnits: units };
    }, [userStyles]); // 此处修改1行

    const groupedStyleUnits = useMemo(() => {
        const allUnits = [...DEFAULT_STYLE_UNITS, ...styleUnits]; // 此处修改1行
        return allUnits.reduce((acc, style) => { // 此处修改1行
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
            <div className="style-atelier">
                <div className="style-atelier__sidebar">
                    <div className="style-atelier__sidebar-header">
                        <Palette size={18}/>
                        <h3>样式库</h3>
                    </div>
                    <div className="style-atelier__style-list">
                        <div className="style-atelier__group style-atelier__theme-section">
                            <h4 className="style-atelier__group-title">全局主题</h4>
                            {themes.map(theme => {
                                const isActive = activeThemeId === theme.id;
                                return (
                                    <div key={theme.id} className={`theme-item ${isActive ? 'active' : ''}`}>
                                        <div className="theme-item__info">
                                            <Palette size={14} />
                                            <span className="theme-item__name">{theme.name}</span>
                                        </div>
                                        <div className="theme-item__actions">
                                            <button onClick={() => { setEditingStyle(theme); setIsEditorOpen(true); }} className="btn btn--ghost" title="编辑"><Edit2 size={14}/></button>
                                            <button onClick={(e) => requestDelete(theme, e)} className="btn btn--ghost btn--delete" title="删除"><Trash2 size={14}/></button>
                                            <button onClick={() => handleApplyTheme(theme.id)} className={`theme-item__apply-btn ${isActive ? 'active' : ''}`}>
                                                <Check size={14}/>
                                                <span>{isActive ? '已应用' : '应用'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {groupOrder.map(groupKey => (
                            groupedStyleUnits[groupKey] && (
                                <div key={groupKey} className="style-atelier__group">
                                    <h4 className="style-atelier__group-title">{groupLabels[groupKey as keyof typeof groupLabels]}</h4>
                                    {groupedStyleUnits[groupKey].map(style => (
                                        <DraggableStyleUnit // 此处开始修改6行
                                            key={style.id}
                                            style={style as StyleDefinition & { isDefault?: boolean }}
                                            setPreviewingStyle={setPreviewingStyle}
                                            onEdit={() => { setEditingStyle(style); setIsEditorOpen(true); }}
                                            onCopy={() => handleCopyStyle(style)}
                                            onDelete={(e) => requestDelete(style, e)}
                                        />
                                    ))}
                                </div>
                            )
                        ))}
                    </div>
                    <div className="style-atelier__sidebar-footer">
                        <button onClick={() => { setEditingStyle(null); setIsEditorOpen(true); }} className="style-atelier__add-btn">
                            <Plus size={16}/> 新建样式
                        </button>
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