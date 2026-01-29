import React, { useState, useMemo } from 'react';
import { ItemDefinition, CategoryDefinition, StatusBarData } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import { Plus, Edit2, Trash2, Box, Type, Layers, List, Check, X as XIcon, AlertTriangle, ChevronsRight, UploadCloud, Loader, ChevronLeft } from 'lucide-react';
import DefinitionDrawer from './DefinitionDrawer';
import CategoryDrawer from './CategoryDrawer';
import * as LucideIcons from 'lucide-react';
import { tavernService } from '../../../services/mockTavernService';
import './DefinitionList.css';

interface DefinitionListProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  onGoToStyleEditor: (itemKey: string) => void;
}

const DefinitionList: React.FC<DefinitionListProps> = ({ data, onUpdate, onGoToStyleEditor }) => {
  const toast = useToast();
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'categories' | 'items'>('categories');

  const [editingItemDef, setEditingItemDef] = useState<ItemDefinition | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [editingCatDef, setEditingCatDef] = useState<CategoryDefinition | null>(null);
  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState(false);
  const [confirmDeleteCatKey, setConfirmDeleteCatKey] = useState<string | null>(null);
  const [confirmDeleteItemKey, setConfirmDeleteItemKey] = useState<string | null>(null);
  const [isInjectingAll, setIsInjectingAll] = useState(false);

  const categories = (Object.values(data.categories || {}) as CategoryDefinition[]).sort((a, b) => a.order - b.order);
  const itemDefinitions = (Object.values(data.item_definitions || {}) as ItemDefinition[]).sort((a, b) => a.key.localeCompare(b.key));

  const filteredItems = useMemo(() => {
    if (selectedCategoryKey === null) {
      return itemDefinitions;
    }
    return itemDefinitions.filter(def => def.defaultCategory === selectedCategoryKey);
  }, [selectedCategoryKey, itemDefinitions]);
  
  const selectedCategory = selectedCategoryKey ? data.categories[selectedCategoryKey] : null;

  const handleSelectCategory = (key: string | null) => {
    setSelectedCategoryKey(key);
    setMobileView('items');
  };
  
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
  
  const handleInject = async (def: ItemDefinition) => {
    const result = await tavernService.injectDefinition(def, data.categories);
    switch (result.status) {
        case 'created':
            toast.success(`规则 "${def.key}" 已成功注入`, { description: '新的世界书条目已创建' });
            break;
        case 'updated':
            toast.success(`规则 "${def.key}" 已同步更新`);
            break;
        case 'no_change':
            toast.info(`规则 "${def.key}" 无需更新`);
            break;
        case 'error':
            toast.error(`注入 "${def.key}" 失败`);
            break;
    }
  };

  const handleInjectAll = async () => {
    const definitionsToInject = selectedCategoryKey === null 
      ? itemDefinitions 
      : filteredItems;

    if (definitionsToInject.length === 0) {
      toast.info("当前范围内没有可注入的条目");
      return;
    }

    setIsInjectingAll(true);
    const result = await tavernService.injectMultipleDefinitions(definitionsToInject, data.categories);
    setIsInjectingAll(false);
    
    const descriptions = [
        result.created > 0 ? `新增 ${result.created}` : '',
        result.updated > 0 ? `更新 ${result.updated}` : '',
        result.no_change > 0 ? `无变化 ${result.no_change}` : '',
        result.errors > 0 ? `失败 ${result.errors}` : '',
    ].filter(Boolean).join(', ');
    
    const title = selectedCategory 
      ? `分类 "${selectedCategory.name}" 同步完成` 
      : "批量同步完成";

    if (result.errors > 0) {
        toast.error(title, { description: `操作有误: ${descriptions}` });
    } else if (result.created > 0 || result.updated > 0) {
        toast.success(title, { description: descriptions });
    } else {
        toast.info("所有规则均无需更新");
    }
  };

  const InlineConfirm = ({ onConfirm, onCancel, context }: { onConfirm: () => void, onCancel: () => void, context?: string }) => (
    <div className={`inline-confirm ${context ? `inline-confirm--${context}` : ''} animate-fade-in`}>
        <span className="inline-confirm__text"><AlertTriangle size={12} /> 确认?</span>
        <button onClick={(e) => { e.stopPropagation(); onConfirm(); }} className="inline-confirm__btn inline-confirm__btn--yes" title="确认删除"><Check size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="inline-confirm__btn inline-confirm__btn--no" title="取消"><XIcon size={14} /></button>
    </div>
  );

  const injectButtonText = isInjectingAll
    ? '同步中...' 
    : selectedCategory 
      ? `注入 "${selectedCategory.name}"` 
      : '全部注入/同步';

  return (
    <div className="def-studio">
      <div className={`def-studio__sidebar ${mobileView === 'items' ? 'mobile-hidden' : ''}`}>
          <div className="def-studio__sidebar-header">
              <Layers size={18} />
              <h3>分类</h3>
          </div>
          <div className="def-studio__cat-list">
              <div onClick={() => handleSelectCategory(null)} className={`def-studio__cat-item-wrapper ${selectedCategoryKey === null ? 'active' : ''}`}>
                  <div className="def-studio__cat-item">
                      <ChevronsRight size={16} />
                      <span>所有分类</span>
                  </div>
              </div>

              {categories.map(cat => {
                  const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.CircleHelp;
                  return (
                      <div key={cat.key} className={`def-studio__cat-item-wrapper ${selectedCategoryKey === cat.key ? 'active' : ''}`}>
                          <div className="def-studio__cat-item" onClick={() => handleSelectCategory(cat.key)}>
                              <Icon size={16} />
                              <span>{cat.name}</span>
                          </div>
                          <div className="def-studio__cat-item-actions">
                              {confirmDeleteCatKey === cat.key ? (
                                  <InlineConfirm context="sidebar" onConfirm={() => executeDeleteCategory(cat.key)} onCancel={() => setConfirmDeleteCatKey(null)} />
                              ) : (
                                  <>
                                      <button onClick={() => { setEditingCatDef(cat); setIsCatDrawerOpen(true); }} className="btn btn--ghost" title="编辑"><Edit2 size={14} /></button>
                                      <button onClick={() => setConfirmDeleteCatKey(cat.key)} className="btn btn--ghost btn--delete" title="删除"><Trash2 size={14} /></button>
                                  </>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
          <div className="def-studio__sidebar-footer">
              <button onClick={() => { setEditingCatDef(null); setIsCatDrawerOpen(true); }} className="def-studio__add-cat-btn" title="新建分类">
                  <Plus size={16} /> 新建分类
              </button>
          </div>
      </div>
      
      <div className={`def-studio__main ${mobileView === 'categories' ? 'mobile-hidden' : ''}`}>
          <div className="def-studio__main-header">
              <button className="def-studio__back-btn" onClick={() => setMobileView('categories')}>
                  <ChevronLeft size={16} />
                  返回分类
              </button>
              <div>
                  <h2 className="def-studio__main-title">
                      {selectedCategory ? selectedCategory.name : '所有条目规则'}
                  </h2>
                  <p className="def-studio__main-subtitle">
                      {selectedCategory ? `(Key: ${selectedCategory.key})` : '全局'}
                      {' '}&bull;{' '}
                      {filteredItems.length} 个条目
                  </p>
              </div>
              <div className="def-studio__header-actions">
                  <button onClick={handleInjectAll} className="btn btn--ghost" disabled={isInjectingAll || filteredItems.length === 0}>
                      {isInjectingAll ? <Loader size={16} className="spinner" /> : <UploadCloud size={16} />}
                      <span className="desktop-only">{injectButtonText}</span>
                  </button>
                  <button 
                    className="btn btn--primary" 
                    onClick={() => { setEditingItemDef(null); setIsItemDrawerOpen(true); }}
                  >
                      <Plus size={16} /> <span className="desktop-only">新建条目规则</span>
                  </button>
              </div>
          </div>

          <div className="def-studio__main-content">
              {filteredItems.length > 0 ? (
                  <div className="def-studio__item-grid">
                      {filteredItems.map(def => {
                          const isComplex = def.structure?.parts && def.structure.parts.length > 0;
                          return (
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
                                                  <button onClick={() => handleInject(def)} className="btn btn--ghost" title="注入/同步到世界书"><UploadCloud size={16} /></button>
                                                  <button onClick={() => { setEditingItemDef(def); setIsItemDrawerOpen(true); }} className="btn btn--ghost"><Edit2 size={16} /></button>
                                                  <button onClick={() => setConfirmDeleteItemKey(def.key)} className="btn btn--ghost btn--delete"><Trash2 size={16} /></button>
                                              </>
                                          )}
                                      </div>
                                  </div>
                                  <div className="def-card__meta-group">
                                      <span className="def-card__meta-chip">
                                          <Type size={12} />
                                          {def.type === 'text' ? '文本' : def.type === 'numeric' ? '数值' : def.type === 'list-of-objects' ? '对象列表' : '标签组'}
                                      </span>
                                      {isComplex && (
                                          <span className="def-card__meta-chip highlight">
                                              自定义结构 ({def.structure?.parts.length})
                                          </span>
                                      )}
                                  </div>
                                  {def.name && <div className="def-card__display-name">{def.name}</div>}
                              </div>
                          );
                      })}
                  </div>
              ) : (
                  <div className="def-studio__empty-state">
                      <List size={40} />
                      <p>{selectedCategory ? `分类 “${selectedCategory.name}” 下暂无条目规则` : '暂无条目规则'}</p>
                      <button className="btn btn--primary" onClick={() => { setEditingItemDef(null); setIsItemDrawerOpen(true); }}>
                          <Plus size={16} /> 创建第一个
                      </button>
                  </div>
              )}
          </div>
      </div>

      <DefinitionDrawer isOpen={isItemDrawerOpen} onClose={() => setIsItemDrawerOpen(false)} definition={editingItemDef} categories={data.categories} onSave={handleSaveItemDef} onInject={handleInject} existingKeys={itemDefinitions.map(d => d.key)} preselectedCategory={selectedCategoryKey} onGoToStyleEditor={onGoToStyleEditor} />
      <CategoryDrawer isOpen={isCatDrawerOpen} onClose={() => setIsCatDrawerOpen(false)} category={editingCatDef} onSave={handleSaveCategory} existingKeys={categories.map(d => d.key)} />
    </div>
  );
};

export default DefinitionList;