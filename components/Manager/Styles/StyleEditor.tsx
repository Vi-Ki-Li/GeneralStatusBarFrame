import React, { useState, useEffect, useMemo } from 'react';
import { StyleDefinition, ItemDefinition, StatusBarItem } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import { X, Save, Code, Settings, Palette, HelpCircle, ChevronRight, ClipboardCopy, LayoutTemplate, RotateCcw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import StyledItemRenderer from '../../StatusBar/Renderers/StyledItemRenderer';
import { STYLE_CLASS_DOCUMENTATION } from '../../../services/styleDocumentation';
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits';
import './StyleEditor.css';

// 简易模板库 (Templates)
// 修复：确保 HTML 中的 class 与 CSS 选择器严格匹配
const TEMPLATES: Record<string, { label: string, css: string, html?: string }[]> = {
  numeric: [
    { 
      label: '默认 (精美)', 
      css: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_numeric')?.css || '',
      html: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_numeric')?.html
    },
    { 
      label: '纯净 (极简)', 
      // 这里的 HTML 默认使用了 {{progress_bar_html}}，它内部已经包含了 .numeric-renderer__progress-container 等类名
      css: `.numeric-renderer__progress-container { height: 8px; background: #eee; border-radius: 4px; }
.numeric-renderer__progress-fill { background: #666; border-radius: 4px; }`,
      html: `<div style="width: 100%;">{{progress_bar_html}}</div>`
    },
    { 
      label: '高亮文本', 
      css: `.numeric-renderer__value { color: #ec4899; font-weight: 900; font-size: 1.2rem; }
.status-item-row__label { font-weight: bold; }`,
      html: `<div style="display:flex; justify-content:space-between; width:100%;">
  <span>{{name}}</span>
  <span class="numeric-renderer__value">{{current}}</span>
</div>`
    }
  ],
  text: [
    { 
      label: '默认 (气泡)', 
      css: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_text')?.css || '',
      html: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_text')?.html
    },
    { 
      label: '纯净 (无样式)', 
      css: `.text-renderer__value { color: inherit; font-size: 1rem; }`, 
      // 修复：显式添加 class 以匹配 CSS
      html: `<div class="text-renderer__value">{{value}}</div>`
    },
    { 
        label: '警告红字', 
        css: `.text-renderer__value { color: red; font-weight: bold; border: 2px solid red; padding: 4px; text-align: center; }`, 
        // 修复：显式添加 class 以匹配 CSS
        html: `<div class="text-renderer__value">{{value}}</div>`
    }
  ],
  array: [
      {
          label: '默认 (标签)',
          css: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_array')?.css || '',
          html: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_array')?.html
      },
      {
          label: '纯净 (列表)',
          css: `.array-renderer__tag-chip { display: inline-block; margin-right: 4px; border: 1px solid #ccc; padding: 2px; }`,
          // {{tags_html}} 内部生成 span 时会自动带上 array-renderer__tag-chip 类名
          html: `<div>{{tags_html}}</div>`
      }
  ],
  'list-of-objects': [
      {
          label: '默认 (卡片)',
          css: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_object_list')?.css || '',
          html: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_object_list')?.html
      },
      {
          label: '纯净 (列表)',
          css: `.object-list-renderer__card-container { display: flex; flex-direction: column; gap: 4px; }
.object-card { border-bottom: 1px solid #eee; padding: 4px; }`,
          html: `<div class="object-list-renderer__card-container">{{cards_html}}</div>`
      }
  ]
};

// 独立的、真实的实时预览组件
const RealtimePreview: React.FC<{ style: Partial<StyleDefinition> }> = ({ style }) => {
    // 创建稳定的模拟数据
    const { mockItem, mockDefinition } = useMemo(() => {
        const item: StatusBarItem = {
            key: 'mock_key',
            _uuid: `mock_${uuidv4()}`,
            values: [],
            category: 'mock_cat',
            source_id: 0,
            user_modified: false
        };

        const definition: ItemDefinition = {
            key: 'mock_key',
            type: 'text', // default
            name: '预览项目'
        };

        switch (style.dataType) {
            case 'numeric':
                item.values = ['75', '100'];
                definition.type = 'numeric';
                break;
            case 'array':
                item.values = ['标签 A', '标签 B', '标签 C'];
                definition.type = 'array';
                break;
            case 'list-of-objects':
                item.values = [{ name: '对象A', desc: '描述1' }, { name: '对象B', desc: '描述2' }];
                definition.type = 'list-of-objects';
                definition.structure = {
                    parts: [{ key: 'name', label: '名称' }, { key: 'desc', label: '描述' }]
                };
                break;
            case 'text':
                item.values = ['这是一段示例文本。'];
                definition.type = 'text';
                break;
        }
        return { mockItem: item, mockDefinition: definition };
    }, [style.dataType]);

    return (
        <div className="style-editor__preview-wrapper">
            <StyledItemRenderer 
                item={mockItem} 
                definition={mockDefinition} 
                liveCssOverride={style.css}
                liveHtmlOverride={style.html} 
            />
        </div>
    );
};


interface StyleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  styleToEdit: StyleDefinition | null;
  onSave: (style: StyleDefinition) => void;
  allDefinitions: ItemDefinition[];
}

const StyleEditor: React.FC<StyleEditorProps> = ({ isOpen, onClose, styleToEdit, onSave, allDefinitions }) => {
  const [formData, setFormData] = useState<Partial<StyleDefinition>>({});
  const [showDocs, setShowDocs] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      if (styleToEdit) {
          setFormData(styleToEdit);
      } else {
          // New style: Pre-fill with default numeric template for better UX
          const defaultTmpl = DEFAULT_STYLE_UNITS.find(u => u.id === 'default_numeric');
          setFormData({ 
              name: '', 
              dataType: 'numeric', 
              css: defaultTmpl?.css || '', 
              html: defaultTmpl?.html || '' 
          });
      }
    }
  }, [isOpen, styleToEdit]);
  
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleChange = (field: keyof StyleDefinition, value: any) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        // Smart Template Switching
        if (field === 'dataType') {
             const defaultTmpl = DEFAULT_STYLE_UNITS.find(u => u.dataType === value);
             if (defaultTmpl) {
                 newData.css = defaultTmpl.css;
                 newData.html = defaultTmpl.html;
             }
        }
        return newData;
    });
  };

  const applyTemplate = (tmpl: { css: string, html?: string }) => {
      setFormData(prev => ({ ...prev, css: tmpl.css, html: tmpl.html || '' }));
      toast.info("已应用模板");
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error("样式名称不能为空");
      return;
    }
    onSave(formData as StyleDefinition);
    onClose();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已复制: ${text}`);
  };

  if (!isOpen) return null;

  const docEntries = formData.dataType ? STYLE_CLASS_DOCUMENTATION[formData.dataType] : [];
  const currentTemplates = formData.dataType ? TEMPLATES[formData.dataType] : [];

  return (
    <div className="style-editor-wrapper open">
        <div className="style-editor__overlay" onClick={onClose} />
        <div className="style-editor__panel glass-panel">
            <div className="style-editor__header">
                <h3 className="style-editor__title">{styleToEdit ? '编辑样式单元' : '新建样式单元'}</h3>
                <button onClick={onClose} className="style-editor__close-btn"><X size={20} /></button>
            </div>

            <div className="style-editor__main-layout">
                <div className="style-editor__left-pane">
                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Settings size={14}/> 配置</label>
                        <input
                            className="style-editor__input"
                            placeholder="样式名称 (e.g. 渐变生命条)"
                            value={formData.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                        <div className="style-editor__type-row">
                            <select
                                className="style-editor__input"
                                value={formData.dataType || 'numeric'}
                                onChange={(e) => handleChange('dataType', e.target.value as StyleDefinition['dataType'])}
                            >
                                <option value="numeric">数值 (Numeric)</option>
                                <option value="array">标签组 (Array)</option>
                                <option value="list-of-objects">对象列表 (List of Objects)</option>
                                <option value="text">文本 (Text)</option>
                                <option value="theme">主题 (Theme)</option>
                            </select>
                            
                            {/* Template Selector Dropdown */}
                            {currentTemplates && currentTemplates.length > 0 && (
                                <div className="style-editor__template-dropdown">
                                    <button className="style-editor__template-btn" title="加载模板">
                                        <LayoutTemplate size={16} /> 模板
                                    </button>
                                    <div className="style-editor__template-menu glass-panel">
                                        {currentTemplates.map((t, i) => (
                                            <div key={i} onClick={() => applyTemplate(t)} className="style-editor__template-item">
                                                {t.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Code size={14}/> HTML 模板 (可选)</label>
                        <textarea
                            className="style-editor__textarea style-editor__textarea--html"
                            placeholder="使用 {{placeholder}} 语法... (留空则使用默认结构)"
                            value={formData.html || ''}
                            onChange={(e) => handleChange('html', e.target.value)}
                        />
                    </div>
                    
                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Code size={14}/> CSS 代码</label>
                        <textarea
                            className="style-editor__textarea style-editor__textarea--css"
                            placeholder=".numeric-renderer__progress-fill { background: red; }"
                            value={formData.css || ''}
                            onChange={(e) => handleChange('css', e.target.value)}
                        />
                    </div>

                    {/* CSS类名文档区 */}
                    {formData.dataType !== 'theme' && (
                        <div className="style-editor__docs-container">
                            <button onClick={() => setShowDocs(!showDocs)} className="style-editor__docs-toggle">
                                <HelpCircle size={14} />
                                <span>可用CSS类名参考</span>
                                <ChevronRight size={16} className={`icon-selector__arrow ${showDocs ? 'open' : ''}`} />
                            </button>
                            {showDocs && (
                                <div className="style-editor__docs-content animate-fade-in">
                                    {docEntries && docEntries.length > 0 ? (
                                        docEntries.map(doc => (
                                            <div key={doc.className} className="style-editor__doc-item">
                                                <div className="style-editor__doc-main">
                                                    <code className="style-editor__doc-class">{doc.className}</code>
                                                    <p className="style-editor__doc-desc">{doc.description}</p>
                                                </div>
                                                <button onClick={() => handleCopy(doc.className)} className="style-editor__doc-copy-btn" title="复制">
                                                    <ClipboardCopy size={14} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="style-editor__doc-empty">暂无此类名的参考信息。</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="style-editor__right-pane">
                    <div className="style-editor__preview-container">
                       {formData.dataType === 'theme' ? (
                           <div className="style-editor__theme-preview-placeholder">
                               <Palette size={32} />
                               <h4>全局主题预览</h4>
                               <p>
                                   全局主题将直接应用于整个应用。<br/>
                                   请在主界面点击“应用”按钮查看效果。
                               </p>
                           </div>
                       ) : (
                           <RealtimePreview style={formData} />
                       )}
                    </div>
                </div>
            </div>

            <div className="style-editor__footer">
                <button onClick={onClose} className="btn btn--ghost">取消</button>
                <button onClick={handleSave} className="btn btn--primary"><Save size={16}/> 保存样式</button>
            </div>
        </div>
    </div>
  );
};

export default StyleEditor;