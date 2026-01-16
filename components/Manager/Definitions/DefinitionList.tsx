import React, { useState } from 'react';
import { ItemDefinition, CategoryDefinition, StatusBarData } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import { Plus, Edit2, Trash2, Box, Type, Layers, List, Check, X as XIcon, AlertTriangle } from 'lucide-react';
import DefinitionDrawer from './DefinitionDrawer';
import CategoryDrawer from './CategoryDrawer';
import * as LucideIcons from 'lucide-react';

interface DefinitionListProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const DefinitionList: React.FC<DefinitionListProps> = ({ data, onUpdate }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
  
  // State for Drawers
  const [editingItemDef, setEditingItemDef] = useState<ItemDefinition | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [editingCatDef, setEditingCatDef] = useState<CategoryDefinition | null>(null);
  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState(false);

  // State for Inline Delete Confirmation
  const [confirmDeleteCatKey, setConfirmDeleteCatKey] = useState<string | null>(null);
  const [confirmDeleteItemKey, setConfirmDeleteItemKey] = useState<string | null>(null);

  // --- Logic for Categories ---
  const categories = Object.values(data.categories || {}).sort((a, b) => a.order - b.order);

  const handleSaveCategory = (def: CategoryDefinition) => {
    const newData = { ...data };
    if (!newData.categories) newData.categories = {};
    newData.categories[def.key] = def;
    onUpdate(newData);
    toast.success(`分类 "${def.name}" 已保存`);
  };

  const requestDeleteCategory = (key: string) => {
    console.log('[DefinitionList] Requesting delete for Category:', key);
    setConfirmDeleteCatKey(key);
  };

  const executeDeleteCategory = (key: string) => {
    console.log('[DefinitionList] Executing delete for Category:', key);
    const newData = { ...data };
    delete newData.categories[key];
    onUpdate(newData);
    toast.info(`分类 "${key}" 已删除`);
    setConfirmDeleteCatKey(null);
  };

  // --- Logic for Items ---
  const itemDefinitions = Object.values(data.item_definitions || {}).sort((a, b) => a.key.localeCompare(b.key));

  const handleSaveItemDef = (def: ItemDefinition) => {
    const newData = { ...data };
    if (!newData.item_definitions) newData.item_definitions = {};
    newData.item_definitions[def.key] = def;
    onUpdate(newData);
    toast.success(`条目 "${def.key}" 已保存`);
  };

  const requestDeleteItemDef = (key: string) => {
    console.log('[DefinitionList] Requesting delete for ItemDef:', key);
    setConfirmDeleteItemKey(key);
  };

  const executeDeleteItemDef = (key: string) => {
    console.log('[DefinitionList] Executing delete for ItemDef:', key);
    const newData = { ...data };
    delete newData.item_definitions[key];
    onUpdate(newData);
    toast.info(`条目 "${key}" 已删除`);
    setConfirmDeleteItemKey(null);
  };

  // 辅助组件：行内删除确认
  const InlineConfirm = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '8px', animation: 'fadeIn 0.2s' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> 确认?
        </span>
        <button 
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            className="btn btn--ghost"
            style={{ padding: '4px', height: '24px', width: '24px', color: 'var(--color-danger)' }}
            title="确认删除"
        >
            <Check size={14} />
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="btn btn--ghost"
            style={{ padding: '4px', height: '24px', width: '24px', color: 'var(--text-secondary)' }}
            title="取消"
        >
            <XIcon size={14} />
        </button>
    </div>
  );

  return (
    <div style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Tabs */}
      <div style={{ 
          padding: '24px 24px 0 24px', 
          background: 'var(--glass-bg)',
          borderBottom: '1px solid var(--chip-border)',
          zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={22} style={{ color: 'var(--color-primary)' }} />
                    定义工作室
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    管理状态栏的结构（分类）和内容规则（条目）。
                </p>
             </div>
             <button 
                className="btn btn--primary" 
                onClick={() => activeTab === 'categories' 
                    ? (setEditingCatDef(null), setIsCatDrawerOpen(true)) 
                    : (setEditingItemDef(null), setIsItemDrawerOpen(true))
                }
            >
                <Plus size={16} /> 
                {activeTab === 'categories' ? '新建分类' : '新建条目规则'}
             </button>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
            <button 
                onClick={() => setActiveTab('categories')}
                style={{
                    padding: '10px 4px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'categories' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    color: activeTab === 'categories' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s'
                }}
            >
                <Layers size={16} /> 分类容器 (Categories)
            </button>
            <button 
                onClick={() => setActiveTab('items')}
                style={{
                    padding: '10px 4px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'items' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    color: activeTab === 'items' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s'
                }}
            >
                <List size={16} /> 条目规则 (Item Rules)
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        
        {/* CATEGORIES LIST */}
        {activeTab === 'categories' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {categories.map(cat => {
                    const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.CircleHelp;
                    const isConfirming = confirmDeleteCatKey === cat.key;

                    return (
                        <div key={cat.key} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--chip-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '10px', 
                                    background: 'rgba(var(--color-primary), 0.1)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--color-primary)'
                                }}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{cat.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                                        Key: {cat.key} | Order: {cat.order}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {isConfirming ? (
                                    <InlineConfirm 
                                        onConfirm={() => executeDeleteCategory(cat.key)} 
                                        onCancel={() => setConfirmDeleteCatKey(null)} 
                                    />
                                ) : (
                                    <>
                                        <button onClick={() => { setEditingCatDef(cat); setIsCatDrawerOpen(true); }} className="btn btn--ghost" style={{ padding: '6px' }}><Edit2 size={16} /></button>
                                        <button onClick={() => requestDeleteCategory(cat.key)} className="btn btn--ghost hover-danger" style={{ padding: '6px' }}><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* ITEMS LIST */}
        {activeTab === 'items' && (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {itemDefinitions.map(def => {
                    const isConfirming = confirmDeleteItemKey === def.key;
                    
                    return (
                        <div key={def.key} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--chip-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{def.key}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {data.categories[def.defaultCategory || '']?.name || def.defaultCategory || 'Default'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    {isConfirming ? (
                                        <InlineConfirm 
                                            onConfirm={() => executeDeleteItemDef(def.key)} 
                                            onCancel={() => setConfirmDeleteItemKey(null)} 
                                        />
                                    ) : (
                                        <>
                                            <button onClick={() => { setEditingItemDef(def); setIsItemDrawerOpen(true); }} className="btn btn--ghost" style={{ padding: '6px' }}><Edit2 size={16} /></button>
                                            <button onClick={() => requestDeleteItemDef(def.key)} className="btn btn--ghost hover-danger" style={{ padding: '6px' }}><Trash2 size={16} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-app)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--chip-border)' }}>
                                    <Type size={12} />
                                    {def.type === 'text' && '文本'}
                                    {def.type === 'numeric' && '数值'}
                                    {def.type === 'array' && '标签组'}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {itemDefinitions.length === 0 && (
                     <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                        暂无特殊条目规则。
                    </div>
                )}
             </div>
        )}
      </div>

      {/* Drawers */}
      <DefinitionDrawer 
        isOpen={isItemDrawerOpen} 
        onClose={() => setIsItemDrawerOpen(false)}
        definition={editingItemDef}
        categories={data.categories}
        onSave={handleSaveItemDef}
        existingKeys={itemDefinitions.map(d => d.key)}
      />

      <CategoryDrawer 
        isOpen={isCatDrawerOpen} 
        onClose={() => setIsCatDrawerOpen(false)}
        category={editingCatDef}
        onSave={handleSaveCategory}
        existingKeys={categories.map(d => d.key)}
      />
    </div>
  );
};

export default DefinitionList;