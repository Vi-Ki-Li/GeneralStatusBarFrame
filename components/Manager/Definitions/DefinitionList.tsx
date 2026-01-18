import React, { useState } from 'react';
import { ItemDefinition, CategoryDefinition, StatusBarData } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import { Plus, Edit2, Trash2, Box, Type, Layers, List, Check, X as XIcon, AlertTriangle } from 'lucide-react';
import DefinitionDrawer from './DefinitionDrawer';
import CategoryDrawer from './CategoryDrawer';
import * as LucideIcons from 'lucide-react';
import './DefinitionList.css';

interface DefinitionListProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const DefinitionList: React.FC<DefinitionListProps> = ({ data, onUpdate }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
  const [editingItemDef, setEditingItemDef] = useState<ItemDefinition | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [editingCatDef, setEditingCatDef] = useState<CategoryDefinition | null>(null);
  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState(false);
  const [confirmDeleteCatKey, setConfirmDeleteCatKey] = useState<string | null>(null);
  const [confirmDeleteItemKey, setConfirmDeleteItemKey] = useState<string | null>(null);

  const categories = Object.values(data.categories || {}).sort((a, b) => a.order - b.order);
  const itemDefinitions = Object.values(data.item_definitions || {}).sort((a, b) => a.key.localeCompare(b.key));

  const handleSaveCategory = (def: CategoryDefinition) => {
    const newData = { ...data, categories: { ...data.categories, [def.key]: def } };
    onUpdate(newData);
    toast.success(`分类 "${def.name}" 已保存`);
  };

  const executeDeleteCategory = (key: string) => {
    const newData = { ...data };
    delete newData.categories[key];
    onUpdate(newData);
    toast.info(`分类 "${key}" 已删除`);
    setConfirmDeleteCatKey(null);
  };

  const handleSaveItemDef = (def: ItemDefinition) => {
    const newData = { ...data, item_definitions: { ...data.item_definitions, [def.key]: def } };
    onUpdate(newData);
    toast.success(`条目 "${def.key}" 已保存`);
  };

  const executeDeleteItemDef = (key: string) => {
    const newData = { ...data };
    delete newData.item_definitions[key];
    onUpdate(newData);
    toast.info(`条目 "${key}" 已删除`);
    setConfirmDeleteItemKey(null);
  };

  const InlineConfirm = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
    <div className="inline-confirm animate-fade-in">
        <span className="inline-confirm__text"><AlertTriangle size={12} /> 确认?</span>
        <button onClick={(e) => { e.stopPropagation(); onConfirm(); }} className="inline-confirm__btn inline-confirm__btn--yes" title="确认删除"><Check size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="inline-confirm__btn inline-confirm__btn--no" title="取消"><XIcon size={14} /></button>
    </div>
  );

  return (
    <div className="definition-list">
      <div className="definition-list__header">
        <div className="definition-list__header-main">
             <div>
                <h3 className="definition-list__title"><Box size={22} /> 定义工作室</h3>
                <p className="definition-list__subtitle">管理状态栏的结构（分类）和内容规则（条目）。</p>
             </div>
             <button 
                className="btn btn--primary" 
                onClick={() => activeTab === 'categories' 
                    ? (setEditingCatDef(null), setIsCatDrawerOpen(true)) 
                    : (setEditingItemDef(null), setIsItemDrawerOpen(true))
                }
            >
                <Plus size={16} /> {activeTab === 'categories' ? '新建分类' : '新建条目规则'}
             </button>
        </div>

        <div className="definition-list__tabs">
            <button onClick={() => setActiveTab('categories')} className={`definition-list__tab ${activeTab === 'categories' ? 'active' : ''}`}>
                <Layers size={16} /> 分类容器 (Categories)
            </button>
            <button onClick={() => setActiveTab('items')} className={`definition-list__tab ${activeTab === 'items' ? 'active' : ''}`}>
                <List size={16} /> 条目规则 (Item Rules)
            </button>
        </div>
      </div>

      <div className="definition-list__content">
        {activeTab === 'categories' && (
            <div className="definition-list__grid">
                {categories.map(cat => {
                    const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.CircleHelp;
                    return (
                        <div key={cat.key} className="def-card def-card--category glass-panel">
                            <div className="def-card__main">
                                <div className="def-card__icon-wrapper"><Icon size={20} /></div>
                                <div>
                                    <div className="def-card__name">{cat.name}</div>
                                    <div className="def-card__meta">Key: {cat.key} | Order: {cat.order}</div>
                                </div>
                            </div>
                            <div className="def-card__actions">
                                {confirmDeleteCatKey === cat.key ? (
                                    <InlineConfirm onConfirm={() => executeDeleteCategory(cat.key)} onCancel={() => setConfirmDeleteCatKey(null)} />
                                ) : (
                                    <>
                                        <button onClick={() => { setEditingCatDef(cat); setIsCatDrawerOpen(true); }} className="btn btn--ghost"><Edit2 size={16} /></button>
                                        <button onClick={() => setConfirmDeleteCatKey(cat.key)} className="btn btn--ghost btn--delete"><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {activeTab === 'items' && (
             <div className="definition-list__grid">
                {itemDefinitions.map(def => (
                    <div key={def.key} className="def-card def-card--item glass-panel">
                        <div className="def-card__header">
                            <div className="def-card__name-group">
                                <div className="def-card__name">{def.key}</div>
                                <div className="def-card__category-tag">
                                    {data.categories[def.defaultCategory || '']?.name || def.defaultCategory || 'Default'}
                                </div>
                            </div>
                            <div className="def-card__actions">
                                {confirmDeleteItemKey === def.key ? (
                                    <InlineConfirm onConfirm={() => executeDeleteItemDef(def.key)} onCancel={() => setConfirmDeleteItemKey(null)} />
                                ) : (
                                    <>
                                        <button onClick={() => { setEditingItemDef(def); setIsItemDrawerOpen(true); }} className="btn btn--ghost"><Edit2 size={16} /></button>
                                        <button onClick={() => setConfirmDeleteItemKey(def.key)} className="btn btn--ghost btn--delete"><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="def-card__meta-group">
                            <span className="def-card__meta-chip"><Type size={12} />
                                {def.type === 'text' ? '文本' : def.type === 'numeric' ? '数值' : '标签组'}
                            </span>
                        </div>
                    </div>
                ))}
                {itemDefinitions.length === 0 && (
                     <div className="definition-list__empty-state">暂无特殊条目规则。</div>
                )}
             </div>
        )}
      </div>

      <DefinitionDrawer isOpen={isItemDrawerOpen} onClose={() => setIsItemDrawerOpen(false)} definition={editingItemDef} categories={data.categories} onSave={handleSaveItemDef} existingKeys={itemDefinitions.map(d => d.key)} />
      <CategoryDrawer isOpen={isCatDrawerOpen} onClose={() => setIsCatDrawerOpen(false)} category={editingCatDef} onSave={handleSaveCategory} existingKeys={categories.map(d => d.key)} />
    </div>
  );
};

export default DefinitionList;