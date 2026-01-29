
import React, { useState, useEffect } from 'react';
import { StatusBarData, SnapshotMeta } from '../../types';
import { detectChanges, generateNarrative, getNarrativeTemplates, saveNarrativeTemplates, resetNarrativeTemplates, TEMPLATE_INFO, DEFAULT_TEMPLATES } from '../../utils/snapshotGenerator';
import { getDefaultCategoriesMap, getDefaultItemDefinitionsMap } from '../../services/definitionRegistry';
import { Camera, Zap, FileText, Info, History, Edit, RotateCcw, Save, Check } from 'lucide-react';
import { useToast } from '../Toast/ToastContext';
import './SnapshotSettings.css';

interface SnapshotSettingsProps {
  data: StatusBarData;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  meta: SnapshotMeta | null;
}

const SnapshotSettings: React.FC<SnapshotSettingsProps> = ({ data, enabled, onToggle, meta }) => {
  const [lastSnapshot, setLastSnapshot] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Template Editor State
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  
  const toast = useToast();

  useEffect(() => {
      if (showTemplateEditor) {
          setTemplates(getNarrativeTemplates());
      }
  }, [showTemplateEditor]);

  const handleManualTrigger = () => {
    setIsGenerating(true);
    setTimeout(() => {
        const emptyData: StatusBarData = { 
            categories: getDefaultCategoriesMap(),
            item_definitions: getDefaultItemDefinitionsMap(),
            id_map: {},
            shared: {}, 
            characters: {} 
        };
        const events = detectChanges(emptyData, data);
        const narrative = generateNarrative(events);
        
        setLastSnapshot(narrative || "（当前状态下没有检测到值得记录的信息）");
        setIsGenerating(false);
    }, 500);
  };

  const handleEditTemplate = (key: string) => {
      setEditingKey(key);
      setTempValue(templates[key] || DEFAULT_TEMPLATES[key] || '');
  };

  const handleSaveTemplate = (key: string) => {
      const newTemplates = { ...templates, [key]: tempValue };
      setTemplates(newTemplates);
      saveNarrativeTemplates(newTemplates);
      setEditingKey(null);
      toast.success('模板已更新');
  };

  const handleResetAllTemplates = () => {
      if (confirm('确定要重置所有叙事模板到默认状态吗？您的自定义将丢失。')) {
          resetNarrativeTemplates();
          setTemplates(DEFAULT_TEMPLATES);
          toast.info('已恢复默认模板');
      }
  };

  return (
    <div className="snapshot-settings">
       <div className="snapshot-settings__container">
          
          <div className="snapshot-settings__card snapshot-settings__card--control glass-panel">
             <div className="snapshot-settings__card-main">
                <div className="snapshot-settings__icon-wrapper snapshot-settings__icon-wrapper--primary">
                    <Camera size={24} />
                </div>
                <div>
                    <h4 className="snapshot-settings__card-title">自动快照写入</h4>
                    <p className="snapshot-settings__card-description">
                        启用后，当状态数据发生变化时，自动生成叙事文本并写入世界书。
                    </p>
                </div>
             </div>
             
             <label className="snapshot-settings__toggle-switch">
                <input 
                    type="checkbox" 
                    checked={enabled} 
                    onChange={e => onToggle(e.target.checked)}
                />
                <span className="snapshot-settings__toggle-slider"></span>
             </label>
          </div>

          {enabled && (
             <div className={`snapshot-settings__card snapshot-settings__card--status glass-panel ${meta ? 'synced' : ''}`}>
                <History size={20} className="snapshot-settings__status-icon" />
                <div>
                    <h4 className="snapshot-settings__status-title">
                        {meta ? '最近自动快照 (Live)' : '自动快照就绪'}
                    </h4>
                    <div className="snapshot-settings__status-details">
                        {meta ? (
                            <>
                                <div>时间: {new Date(meta.timestamp).toLocaleString()}</div>
                                <div>触发源消息ID: {meta.message_count}</div>
                                {meta.description_summary && (
                                    <div className="snapshot-settings__status-summary">
                                        "{meta.description_summary}"
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>
                                系统正在后台监控状态变化...<br/>
                                <span>当检测到数值、物品或状态变动后，此处将显示快照详情。</span>
                            </div>
                        )}
                    </div>
                </div>
             </div>
          )}

          {/* Template Configuration Toggle */}
          <div className="snapshot-settings__separator">
              <button 
                className="btn btn--ghost" 
                onClick={() => setShowTemplateEditor(!showTemplateEditor)}
              >
                  <Edit size={16} /> {showTemplateEditor ? '隐藏模板配置' : '配置叙事模板'}
              </button>
          </div>

          {showTemplateEditor && (
              <div className="snapshot-settings__template-editor glass-panel animate-fade-in">
                  <div className="snapshot-settings__template-header">
                      <h4>自定义叙事风格</h4>
                      <button onClick={handleResetAllTemplates} className="btn btn--ghost btn--delete">
                          <RotateCcw size={14} /> 重置所有
                      </button>
                  </div>
                  <p className="snapshot-settings__template-desc">
                      系统会根据变更来源（AI自然演变 vs 用户手动修改）选择不同的模板。您可以为这两种情况编写截然不同的描述风格（例如：自然演变平实客观，用户修改充满神迹感）。
                  </p>
                  
                  <div className="snapshot-settings__template-list">
                      {Object.keys(TEMPLATE_INFO).map(key => {
                          const info = TEMPLATE_INFO[key];
                          const isEditing = editingKey === key;
                          const currentValue = isEditing ? tempValue : (templates[key] || DEFAULT_TEMPLATES[key]);
                          const isUserModified = currentValue !== DEFAULT_TEMPLATES[key];

                          return (
                              <div key={key} className={`template-item ${isEditing ? 'editing' : ''}`}>
                                  <div className="template-item__header">
                                      <span className="template-item__label">{info.label}</span>
                                      {!isEditing && (
                                          <div className="template-item__actions">
                                              {isUserModified && <span className="template-item__modified-tag">已修改</span>}
                                              <button onClick={() => handleEditTemplate(key)} className="btn btn--ghost icon-only"><Edit size={14}/></button>
                                          </div>
                                      )}
                                  </div>
                                  
                                  {isEditing ? (
                                      <div className="template-item__editor">
                                          <textarea 
                                              value={tempValue} 
                                              onChange={e => setTempValue(e.target.value)}
                                              className="template-item__textarea"
                                              autoFocus
                                          />
                                          <div className="template-item__vars">
                                              可用变量: {info.vars.map(v => <code key={v}>{`{${v}}`}</code>)}
                                          </div>
                                          <div className="template-item__footer">
                                              <button onClick={() => setEditingKey(null)} className="btn btn--ghost">取消</button>
                                              <button onClick={() => handleSaveTemplate(key)} className="btn btn--primary"><Save size={14}/> 保存</button>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="template-item__preview" onClick={() => handleEditTemplate(key)}>
                                          {currentValue}
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          <div className="snapshot-settings__grid">
             <div className="snapshot-settings__card glass-panel">
                <h4 className="snapshot-settings__card-title icon-title">
                    <Zap size={18} className="snapshot-settings__icon--warning" />
                    手动操作
                </h4>
                <p className="snapshot-settings__card-description">
                    立即对比当前状态与空状态，生成一份完整的状态描述快照。用于测试叙事引擎的效果。
                </p>
                <button 
                    className="btn btn--primary" 
                    onClick={handleManualTrigger}
                    disabled={isGenerating}
                >
                    {isGenerating ? '生成中...' : '立即生成当前状态快照'}
                </button>
             </div>

             <div className="snapshot-settings__card glass-panel">
                 <h4 className="snapshot-settings__card-title icon-title">
                    <Info size={18} className="snapshot-settings__icon--info" />
                    关于机制
                </h4>
                <p className="snapshot-settings__card-description">
                    叙事引擎会监测数值剧烈变化（&gt;30%）、物品增减以及角色进出场。生成的文本将存储在 <code>[通用状态栏世界书]</code> 的 <code>[动态世界快照]</code> 条目中。
                </p>
             </div>
          </div>

          <div className="snapshot-settings__card snapshot-settings__card--preview glass-panel">
             <h4 className="snapshot-settings__card-title icon-title">
                <FileText size={18} className="snapshot-settings__icon--tertiary" />
                快照预览
             </h4>
             <textarea 
                value={lastSnapshot}
                readOnly
                placeholder="点击上方按钮生成预览..."
                className="snapshot-settings__preview-area"
             />
          </div>
       </div>
    </div>
  );
};

export default SnapshotSettings;