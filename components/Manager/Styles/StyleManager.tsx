import React, { useState, useEffect, useMemo } from 'react';
import { StyleDefinition } from '../../../types';
import { styleService } from '../../../services/styleService';
import { useToast } from '../../Toast/ToastContext';
import { Plus, Edit2, Trash2, Palette, AlertTriangle, Check, X as XIcon, Paintbrush } from 'lucide-react';
import StyleEditor from './StyleEditor';
import StatusBar from '../../StatusBar/StatusBar'; // For preview
import { tavernService } from '../../../services/mockTavernService'; // For mock data
import { StatusBarData } from '../../../types';
import './StyleManager.css';

const StyleManager: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const [styles, setStyles] = useState<StyleDefinition[]>([]);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<StyleDefinition | null>(null);
    const [deletingStyle, setDeletingStyle] = useState<StyleDefinition | null>(null);
    const [mockData, setMockData] = useState<StatusBarData | null>(null);

    const toast = useToast();

    useEffect(() => {
        loadStyles();
        // Load mock data for the preview
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
                toast.info(`样式 "${deletingStyle.name}" 已删除`);
                setDeletingStyle(null);
            } catch (e) {
                toast.error("删除样式失败");
            }
        }
    };

    const groupedStyles = useMemo(() => {
        return styles.reduce((acc, style) => {
            const type = style.dataType || 'other';
            if (!acc[type]) acc[type] = [];
            acc[type].push(style);
            return acc;
        }, {} as Record<string, StyleDefinition[]>);
    }, [styles]);

    const groupOrder: (keyof typeof groupedStyles)[] = ['numeric', 'array', 'text', 'theme', 'other'];
    const groupLabels = {
        numeric: '数值样式',
        array: '标签组样式',
        text: '文本样式',
        theme: '全局主题',
        other: '其他',
    };

    return (
        <div className="style-atelier">
            {/* --- Left Sidebar: Style List --- */}
            <div className="style-atelier__sidebar">
                <div className="style-atelier__sidebar-header">
                    <Palette size={18}/>
                    <h3>样式单元</h3>
                </div>
                <div className="style-atelier__style-list">
                    {groupOrder.map(groupKey => (
                        groupedStyles[groupKey] && (
                            <div key={groupKey} className="style-atelier__group">
                                <h4 className="style-atelier__group-title">{groupLabels[groupKey as keyof typeof groupLabels]}</h4>
                                {groupedStyles[groupKey].map(style => (
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

            {/* --- Right Main Area: Holistic Preview --- */}
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

            {/* --- Deletion Confirmation Modal --- */}
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

            {/* --- Editor Modal --- */}
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