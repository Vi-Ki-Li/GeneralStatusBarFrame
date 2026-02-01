
import React, { useState, useMemo, useRef } from 'react';
import { ItemDefinition, CategoryDefinition, StatusBarData } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import { Plus, Edit2, Trash2, Box, Type, Layers, List, Check, X as XIcon, AlertTriangle, ChevronsRight, UploadCloud, Loader, ChevronLeft, PanelLeftOpen, PanelLeftClose, Download, Upload } from 'lucide-react';
import DefinitionDrawer from './DefinitionDrawer';
import CategoryDrawer from './CategoryDrawer';
import ContextHelpButton from '../../Shared/ContextHelpButton'; // 此处添加1行
import * as LucideIcons from 'lucide-react';
import { tavernService } from '../../../services/mockTavernService';
import '../ManagerLayout.css';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [editingItemDef, setEditingItemDef] = useState<ItemDefinition | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [editingCatDef, setEditingCatDef] = useState<CategoryDefinition | null>(null);
  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState(false);
  const [confirmDeleteCatKey, setConfirmDeleteCatKey] = useState<string | null>(null);
  const [confirmDeleteItemKey, setConfirmDeleteItemKey] = useState<string | null>(null);
  const [isInjectingAll, setIsInjectingAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = window.innerWidth <= 768; // Simple check

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

  // --- Export Logic ---
  const handleExportDefinition = (def: ItemDefinition, e: React.MouseEvent) => {
      e.stopPropagation();
      const json = JSON.stringify(def, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `def_${def.key}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`规则 "${def.key}" 已导出`);
  };

  // --- Import Logic ---
  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const content = ev.target?.result as string;
              const imported = JSON.parse(content) as ItemDefinition;
              
              if (!imported.key || !imported.type) {
                  throw new Error("Invalid format");
              }

              const newData = { ...data, item_definitions: { ...data.item_definitions, [imported.key]: imported } };
              onUpdate(newData);
              toast.success(`规则 "${imported.key}" 导入成功`);
          } catch (err) {
              toast.error("导入失败: 格式错误");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const injectButtonText = isInjectingAll
    ? '同步中...' 
    : selectedCategory 
      ? `注入 "${selectedCategory.name}"` 
      : '全部注入/同步';

  return (
    <div className="th-manager">
      <div className="th-manager__layout">
          {/* Sidebar */}
          <div className={`th-manager__sidebar ${isSidebarCollapsed ? 'th-manager__sidebar--collapsed' : ''} ${isMobile && mobileView === 'items' ? 'mobile-hidden' : ''}`}>
              <div className="th-manager__sidebar-header">
                  <div className="th-manager__sidebar-title"><Layers size={16} /> 分类</div>
                  <button 
                    onClick={() => setIsSidebarCollapsed(true)} 
                    className="th-manager__icon-btn desktop-only"
                    title="收起侧边栏"
                  >
                      <PanelLeftClose size={16}/>
                  </button>
              </div>
              
              <div className="th-manager__sidebar-content">
                  <button onClick={() => handleSelectCategory(null)} className={`th-manager__list-item ${selectedCategoryKey === null ? 'th-manager__list-item--active' : ''}`}>
                      <div className="th-manager__item-main">
                          <div className="th-manager__item-icon"><ChevronsRight size={16} /></div>
                          <span className="th-manager__item-text">所有分类</span>
                      </div>
                  </button>

                  {categories.map(cat => {
                      const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.CircleHelp;
                      return (
                          <div key={cat.key} className={`th-manager__list-item ${selectedCategoryKey === cat.key ? 'th-manager__list-item--active' : ''}`} onClick={() => handleSelectCategory(cat.key)}>
                              <div className="th-manager__item-main">
                                  <div className="th-manager__item-icon"><Icon size={16} /></div>
                                  <span className="th-manager__item-text">{cat.name}</span>
                              </div>
                              <div className="th-manager__item-actions">
                                  {confirmDeleteCatKey === cat.key ? (
                                      <div style={{display:'flex', gap: 4}}>
                                          <button onClick={(e) => { e.stopPropagation(); executeDeleteCategory(cat.key); }} className="th-manager__icon-btn th-manager__icon-btn--danger"><Check size={16} /></button>
                                          <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteCatKey(null); }} className="th-manager__icon-btn"><XIcon size={16} /></button>
                                      </div>
                                  ) : (
                                      <>
                                          <button onClick={(e) => { e.stopPropagation(); setEditingCatDef(cat); setIsCatDrawerOpen(true); }} className="th-manager__icon-btn"><Edit2 size={16} /></button>
                                          <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteCatKey(cat.key); }} className="th-manager__icon-btn th-manager__icon-btn--danger"><Trash2 size={16} /></button>
                                      </>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
              
              <div className="th-manager__sidebar-footer">
                  <button onClick={() => { setEditingCatDef(null); setIsCatDrawerOpen(true); }} className="th-manager__list-item" style={{justifyContent: 'center', color: 'var(--text-tertiary)'}}>
                      <Plus size={16} /> 新建分类
                  </button>
              </div>
          </div>
          
          {/* Main Content */}
          <div className={`th-manager__main ${isMobile && mobileView === 'categories' ? 'mobile-hidden' : ''}`}>
              <div className="th-manager__main-header">
                  {isMobile && (
                      <button className="th-manager__icon-btn" onClick={() => setMobileView('categories')} style={{marginRight: 8}}>
                          <ChevronLeft size={20} />
                      </button>
                  )}
                  <div className="th-manager__main-title-group">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isSidebarCollapsed && !isMobile && (
                              <button onClick={() => setIsSidebarCollapsed(false)} className="th-manager__icon-btn desktop-only"><PanelLeftOpen size={16} /></button>
                          )}
                          <h2 className="th-manager__main-title">
                              {selectedCategory ? selectedCategory.name : '所有条目规则'}
                          </h2>
                          {/* Help Button - Start Add */}
                          <ContextHelpButton 
                              title="定义工坊帮助" 
                              content={
                                  <>
                                      <p>这里是管理数据“元数据”的地方。您可以定义每个条目的结构、类型和在世界书中的格式。</p>
                                      <ul>
                                          <li><strong>分类管理</strong>: 左侧管理分类（容器）。可以设置分类是“列表”、“网格”还是“标签流”布局。</li>
                                          <li><strong>条目规则</strong>: 点击“新建规则”来定义一个新的数据点（如“HP”）。</li>
                                          <li><strong>注入世界书</strong>: 编辑好规则后，点击“注入/同步”按钮。这会自动在您的 SillyTavern 世界书中创建一条正则替换条目，教导 AI 如何输出这个数据。</li>
                                          <li><strong>数据结构</strong>: 支持“数值”（带进度条）、“文本”、“标签组”和“对象列表”（如背包）。</li>
                                      </ul>
                                  </>
                              } 
                          />
                          {/* Help Button - End Add */}
                      </div>
                      <p className="th-manager__main-subtitle">
                          {selectedCategory ? `(Key: ${selectedCategory.key})` : '全局'}
                          {' '}&bull;{' '}
                          {filteredItems.length} 个条目
                      </p>
                  </div>
                  <div className="th-manager__toolbar" style={{borderTop: 'none', background: 'transparent', padding: 0, marginLeft: 'auto'}}>
                      <button onClick={handleImportClick} className="btn btn--ghost" title="导入单个规则">
                          <Download size={16} /> <span className="desktop-only">导入</span>
                      </button>
                      <button onClick={handleInjectAll} className="btn btn--ghost" disabled={isInjectingAll || filteredItems.length === 0}>
                          {isInjectingAll ? <Loader size={16} className="spinner" /> : <UploadCloud size={16} />}
                          <span className="desktop-only">{injectButtonText}</span>
                      </button>
                      <button 
                        className="btn btn--primary" 
                        onClick={() => { setEditingItemDef(null); setIsItemDrawerOpen(true); }}
                      >
                          <Plus size={16} /> <span className="desktop-only">新建规则</span>
                      </button>
                      <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".json" onChange={handleImportFile} />
                  </div>
              </div>

              <div className="th-manager__main-content">
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
                                                  <div style={{display:'flex', gap: 4, background: 'var(--color-danger-bg)', borderRadius: 4, padding: 2}}>
                                                      <span style={{fontSize: 12, color: 'var(--color-danger)', marginLeft: 4}}>确认?</span>
                                                      <button onClick={() => executeDeleteItemDef(def.key)} className="th-manager__icon-btn th-manager__icon-btn--danger"><Check size={14} /></button>
                                                      <button onClick={() => setConfirmDeleteItemKey(null)} className="th-manager__icon-btn"><XIcon size={14} /></button>
                                                  </div>
                                              ) : (
                                                  <>
                                                      <button onClick={(e) => handleExportDefinition(def, e)} className="th-manager__icon-btn" title="导出规则"><Upload size={16} /></button>
                                                      <button onClick={() => handleInject(def)} className="th-manager__icon-btn" title="注入/同步到世界书"><UploadCloud size={16} /></button>
                                                      <button onClick={() => { setEditingItemDef(def); setIsItemDrawerOpen(true); }} className="th-manager__icon-btn"><Edit2 size={16} /></button>
                                                      <button onClick={() => setConfirmDeleteItemKey(def.key)} className="th-manager__icon-btn th-manager__icon-btn--danger"><Trash2 size={16} /></button>
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
      </div>

      <DefinitionDrawer isOpen={isItemDrawerOpen} onClose={() => setIsItemDrawerOpen(false)} definition={editingItemDef} categories={data.categories} onSave={handleSaveItemDef} onInject={handleInject} existingKeys={itemDefinitions.map(d => d.key)} preselectedCategory={selectedCategoryKey} onGoToStyleEditor={onGoToStyleEditor} />
      <CategoryDrawer isOpen={isCatDrawerOpen} onClose={() => setIsCatDrawerOpen(false)} category={editingCatDef} onSave={handleSaveCategory} existingKeys={categories.map(d => d.key)} />
    </div>
  );
};

export default DefinitionList;
