
import React, { useState, useEffect } from 'react';
import { StyleUnit } from '../../../types';
import { Save, Settings, Code, FileCode, RotateCcw, AlertTriangle } from 'lucide-react';
import './StyleEditor.css';

interface StyleEditorProps {
  unit: StyleUnit;
  onUpdate: (updatedUnit: StyleUnit) => void;
  onSave: (unitToSave: StyleUnit) => void;
}

export const DEFAULT_TEMPLATES: Record<StyleUnit['dataType'], { html: string, css: string }> = { // 此处开始修改
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

const StyleEditor: React.FC<StyleEditorProps> = ({ unit, onUpdate, onSave }) => {
  const [name, setName] = useState(unit.name);
  const [dataType, setDataType] = useState(unit.dataType);
  const [css, setCss] = useState(unit.css);
  const [html, setHtml] = useState(unit.html || '');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'settings'>('html');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDataType, setPendingDataType] = useState<StyleUnit['dataType'] | null>(null);

  useEffect(() => {
    // Live update parent component for preview
    const handler = setTimeout(() => {
        onUpdate({ ...unit, name, dataType, css, html });
    }, 200);
    return () => clearTimeout(handler);
  }, [name, dataType, css, html]);

  const handleDataTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as StyleUnit['dataType'];
    setPendingDataType(newType);
    setShowConfirm(true);
  };

  const confirmTemplateChange = () => {
      if (!pendingDataType) return;
      const template = DEFAULT_TEMPLATES[pendingDataType];
      setCss(template.css);
      setHtml(template.html);
      setDataType(pendingDataType); // Only change dataType after applying
      setShowConfirm(false);
      setPendingDataType(null);
  };
  
  const cancelTemplateChange = () => {
      if (!pendingDataType) return;
      setDataType(pendingDataType); // Change type without applying template
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

  return (
    <div className="style-editor">
        {showConfirm && <TemplateConfirmModal onConfirm={confirmTemplateChange} onCancel={cancelTemplateChange} type={pendingDataType || ''} />}

        <div className="style-editor__header">
            <input 
                className="style-editor__name-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="样式单元名称"
            />
            <div className="style-editor__actions">
                 <div className="style-editor__tabs">
                    <button onClick={() => setActiveTab('html')} className={activeTab === 'html' ? 'active' : ''}><FileCode size={14}/> HTML</button>
                    <button onClick={() => setActiveTab('css')} className={activeTab === 'css' ? 'active' : ''}><Code size={14}/> CSS</button>
                    <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}><Settings size={14}/> 设置</button>
                 </div>
                 <button onClick={handleResetToTemplate} className="btn btn--ghost" title="重置为当前类型的默认模板">
                     <RotateCcw size={16} />
                 </button>
                 <button onClick={handleSaveClick} className="btn btn--primary">
                    <Save size={16} /> 保存
                 </button>
            </div>
        </div>

        <div className="style-editor__content">
            {activeTab === 'html' && (
                <textarea
                    className="style-editor__textarea"
                    value={html}
                    onChange={e => setHtml(e.target.value)}
                    spellCheck="false"
                    placeholder="在此处输入 HTML 结构..."
                />
            )}
            {activeTab === 'css' && (
                <textarea
                    className="style-editor__textarea"
                    value={css}
                    onChange={e => setCss(e.target.value)}
                    spellCheck="false"
                    placeholder="在此处输入 CSS..."
                />
            )}
            {activeTab === 'settings' && (
                <div className="style-editor__settings animate-fade-in">
                    <div className="form-group">
                        <label className="form-label">关联数据类型</label>
                        <p className="form-description">
                            选择一个类型，以便在右侧的预览面板中看到最相关的效果。切换时会提示您是否应用该类型的默认模板。
                        </p>
                        <select className="form-input" value={dataType} onChange={handleDataTypeChange}>
                            <option value="numeric">数值 (Numeric)</option>
                            <option value="array">标签组 (Array)</option>
                            <option value="text">文本 (Text)</option>
                        </select>
                    </div>
                     <div className="form-group">
                        <label className="form-label">唯一ID (自动生成)</label>
                        <input className="form-input" value={unit.id} readOnly disabled />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}; // 此处完成修改

export default StyleEditor;
