
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StatusBarData, SnapshotMeta, SnapshotEvent } from '../../types';
import { tavernService } from '../../../services/mockTavernService';
import { 
    detectChanges, 
    generateNarrative, 
    getNarrativeTemplates, 
    saveNarrativeTemplates, 
    getNarrativeConfigs,
    getActiveNarrativeConfigId,
    setActiveNarrativeConfigId,
    createNarrativeConfig,
    updateNarrativeConfig,
    deleteNarrativeConfig,
    NarrativeConfig,
    TEMPLATE_INFO, 
    DEFAULT_TEMPLATES 
} from '../../utils/snapshotGenerator';
import { getDefaultCategoriesMap, getDefaultItemDefinitionsMap } from '../../services/definitionRegistry';
import { Zap, History, Edit, RotateCcw, Check, Plus, Trash2, Settings, X, Terminal, Power, Save, Download, Upload } from 'lucide-react'; 
import { useToast } from '../Toast/ToastContext';
import './SnapshotSettings.css';

// 模拟数据字典
const MOCK_VAR_MAP: Record<string, string> = {
    '角色名': 'Eria',
    'name': 'Eria',
    '键名': '体力',
    'key': 'HP',
    '前缀': 'Eria的',
    'prefix': "Eria's",
    
    // 数值相关
    '旧值': '20',
    'old': '20',
    '新值': '90',
    'new': '90',
    '变化量': '+70',
    'diff': '+70',
    '变化量绝对值': '70',
    'diff_abs': '70',
    '原因': '神圣治疗',
    'reason': 'Divine Heal',
    
    // 列表相关
    '新增项': '誓约胜利之剑',
    'added': 'Excalibur',
    '移除项': '断裂的木棍',
    'removed': 'Broken Stick',
    '新列表': '誓约胜利之剑、恢复药水',
    'list_new': 'Excalibur, Potion',
    '旧列表': '断裂的木棍、恢复药水',
    'list_old': 'Broken Stick, Potion',
    
    // 文本相关
    'value': '警惕',
    'previousValue': '放松'
};

const MockPreview: React.FC<{ templateKey: string, templateValue: string }> = ({ templateKey, templateValue }) => {
    const previewText = useMemo(() => {
        try {
            // 使用正则替换所有 {variable} 为模拟值
            return templateValue.replace(/\{([\u4e00-\u9fa5a-zA-Z0-9_]+)\}/g, (match, p1) => {
                return MOCK_VAR_MAP[p1] || `(${p1})`;
            });
        } catch (e) { return "预览错误"; }
    }, [templateKey, templateValue]);

    return (
        <div className="snapshot-mock-preview">
            <div className="snapshot-mock-preview__label"><Terminal size={12} /> 实时预览 (效果演示)</div>
            <div className="snapshot-mock-preview__content">{previewText}</div>
        </div>
    );
};

interface SnapshotSettingsProps {
  data: StatusBarData;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  meta: SnapshotMeta | null;
}

const SnapshotSettings: React.FC<SnapshotSettingsProps> = ({ data, enabled, onToggle, meta }) => {
  const [lastSnapshot, setLastSnapshot] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [configs, setConfigs] = useState<NarrativeConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string>('default');
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');

  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
      refreshConfigs();
  }, []);

  useEffect(() => {
      if (showTemplateEditor) {
          setTemplates(getNarrativeTemplates());
      }
  }, [showTemplateEditor, activeConfigId]);

  const refreshConfigs = () => {
      setConfigs(getNarrativeConfigs());
      setActiveConfigId(getActiveNarrativeConfigId());
  };

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
        
        // Inject into Worldbook
        if (narrative) {
            tavernService.updateWorldbookEntry('[通用状态栏]', '[动态快照]', narrative);
        }
        
        setLastSnapshot(narrative || "（当前状态下没有检测到值得记录的信息）");
        setIsGenerating(false);
        toast.success("快照已生成并写入世界书");
    }, 500);
  };

  // ... (Config management handlers same as before) ...
  const handleEditTemplate = (key: string) => {
      setEditingKey(key);
      setTempValue(templates[key] || DEFAULT_TEMPLATES[key] || '');
  };

  const handleSaveTemplate = (key: string) => {
      const activeConfig = configs.find(c => c.id === activeConfigId);
      if (activeConfig?.isBuiltIn) {
          if (confirm(`默认配置 "${activeConfig.name}" 不可直接修改。\n是否创建该配置的副本并进行编辑？`)) {
              handleCreateConfig(`${activeConfig.name} (副本)`, activeConfig.templates);
              setTimeout(() => {
                  const newTemplates = { ...getNarrativeTemplates(), [key]: tempValue };
                  saveNarrativeTemplates(newTemplates);
                  setTemplates(newTemplates);
                  setEditingKey(null);
                  toast.success('已创建副本并保存修改');
              }, 100);
          }
          return;
      }

      const newTemplates = { ...templates, [key]: tempValue };
      setTemplates(newTemplates);
      saveNarrativeTemplates(newTemplates);
      setEditingKey(null);
      toast.success('模板已更新');
  };

  const handleResetTemplate = (key: string) => {
      const activeConfig = configs.find(c => c.id === activeConfigId);
      if (activeConfig?.isBuiltIn) return;

      const newTemplates = { ...templates };
      delete newTemplates[key];
      setTemplates(newTemplates);
      saveNarrativeTemplates(newTemplates);
      toast.info('已恢复该条默认');
  };

  const insertVariable = (variable: string) => {
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const text = tempValue;
      const newText = text.substring(0, start) + `{${variable}}` + text.substring(end);
      setTempValue(newText);
      
      setTimeout(() => {
          if (textAreaRef.current) {
              textAreaRef.current.focus();
              textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + variable.length + 2;
          }
      }, 0);
  };

  const handleSwitchConfig = (id: string) => {
      setActiveNarrativeConfigId(id);
      setActiveConfigId(id);
  };

  const handleCreateConfig = (nameInput?: string, baseTemplates?: Record<string, string>) => {
      if (nameInput) {
          const config = createNarrativeConfig(nameInput, baseTemplates);
          setActiveNarrativeConfigId(config.id);
          refreshConfigs();
          toast.success(`配置 "${nameInput}" 已创建并激活`);
      } else {
          setIsCreating(true);
          setNewConfigName('');
      }
  };

  const confirmCreateConfig = () => {
      if (!newConfigName.trim()) return;
      const config = createNarrativeConfig(newConfigName.trim());
      setActiveNarrativeConfigId(config.id);
      refreshConfigs();
      setIsCreating(false);
      toast.success(`配置 "${config.name}" 已创建`);
  };

  const handleRenameConfig = () => {
      if (!newName.trim()) return;
      const config = configs.find(c => c.id === activeConfigId);
      if (config && !config.isBuiltIn) {
          updateNarrativeConfig({ ...config, name: newName });
          refreshConfigs();
          setIsRenaming(false);
          toast.success("重命名成功");
      }
  };

  const handleDeleteConfig = () => {
      const config = configs.find(c => c.id === activeConfigId);
      if (config && !config.isBuiltIn) {
          if (confirm(`确定要删除配置 "${config.name}" 吗？`)) {
              deleteNarrativeConfig(activeConfigId);
              refreshConfigs(); 
              toast.info("配置已删除");
          }
      }
  };

  const handleExportConfig = () => {
      const config = configs.find(c => c.id === activeConfigId);
      if (!config) return;
      
      const json = JSON.stringify(config, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `narrative_config_${config.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("导出成功");
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const content = event.target?.result as string;
              const importedConfig = JSON.parse(content) as NarrativeConfig;
              
              if (!importedConfig.templates) {
                  throw new Error("Invalid format");
              }
              
              const newConfigName = `导入: ${importedConfig.name || 'Unknown'}`;
              const newConfig = createNarrativeConfig(newConfigName, importedConfig.templates);
              setActiveNarrativeConfigId(newConfig.id);
              refreshConfigs();
              toast.success(`配置 "${newConfigName}" 导入成功`);
          } catch (err) {
              toast.error("导入失败: 文件格式错误");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
  };

  const activeConfig = configs.find(c => c.id === activeConfigId);

  return (
    <div className="snapshot-settings">
       {/* 1. Top Toolbar (Actions) */}
       <div className="th-manager__toolbar" style={{borderTop: 'none', borderBottom: '1px solid var(--border-base)', marginBottom: 0, justifyContent: 'space-between'}}>
           <div className="snapshot-toolbar-left">
               <label className={`snapshot-toggle-btn ${enabled ? 'active' : ''}`}>
                   <input type="checkbox" checked={enabled} onChange={e => onToggle(e.target.checked)} />
                   <Power size={16} />
                   <span>{enabled ? '自动生成: ON' : '自动生成: OFF'}</span>
               </label>
               
               {meta && enabled && (
                   <div className="snapshot-status-indicator">
                       <span className="dot"></span>
                       Live (ID: {meta.message_count})
                   </div>
               )}
           </div>

           <div className="snapshot-toolbar-right">
               <button 
                   className={`btn ${isGenerating ? 'btn--ghost' : 'btn--primary'}`} 
                   onClick={handleManualTrigger}
                   disabled={isGenerating}
               >
                   {isGenerating ? <RotateCcw size={16} className="spin"/> : <Zap size={16} />}
                   <span>手动快照</span>
               </button>
               
               <button 
                   className={`btn ${showTemplateEditor ? 'btn--active' : 'btn--ghost'}`} 
                   onClick={() => setShowTemplateEditor(!showTemplateEditor)}
               >
                   <Settings size={16} /> 配置风格
               </button>
           </div>
       </div>

       <div className="snapshot-settings__content">
          
          {/* 2. Console / Output Area */}
          {!showTemplateEditor && (
              <div className="snapshot-console-wrapper animate-fade-in">
                  <div className="snapshot-console-header">
                      <Terminal size={14} /> Output Console
                  </div>
                  <div className="snapshot-console">
                      {lastSnapshot ? (
                          <div className="snapshot-console__text">{lastSnapshot}</div>
                      ) : (
                          <div className="snapshot-console__empty">
                              > 等待指令...<br/>
                              > 点击上方“手动快照”可立即生成当前状态描述。<br/>
                              > 生成的文本将自动写入世界书条目 [动态快照]。
                          </div>
                      )}
                  </div>
                  {meta && meta.description_summary && (
                      <div className="snapshot-last-log">
                          <History size={12} /> 最近自动记录: {meta.description_summary} ({new Date(meta.timestamp).toLocaleTimeString()})
                      </div>
                  )}
              </div>
          )}

          {/* 3. Template Editor (Full Width) */}
          {showTemplateEditor && (
              <div className="snapshot-editor glass-panel animate-slide-up">
                  <div className="snapshot-editor__toolbar">
                      <div className="selector-group">
                          <span className="editor-label">当前方案:</span>
                          <select value={activeConfigId} onChange={(e) => handleSwitchConfig(e.target.value)}>
                              {configs.map(c => (
                                  <option key={c.id} value={c.id}>{c.name} {c.isBuiltIn ? '(内置)' : ''}</option>
                              ))}
                          </select>
                      </div>
                      
                      <div className="actions-group">
                          <button className="icon-btn" onClick={handleExportConfig} title="导出当前配置"><Upload size={14} /></button>
                          <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="导入配置"><Download size={14} /></button>
                          <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".json" onChange={handleImportConfig} />
                          
                          <div className="v-divider" />

                          {activeConfig && !activeConfig.isBuiltIn ? (
                              isRenaming ? (
                                  <div className="rename-box">
                                      <input value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                                      <button onClick={handleRenameConfig}><Check size={14}/></button>
                                      <button onClick={() => setIsRenaming(false)}><X size={14}/></button>
                                  </div>
                              ) : (
                                  <>
                                    <button className="icon-btn" onClick={() => { setIsRenaming(true); setNewName(activeConfig.name); }} title="重命名"><Edit size={14} /></button>
                                    <button className="icon-btn danger" onClick={handleDeleteConfig} title="删除"><Trash2 size={14} /></button>
                                  </>
                              )
                          ) : <span className="tag">系统内置 (只读)</span>}
                          
                          <div className="v-divider" />
                          
                          {isCreating ? (
                              <div className="rename-box">
                                  <input value={newConfigName} onChange={e => setNewConfigName(e.target.value)} placeholder="新名称" autoFocus />
                                  <button onClick={confirmCreateConfig}><Check size={14}/></button>
                                  <button onClick={() => setIsCreating(false)}><X size={14}/></button>
                              </div>
                          ) : (
                              <button className="btn btn--sm btn--primary" onClick={() => handleCreateConfig()}><Plus size={14} /> 新建方案</button>
                          )}
                      </div>
                  </div>
                  
                  <div className="snapshot-editor__list">
                      {Object.keys(TEMPLATE_INFO).map(key => {
                          const info = TEMPLATE_INFO[key];
                          const isEditing = editingKey === key;
                          const currentValue = isEditing ? tempValue : (templates[key] || DEFAULT_TEMPLATES[key]);
                          const isModified = activeConfig && !activeConfig.isBuiltIn && activeConfig.templates[key] !== undefined;

                          return (
                              <div key={key} className={`template-row ${isEditing ? 'editing' : ''}`}>
                                  <div className="template-row__header" onClick={() => !isEditing && handleEditTemplate(key)}>
                                      <span className="label">{info.label}</span>
                                      {!isEditing && (
                                          <div className="actions">
                                              {isModified && <span className="modified-tag">已修改</span>}
                                              {isModified && <button onClick={(e) => { e.stopPropagation(); handleResetTemplate(key); }} className="icon-btn" title="重置"><RotateCcw size={14}/></button>}
                                              <Edit size={14} className="edit-icon-hint"/>
                                          </div>
                                      )}
                                  </div>
                                  
                                  {isEditing ? (
                                      <div className="template-row__editor animate-fade-in">
                                          <div className="vars-bar">
                                              <span className="vars-label">可用变量:</span>
                                              {info.vars.map(v => <button key={v} onClick={() => insertVariable(v)}>{v}</button>)}
                                          </div>
                                          <textarea ref={textAreaRef} value={tempValue} onChange={e => setTempValue(e.target.value)} autoFocus />
                                          <MockPreview templateKey={key} templateValue={tempValue} />
                                          <div className="editor-footer">
                                              <button onClick={() => setEditingKey(null)} className="btn btn--ghost btn--sm">取消</button>
                                              <button onClick={() => handleSaveTemplate(key)} className="btn btn--primary btn--sm">保存</button>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="template-row__preview" onClick={() => handleEditTemplate(key)}>{currentValue}</div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}
       </div>
    </div>
  );
};

export default SnapshotSettings;
