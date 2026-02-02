
import React, { useState, useEffect, useMemo } from 'react';
import { StyleDefinition, ItemDefinition, StatusBarItem } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import { X, Save, Code, Settings, Palette, HelpCircle, ChevronRight, ClipboardCopy, LayoutTemplate, Brush, Eye, Edit3, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import StyledItemRenderer from '../../StatusBar/Renderers/StyledItemRenderer';
import StyleGuiControls from './StyleGuiControls';
import { generateCssFromGuiConfig } from '../../../utils/styleUtils';
import { STYLE_CLASS_DOCUMENTATION } from '../../../services/styleDocumentation';
import { documentationParser, CssDocEntry } from '../../../services/documentationParser'; // Import parser
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits';
import './StyleEditor.css';

// 简易模板库 (Templates)
const TEMPLATES: Record<string, { label: string, css: string, html?: string }[]> = {
  numeric: [
    { 
      label: '默认 (精美)', 
      css: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_numeric')?.css || '',
      html: DEFAULT_STYLE_UNITS.find(u => u.id === 'default_numeric')?.html
    },
    { 
      label: '纯净 (极简)', 
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
      html: `<div class="text-renderer__value">{{value}}</div>`
    },
    { 
        label: '警告红字', 
        css: `.text-renderer__value { color: red; font-weight: bold; border: 2px solid red; padding: 4px; text-align: center; }`, 
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

// 交互式实时预览组件 (Interactive Realtime Preview)
const RealtimePreview: React.FC<{ 
    style: Partial<StyleDefinition>; 
    previewDefinition?: ItemDefinition | null;
    onElementSelect: (selector: string | null) => void;
    activeSelector: string | null;
}> = ({ style, previewDefinition, onElementSelect, activeSelector }) => {

    const { mockItem, mockDefinition } = useMemo(() => {
        if (previewDefinition) {
             const item: StatusBarItem = { key: previewDefinition.key, _uuid: `mock_${uuidv4()}`, values: [], category: 'mock_cat', source_id: 0, user_modified: false };
            
            if (previewDefinition.type === 'list-of-objects' && previewDefinition.structure?.parts) {
                const mockObj1: Record<string, string> = {};
                const mockObj2: Record<string, string> = {};
                previewDefinition.structure.parts.forEach((p, i) => {
                    mockObj1[p.key] = i === 0 ? '示例 A' : (p.key === 'level' ? '5' : `示例${p.label || p.key}`);
                    mockObj2[p.key] = i === 0 ? '示例 B' : (p.key === 'level' ? '2' : `示例${p.label || p.key}`);
                });
                item.values = [mockObj1, mockObj2];
            } else if (previewDefinition.type === 'numeric') {
                 const parts = previewDefinition.structure?.parts || [];
                 const values = new Array(parts.length).fill('');
                 parts.forEach((p, i) => {
                     const k = p.key.toLowerCase();
                     if (k === 'current' || k === 'value') values[i] = '75'; else if (k === 'max') values[i] = '100'; else if (k === 'change') values[i] = '-5'; else if (k === 'reason') values[i] = '受击'; else if (k === 'description') values[i] = '状态一般'; else values[i] = `[${p.label || p.key}]`;
                 });
                 item.values = parts.length === 0 ? ['75', '100'] : values;
            } else if (previewDefinition.type === 'array') {
                item.values = ['示例标签 1', '示例标签 2', '示例标签 3'];
            } else {
                item.values = ['这是一段基于您所选定义的预览文本。'];
            }
            return { mockItem: item, mockDefinition: previewDefinition };
        }

        const item: StatusBarItem = { key: 'Preview_Item', _uuid: `mock_${uuidv4()}`, values: [], category: 'mock_cat', source_id: 0, user_modified: false };
        const definition: ItemDefinition = { key: 'Preview_Item', type: (style.dataType && style.dataType !== 'theme') ? style.dataType : 'text', name: '预览项目' };
        switch (style.dataType) {
            case 'numeric': item.values = ['75', '100', '-5', '测试', '状态描述']; definition.type = 'numeric'; break;
            case 'array': item.values = ['标签 A', '标签 B', '标签 C']; definition.type = 'array'; break;
            case 'list-of-objects':
                item.values = [{ name: '对象A', desc: '描述1' }, { name: '对象B', desc: '描述2' }]; definition.type = 'list-of-objects';
                definition.structure = { parts: [{ key: 'name', label: '名称' }, { key: 'desc', label: '描述' }] }; break;
            case 'text': item.values = ['这是一段通用预览文本。']; definition.type = 'text'; break;
        }
        return { mockItem: item, mockDefinition: definition };
    }, [style.dataType, previewDefinition]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        let target = e.target as HTMLElement | null;
        while (target && target !== e.currentTarget) {
            const selector = target.getAttribute('data-target-selector');
            if (selector) {
                onElementSelect(selector);
                return;
            }
            target = target.parentElement;
        }
    };

    return (
        <div className="style-editor__preview-wrapper interactive-mode" onClick={handleClick}>
            <StyledItemRenderer 
                item={mockItem} 
                definition={mockDefinition} 
                liveCssOverride={style.css}
                liveHtmlOverride={style.html}
                activeSelector={activeSelector}
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
  initialPreviewKey?: string; 
}

const StyleEditor: React.FC<StyleEditorProps> = ({ isOpen, onClose, styleToEdit, onSave, allDefinitions, initialPreviewKey }) => { 
  const [formData, setFormData] = useState<Partial<StyleDefinition>>({});
  const [previewKey, setPreviewKey] = useState<string>('');
  const [showDocs, setShowDocs] = useState(false);
  const [showGui, setShowGui] = useState(true);
  const [activeSelector, setActiveSelector] = useState<string | null>(null);
  
  // Dynamic Docs State
  const [dynamicDocs, setDynamicDocs] = useState<CssDocEntry[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({}); // Store computed values

  // Mobile Tab State
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const toast = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize and Fetch Docs
  useEffect(() => {
    if (isOpen) {
      if (styleToEdit) {
          setFormData({ ...styleToEdit, guiConfig: styleToEdit.guiConfig || {} });
      } else {
          const defaultTmpl = DEFAULT_STYLE_UNITS.find(u => u.id === 'default_numeric');
          setFormData({ name: '', dataType: 'numeric', css: defaultTmpl?.css || '', html: defaultTmpl?.html || '', guiConfig: {} });
      }
      
      if (initialPreviewKey) { 
        setPreviewKey(initialPreviewKey);
      } else if (!styleToEdit) {
        setPreviewKey('');
      }
      setActiveSelector(null);
      setActiveTab('edit'); 

      // Trigger dynamic doc parsing
      setIsLoadingDocs(true);
      documentationParser.parse().then(docs => {
          setDynamicDocs(docs);
          setIsLoadingDocs(false);
      });
    }
  }, [isOpen, styleToEdit, initialPreviewKey]); 
  
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Compute variable values when docs are shown
  useEffect(() => {
    if (showDocs && dynamicDocs.length > 0) {
        // Use document.body to capture values that might be set on body class (like dark mode)
        // Fallback to documentElement if body doesn't have it (cascading handles this usually)
        const computed = getComputedStyle(document.body);
        const newValues: Record<string, string> = {};
        dynamicDocs.forEach(doc => {
            if (doc.className.startsWith('--')) {
                newValues[doc.className] = computed.getPropertyValue(doc.className).trim();
            }
        });
        setVariableValues(newValues);
    }
  }, [showDocs, dynamicDocs]);

  const combinedCss = useMemo(() => {
    const guiCss = generateCssFromGuiConfig(formData.guiConfig);
    return `${guiCss}\n\n${formData.css || ''}`;
  }, [formData.guiConfig, formData.css]);

  const handleChange = (field: keyof StyleDefinition, value: any) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };
        if (field === 'dataType') {
             const defaultTmpl = DEFAULT_STYLE_UNITS.find(u => u.dataType === value);
             if (defaultTmpl) {
                 newData.css = defaultTmpl.css;
                 newData.html = defaultTmpl.html;
                 newData.guiConfig = {};
                 setActiveSelector(null);
             }
        }
        return newData;
    });
  };

  const applyTemplate = (tmpl: { css: string, html?: string }) => {
      setFormData(prev => ({ ...prev, css: tmpl.css, html: tmpl.html || '', guiConfig: {} }));
      setActiveSelector(null);
      toast.info("已应用模板 (GUI配置已重置)");
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error("样式名称不能为空"); return;
    }

    const cssContent = combinedCss || '';
    const dangerousPatterns = [
        /(\*|body|html)\s*\{[^}]*display\s*:\s*none/i,
        /(\*|body|html)\s*\{[^}]*opacity\s*:\s*0/i,
        /(\*|body|html)\s*\{[^}]*visibility\s*:\s*hidden/i,
        /:root\s*\{[^}]*display\s*:\s*none/i
    ];

    const isDangerous = dangerousPatterns.some(pattern => pattern.test(cssContent));

    if (isDangerous) {
        const confirmSave = window.confirm(
            "⚠️ 严重安全警告\n\n" +
            "您的 CSS 代码包含可能导致整个应用不可见的规则 (如全局 display: none)。\n" +
            "这可能导致界面白屏，只能通过【安全模式】恢复。\n\n" +
            "如果是无意的，请点击【取消】并检查代码。\n" +
            "如果确定要执行，请点击【确定】。"
        );
        if (!confirmSave) return;
    }

    onSave({ ...formData, css: combinedCss, id: formData.id || uuidv4() } as StyleDefinition);
    onClose();
  };

  const handleCopy = (text: string) => { 
    navigator.clipboard.writeText(text);
    toast.success(`已复制: ${text}`);
  };

  const availablePlaceholders = useMemo(() => { 
    if (!previewKey) return [];
    const definition = allDefinitions.find(d => d.key === previewKey);
    if (!definition) return [];
    const placeholders = ['name', 'key', 'category', 'icon', 'lock_icon', 'label_container'];
    if (definition.structure?.parts) {
      definition.structure.parts.forEach(part => placeholders.push(part.key));
    }
    switch (definition.type) {
        case 'numeric': placeholders.push('current', 'max', 'percentage', 'progress_bar_html', 'max_html', 'change_indicator_html', 'sub_row_html', 'barColor'); break;
        case 'array': placeholders.push('tags_html', 'count'); break;
        case 'list-of-objects': placeholders.push('cards_html', 'count'); break;
        case 'text': placeholders.push('value'); break;
    }
    return [...new Set(placeholders)].sort((a,b) => a.localeCompare(b));
  }, [previewKey, allDefinitions]);

  // Helper to determine if a value looks like a color
  const isColorValue = (val: string) => {
      if (!val) return false;
      const v = val.toLowerCase();
      return v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl') || 
             ['red', 'blue', 'green', 'white', 'black', 'transparent', 'none'].includes(v);
  };

  if (!isOpen) return null;

  // Merge static and dynamic docs
  let docEntries: CssDocEntry[] = [];
  
  if (formData.dataType === 'theme') {
      // Include Theme, Manager, and Statusbar docs for global theme editing
      const parsedThemeDocs = dynamicDocs.filter(d => 
          d.category === 'theme' || d.category === 'manager' || d.category === 'statusbar'
      );
      if (parsedThemeDocs.length > 0) {
          docEntries = parsedThemeDocs;
      } else {
          docEntries = STYLE_CLASS_DOCUMENTATION['theme'] as CssDocEntry[] || [];
      }
  } else if (formData.dataType) {
      docEntries = STYLE_CLASS_DOCUMENTATION[formData.dataType] as CssDocEntry[] || [];
  }

  const currentTemplates = formData.dataType ? TEMPLATES[formData.dataType] : [];

  const renderGuiControls = () => (
      <div className="animate-fade-in" style={{ marginTop: 'var(--spacing-sm)' }}>
          <StyleGuiControls 
              guiConfig={formData.guiConfig} 
              onUpdate={(newConfig) => handleChange('guiConfig', newConfig)} 
              dataType={formData.dataType!} 
              activeSelector={activeSelector} 
          />
      </div>
  );

  return (
    <div className="style-editor-wrapper open">
        <div className="style-editor__overlay" onClick={onClose} />
        <div className="style-editor__panel glass-panel">
            <div className="style-editor__header">
                <h3 className="style-editor__title">{styleToEdit ? '编辑样式单元' : '新建样式单元'}</h3>
                <button onClick={onClose} className="style-editor__close-btn"><X size={20} /></button>
            </div>

            {isMobile && (
                <div className="style-editor__mobile-tabs">
                    <button 
                        className={`style-editor__mobile-tab ${activeTab === 'edit' ? 'active' : ''}`}
                        onClick={() => setActiveTab('edit')}
                    >
                        <Settings size={16} /> 配置
                    </button>
                    <button 
                        className={`style-editor__mobile-tab ${activeTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        <Eye size={16} /> 预览
                    </button>
                </div>
            )}

            <div className="style-editor__main-layout">
                <div className={`style-editor__left-pane ${isMobile && activeTab !== 'edit' ? 'hidden' : ''}`}>
                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Edit3 size={14}/> 基础属性</label>
                        <input className="style-editor__input" placeholder="样式名称 (e.g. 渐变生命条)" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                        <div className="style-editor__type-row">
                            <select className="style-editor__input" value={formData.dataType || 'numeric'} onChange={(e) => handleChange('dataType', e.target.value as StyleDefinition['dataType'])}>
                                <option value="numeric">数值 (Numeric)</option> <option value="array">标签组 (Array)</option> <option value="list-of-objects">对象列表 (List of Objects)</option> <option value="text">文本 (Text)</option> <option value="theme">主题 (Theme)</option>
                            </select>
                            {currentTemplates && currentTemplates.length > 0 && (
                                <div className="style-editor__template-dropdown">
                                    <button className="style-editor__template-btn" title="加载模板"><LayoutTemplate size={16} /> 模板</button>
                                    <div className="style-editor__template-menu glass-panel">{currentTemplates.map((t, i) => (<div key={i} onClick={() => applyTemplate(t)} className="style-editor__template-item">{t.label}</div>))}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {formData.dataType !== 'theme' && (
                        <div className="style-editor__form-group">
                            <label className="style-editor__label">预览数据源 (Preview Data)<span style={{fontSize: '0.75em', marginLeft: 'auto', color: 'var(--text-tertiary)', fontWeight: 'normal'}}>(可选任意定义进行测试)</span></label>
                            <select className="style-editor__input" value={previewKey} onChange={(e) => setPreviewKey(e.target.value)}>
                                <option value="">通用默认数据 (Generic Mock)</option>
                                {allDefinitions.map(def => (<option key={def.key} value={def.key}>{def.name || def.key} ({def.type})</option>))}
                            </select>
                        </div>
                    )}

                    <div className="style-editor__docs-container">
                        <button onClick={() => setShowGui(!showGui)} className="style-editor__docs-toggle"><Brush size={14} /><span>可视化配置 (GUI)</span><ChevronRight size={16} className={`icon-selector__arrow ${showGui ? 'open' : ''}`} /></button>
                        {/* Only show here on Desktop */}
                        {showGui && !isMobile && formData.dataType !== 'theme' && renderGuiControls()}
                    </div>

                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Code size={14}/> HTML 模板 (可选)</label>
                        <textarea className="style-editor__textarea style-editor__textarea--html" placeholder="使用 {{placeholder}} 语法... (留空则使用默认结构)" value={formData.html || ''} onChange={(e) => handleChange('html', e.target.value)} />
                    </div>

                    {availablePlaceholders.length > 0 && ( 
                        <div className="style-editor__placeholder-helper animate-fade-in">
                            <label className="style-editor__label">可用占位符</label>
                            <div className="style-editor__placeholder-tags">{availablePlaceholders.map(ph => (<code key={ph} className="style-editor__placeholder-tag" onClick={() => handleCopy(`{{${ph}}}`)} title="点击复制">&#123;&#123;{ph}&#125;&#125;</code>))}</div>
                        </div>
                    )}
                    
                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Code size={14}/> 手动 CSS 代码</label>
                        <textarea className="style-editor__textarea style-editor__textarea--css" placeholder=".numeric-renderer__progress-fill { background: red; }" value={formData.css || ''} onChange={(e) => handleChange('css', e.target.value)} />
                    </div>

                    <div className="style-editor__docs-container">
                        <button onClick={() => setShowDocs(!showDocs)} className="style-editor__docs-toggle">
                            <HelpCircle size={14} />
                            <span>可用CSS类名参考</span>
                            {isLoadingDocs && <Loader2 size={14} className="spin" style={{marginLeft: 8}} />}
                            <ChevronRight size={16} className={`icon-selector__arrow ${showDocs ? 'open' : ''}`} />
                        </button>
                        {showDocs && (
                            <div className="style-editor__docs-content animate-fade-in">
                                {docEntries && docEntries.length > 0 ? (
                                    docEntries.map((doc, idx) => (
                                        <div key={idx} className="style-editor__doc-item">
                                            <div className="style-editor__doc-main">
                                                <code className="style-editor__doc-class">{doc.className}</code>
                                                <p className="style-editor__doc-desc">{doc.description}</p>
                                                {doc.notes && <p className="style-editor__doc-notes">注: {doc.notes}</p>}
                                                {doc.className.startsWith('--') && variableValues[doc.className] && (
                                                    <div className="style-editor__doc-value-preview">
                                                        <span className="value-text">{variableValues[doc.className]}</span>
                                                        {isColorValue(variableValues[doc.className]) && (
                                                            <span className="color-swatch" style={{background: variableValues[doc.className]}} />
                                                        )}
                                                    </div>
                                                )}
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
                </div>

                <div className={`style-editor__right-pane ${isMobile && activeTab !== 'preview' ? 'hidden' : ''}`}>
                    <div className="style-editor__preview-container">
                       {formData.dataType === 'theme' ? (
                           <div className="style-editor__theme-preview-placeholder"><Palette size={32} /><h4>全局主题预览</h4><p>全局主题将直接应用于整个应用。<br/>请在主界面点击“应用”按钮查看效果。</p></div>
                       ) : (
                           <RealtimePreview style={{ ...formData, css: combinedCss }} previewDefinition={allDefinitions.find(d => d.key === previewKey) || null} onElementSelect={setActiveSelector} activeSelector={activeSelector} />
                       )}
                    </div>
                    {isMobile && activeTab === 'preview' && (
                        <>
                            <div className="style-editor__preview-hint">
                                👆 点击上方元素选中，即可在下方调整样式
                            </div>
                            {/* Render GUI Controls here on Mobile */}
                            {formData.dataType !== 'theme' && (
                                <div className="style-editor__mobile-gui-wrapper">
                                    {renderGuiControls()}
                                </div>
                            )}
                        </>
                    )}
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
