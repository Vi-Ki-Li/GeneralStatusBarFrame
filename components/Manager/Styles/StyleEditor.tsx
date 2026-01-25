import React, { useState, useEffect, useMemo } from 'react';
import { StyleDefinition, ItemDefinition, StatusBarItem } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import { X, Save, Code, Settings, Palette, HelpCircle, ChevronRight, ClipboardCopy, LayoutTemplate, RotateCcw, Brush } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import StyledItemRenderer from '../../StatusBar/Renderers/StyledItemRenderer';
import StyleGuiControls from './StyleGuiControls'; // 此处添加1行
import { generateCssFromGuiConfig } from '../../../utils/styleUtils'; // 此处添加1行
import { STYLE_CLASS_DOCUMENTATION } from '../../../services/styleDocumentation';
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

// 独立的、真实的实时预览组件
const RealtimePreview: React.FC<{ style: Partial<StyleDefinition>; previewDefinition?: ItemDefinition | null }> = ({ style, previewDefinition }) => {
    // 创建稳定的模拟数据
    const { mockItem, mockDefinition } = useMemo(() => {
        // 策略 A: 用户指定了特定的预览定义 (Preview Source)
        // 此时，我们必须生成符合该定义结构的数据，以便 {{placeholder}} 能正确工作
        if (previewDefinition) {
             const item: StatusBarItem = {
                key: previewDefinition.key,
                _uuid: `mock_${uuidv4()}`,
                values: [],
                category: 'mock_cat',
                source_id: 0,
                user_modified: false
            };
            
            // 根据定义结构智能生成 Mock 数据
            if (previewDefinition.type === 'list-of-objects' && previewDefinition.structure?.parts) {
                const mockObj1: Record<string, string> = {};
                const mockObj2: Record<string, string> = {};
                previewDefinition.structure.parts.forEach((p, i) => {
                    mockObj1[p.key] = i === 0 ? '示例 A' : (p.key === 'level' ? '5' : `示例${p.label || p.key}`);
                    mockObj2[p.key] = i === 0 ? '示例 B' : (p.key === 'level' ? '2' : `示例${p.label || p.key}`);
                });
                item.values = [mockObj1, mockObj2];
            } else if (previewDefinition.type === 'numeric') {
                 // 智能映射：尝试填入合理的数值
                 const parts = previewDefinition.structure?.parts || [];
                 const values = new Array(parts.length).fill('');
                 
                 parts.forEach((p, i) => {
                     const k = p.key.toLowerCase();
                     if (k === 'current' || k === 'value') values[i] = '75';
                     else if (k === 'max') values[i] = '100';
                     else if (k === 'change') values[i] = '-5';
                     else if (k === 'reason') values[i] = '受击';
                     else if (k === 'description') values[i] = '状态一般';
                     else values[i] = `[${p.label || p.key}]`;
                 });
                 if (parts.length === 0) item.values = ['75', '100']; // 默认 fallback
                 else item.values = values;
            } else if (previewDefinition.type === 'array') {
                item.values = ['示例标签 1', '示例标签 2', '示例标签 3'];
            } else {
                item.values = ['这是一段基于您所选定义的预览文本。'];
            }

            return { mockItem: item, mockDefinition: previewDefinition };
        }

        // 策略 B: 未指定预览源，使用当前 Style 类型生成通用 Mock 数据
        const item: StatusBarItem = {
            key: 'Preview_Item',
            _uuid: `mock_${uuidv4()}`,
            values: [],
            category: 'mock_cat',
            source_id: 0,
            user_modified: false
        };

        const definition: ItemDefinition = {
            key: 'Preview_Item',
            type: (style.dataType && style.dataType !== 'theme') ? style.dataType : 'text',
            name: '预览项目'
        };

        switch (style.dataType) {
            case 'numeric':
                item.values = ['75', '100', '-5', '测试', '状态描述'];
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
                item.values = ['这是一段通用预览文本。'];
                definition.type = 'text';
                break;
        }
        return { mockItem: item, mockDefinition: definition };
    }, [style.dataType, previewDefinition]);

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
  initialPreviewKey?: string; 
}

const StyleEditor: React.FC<StyleEditorProps> = ({ isOpen, onClose, styleToEdit, onSave, allDefinitions, initialPreviewKey }) => { 
  const [formData, setFormData] = useState<Partial<StyleDefinition>>({});
  const [previewKey, setPreviewKey] = useState<string>(''); // 用户选定的预览数据源
  const [showDocs, setShowDocs] = useState(false);
  const [showGui, setShowGui] = useState(true); // 此处添加1行
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      if (styleToEdit) {
          setFormData({ // 此处开始修改
            ...styleToEdit,
            guiConfig: styleToEdit.guiConfig || {}
          }); // 此处完成修改
      } else {
          const defaultTmpl = DEFAULT_STYLE_UNITS.find(u => u.id === 'default_numeric');
          setFormData({ 
              name: '', 
              dataType: 'numeric', 
              css: defaultTmpl?.css || '', 
              html: defaultTmpl?.html || '',
              guiConfig: {} // 此处添加1行
          });
      }
      
      if (initialPreviewKey) { 
        setPreviewKey(initialPreviewKey);
      } else if (!styleToEdit) { // Only clear if creating a new style without a specific request
        setPreviewKey('');
      }

    }
  }, [isOpen, styleToEdit, initialPreviewKey]); 
  
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const combinedCss = useMemo(() => { // 此处开始添加4行
    const guiCss = generateCssFromGuiConfig(formData.guiConfig);
    return `${guiCss}\n\n${formData.css || ''}`;
  }, [formData.guiConfig, formData.css]);

  const handleChange = (field: keyof StyleDefinition, value: any) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        // 智能模板切换：当改变类型时，加载该类型的默认模板，但不清空 previewKey
        if (field === 'dataType') {
             const defaultTmpl = DEFAULT_STYLE_UNITS.find(u => u.dataType === value);
             if (defaultTmpl) {
                 newData.css = defaultTmpl.css;
                 newData.html = defaultTmpl.html;
                 newData.guiConfig = {}; // 清空GUI配置
             }
        }
        return newData;
    });
  };

  const applyTemplate = (tmpl: { css: string, html?: string }) => {
      setFormData(prev => ({ ...prev, css: tmpl.css, html: tmpl.html || '', guiConfig: {} })); // 此处修改1行
      toast.info("已应用模板 (GUI配置已重置)");
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error("样式名称不能为空");
      return;
    }
    onSave({ // 此处开始修改
        ...formData,
        id: formData.id || uuidv4(),
    } as StyleDefinition); // 此处完成修改
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
    
    // Add implicit placeholders based on type
    switch (definition.type) {
        case 'numeric':
            placeholders.push('current', 'max', 'percentage', 'progress_bar_html', 'max_html', 'change_indicator_html', 'sub_row_html', 'barColor');
            break;
        case 'array':
            placeholders.push('tags_html', 'count');
            break;
        case 'list-of-objects':
            placeholders.push('cards_html', 'count');
            break;
        case 'text':
            placeholders.push('value');
            break;
    }
    
    return [...new Set(placeholders)].sort((a,b) => a.localeCompare(b));
  }, [previewKey, allDefinitions]);

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
                            
                            {/* 模板选择器 */}
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

                    {/* 预览数据源选择器 (已解耦，不过滤) */}
                    {formData.dataType !== 'theme' && (
                        <div className="style-editor__form-group">
                            <label className="style-editor__label">
                                预览数据源 (Preview Data)
                                <span style={{fontSize: '0.75em', marginLeft: 'auto', color: 'var(--text-tertiary)', fontWeight: 'normal'}}>
                                    (可选任意定义进行测试)
                                </span>
                            </label>
                            <select
                                className="style-editor__input"
                                value={previewKey}
                                onChange={(e) => setPreviewKey(e.target.value)}
                            >
                                <option value="">通用默认数据 (Generic Mock)</option>
                                {allDefinitions.map(def => (
                                    <option key={def.key} value={def.key}>
                                        {def.name || def.key} ({def.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Code size={14}/> HTML 模板 (可选)</label>
                        <textarea
                            className="style-editor__textarea style-editor__textarea--html"
                            placeholder="使用 {{placeholder}} 语法... (留空则使用默认结构)"
                            value={formData.html || ''}
                            onChange={(e) => handleChange('html', e.target.value)}
                        />
                    </div>

                    {availablePlaceholders.length > 0 && ( 
                        <div className="style-editor__placeholder-helper animate-fade-in">
                            <label className="style-editor__label">可用占位符</label>
                            <div className="style-editor__placeholder-tags">
                                {availablePlaceholders.map(ph => (
                                    <code key={ph} className="style-editor__placeholder-tag" onClick={() => handleCopy(`{{${ph}}}`)} title="点击复制">
                                        &#123;&#123;{ph}&#125;&#125;
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Visual GUI Controls Section */}
                    <div className="style-editor__docs-container">
                        <button onClick={() => setShowGui(!showGui)} className="style-editor__docs-toggle">
                            <Brush size={14} />
                            <span>可视化配置 (GUI)</span>
                            <ChevronRight size={16} className={`icon-selector__arrow ${showGui ? 'open' : ''}`} />
                        </button>
                        {showGui && formData.dataType !== 'theme' && (
                            <div className="animate-fade-in" style={{ marginTop: 'var(--spacing-sm)' }}>
                                <StyleGuiControls 
                                    guiConfig={formData.guiConfig}
                                    onUpdate={(newConfig) => handleChange('guiConfig', newConfig)}
                                    dataType={formData.dataType!}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Code size={14}/> 手动 CSS 代码</label>
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
                           <RealtimePreview 
                               style={{ ...formData, css: combinedCss }} // 此处修改1行
                               previewDefinition={allDefinitions.find(d => d.key === previewKey) || null} 
                           />
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