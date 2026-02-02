import React, { useState, useEffect, useMemo } from 'react';
import { Preset, ItemDefinition, StyleDefinition } from '../../../types';
import { LayoutNode } from '../../../types/layout';
import { useToast } from '../../Toast/ToastContext';
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits';
import { getNarrativeConfigs, NarrativeConfig } from '../../../utils/snapshotGenerator';
import { ManagerModule } from '../Navigation/ModuleNavigation';
import { X, Save, Search, Box, LayoutTemplate, MessageSquareQuote, CheckSquare, Square, ArrowUpRight } from 'lucide-react';
import ManagerModal from '../ManagerModal'; // 引入标准弹窗组件
import './PresetEditorModal.css';

interface PresetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: Preset) => void;
  presetToEdit: Preset | null;
  allDefinitions: ItemDefinition[];
  allStyles: StyleDefinition[];
  currentLayout?: LayoutNode[];
  onNavigate: (module: ManagerModule) => void;
}

const PresetEditorModal: React.FC<PresetEditorModalProps> = ({
  isOpen, onClose, onSave, presetToEdit, allDefinitions, allStyles, currentLayout, onNavigate
}) => {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedItemKeys, setSelectedItemKeys] = useState<Set<string>>(new Set());
  const [styleOverrides, setStyleOverrides] = useState<{ [key: string]: string }>({});
  const [includeLayout, setIncludeLayout] = useState(false);
  const [selectedNarrativeId, setSelectedNarrativeId] = useState<string>('');
  
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
      } else {
        setName('');
        setSelectedItemKeys(new Set());
        setStyleOverrides({});
        setIncludeLayout(false);
        setSelectedNarrativeId('');
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

  return (
    <ManagerModal isOpen={isOpen} onClose={onClose}>
      <div className="preset-editor">
        <div className="preset-editor__header">
          <h3 className="preset-editor__title">
            {presetToEdit ? `编辑预设: ${presetToEdit.name}` : '创建新预设'}
          </h3>
          <button onClick={onClose} className="preset-editor__close-btn"><X size={24} /></button>
        </div>

        <div className="preset-editor__content">
          <div className="preset-editor__form-group">
            <label className="preset-editor__label">预设名称</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="例如: 魔法世界观"
              className="preset-editor__input"
            />
          </div>
          
          <div className="preset-editor__form-group">
              <label className="preset-editor__label">绑定叙事风格</label>
              <div className="preset-editor__select-wrapper">
                  <MessageSquareQuote size={16} className="preset-editor__select-icon" />
                  <select 
                      value={selectedNarrativeId} 
                      onChange={e => setSelectedNarrativeId(e.target.value)}
                      className="preset-editor__input preset-editor__input--with-icon"
                  >
                      <option value="">(不绑定) 保持当前风格</option>
                      {narrativeConfigs.map(config => (
                          <option key={config.id} value={config.id}>{config.name} {config.isBuiltIn ? '(内置)' : ''}</option>
                      ))}
                  </select>
              </div>
          </div>
          
          <div className="preset-editor__form-group">
              <div className="preset-editor__layout-option">
                  <label className="preset-editor__checkbox-label">
                      <input 
                          type="checkbox" 
                          checked={includeLayout} 
                          onChange={e => setIncludeLayout(e.target.checked)} 
                      />
                      <span className="preset-editor__checkbox-text">包含当前布局结构</span>
                      {includeLayout && <LayoutTemplate size={14} className="preset-editor__layout-icon" />}
                  </label>
                  <button onClick={() => handleNavigate('LAYOUT')} className="preset-editor__link-btn">
                      去调整布局 <ArrowUpRight size={12}/>
                  </button>
              </div>
              {includeLayout && (
                  <div className="preset-editor__hint">
                      应用此预设时，整个状态栏的排版布局将被该快照覆盖。
                  </div>
              )}
          </div>

          <div className="preset-editor__definitions-section">
            <div className="preset-editor__definitions-header">
              <label className="preset-editor__label">
                包含的定义 ({selectedItemKeys.size} / {allDefinitions.length})
              </label>
              <div className="preset-editor__search-wrapper">
                <Search size={14} />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜索定义..."
                  className="preset-editor__search-input"
                />
              </div>
            </div>
            
            <div className="preset-editor__selection-actions">
                <button onClick={handleSelectAll} className="preset-editor__action-btn">
                    <CheckSquare size={14} /> 全选
                </button>
                <button onClick={handleDeselectAll} className="preset-editor__action-btn">
                    <Square size={14} /> 全不选
                </button>
                <div style={{flex: 1}}/>
                <button onClick={() => handleNavigate('STYLES')} className="preset-editor__link-btn">
                    去设计样式 <ArrowUpRight size={12}/>
                </button>
            </div>
            
            <div className="preset-editor__def-list">
              {filteredDefinitions.map(def => {
                const isSelected = selectedItemKeys.has(def.key);
                return (
                  <div key={def.key} className={`preset-editor__def-item ${isSelected ? 'selected' : ''}`}>
                    <div className="preset-editor__def-item-main" onClick={() => handleToggleItem(def.key)}>
                      <div className="preset-editor__checkbox">{isSelected && <div/>}</div>
                      <div className="preset-editor__def-info">
                        <span className="preset-editor__def-name">{def.name || def.key}</span>
                        <span className="preset-editor__def-key">{def.name ? def.key : ''}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="preset-editor__style-override animate-fade-in">
                         <select 
                           value={styleOverrides[def.key] || 'style_default'}
                           onChange={e => handleOverrideChange(def.key, e.target.value)}
                           className="preset-editor__style-select"
                         >
                           {availableStyles.map(style => (
                             <option key={style.id} value={style.id}>
                                 {style.name} {style.id !== 'style_default' ? `(${style.dataType})` : ''}
                             </option>
                           ))}
                         </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="preset-editor__footer">
          <button onClick={onClose} className="btn btn--ghost">取消</button>
          <button onClick={handleSave} className="btn btn--primary">
            <Save size={16} /> {presetToEdit ? '保存更改' : '创建预设'}
          </button>
        </div>
      </div>
    </ManagerModal>
  );
};

export default PresetEditorModal;