import React, { useEffect, useState } from 'react';
import { Preset, LorebookEntry } from '../../../types';
import { presetService } from '../../../services/presetService';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { Save, Trash2, CheckCircle, Clock, BookOpen, Layers, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import SavePresetModal from './SavePresetModal';

const PresetList: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEnabledCount, setCurrentEnabledCount] = useState(0);
  const [deletingPreset, setDeletingPreset] = useState<string | null>(null);
  
  // New state for details expansion
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<LorebookEntry[]>([]);

  const toast = useToast();

  useEffect(() => {
    loadPresets();
    checkCurrentState();
    loadAllEntries(); // Fetch all entries for mapping IDs to Names
  }, []);

  const loadAllEntries = async () => {
      try {
          const entries = await tavernService.getLorebookEntries();
          setAllEntries(entries);
      } catch (e) {
          console.error("Failed to load entries map");
      }
  };

  const loadPresets = () => {
    setPresets(presetService.getPresets());
  };

  const checkCurrentState = async () => {
    try {
        const entries = await tavernService.getLorebookEntries();
        const count = entries.filter(e => 
            e.enabled && 
            !e.comment.startsWith('设置-') && 
            !e.comment.startsWith('样式-')
        ).length;
        setCurrentEnabledCount(count);
    } catch (e) {
        console.error("Failed to check entries", e);
    }
  };

  const handleSavePreset = async (name: string) => {
    try {
      const entries = await tavernService.getLorebookEntries();
      const enabledIds = entries
        .filter(e => e.enabled && !e.comment.startsWith('设置-') && !e.comment.startsWith('样式-'))
        .map(e => e.uid);

      const newPreset: Preset = {
        name,
        timestamp: Date.now(),
        enabledIds,
        count: enabledIds.length
      };

      presetService.savePreset(newPreset);
      loadPresets();
      setIsModalOpen(false);
      toast.success(`配置 "${name}" 已保存`);
    } catch (e) {
      toast.error("保存配置失败");
    }
  };

  // Trigger delete UI
  const requestDelete = (name: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent toggling details
      console.log(`[PresetList] Requesting delete for: ${name}`);
      setDeletingPreset(name);
  };

  // Execute delete
  const confirmDelete = () => {
    if (deletingPreset) {
      presetService.deletePreset(deletingPreset);
      loadPresets();
      toast.info(`配置 "${deletingPreset}" 已删除`);
      setDeletingPreset(null);
    }
  };

  const handleApplyPreset = async (preset: Preset, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling details
    try {
      const entries = await tavernService.getLorebookEntries();
      let changedCount = 0;

      const updatedEntries = entries.map(entry => {
        if (entry.comment.startsWith('设置-') || entry.comment.startsWith('样式-')) {
            return entry;
        }
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
    } catch (e) {
      toast.error("应用配置失败");
    }
  };

  const toggleDetails = (name: string) => {
      setExpandedPreset(expandedPreset === name ? null : name);
  };

  // Helper to render entry list
  const renderEntryDetails = (enabledIds: number[]) => {
      const includedEntries = allEntries.filter(e => enabledIds.includes(e.uid));
      
      if (includedEntries.length === 0) {
          return <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.85rem' }}>此配置不包含任何条目</div>;
      }

      return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
              {includedEntries.map(entry => (
                  <div key={entry.uid} style={{ 
                      fontSize: '0.8rem', 
                      padding: '4px 8px', 
                      background: 'var(--bg-app)', 
                      borderRadius: '4px',
                      border: '1px solid var(--chip-border)',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                  }}>
                      {entry.comment}
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ 
          padding: '20px', 
          marginBottom: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))'
      }}>
        <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} style={{ color: 'var(--color-primary)' }} />
                配置预设库
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                保存当前启用的世界书条目组合，以便在不同场景间快速切换。
            </p>
        </div>
        <button 
            className="btn btn--primary" 
            onClick={() => {
                checkCurrentState();
                setIsModalOpen(true);
            }}
        >
            <Save size={16} />
            保存当前配置
        </button>
      </div>

      {/* Preset List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
         {presets.length === 0 ? (
             <div style={{ 
                 textAlign: 'center', 
                 padding: '40px', 
                 color: 'var(--text-tertiary)',
                 border: '2px dashed var(--chip-border)',
                 borderRadius: '12px'
             }}>
                 <Layers size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                 <p>暂无保存的预设</p>
             </div>
         ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {presets.map(preset => {
                     const isExpanded = expandedPreset === preset.name;
                     return (
                        <div 
                            key={preset.name} 
                            className="glass-panel" 
                            style={{ 
                                padding: '16px', 
                                border: '1px solid var(--chip-border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isExpanded ? 'var(--bg-app)' : 'var(--glass-bg)'
                            }}
                            onClick={() => toggleDetails(preset.name)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {preset.name}
                                        </h4>
                                        {isExpanded ? <ChevronUp size={16} color="var(--text-tertiary)" /> : <ChevronDown size={16} color="var(--text-tertiary)" />}
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <BookOpen size={14} />
                                            {preset.count} 条目
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} />
                                            {new Date(preset.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button 
                                        className="btn btn--ghost" 
                                        style={{ 
                                            padding: '6px 12px',
                                            border: '1px solid var(--color-success)',
                                            color: 'var(--color-success)',
                                            background: 'rgba(16, 185, 129, 0.05)',
                                            fontSize: '0.85rem'
                                        }}
                                        onClick={(e) => handleApplyPreset(preset, e)}
                                    >
                                        <CheckCircle size={14} />
                                        应用
                                    </button>
                                    <button 
                                        onClick={(e) => requestDelete(preset.name, e)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '6px' }}
                                        className="hover-danger"
                                        title="删除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && renderEntryDetails(preset.enabledIds)}
                        </div>
                     );
                 })}
             </div>
         )}
      </div>

      {/* Delete Confirmation Modal (Inline) */}
      {deletingPreset && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          animation: 'fadeIn 0.2s ease',
          borderRadius: '16px'
        }}>
          <div className="glass-panel" style={{ 
            padding: '24px', 
            width: '80%', 
            maxWidth: '350px',
            background: 'var(--bg-app)',
            border: '1px solid var(--color-danger)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-danger)', marginBottom: '12px' }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>确认删除</h3>
             </div>
             <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95rem' }}>
                您确定要删除预设 "{deletingPreset}" 吗？此操作不可撤销。
             </p>
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                    className="btn btn--ghost" 
                    onClick={() => setDeletingPreset(null)}
                >
                    取消
                </button>
                <button 
                    className="btn" 
                    style={{ background: 'var(--color-danger)', color: 'white' }}
                    onClick={confirmDelete}
                >
                    <Trash2 size={16} /> 删除
                </button>
             </div>
          </div>
        </div>
      )}

      <SavePresetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePreset}
        entryCount={currentEnabledCount}
      />

      <style>{`
        .hover-danger:hover {
            color: var(--color-danger) !important;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default PresetList;