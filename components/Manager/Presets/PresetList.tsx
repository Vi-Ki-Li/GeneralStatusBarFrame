import React, { useEffect, useState } from 'react';
import { Preset, LorebookEntry } from '../../../types';
import { presetService } from '../../../services/presetService';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { Save, Trash2, CheckCircle, Clock, BookOpen, Layers, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import SavePresetModal from './SavePresetModal';
import './PresetList.css';

const PresetList: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEnabledCount, setCurrentEnabledCount] = useState(0);
  const [deletingPreset, setDeletingPreset] = useState<string | null>(null);
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<LorebookEntry[]>([]);

  const toast = useToast();

  useEffect(() => {
    loadPresets();
    checkCurrentState();
    loadAllEntries();
  }, []);

  const loadAllEntries = async () => {
      try {
          const entries = await tavernService.getLorebookEntries();
          setAllEntries(entries);
      } catch (e) { console.error("Failed to load entries map"); }
  };

  const loadPresets = () => setPresets(presetService.getPresets());

  const checkCurrentState = async () => {
    try {
        const entries = await tavernService.getLorebookEntries();
        const count = entries.filter(e => 
            e.enabled && !e.comment.startsWith('设置-') && !e.comment.startsWith('样式-')
        ).length;
        setCurrentEnabledCount(count);
    } catch (e) { console.error("Failed to check entries", e); }
  };

  const handleSavePreset = async (name: string) => {
    try {
      const entries = await tavernService.getLorebookEntries();
      const enabledIds = entries
        .filter(e => e.enabled && !e.comment.startsWith('设置-') && !e.comment.startsWith('样式-'))
        .map(e => e.uid);

      const newPreset: Preset = { name, timestamp: Date.now(), enabledIds, count: enabledIds.length };

      presetService.savePreset(newPreset);
      loadPresets();
      setIsModalOpen(false);
      toast.success(`配置 "${name}" 已保存`);
    } catch (e) { toast.error("保存配置失败"); }
  };

  const requestDelete = (name: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeletingPreset(name);
  };

  const confirmDelete = () => {
    if (deletingPreset) {
      presetService.deletePreset(deletingPreset);
      loadPresets();
      toast.info(`配置 "${deletingPreset}" 已删除`);
      setDeletingPreset(null);
    }
  };

  const handleApplyPreset = async (preset: Preset, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const entries = await tavernService.getLorebookEntries();
      let changedCount = 0;

      const updatedEntries = entries.map(entry => {
        if (entry.comment.startsWith('设置-') || entry.comment.startsWith('样式-')) return entry;
        const shouldEnable = preset.enabledIds.includes(entry.uid);
        if (entry.enabled !== shouldEnable) {
            changedCount++;
            return { ...entry, enabled: shouldEnable };
        }
        return entry;
      });

      if (changedCount > 0) {
          await tavernService.setLorebookEntries(updatedEntries);
          toast.success(`配置 "${preset.name}" 已应用`, { description: `更新了 ${changedCount} 个条目的状态` });
          checkCurrentState();
      } else {
          toast.info("当前状态与配置一致，无需更新");
      }
    } catch (e) { toast.error("应用配置失败"); }
  };

  const toggleDetails = (name: string) => setExpandedPreset(expandedPreset === name ? null : name);

  const renderEntryDetails = (enabledIds: number[]) => {
      const includedEntries = allEntries.filter(e => enabledIds.includes(e.uid));
      if (includedEntries.length === 0) return <div className="preset-item__no-entries">此配置不包含任何条目</div>;
      return (
          <div className="preset-item__details-grid">
              {includedEntries.map(entry => (
                  <div key={entry.uid} className="preset-item__detail-chip">{entry.comment}</div>
              ))}
          </div>
      );
  };

  return (
    <div className="preset-list">
      <div className="preset-list__header glass-panel">
        <div>
            <h3 className="preset-list__title"><Layers size={20} /> 配置预设库</h3>
            <p className="preset-list__subtitle">保存当前启用的世界书条目组合，以便在不同场景间快速切换。</p>
        </div>
        <button className="btn btn--primary" onClick={() => { checkCurrentState(); setIsModalOpen(true); }}>
            <Save size={16} /> 保存当前配置
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
                     const isExpanded = expandedPreset === preset.name;
                     return (
                        <div key={preset.name} className={`preset-item glass-panel ${isExpanded ? 'preset-item--expanded' : ''}`} onClick={() => toggleDetails(preset.name)}>
                            <div className="preset-item__main">
                                <div className="preset-item__info">
                                    <div className="preset-item__name-row">
                                        <h4 className="preset-item__name">{preset.name}</h4>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                    <div className="preset-item__meta">
                                        <span><BookOpen size={14} /> {preset.count} 条目</span>
                                        <span><Clock size={14} /> {new Date(preset.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="preset-item__actions">
                                    <button className="btn btn--ghost btn--apply" onClick={(e) => handleApplyPreset(preset, e)}>
                                        <CheckCircle size={14} /> 应用
                                    </button>
                                    <button className="btn btn--ghost btn--delete" onClick={(e) => requestDelete(preset.name, e)} title="删除">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            {isExpanded && renderEntryDetails(preset.enabledIds)}
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
             <p>您确定要删除预设 "{deletingPreset}" 吗？此操作不可撤销。</p>
             <div className="preset-list__delete-actions">
                <button className="btn btn--ghost" onClick={() => setDeletingPreset(null)}>取消</button>
                <button className="btn btn--danger" onClick={confirmDelete}>
                    <Trash2 size={16} /> 删除
                </button>
             </div>
          </div>
        </div>
      )}

      <SavePresetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePreset} entryCount={currentEnabledCount} />
    </div>
  );
};

export default PresetList;