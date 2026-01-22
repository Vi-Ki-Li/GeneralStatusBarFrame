

import React, { useState, useEffect } from 'react';
// FIX: Replaced non-exported 'StyleUnit' with 'StyleDefinition'.
import { StyleDefinition } from '../../../types';
import { Save, Settings, Code, FileCode, RotateCcw, AlertTriangle, Palette, Terminal, Copy } from 'lucide-react';
import './StyleEditor.css';

interface StyleEditorProps {
  // FIX: Use StyleDefinition type.
  unit: StyleDefinition;
  onUpdate: (updatedUnit: StyleDefinition) => void;
  onSave: (unitToSave: StyleDefinition) => void;
}

// FIX: Use StyleDefinition type.
export const DEFAULT_TEMPLATES: Record<StyleDefinition['dataType'], { html: string, css: string }> = {
    numeric: {
      html: `
<div class="numeric-renderer__main-row">
    <div class="status-item-row__label">
        <span>{{label}}</span>
    </div>
    <div class="numeric-renderer__progress-container">
        <div class="numeric-renderer__progress-fill" style="width: {{percentage}}%;"></div>
    </div>
    <div class="numeric-renderer__value-group">
        <span class="numeric-renderer__value">
            {{values[0]}}
            <span class="numeric-renderer__value-max">/{{values[1]}}</span>
        </span>
    </div>
</div>
<div class="numeric-renderer__sub-row">
    <span class="numeric-renderer__description">{{values[4]}}</span>
</div>`,
      css: `
.status-item-row__label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
.numeric-renderer__progress-container {
  flex: 1; margin: 0 12px; height: 8px;
  background: var(--bar-bg); border-radius: 4px;
}
.numeric-renderer__progress-fill {
  height: 100%; border-radius: 4px;
  background: linear-gradient(to right, var(--color-success), var(--color-primary));
}
.numeric-renderer__value { font-weight: 600; }
.numeric-renderer__value-max { color: var(--text-tertiary); font-size: 0.8em; }
.numeric-renderer__main-row, .numeric-renderer__sub-row { display: flex; align-items: center; width: 100%; }
.numeric-renderer__sub-row { font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px; }`
    },
    array: {
      html: `
<div class="array-renderer__header">
    <span class="status-item-row__label">{{label}}</span>
</div>
<div class="array-renderer__tags-container">
    {{#each values}}
        <span class="array-renderer__tag-chip">{{this}}</span>
    {{/each}}
</div>`,
      css: `
.status-item-row--array { display: block; }
.array-renderer__header { margin-bottom: 6px; }
.status-item-row__label { font-weight: 500; }
.array-renderer__tags-container { display: flex; flex-wrap: wrap; gap: 6px; }
.array-renderer__tag-chip {
  background: var(--chip-bg);
  border: 1px solid var(--chip-border);
  color: var(--text-primary);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
}`
    },
    text: {
      html: `
<div class="status-item-row__label">{{label}}</div>
<div class="text-renderer__value">{{values[0]}}</div>`,
      css: `
.status-item-row--text-block { align-items: flex-start; flex-direction: column; gap: 4px; }
.status-item-row__label { color: var(--text-secondary); font-size: 0.85rem; }
.text-renderer__value {
  font-style: italic;
  color: var(--text-primary);
  line-height: 1.5;
}`
    },
    theme: {
        html: '<!-- Theme mode does not use HTML template -->',
        css: `
/* 全局变量覆盖 */
:root {
  --color-primary: #8b5cf6;
  --color-secondary: #ec4899;
  --bg-app: #1e1e2e;
  --text-primary: #cdd6f4;
  --glass-bg: rgba(30, 30, 46, 0.7);
  --radius-xl: 0px; /* 直角风格 */
}

/* 全局组件样式 */
.btn {
  text-transform: uppercase;
  letter-spacing: 1px;
}
.glass-panel {
  border: 1px solid var(--color-primary);
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
}
`
    }
};

const TemplateConfirmModal = ({ onConfirm, onCancel, type }: { onConfirm: () => void, onCancel: () => void, type: string }) => (
    <div className="style-editor__template-confirm">
        <div className="style-editor__template-confirm-content">
            <AlertTriangle/>
            <h4>应用模板</h4>
            <p>您想用新的 <strong>{type}</strong> 模板替换当前的 HTML 和 CSS 代码吗？</p>
            <div className="style-editor__template-confirm-actions">
                <button className="btn btn--ghost" onClick={onCancel}>取消</button>
                <button className="btn btn--primary" onClick={onConfirm}>应用模板</button>
            </div>
        </div>
    </div>
);

// Snippet Helper Component
const CssSnippets = ({ onInsert }: { onInsert: (code: string) => void }) => {
    const snippets = [
        { label: '主色调', code: 'var(--color-primary)' },
        { label: '背景色', code: 'var(--bg-app)' },
        { label: '玻璃背景', code: 'var(--glass-bg)' },
        { label: 'Flex Center', code: 'display: flex; align-items: center; justify-content: center;' },
        { label: 'Grid 2Col', code: 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;' },
        { label: 'Gradient', code: 'background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));' },
    ];
    return (
        <div className="style-editor__snippets">
            <span className="style-editor__snippets-title">快速插入:</span>
            {snippets.map(s => (
                <button key={s.label} onClick={() => onInsert(s.code)} className="snippet-tag" title={s.code}>
                    {s.label}
                </button>
            ))}
        </div>
    );
};

const StyleEditor: React.FC<StyleEditorProps> = ({ unit, onUpdate, onSave }) => {
  const [name, setName] = useState(unit.name);
  const [dataType, setDataType] = useState(unit.dataType);
  const [css, setCss] = useState(unit.css);
  const [html, setHtml] = useState(unit.html || '');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'settings'>('css'); // Default to CSS for convenience
  const [showConfirm, setShowConfirm] = useState(false);
  // FIX: Use StyleDefinition type.
  const [pendingDataType, setPendingDataType] = useState<StyleDefinition['dataType'] | null>(null);

  // Auto-switch to CSS tab if theme
  useEffect(() => {
      if (unit.dataType === 'theme' && activeTab === 'html') {
          setActiveTab('css');
      }
  }, [unit.dataType]);

  useEffect(() => {
    const handler = setTimeout(() => {
        onUpdate({ ...unit, name, dataType, css, html });
    }, 200);
    return () => clearTimeout(handler);
  }, [name, dataType, css, html]);

  const handleDataTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // FIX: Use StyleDefinition type.
    const newType = e.target.value as StyleDefinition['dataType'];
    setPendingDataType(newType);
    setShowConfirm(true);
  };

  const confirmTemplateChange = () => {
      if (!pendingDataType) return;
      const template = DEFAULT_TEMPLATES[pendingDataType];
      setCss(template.css);
      setHtml(template.html);
      setDataType(pendingDataType);
      setShowConfirm(false);
      setPendingDataType(null);
  };
  
  const cancelTemplateChange = () => {
      if (!pendingDataType) return;
      setDataType(pendingDataType);
      setShowConfirm(false);
      setPendingDataType(null);
  };
  
  const handleResetToTemplate = () => {
      const template = DEFAULT_TEMPLATES[dataType];
      setCss(template.css);
      setHtml(template.html);
  };

  const handleSaveClick = () => {
    onSave({ ...unit, name, dataType, css, html });
  };
  
  const insertSnippet = (snippet: string) => {
      if (activeTab === 'css') {
          setCss(prev => prev + '\n' + snippet);
      } else if (activeTab === 'html') {
          setHtml(prev => prev + snippet);
      }
  };

  const isTheme = dataType === 'theme';

  return (
    <div className="style-editor">
        {showConfirm && <TemplateConfirmModal onConfirm={confirmTemplateChange} onCancel={cancelTemplateChange} type={pendingDataType || ''} />}

        <div className="style-editor__header">
            <div className="style-editor__name-wrapper">
                <input 
                    className="style-editor__name-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="样式单元名称"
                />
                <span className="style-editor__id-hint">{unit.id}</span>
            </div>
            <div className="style-editor__actions">
                 <button onClick={handleResetToTemplate} className="btn btn--ghost" title="重置为默认模板">
                     <RotateCcw size={16} />
                 </button>
                 <button onClick={handleSaveClick} className="btn btn--primary">
                    <Save size={16} /> 保存
                 </button>
            </div>
        </div>

        <div className="style-editor__tabs-bar">
             <div className="style-editor__tabs">
                {!isTheme && (
                    <button onClick={() => setActiveTab('html')} className={activeTab === 'html' ? 'active' : ''}>
                        <FileCode size={14}/> 结构 (HTML)
                    </button>
                )}
                <button onClick={() => setActiveTab('css')} className={activeTab === 'css' ? 'active' : ''}>
                    <Code size={14}/> 样式 (CSS)
                </button>
                <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}>
                    <Settings size={14}/> 设置
                </button>
             </div>
             {activeTab !== 'settings' && <CssSnippets onInsert={insertSnippet} />}
        </div>

        <div className="style-editor__content">
            <div className="style-editor__editor-wrapper">
                {/* Fake line numbers for aesthetics */}
                <div className="style-editor__line-numbers">
                    {Array.from({length: 20}).map((_, i) => <span key={i}>{i + 1}</span>)}
                </div>

                {activeTab === 'html' && !isTheme && (
                    <textarea
                        className="style-editor__textarea"
                        value={html}
                        onChange={e => setHtml(e.target.value)}
                        spellCheck="false"
                        placeholder="<!-- HTML Template -->"
                    />
                )}
                {activeTab === 'css' && (
                    <textarea
                        className="style-editor__textarea"
                        value={css}
                        onChange={e => setCss(e.target.value)}
                        spellCheck="false"
                        placeholder="/* CSS Styles */"
                    />
                )}
            </div>
            
            {activeTab === 'settings' && (
                <div className="style-editor__settings animate-fade-in">
                    <div className="form-group">
                        <label className="form-label"><Terminal size={16}/> 数据源类型</label>
                        <p className="form-description">
                            决定了预览区域使用什么Mock数据，以及HTML模板是否可用。
                        </p>
                        <select className="form-input" value={dataType} onChange={handleDataTypeChange}>
                            <option value="numeric">数值组件 (Numeric)</option>
                            <option value="array">标签组组件 (Array)</option>
                            <option value="text">文本组件 (Text)</option>
                            <option value="theme">全局主题 (Theme)</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default StyleEditor;