
import React, { useState, useEffect } from 'react';
import { parseStatusBarText } from '../../utils/parser';
import { mergeStatusBarData } from '../../utils/dataMerger';
import { StatusBarData } from '../../types';
import { Play, RotateCcw, AlertTriangle } from 'lucide-react';

interface LogicTesterProps {
  initialData: StatusBarData | null;
  onUpdate?: (newData: StatusBarData) => void; // 新增回调接口
}

const LogicTester: React.FC<LogicTesterProps> = ({ initialData, onUpdate }) => {
  // 模拟当前状态 (SST)
  const [currentData, setCurrentData] = useState<StatusBarData>(
    initialData || { shared: {}, characters: {}, _meta: { message_count: 10 } }
  );

  // 当外部数据变化时（例如从其他地方更新了），同步内部状态
  useEffect(() => {
    if (initialData) {
      setCurrentData(initialData);
    }
  }, [initialData]);

  // 输入
  const [inputText, setInputText] = useState<string>('[Eria^CV|体力::20@100|+5|中毒]\n[User^CP|状态::兴奋]');
  const [sourceId, setSourceId] = useState<number>(11);
  
  // 输出
  const [logs, setLogs] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastParsed, setLastParsed] = useState<any>(null);

  const handleRun = () => {
    // 1. 解析
    const parsed = parseStatusBarText(inputText, sourceId);
    setLastParsed(parsed);

    // 2. 合并
    const result = mergeStatusBarData(currentData, parsed, sourceId);
    
    // 3. 更新状态
    setLogs(result.logs);
    setWarnings(result.warnings);
    
    // 如果没有严重错误，更新模拟的当前数据，模拟状态推进
    if (result.warnings.length === 0) {
      setCurrentData(result.data);
      // 自动增加 sourceId 以便下一次测试
      if (sourceId === (result.data._meta?.message_count || 0)) {
          setSourceId(prev => prev + 1);
      }
      
      // *** 关键修复：通知父组件更新 ***
      if (onUpdate) {
        onUpdate(result.data);
      }
    }
  };

  const handleReset = () => {
    const emptyData = { shared: {}, characters: {}, _meta: { message_count: 10 } };
    if (initialData) {
        setCurrentData(initialData);
        if (onUpdate) onUpdate(initialData);
    } else {
        setCurrentData(emptyData);
        if (onUpdate) onUpdate(emptyData);
    }
    setLogs([]);
    setWarnings([]);
    setLastParsed(null);
    setSourceId(11);
  };

  return (
    <div className="glass-panel" style={{ 
      padding: '20px', 
      marginTop: '20px',
    }}>
      <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
        🛠️ 核心逻辑测试台 (Logic Lab)
      </h3>

      {/* 使用 CSS 类控制布局: 桌面双列，移动端单列 */}
      <div className="logic-tester-grid">
        {/* 左侧：输入控制 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              模拟 AI 输出文本 (Input Text)
            </label>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{
                width: '100%',
                height: '120px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--chip-border)',
                fontFamily: 'monospace',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              来源消息 ID (Source ID) - 当前记录: {currentData._meta?.message_count}
            </label>
            <input
              type="number"
              value={sourceId}
              onChange={e => setSourceId(parseInt(e.target.value))}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--chip-border)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button className="btn btn--primary" onClick={handleRun}>
              <Play size={16} /> 执行并同步
            </button>
            <button className="btn btn--ghost" onClick={handleReset}>
              <RotateCcw size={16} /> 重置
            </button>
          </div>

          {/* 警告显示 */}
          {warnings.length > 0 && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              background: 'rgba(229, 91, 91, 0.1)', 
              color: 'var(--color-danger)',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <AlertTriangle size={16} /> 警告
              </div>
              <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* 日志显示 */}
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '5px' }}>变更日志</h4>
            <div style={{ 
              height: '150px', 
              overflowY: 'auto', 
              background: 'rgba(0,0,0,0.3)', 
              color: '#4ec9b0', 
              padding: '10px', 
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              border: '1px solid var(--chip-border)'
            }}>
              {logs.length === 0 ? <span style={{ opacity: 0.5 }}>// 等待执行...</span> : logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：状态预览 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>
            当前权威状态 (Current State)
          </label>
          <div style={{ 
            flex: 1,
            background: 'rgba(0,0,0,0.2)', 
            padding: '10px', 
            borderRadius: '8px',
            border: '1px solid var(--chip-border)',
            fontFamily: 'monospace',
            fontSize: '12px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            minHeight: '200px', /* Ensure height on mobile */
            maxHeight: '500px',
            color: 'var(--text-tertiary)'
          }}>
            {JSON.stringify(currentData, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogicTester;
