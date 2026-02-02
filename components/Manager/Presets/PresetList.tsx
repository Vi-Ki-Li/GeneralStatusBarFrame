
import React, { useEffect, useState, useRef } from 'react';
import { Preset, StatusBarData, ItemDefinition, StyleDefinition } from '../../../types';
import { presetService } from '../../../services/presetService';
import { tavernService } from '../../../services/mockTavernService';
import { setActiveNarrativeConfigId, getNarrativeConfigs } from '../../../utils/snapshotGenerator';
import { useToast } from '../../Toast/ToastContext';
import { Save, Trash2, CheckCircle, Clock, BookOpen, Layers, AlertTriangle, Plus, Edit2, Loader, LayoutTemplate, MessageSquareQuote, Check, Download, Upload, Search } from 'lucide-react';
import PresetEditorModal from './PresetEditorModal';
import { ManagerModule } from '../Navigation/ModuleNavigation';
import './PresetList.css';

interface PresetListProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  allStyles: StyleDefinition[];
  onNavigate: (module: ManagerModule) => void;
}

const PresetList: React.FC<PresetListProps> = ({ data, onUpdate, allStyles, onNavigate }) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const [deletingPreset, setDeletingPreset] = useState<Preset | null>(null);
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    loadPresets();
  }, []);

  const allDefinitions = Object.values(data.item_definitions) as ItemDefinition[];
  const activePresetId = data._meta?.activePresetIds?.[0];

  const loadPresets = () => setPresets(presetService.getPresets());

  const filteredPresets = presets.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleExportPreset = (preset: Preset, e: React.MouseEvent) => {
      e.stopPropagation();
      const json = JSON.stringify(preset, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preset_${preset.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`预设 "${preset.name}" 已导出`);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const content = ev.target?.result as string;
              const imported = JSON.parse(content) as Preset;
              
              if (!imported.name || !imported.itemKeys) {
                  throw new Error("Invalid format");
              }

              const newPreset = { ...imported, id: undefined, name: `${imported.name} (导入)` };
              presetService.savePreset(newPreset as Preset);
              loadPresets();
              toast.success(`预设 "${newPreset.name}" 导入成功`);
          } catch (err) {
              toast.error("导入失败: 文件格式错误");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleApplyPreset = async (preset: Preset, e: React.MouseEvent) => {
    e.stopPropagation();
    setApplyingPresetId(preset.id);
    try {
      const newData = { ...data };
      if (!newData._meta) newData._meta = {};
      
      const isDeactivating = newData._meta.activePresetIds?.[0] === preset.id;
      let layoutMsg = "";
      let narrativeMsg = "";

      if (isDeactivating) {
          newData._meta.activePresetIds = [];
      } else {
          newData._meta.activePresetIds = [preset.id];
          
          if (preset.layout && preset.layout.length > 0) {
              newData.layout = preset.layout;
              layoutMsg = " & 布局";
          }
          
          if (preset.narrativeConfigId) {
              setActiveNarrativeConfigId(preset.narrativeConfigId);
              narrativeMsg = " & 叙事风格";
          }
      }

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
      
      onUpdate(newData);

      if (isDeactivating) {
          toast.info(`配置 "${preset.name}" 已取消应用`, {
              description: changesMade > 0 ? `同步 ${changesMade} 个世界书条目` : undefined
          });
      } else {
          toast.success(`配置 "${preset.name}" 已应用 (定义${layoutMsg}${narrativeMsg})`, {
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
      const narrativeConfigName = preset.narrativeConfigId 
        ? getNarrativeConfigs().find(c => c.id === preset.narrativeConfigId)?.name 
        : null;
      
      return (
          <div className="preset-details animate-slide-up">
              <div className="preset-details__info-grid">
                  {preset.layout && preset.layout.length > 0 && (
                      <div className="preset-details__tag layout">
                          <LayoutTemplate size={12} />
                          <span>自定义布局 ({preset.layout.length} 行)</span>
                      </div>
                  )}
                  {narrativeConfigName && (
                      <div className="preset-details__tag narrative">
                          <MessageSquareQuote size={12} />
                          <span>叙事风格: {narrativeConfigName}</span>
                      </div>
                  )}
              </div>
              
              <div className="preset-details__divider" />
              
              {includedEntries.length === 0 ? (
                  <div className="preset-details__empty">此配置不包含任何条目定义</div>
              ) : (
                  <div className="preset-details__chips">
                      {includedEntries.map(def => (
                          <div key={def.key} className="preset-details__chip">
                            {def.name || def.key}
                            {preset.styleOverrides[def.key] && preset.styleOverrides[def.key] !== 'style_default' && <span className="highlight">*</span>}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="preset-list">
      {/* Standardized Toolbar */}
      <div className="th-toolbar">
         <div className="th-search-box">
             <Search size={16} />
             <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="搜索预设..." 
             />
         </div>
         
         <div className="preset-list__stats desktop-only">
             {filteredPresets.length} 个预设
         </div>

         <div style={{flex: 1}} />

         <div style={{display: 'flex', gap: '8px'}}>
             <button className="btn btn--ghost" onClick={handleImportClick} title="导入配置预设">
                 <Download size={16} /> 导入
             </button>
             <button className="btn btn--primary" onClick={() => { setEditingPreset(null); setIsEditorOpen(true); }}>
                <Plus size={16} /> 新建预设
            </button>
         </div>
         <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".json" onChange={handleImportFile} />
      </div>

      <div className="preset-list__content">
         {filteredPresets.length === 0 ? (
             <div className="preset-list__empty">
                 <Layers size={48} />
                 <p>{presets.length === 0 ? "暂无保存的配置预设" : "未找到匹配的预设"}</p>
             </div>
         ) : (
             <div className="preset-list__grid">
                 {filteredPresets.map(preset => {
                     const isExpanded = expandedPreset === preset.id;
                     const isActive = activePresetId === preset.id;
                     const isApplying = applyingPresetId === preset.id;

                     return (
                        <div 
                            key={preset.id} 
                            className={`th-interactive-card preset-card-item ${isActive ? 'active' : ''}`} 
                            onClick={() => toggleDetails(preset.id)}
                        >
                            <div className="preset-card__main">
                                <div className="preset-card__icon">
                                    {isActive ? <CheckCircle size={20} className="active-indicator"/> : <Layers size={20}/>}
                                </div>
                                
                                <div className="preset-card__info">
                                    <div className="preset-card__title">
                                        {preset.name}
                                        {isActive && <span className="preset-card__badge">使用中</span>}
                                    </div>
                                    <div className="preset-card__meta">
                                        <span><BookOpen size={12} /> {preset.itemKeys.length} 定义</span>
                                        <span><Clock size={12} /> {new Date(preset.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="preset-card__actions">
                                    <button 
                                        className={`btn btn--sm ${isActive ? 'btn--danger' : 'btn--primary'} btn--apply`} 
                                        onClick={(e) => handleApplyPreset(preset, e)} 
                                        disabled={isApplying}
                                        title={isActive ? "取消应用" : "应用此预设"}
                                    >
                                        {isApplying ? <Loader size={14} className="spinner" /> : (isActive ? <span style={{fontSize: 12}}>停用</span> : <Check size={14} />)}
                                    </button>
                                    <div className="preset-card__menu">
                                        <button className="th-manager__icon-btn" onClick={(e) => handleExportPreset(preset, e)} title="导出">
                                            <Upload size={16} />
                                        </button>
                                        <button className="th-manager__icon-btn" onClick={(e) => { e.stopPropagation(); setEditingPreset(preset); setIsEditorOpen(true); }} title="编辑">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="th-manager__icon-btn th-manager__icon-btn--danger" onClick={(e) => requestDelete(preset, e)} title="删除">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
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
        <div className="preset-list__confirm-overlay animate-fade-in">
          <div className="preset-list__confirm-modal glass-panel">
             <div className="confirm-header">
                <AlertTriangle size={24} /> 确认删除
             </div>
             <p>确定要删除预设 <strong>{deletingPreset.name}</strong> 吗？</p>
             <div className="confirm-actions">
                <button className="btn btn--ghost" onClick={() => setDeletingPreset(null)}>取消</button>
                <button className="btn btn--danger" onClick={confirmDelete}>删除</button>
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
        categories={data.categories} 
        allStyles={allStyles}
        currentLayout={data.layout}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default PresetList;
