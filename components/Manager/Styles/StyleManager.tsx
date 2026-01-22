import React, { useState, useEffect, useMemo } from 'react';
import { StyleDefinition } from '../../../types';
import { styleService } from '../../../services/styleService';
import { useToast } from '../../Toast/ToastContext';
import { Plus, Edit2, Trash2, Palette, AlertTriangle, Check, X as XIcon, Paintbrush, Loader } from 'lucide-react';
import StyleEditor from './StyleEditor';
import StatusBar from '../../StatusBar/StatusBar'; // For preview
import { tavernService } from '../../../services/mockTavernService'; // For mock data
import { StatusBarData } from '../../../types';
import './StyleManager.css';

const StyleManager: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const [styles, setStyles] = useState<StyleDefinition[]>([]);
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<StyleDefinition | null>(null);
    const [deletingStyle, setDeletingStyle] = useState<StyleDefinition | null>(null);
    const [mockData, setMockData] = useState<StatusBarData | null>(null);

    const toast = useToast();

    useEffect(() => {
        loadStyles();
        setActiveThemeId(styleService.getActiveThemeId());
        const vars = tavernService.getVariables();
        setMockData(vars.statusBarCharacterData);
    }, []);

    const loadStyles = () => {
        setStyles(styleService.getStyleDefinitions());
    };

    const handleSaveStyle = (style: StyleDefinition) => {
        try {
            styleService.saveStyleDefinition(style);
            loadStyles();
            toast.success(`样式 "${style.name}" 已保存`);
        } catch (e) {
            toast.error("保存样式失败");
        }
    };

    const requestDelete = (style: StyleDefinition, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingStyle(style);
    };

    const confirmDelete = () => {
        if (deletingStyle) {
            try {
                styleService.deleteStyleDefinition(deletingStyle.id);
                loadStyles();
                // If the deleted style was the active theme, the service handles clearing it. Update local state.
                if (activeThemeId === deletingStyle.id) {
                    setActiveThemeId(null);
                }
                toast.info(`样式 "${deletingStyle.name}" 已删除`);
                setDeletingStyle(null);
            } catch (e) {
                toast.error("删除样式失败");
            }
        }
    };

    const handleApplyTheme = (themeId: string) => {
        if (activeThemeId === themeId) {
            styleService.clearActiveTheme();
            setActiveThemeId(null);
            toast.info("主题已取消应用");
        } else {
            styleService.applyTheme(themeId);
            setActiveThemeId(themeId);
            toast.success("主题已应用");
        }
    };

    const { themes, styleUnits } = useMemo(() => {
        const themes: StyleDefinition[] = [];
        const units: StyleDefinition[] = [];
        styles.forEach(style => {
            if (style.dataType === 'theme') {
                themes.push(style);
            } else {
                units.push(style);
            }
        });
        return { themes, styleUnits: units };
    }, [styles]);

    const groupedStyleUnits = useMemo(() => {
        return styleUnits.reduce((acc, style) => {
            let type = style.dataType || 'other';
            if (type === 'list-of-objects') {
                type = 'array'; // Group list-of-objects with array
            }
            if (!acc[type]) acc[type] = [];
            acc[type].push(style);
            return acc;
        }, {} as Record<string, StyleDefinition[]>);
    }, [styleUnits]);

    const groupOrder = ['numeric', 'array', 'text', 'other'];
    const groupLabels = {
        numeric: '数值样式',
        array: '标签组 / 对象列表',
        text: '文本样式',
        other: '其他',
    };

    return (
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
                                        <button 
                                            onClick={() => handleApplyTheme(theme.id)} 
                                            className={`theme-item__apply-btn ${isActive ? 'active' : ''}`}
                                        >
                                            <Check size={14}/>
                                            <span>{isActive ? '已应用' : '应用'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {groupOrder.map(groupKey => (
                        groupedStyleUnits[groupKey as keyof typeof groupedStyleUnits] && (
                            <div key={groupKey} className="style-atelier__group">
                                <h4 className="style-atelier__group-title">{groupLabels[groupKey as keyof typeof groupLabels]}</h4>
                                {groupedStyleUnits[groupKey as keyof typeof groupedStyleUnits].map(style => (
                                    <div key={style.id} className="style-atelier__item-wrapper">
                                        <div className="style-atelier__item-main">
                                            <span className="style-atelier__item-name">{style.name}</span>
                                        </div>
                                        <div className="style-atelier__item-actions">
                                            <button onClick={() => { setEditingStyle(style); setIsEditorOpen(true); }} className="btn btn--ghost" title="编辑"><Edit2 size={14}/></button>
                                            <button onClick={(e) => requestDelete(style, e)} className="btn btn--ghost btn--delete" title="删除"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
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
                    {mockData ? (
                        <StatusBar data={mockData} />
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

            <StyleEditor
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveStyle}
                styleToEdit={editingStyle}
                allDefinitions={mockData ? Object.values(mockData.item_definitions) : []}
            />
        </div>
    );
};

export default StyleManager;