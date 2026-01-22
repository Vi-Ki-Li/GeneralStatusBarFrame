import React, { useState, useEffect, useMemo } from 'react';
import { Preset, ItemDefinition, StyleDefinition } from '../../../types';
import { styleService } from '../../../services/styleService';
import { useToast } from '../../Toast/ToastContext';
import { X, Save, Search, Box } from 'lucide-react';
import './PresetEditorModal.css';

interface PresetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: Preset) => void;
  presetToEdit: Preset | null;
  allDefinitions: ItemDefinition[];
}

const PresetEditorModal: React.FC<PresetEditorModalProps> = ({
  isOpen, onClose, onSave, presetToEdit, allDefinitions
}) => {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedItemKeys, setSelectedItemKeys] = useState<Set<string>>(new Set());
  const [styleOverrides, setStyleOverrides] = useState<{ [key: string]: string }>({});
  
  const toast = useToast();
  const mockStyles = useMemo(() => styleService.getMockStyleUnits(), []);

  useEffect(() => {
    if (isOpen) {
      if (presetToEdit) {
        setName(presetToEdit.name);
        setSelectedItemKeys(new Set(presetToEdit.itemKeys));
        setStyleOverrides(presetToEdit.styleOverrides || {});
      } else {
        setName('');
        setSelectedItemKeys(new Set());
        setStyleOverrides({});
      }
      setSearch('');
    }
  }, [isOpen, presetToEdit]);
  
  // Prevent body scroll when modal/drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);


  const filteredDefinitions = useMemo(() => {
    if (!search) return allDefinitions;
    const lowerSearch = search.toLowerCase();
    return allDefinitions.filter(def => 
      def.key.toLowerCase().includes(lowerSearch) || 
      (def.name && def.name.toLowerCase().includes(lowerSearch))
    );
  }, [search, allDefinitions]);

  const handleToggleItem = (key: string) => {
    setSelectedItemKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
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

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("预设名称不能为空");
      return;
    }
    const preset: Preset = {
      id: presetToEdit?.id || '', // Service will generate new ID if empty
      name: name.trim(),
      timestamp: Date.now(),
      itemKeys: Array.from(selectedItemKeys),
      styleOverrides,
    };
    onSave(preset);
  };

  if (!isOpen) return null;

  const editorContent = (
    <>
      <div className="preset-editor__header">
        <h3 className="preset-editor__title">
          {presetToEdit ? `编辑预设: ${presetToEdit.name}` : '创建新预设'}
        </h3>
        <button onClick={onClose} className="preset-editor__close-btn"><X size={20} /></button>
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

        <div className="preset-editor__form-group preset-editor__form-group--full">
          <label className="preset-editor__label">
            包含的定义 ({selectedItemKeys.size} / {allDefinitions.length})
          </label>
          <div className="preset-editor__search-wrapper">
            <Search size={16} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索定义..."
              className="preset-editor__search-input"
            />
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
                         {mockStyles.map(style => (
                           <option key={style.id} value={style.id}>{style.name}</option>
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
    </>
  );
  
  return (
    <div className={`preset-editor-wrapper ${isOpen ? 'open' : ''}`}>
        <div className="preset-editor__overlay" onClick={onClose} />
        <div className="preset-editor__panel glass-panel">
            {editorContent}
        </div>
    </div>
  );
};

export default PresetEditorModal;
