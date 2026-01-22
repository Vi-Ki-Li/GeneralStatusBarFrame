
import React, { useState, useEffect, useCallback } from 'react';
import { StyleUnit } from '../../../types';
import { styleService } from '../../../services/styleService';
import { slugify } from '../../../utils/slugify';
import { useToast } from '../../Toast/ToastContext';
import { Paintbrush, Plus, Trash2, Search, List, Check, X as XIcon, AlertTriangle } from 'lucide-react';
import StyleEditor, { DEFAULT_TEMPLATES } from './StyleEditor';
import StylePreview from './StylePreview';
import { v4 as uuidv4 } from 'uuid';
import './StyleManager.css';

const StyleManager: React.FC = () => {
    const [styleUnits, setStyleUnits] = useState<StyleUnit[]>([]);
    const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [unitToDelete, setUnitToDelete] = useState<StyleUnit | null>(null);

    const toast = useToast();

    useEffect(() => {
        const units = styleService.getStyleUnits();
        setStyleUnits(units);
        if (units.length > 0 && !activeUnitId) {
            setActiveUnitId(units[0].id);
        }
    }, []);

    const handleCreateNew = () => { // 此处开始修改
        const newName = "新样式单元";
        let newId = slugify(newName);
        let counter = 1;
        while (styleUnits.some(u => u.id === newId)) {
            newId = `${slugify(newName)}-${counter++}`;
        }

        const defaultTemplate = DEFAULT_TEMPLATES['numeric'];
        const newUnit: StyleUnit = {
            id: newId,
            name: newName,
            css: defaultTemplate.css,
            html: defaultTemplate.html,
            dataType: 'numeric'
        };

        const newUnits = [...styleUnits, newUnit];
        setStyleUnits(newUnits);
        styleService.saveStyleUnits(newUnits);
        setActiveUnitId(newUnit.id);
        toast.success(`已创建 "${newName}"`);
    }; // 此处完成修改

    const handleSelectUnit = (id: string) => {
        setActiveUnitId(id);
    };

    const handleUpdateUnit = useCallback((updatedUnit: StyleUnit) => {
        setStyleUnits(prevUnits => {
            const newUnits = prevUnits.map(u => u.id === updatedUnit.id ? updatedUnit : u);
            return newUnits;
        });
    }, []);
    
    const handleSave = (unitToSave: StyleUnit) => {
        // When saving, ensure the ID is derived from the latest name
        const finalId = slugify(unitToSave.name);
        if (unitToSave.id !== finalId && styleUnits.some(u => u.id === finalId)) {
            toast.error("名称生成的ID已存在", { description: `请尝试一个不同的名称。`});
            return;
        }

        // If ID changed, we need to update the list properly
        const oldId = unitToSave.id;
        unitToSave.id = finalId;

        styleService.deleteStyleUnit(oldId); // Remove old one
        styleService.saveStyleUnit(unitToSave); // Save new one

        // Update local state
        const newUnits = styleUnits.map(u => u.id === oldId ? unitToSave : u);
        setStyleUnits(newUnits);
        setActiveUnitId(unitToSave.id); // Make sure active ID is the new one
        
        toast.success(`样式 "${unitToSave.name}" 已保存`);
    };

    const requestDelete = (unit: StyleUnit, e: React.MouseEvent) => {
        e.stopPropagation();
        setUnitToDelete(unit);
    };

    const confirmDelete = () => {
        if (!unitToDelete) return;
        styleService.deleteStyleUnit(unitToDelete.id);
        const newUnits = styleUnits.filter(u => u.id !== unitToDelete.id);
        setStyleUnits(newUnits);
        if (activeUnitId === unitToDelete.id) {
            setActiveUnitId(newUnits.length > 0 ? newUnits[0].id : null);
        }
        toast.info(`样式 "${unitToDelete.name}" 已删除`);
        setUnitToDelete(null);
    };

    const activeUnit = styleUnits.find(u => u.id === activeUnitId);

    const filteredUnits = styleUnits.filter(u => u.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="style-atelier">
            <div className="style-atelier__sidebar">
                <div className="style-atelier__sidebar-header">
                    <div className="style-atelier__title">
                        <Paintbrush size={18} />
                        <h3>样式单元</h3>
                    </div>
                    <button onClick={handleCreateNew} className="style-atelier__add-btn" title="新建样式单元">
                        <Plus size={16} />
                    </button>
                </div>
                <div className="style-atelier__search-wrapper">
                    <Search size={14} className="style-atelier__search-icon" />
                    <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="搜索..." />
                </div>
                <div className="style-atelier__unit-list">
                    {filteredUnits.length > 0 ? filteredUnits.map(unit => (
                        <div 
                            key={unit.id} 
                            onClick={() => handleSelectUnit(unit.id)}
                            className={`style-atelier__unit-item ${activeUnitId === unit.id ? 'active' : ''}`}
                        >
                            <span className="style-atelier__unit-name">{unit.name}</span>
                            <button onClick={(e) => requestDelete(unit, e)} className="style-atelier__unit-delete-btn">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )) : (
                        <div className="style-atelier__empty-list">
                            <List size={24}/>
                            <span>无样式单元</span>
                        </div>
                    )}
                </div>
            </div>

            {activeUnit ? (
                <>
                    <div className="style-atelier__main">
                        <StyleEditor key={activeUnit.id} unit={activeUnit} onUpdate={handleUpdateUnit} onSave={handleSave} />
                    </div>
                    <div className="style-atelier__preview">
                        <StylePreview unit={activeUnit} />
                    </div>
                </>
            ) : (
                <div className="style-atelier__empty-state">
                     <Paintbrush size={48} />
                     <h2>样式工坊</h2>
                     <p>创建可复用的样式单元来定义你的状态栏外观。</p>
                     <button className="btn btn--primary" onClick={handleCreateNew}>
                         <Plus size={16} /> 创建第一个样式
                     </button>
                </div>
            )}

            {unitToDelete && (
                 <div className="style-atelier__delete-confirm-overlay">
                    <div className="style-atelier__delete-confirm-modal glass-panel">
                        <div className="style-atelier__delete-header">
                            <AlertTriangle size={24} /><h3>确认删除</h3>
                        </div>
                        <p>您确定要删除样式单元 "<strong>{unitToDelete.name}</strong>" 吗？此操作不可撤销。</p>
                        <div className="style-atelier__delete-actions">
                            <button className="btn btn--ghost" onClick={() => setUnitToDelete(null)}>取消</button>
                            <button className="btn btn--danger" onClick={confirmDelete}>
                                <Trash2 size={16} /> 删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StyleManager;
