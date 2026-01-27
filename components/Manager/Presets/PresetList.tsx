import React, { useEffect, useState } from 'react';
import { Preset, StatusBarData, ItemDefinition, StyleDefinition } from '../../../types';
import { presetService } from '../../../services/presetService';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { Save, Trash2, CheckCircle, Clock, BookOpen, Layers, AlertTriangle, ChevronDown, ChevronUp, Plus, Edit2, Loader, LayoutTemplate } from 'lucide-react';
import PresetEditorModal from './PresetEditorModal';
import './PresetList.css';

interface PresetListProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  allStyles: StyleDefinition[];
}

const PresetList: React.FC<PresetListProps> = ({ data, onUpdate, allStyles }) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);
  
  const [deletingPreset, setDeletingPreset] = useState<Preset | null>(null);
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    loadPresets();
  }, []);

  const allDefinitions = Object.values(data.item_definitions) as ItemDefinition[];
  const activePresetId = data._meta?.activePresetIds?.[0];

  const loadPresets = () => setPresets(presetService.getPresets());

  const handleSavePreset = (preset: Preset) => {
    try {
      const savedPreset = presetService.savePreset(preset);
      loadPresets();
      setIsEditorOpen(false);
      setEditingPreset(null);
      toast.success(`配置 "${savedPreset.name}" 已保存`);
    } catch (e) { 
      toast.error("保存配置失败");
    }
  };

  const requestDelete = (preset: Preset, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeletingPreset(preset);
  };

  const confirmDelete = () => {
    if (deletingPreset) {
      try {
        presetService.deletePreset(deletingPreset.id);
        loadPresets();
        toast.info(`配置 "${deletingPreset.name}" 已删除`);
        setDeletingPreset(null);
      } catch(e) {
        toast.error("删除失败");
      }
    }
  };

  const handleApplyPreset = async (preset: Preset, e: React.MouseEvent) => {
    e.stopPropagation();
    setApplyingPresetId(preset.id);
    try {
      const newData = { ...data };
      if (!newData._meta) newData._meta = {};
      
      const isDeactivating = newData._meta.activePresetIds?.[0] === preset.id;
      let layoutMsg = "";

      // Toggle logic
      if (isDeactivating) {
          newData._meta.activePresetIds = [];
      } else {
          newData._meta.activePresetIds = [preset.id];
          
          // Apply Layout if present
          if (preset.layout && preset.layout.length > 0) {
              newData.layout = preset.layout;
              layoutMsg = " & 布局";
          }
      }

      // --- Worldbook Sync Logic ---
      const allEntries = await tavernService.getLorebookEntries();
      const managedEntryKeys = new Set(Object.keys(data.item_definitions));
      let changesMade = 0;

      const updatedEntries = allEntries.map(entry => {
          if (managedEntryKeys.has(entry.comment)) {
              const shouldBeEnabled = !isDeactivating && preset.itemKeys.includes(entry.comment);
              if (entry.enabled !== shouldBeEnabled) {
                  changesMade++;
                  return { ...entry, enabled: shouldBeEnabled };
              }
          }
          return entry;
      });

      if (changesMade > 0) {
          await tavernService.setLorebookEntries(updatedEntries);
      }
      // --- End Worldbook Sync Logic ---
      
      onUpdate(newData);

      if (isDeactivating) {
          toast.info(`配置 "${preset.name}" 已取消应用`, {
              description: changesMade > 0 ? `同步 ${changesMade} 个世界书条目` : undefined
          });
      } else {
          toast.success(`配置 "${preset.name}" 已应用 (定义${layoutMsg})`, {
              description: changesMade > 0 ? `同步 ${changesMade} 个世界书条目` : undefined
          });
      }

    } catch (e) { 
      console.error(e);
      toast.error("应用配置失败");
    } finally {
        setApplyingPresetId(null);
    }
  };

  const toggleDetails = (id: string) => setExpandedPreset(expandedPreset === id ? null : id);

  const renderEntryDetails = (preset: Preset) => {
      const includedEntries = allDefinitions.filter(def => preset.itemKeys.includes(def.key));
      
      return (
          <div className="preset-item__details-container">
              {preset.layout && (
                  <div className="preset-item__layout-indicator">
                      <LayoutTemplate size={14} />
                      <span>包含自定义布局结构 ({preset.layout.length} 行)</span>
                  </div>
              )}
              {includedEntries.length === 0 ? (
                  <div className="preset-item__no-entries">此配置不包含任何条目定义</div>
              ) : (
                  <div className="preset-item__details-grid">
                      {includedEntries.map(def => (
                          <div key={def.key} className="preset-item__detail-chip">
                            {def.name || def.key}
                            {preset.styleOverrides[def.key] && preset.styleOverrides[def.key] !== 'style_default' && ' (*)'}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="preset-list">
      <div className="preset-list__header glass-panel">
        <div>
            <h3 className="preset-list__title"><Layers size={20} /> 配置预设库</h3>
            <p className="preset-list__subtitle">创建“定义”、“样式”与“布局”的组合，以“主题”的形式应用到聊天中。</p>
        </div>
        <button className="btn btn--primary" onClick={() => { setEditingPreset(null); setIsEditorOpen(true); }}>
            <Plus size={16} /> 新建预设
        </button>
      </div>

      <div className="preset-list__content">
         {presets.length === 0 ? (
             <div className="preset-list__empty-state">
                 <Layers size={48} />
                 <p>暂无保存的预设</p>
             </div>
         ) : (
             <div className="preset-list__items-container">
                 {presets.map(preset => {
                     const isExpanded = expandedPreset === preset.id;
                     const isActive = activePresetId === preset.id;
                     const isApplying = applyingPresetId === preset.id;
                     const hasLayout = !!preset.layout && preset.layout.length > 0;

                     return (
                        <div key={preset.id} className={`preset-item glass-panel ${isExpanded ? 'preset-item--expanded' : ''} ${isActive ? 'preset-item--active' : ''}`} onClick={() => toggleDetails(preset.id)}>
                            <div className="preset-item__main">
                                <div className="preset-item__info">
                                    <div className="preset-item__name-row">
                                        {isActive && <CheckCircle size={16} className="preset-item__active-icon" />}
                                        <h4 className="preset-item__name">{preset.name}</h4>
                                        {hasLayout && (
                                            <span title="包含布局" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                <LayoutTemplate size={14} className="preset-item__layout-icon" />
                                            </span>
                                        )}
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                    <div className="preset-item__meta">
                                        <span><BookOpen size={14} /> {preset.itemKeys.length} 定义</span>
                                        <span><Clock size={14} /> {new Date(preset.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="preset-item__actions">
                                    <button className="btn btn--ghost btn--edit" onClick={(e) => { e.stopPropagation(); setEditingPreset(preset); setIsEditorOpen(true); }} title="编辑">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="btn btn--ghost btn--delete" onClick={(e) => requestDelete(preset, e)} title="删除">
                                        <Trash2 size={16} />
                                    </button>
                                    <button className={`btn ${isActive ? 'btn--active' : 'btn--ghost'} btn--apply`} onClick={(e) => handleApplyPreset(preset, e)} disabled={isApplying}>
                                        {isApplying ? <Loader size={14} className="spinner" /> : <CheckCircle size={14} />}
                                        {isApplying ? '应用中' : (isActive ? '取消应用' : '应用')}
                                    </button>
                                </div>
                            </div>
                            {isExpanded && renderEntryDetails(preset)}
                        </div>
                     );
                 })}
             </div>
         )}
      </div>

      {deletingPreset && (
        <div className="preset-list__delete-overlay">
          <div className="preset-list__delete-modal glass-panel">
             <div className="preset-list__delete-header">
                <AlertTriangle size={24} /><h3>确认删除</h3>
             </div>
             <p>您确定要删除预设 "{deletingPreset.name}" 吗？此操作不可撤销。</p>
             <div className="preset-list__delete-actions">
                <button className="btn btn--ghost" onClick={() => setDeletingPreset(null)}>取消</button>
                <button className="btn btn--danger" onClick={confirmDelete}>
                    <Trash2 size={16} /> 删除
                </button>
             </div>
          </div>
        </div>
      )}

      <PresetEditorModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        onSave={handleSavePreset} 
        presetToEdit={editingPreset}
        allDefinitions={allDefinitions}
        allStyles={allStyles}
        currentLayout={data.layout}
      />
    </div>
  );
};

export default PresetList;