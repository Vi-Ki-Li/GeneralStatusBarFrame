import React, { useState, useEffect } from 'react';
import { parseStatusBarText } from '../../utils/parser';
import { mergeStatusBarData } from '../../utils/dataMerger';
import { StatusBarData, ItemDefinition } from '../../types';
import { getDefaultCategoriesMap, getDefaultItemDefinitionsMap } from '../../services/definitionRegistry';
import { Play, RotateCcw, AlertTriangle } from 'lucide-react';
import './LogicTester.css';

interface LogicTesterProps {
  initialData: StatusBarData | null;
  onUpdate?: (newData: StatusBarData) => void; 
}

const LogicTester: React.FC<LogicTesterProps> = ({ initialData, onUpdate }) => {
  const [currentData, setCurrentData] = useState<StatusBarData>(
    initialData || { 
      categories: getDefaultCategoriesMap(),
      item_definitions: getDefaultItemDefinitionsMap(),
      id_map: {},
      character_meta: {},
      shared: {}, 
      characters: {}, 
      _meta: { message_count: 10 } 
    }
  );

  useEffect(() => {
    if (initialData) {
      setCurrentData(initialData);
    }
  }, [initialData]);

  // Test Case
  const [inputText, setInputText] = useState<string>(
`// 1. 标准数值更新 (体力: 80/100)
[Eria^CV|体力::80|100|-5|中毒]

// 2. 简单数组 (道具)
[User^CR|道具物品::治疗药水@魔法面包]

// 3. 简单对象列表 (技能: 名称@等级)
[Eria^CR|技能::奥术飞弹@5|护盾术@1]

// 4. 复杂对象列表 (装备: 名称@类型@效果)
// 注意：需在 LogicTester 初始化时动态注入“装备”定义
[Eria^CR|装备::龙鳞甲@胸甲@火焰抗性+20|精灵之靴@鞋子@敏捷+5]`
  );
  
  const [sourceId, setSourceId] = useState<number>(11);
  const [logs, setLogs] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastParsed, setLastParsed] = useState<any>(null);

  const handleRun = () => {
    // 注入临时定义以便测试 (Dynamic Injection for Test)
    const testDefinitions = { 
        ...currentData.item_definitions,
        '装备': {
            key: '装备',
            name: '装备 (测试)',
            type: 'list-of-objects',
            defaultCategory: 'CR',
            separator: '|',
            partSeparator: '@',
            structure: { 
                parts: [
                    { key: 'name', label: '名称' },
                    { key: 'type', label: '类型' },
                    { key: 'effect', label: '效果' }
                ]
            }
        } as ItemDefinition
    };

    const parsed = parseStatusBarText(inputText, sourceId, testDefinitions);
    setLastParsed(parsed);
    
    // Merge result but ensure we keep the test definition in the result data
    const result = mergeStatusBarData({ ...currentData, item_definitions: testDefinitions }, parsed, sourceId);
    
    setLogs(result.logs);
    setWarnings(result.warnings);
    
    if (result.warnings.length === 0) {
      setCurrentData(result.data);
      if (sourceId === (result.data._meta?.message_count || 0)) {
          setSourceId(prev => prev + 1);
      }
      if (onUpdate) {
        onUpdate(result.data);
      }
    }
  };

  const handleReset = () => {
    const emptyData: StatusBarData = { 
      categories: getDefaultCategoriesMap(),
      item_definitions: getDefaultItemDefinitionsMap(),
      id_map: {},
      character_meta: {},
      shared: {}, 
      characters: {}, 
      _meta: { message_count: 10 } 
    };

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
    <div className="logic-tester glass-panel">
      <h3 className="logic-tester__title">
        🛠️ 核心逻辑测试台 (Logic Lab)
      </h3>

      <div className="logic-tester__grid">
        {/* Left Column: Inputs */}
        <div className="logic-tester__column">
          <div className="logic-tester__form-group">
            <label className="logic-tester__label">
              模拟 AI 输出文本 (Input Text)
            </label>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="logic-tester__textarea"
            />
          </div>

          <div className="logic-tester__form-group">
            <label className="logic-tester__label">
              来源消息 ID (Source ID) - 当前记录: {currentData._meta?.message_count}
            </label>
            <input
              type="number"
              value={sourceId}
              onChange={e => setSourceId(parseInt(e.target.value))}
              className="logic-tester__input"
            />
          </div>

          <div className="logic-tester__actions">
            <button className="btn btn--primary" onClick={handleRun}>
              <Play size={16} /> 执行并同步
            </button>
            <button className="btn btn--ghost" onClick={handleReset}>
              <RotateCcw size={16} /> 重置
            </button>
          </div>

          {warnings.length > 0 && (
            <div className="logic-tester__warnings">
              <div className="logic-tester__warnings-title">
                <AlertTriangle size={16} /> 警告
              </div>
              <ul className="logic-tester__warnings-list">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="logic-tester__logs-container">
            <h4 className="logic-tester__logs-title">变更日志</h4>
            <div className="logic-tester__logs-box">
              {logs.length === 0 ? <span className="logic-tester__logs-placeholder">// 等待执行...</span> : logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: State Preview */}
        <div className="logic-tester__column">
          <label className="logic-tester__label">
            当前权威状态 (Current State)
          </label>
          <div className="logic-tester__state-preview">
            {JSON.stringify(currentData, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogicTester;