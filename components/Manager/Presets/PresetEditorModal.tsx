
import React, { useState, useEffect, useMemo } from 'react';
import { Preset, ItemDefinition, StyleDefinition, CategoryDefinition } from '../../../types';
import { LayoutNode } from '../../../types/layout';
import { useToast } from '../../Toast/ToastContext';
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits';
import { getNarrativeConfigs, NarrativeConfig } from '../../../utils/snapshotGenerator';
import { ManagerModule } from '../Navigation/ModuleNavigation';
import { X, Save, Search, LayoutTemplate, MessageSquareQuote, CheckSquare, Square, ArrowUpRight, Check, Paintbrush, List, Grid, RotateCcw, Box, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import ManagerModal from '../ManagerModal';
import './PresetEditorModal.css';

interface PresetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: Preset) => void;
  presetToEdit: Preset | null;
  allDefinitions: ItemDefinition[];
  categories: { [key: string]: CategoryDefinition };
  allStyles: StyleDefinition[];
  currentLayout?: LayoutNode[];
  onNavigate: (module: ManagerModule) => void;
}

const PresetEditorModal: React.FC<PresetEditorModalProps> = ({
  isOpen, onClose, onSave, presetToEdit, allDefinitions, categories, allStyles, currentLayout, onNavigate
}) => {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedItemKeys, setSelectedItemKeys] = useState<Set<string>>(new Set());
  const [styleOverrides, setStyleOverrides] = useState<{ [key: string]: string }>({});
  const [includeLayout, setIncludeLayout] = useState(false);
  const [selectedNarrativeId, setSelectedNarrativeId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('grouped');
  const [showOptions, setShowOptions] = useState(true);
  
  const [narrativeConfigs, setNarrativeConfigs] = useState<NarrativeConfig[]>([]);
  
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setNarrativeConfigs(getNarrativeConfigs());
      
      if (presetToEdit) {
        setName(presetToEdit.name);
        setSelectedItemKeys(new Set(presetToEdit.itemKeys));
        setStyleOverrides(presetToEdit.styleOverrides || {});
        setIncludeLayout(!!presetToEdit.layout && presetToEdit.layout.length > 0);
        setSelectedNarrativeId(presetToEdit.narrativeConfigId || '');
        setShowOptions(false); // Default to collapsed when editing to show more list
      } else {
        setName('');
        setSelectedItemKeys(new Set());
        setStyleOverrides({});
        setIncludeLayout(false);
        setSelectedNarrativeId('');
        setShowOptions(true);
      }
      setSearch('');
    }
  }, [isOpen, presetToEdit]);

  const filteredDefinitions = useMemo(() => {
    if (!search) return allDefinitions;
    const lowerSearch = search.toLowerCase();
    return allDefinitions.filter(def => 
      def.key.toLowerCase().includes(lowerSearch) || 
      (def.name && def.name.toLowerCase().includes(lowerSearch))
    );
  }, [search, allDefinitions]);

  const groupedDefinitions = useMemo(() => {
      const groups: Record<string, ItemDefinition[]> = {};
      const sortedCats = Object.values(categories).sort((a,b) => a.order - b.order);
      
      // Initialize with sorted order
      sortedCats.forEach(c => { groups[c.key] = []; });
      groups['Other'] = [];

      filteredDefinitions.forEach(def => {
          const cat = def.defaultCategory && groups[def.defaultCategory] ? def.defaultCategory : 'Other';
          groups[cat].push(def);
      });

      // Filter out empty groups
      return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredDefinitions, categories]);

  const availableStyles = useMemo(() => {
    const defaultOption: StyleDefinition = { id: 'style_default', name: '默认', dataType: 'numeric', css: '' };
    const filteredUserStyles = allStyles.filter(s => s.dataType !== 'theme');
    const filteredDefaults = DEFAULT_STYLE_UNITS.filter(s => s.dataType !== 'theme') as unknown as StyleDefinition[];
    return [defaultOption, ...filteredDefaults, ...filteredUserStyles];
  }, [allStyles]);

  const handleToggleItem = (key: string) => {
    setSelectedItemKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };
  
  const handleSelectAll = () => {
      const allKeys = filteredDefinitions.map(d => d.key);
      setSelectedItemKeys(prev => {
          const newSet = new Set(prev);
          allKeys.forEach(k => newSet.add(k));
          return newSet;
      });
  };

  const handleDeselectAll = () => {
      const allKeys = filteredDefinitions.map(d => d.key);
      setSelectedItemKeys(prev => {
          const newSet = new Set(prev);
          allKeys.forEach(k => newSet.delete(k));
          return newSet;
      });
  };

  const handleInvertSelect = () => {
      const visibleKeys = filteredDefinitions.map(d => d.key);
      setSelectedItemKeys(prev => {
          const newSet = new Set(prev);
          visibleKeys.forEach(k => {
              if (newSet.has(k)) newSet.delete(k);
              else newSet.add(k);
          });
          return newSet;
      });
  };

  const handleSelectCategoryGroup = (groupItems: ItemDefinition[], select: boolean) => {
      const keys = groupItems.map(d => d.key);
      setSelectedItemKeys(prev => {
          const newSet = new Set(prev);
          keys.forEach(k => select ? newSet.add(k) : newSet.delete(k));
          return newSet;
      });
  };
  
  const handleOverrideChange = (itemKey: string, styleId: string) => {
    setStyleOverrides(prev => {
      const newOverrides = { ...prev };
      if (styleId === 'style_default') {
        delete newOverrides[itemKey];
      } else {
        newOverrides[itemKey] = styleId;
      }
      return newOverrides;
    });
  };

  const handleNavigate = (module: ManagerModule) => {
      onClose();
      onNavigate(module);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("预设名称不能为空");
      return;
    }
    
    const preset: Preset = {
      id: presetToEdit?.id || '',
      name: name.trim(),
      timestamp: Date.now(),
      itemKeys: Array.from(selectedItemKeys),
      styleOverrides,
      narrativeConfigId: selectedNarrativeId || undefined,
    };

    if (includeLayout) {
        if (currentLayout && currentLayout.length > 0) {
            preset.layout = currentLayout;
        } else {
            if (presetToEdit?.layout) {
                 preset.layout = presetToEdit.layout;
                 toast.info("保留了原有的布局设置 (因为当前没有活动布局)");
            } else {
                 toast.warning("当前没有自定义布局，预设将不包含布局信息");
            }
        }
    }

    onSave(preset);
  };

  const renderItemCard = (def: ItemDefinition) => {
      const isSelected = selectedItemKeys.has(def.key);
      const hasOverride = styleOverrides[def.key] && styleOverrides[def.key] !== 'style_default';
      
      return (
        <div 
          key={def.key} 
          className={`preset-item-card ${isSelected ? 'selected' : ''}`}
          onClick={() => handleToggleItem(def.key)}
        >
          <div className="preset-item-card__header">
              <div className="preset-item-card__checkbox">
                  {isSelected && <Check size={12} />}
              </div>
              <div className="preset-item-card__info">
                  <div className="preset-item-card__name">{def.name || def.key}</div>
                  <div className="preset-item-card__key">{def.key}</div>
              </div>
          </div>
          
          {isSelected && (
              <div className="preset-item-card__override" onClick={e => e.stopPropagation()}>
                   <div className="preset-item-card__override-label">
                       <Paintbrush size={10} /> 样式:
                   </div>
                   <select 
                     value={styleOverrides[def.key] || 'style_default'}
                     onChange={e => handleOverrideChange(def.key, e.target.value)}
                     className={`preset-item-card__select ${hasOverride ? 'highlight' : ''}`}
                   >
                     {availableStyles.map(style => (
                       <option key={style.id} value={style.id}>
                           {style.name}
                       </option>
                     ))}
                   </select>
              </div>
          )}
        </div>
      );
  };

  return (
    <ManagerModal isOpen={isOpen} onClose={onClose}>
      <div className="preset-editor">
        {/* Header */}
        <div className="preset-editor__header">
          <div className="preset-editor__title-group">
              <h3 className="preset-editor__title">
                {presetToEdit ? '编辑配置预设' : '新建配置预设'}
              </h3>
              <p className="preset-editor__subtitle">打包定义、样式、布局和叙事风格</p>
          </div>
          <button onClick={onClose} className="preset-editor__close-btn"><X size={24} /></button>
        </div>

        {/* Fixed Top Section: Meta + Toolbar */}
        <div className="preset-editor__top-section">
            <div className="preset-editor__meta-header">
                <input 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="输入预设名称 (例如: 魔法世界观 v1)"
                    className="preset-editor__name-input"
                    autoFocus
                />
                <button 
                    className={`btn btn--ghost btn--sm ${showOptions ? 'active' : ''}`}
                    onClick={() => setShowOptions(!showOptions)}
                    title={showOptions ? "收起高级配置" : "展开高级配置"}
                >
                    <SlidersHorizontal size={14} /> 
                    {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>
            
            {showOptions && (
                <div className="preset-editor__options-grid animate-fade-in">
                    {/* Narrative Option */}
                    <div className="preset-option-card">
                        <div className="preset-option-card__header">
                            <MessageSquareQuote size={18} className="preset-option-card__icon"/>
                            <span>叙事风格</span>
                        </div>
                        <select 
                            value={selectedNarrativeId} 
                            onChange={e => setSelectedNarrativeId(e.target.value)}
                            className="preset-option-card__select"
                        >
                            <option value="">(不绑定) 保持当前</option>
                            {narrativeConfigs.map(config => (
                                <option key={config.id} value={config.id}>{config.name} {config.isBuiltIn ? '(内置)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Layout Option */}
                    <div 
                        className={`preset-option-card clickable ${includeLayout ? 'active' : ''}`}
                        onClick={() => setIncludeLayout(!includeLayout)}
                    >
                        <div className="preset-option-card__header">
                            <LayoutTemplate size={18} className="preset-option-card__icon"/>
                            <span>布局结构</span>
                            <div className="preset-option-card__checkbox">
                                {includeLayout && <Check size={12} />}
                            </div>
                        </div>
                        <div className="preset-option-card__body">
                            {includeLayout ? '包含当前布局快照' : '不包含 (仅应用数据)'}
                        </div>
                        <button 
                            className="preset-option-card__link"
                            onClick={(e) => { e.stopPropagation(); handleNavigate('LAYOUT'); }}
                            title="前往布局编排"
                        >
                            <ArrowUpRight size={12}/> 去调整
                        </button>
                    </div>
                </div>
            )}

            <div className="th-toolbar preset-editor__toolbar">
                <div className="th-search-box">
                    <Search size={16} />
                    <input 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="搜索定义..."
                    />
                </div>
                <div className="preset-editor__toolbar-actions">
                    <button onClick={handleSelectAll} className="btn btn--ghost btn--sm"><CheckSquare size={14}/> 全选</button>
                    <button onClick={handleInvertSelect} className="btn btn--ghost btn--sm"><RotateCcw size={14}/> 反选</button>
                    <button onClick={handleDeselectAll} className="btn btn--ghost btn--sm"><Square size={14}/> 全不选</button>
                </div>
                <div className="preset-editor__view-switcher">
                    <button 
                        className={`btn-icon-switch ${viewMode === 'grouped' ? 'active' : ''}`}
                        onClick={() => setViewMode('grouped')}
                        title="分组视图"
                    >
                        <List size={16} />
                    </button>
                    <button 
                        className={`btn-icon-switch ${viewMode === 'flat' ? 'active' : ''}`}
                        onClick={() => setViewMode('flat')}
                        title="平铺视图"
                    >
                        <Grid size={16} />
                    </button>
                </div>
                <span className="preset-editor__count-badge">{selectedItemKeys.size} 已选</span>
            </div>
        </div>

        {/* Scrollable List Area */}
        <div className="preset-editor__scroll-area">
            <div className="preset-editor__list-container">
              {viewMode === 'flat' ? (
                  <div className="preset-editor__grid">
                    {filteredDefinitions.map(def => renderItemCard(def))}
                  </div>
              ) : (
                  <div className="preset-editor__grouped-list">
                      {groupedDefinitions.map(([catKey, items]) => {
                          const catName = categories[catKey]?.name || catKey;
                          const allSelected = items.every(i => selectedItemKeys.has(i.key));
                          
                          return (
                              <div key={catKey} className="preset-group">
                                  <div className="preset-group__header">
                                      <div 
                                          className="preset-group__checkbox-wrapper" 
                                          onClick={() => handleSelectCategoryGroup(items, !allSelected)}
                                      >
                                          <div className={`preset-group__checkbox ${allSelected ? 'checked' : ''}`}>
                                              {allSelected && <Check size={12} />}
                                          </div>
                                          <span>{catName}</span>
                                      </div>
                                      <span className="preset-group__count">{items.length}</span>
                                  </div>
                                  <div className="preset-editor__grid">
                                      {items.map(def => renderItemCard(def))}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
            </div>
        </div>

        {/* Footer */}
        <div className="preset-editor__footer">
          <div className="preset-editor__footer-left">
              <button onClick={() => handleNavigate('DEFINITIONS')} className="btn btn--ghost" title="跳转到定义工坊">
                  <Box size={16}/> 管理定义
              </button>
          </div>
          <button onClick={onClose} className="btn btn--ghost">取消</button>
          <button onClick={handleSave} className="btn btn--primary pulse">
            <Save size={16} /> 保存预设
          </button>
        </div>
      </div>
    </ManagerModal>
  );
};

export default PresetEditorModal;
