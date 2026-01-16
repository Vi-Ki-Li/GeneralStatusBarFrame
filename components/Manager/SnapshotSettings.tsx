import React, { useState } from 'react';
import { StatusBarData, SnapshotMeta } from '../../../types';
import { detectChanges, generateNarrative } from '../../../utils/snapshotGenerator';
import { getDefaultCategoriesMap, getDefaultItemDefinitionsMap } from '../../../services/definitionRegistry';
import { Camera, Zap, FileText, Info, History } from 'lucide-react';

interface SnapshotSettingsProps {
  data: StatusBarData;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  meta: SnapshotMeta | null;
}

const SnapshotSettings: React.FC<SnapshotSettingsProps> = ({ data, enabled, onToggle, meta }) => {
  const [lastSnapshot, setLastSnapshot] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleManualTrigger = () => {
    setIsGenerating(true);
    // 模拟生成：对比空状态和当前状态，生成“全量描述”
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

  return (
    <div style={{ padding: '24px', color: 'var(--text-primary)', height: '100%', overflowY: 'auto' }}>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. Control Card */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ 
                    width: '48px', height: '48px', 
                    borderRadius: '12px', 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Camera size={24} />
                </div>
                <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>自动快照写入</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        启用后，当状态数据发生变化时，自动生成叙事文本并写入世界书。
                    </p>
                </div>
             </div>
             
             {/* Toggle Switch */}
             <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', cursor: 'pointer' }}>
                <input 
                    type="checkbox" 
                    checked={enabled} 
                    onChange={e => onToggle(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: enabled ? 'var(--color-success)' : 'var(--chip-border)',
                    borderRadius: '34px',
                    transition: '0.3s'
                }}></span>
                <span style={{
                    position: 'absolute', content: '""',
                    height: '20px', width: '20px',
                    left: enabled ? '26px' : '4px', bottom: '4px',
                    background: 'white', borderRadius: '50%',
                    transition: '0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></span>
             </label>
          </div>

          {/* New: Last Sync Info (Always visible when enabled) */}
          {enabled && (
             <div className="glass-panel" style={{ 
                 padding: '16px 20px', 
                 borderLeft: meta ? '4px solid var(--color-success)' : '4px solid var(--text-tertiary)',
                 background: meta ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.02)',
                 display: 'flex',
                 alignItems: 'start',
                 gap: '12px',
                 transition: 'all 0.3s ease'
             }}>
                <History size={20} style={{ color: meta ? 'var(--color-success)' : 'var(--text-tertiary)', marginTop: '2px' }} />
                <div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: meta ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                        {meta ? '最近自动快照 (Live)' : '自动快照就绪'}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {meta ? (
                            <>
                                <div>时间: {new Date(meta.timestamp).toLocaleString()}</div>
                                <div>触发源消息ID: {meta.message_count}</div>
                                {meta.description_summary && (
                                    <div style={{ marginTop: '4px', fontStyle: 'italic', opacity: 0.8 }}>
                                        "{meta.description_summary}"
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>
                                系统正在后台监控状态变化...<br/>
                                <span style={{ opacity: 0.7 }}>当检测到数值、物品或状态变动后，此处将显示快照详情。</span>
                            </div>
                        )}
                    </div>
                </div>
             </div>
          )}

          {/* 2. Manual Trigger & Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.95rem' }}>
                    <Zap size={18} style={{ color: 'var(--color-warning)' }} />
                    手动操作
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                    立即对比当前状态与空状态，生成一份完整的状态描述快照。用于测试叙事引擎的效果。
                </p>
                <button 
                    className="btn btn--primary" 
                    onClick={handleManualTrigger}
                    disabled={isGenerating}
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {isGenerating ? '生成中...' : '立即生成当前状态快照'}
                </button>
             </div>

             <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.95rem' }}>
                    <Info size={18} style={{ color: 'var(--color-info)' }} />
                    关于机制
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    叙事引擎会监测数值剧烈变化（&gt;30%）、物品增减以及角色进出场。生成的文本将存储在 <code>[通用状态栏世界书]</code> 的 <code>[动态世界快照]</code> 条目中。
                </p>
             </div>
          </div>

          {/* 3. Preview Area */}
          <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
             <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.95rem' }}>
                <FileText size={18} style={{ color: 'var(--text-tertiary)' }} />
                快照预览
             </h4>
             <textarea 
                value={lastSnapshot}
                readOnly
                placeholder="点击上方按钮生成预览..."
                style={{
                    width: '100%',
                    flex: 1,
                    minHeight: '200px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--chip-border)',
                    background: 'rgba(0,0,0,0.03)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                    resize: 'none'
                }}
             />
          </div>
       </div>
    </div>
  );
};

export default SnapshotSettings;