import React, { useState, useEffect, useMemo } from 'react';
import { StyleDefinition, ItemDefinition, StatusBarItem } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import { X, Save, Code, Settings, Palette, HelpCircle, ChevronRight, ClipboardCopy } from 'lucide-react'; // 此处修改1行
import { v4 as uuidv4 } from 'uuid';
import StyledItemRenderer from '../../StatusBar/Renderers/StyledItemRenderer';
// FIX: The `children` prop was removed from StyledItemRenderer, so these are no longer needed here.
// import NumericRenderer from '../../StatusBar/Renderers/NumericRenderer'; // 此处删除4行
// import ArrayRenderer from '../../StatusBar/Renderers/ArrayRenderer';
// import TextRenderer from '../../StatusBar/Renderers/TextRenderer';
// import ObjectListRenderer from '../../StatusBar/Renderers/ObjectListRenderer';
import { STYLE_CLASS_DOCUMENTATION } from '../../../services/styleDocumentation'; // 此处添加1行
import './StyleEditor.css';

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

    // FIX: The renderPreviewContent function is no longer needed as StyledItemRenderer
    // now handles rendering internally. Passing children to it is an error.
    return ( // 此处开始修改4行
        <div className="style-editor__preview-wrapper">
            <StyledItemRenderer item={mockItem} definition={mockDefinition} liveCssOverride={style.css} />
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
  const [showDocs, setShowDocs] = useState(false); // 此处添加1行
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setFormData(styleToEdit || { name: '', dataType: 'numeric', css: '', html: '' });
    }
  }, [isOpen, styleToEdit]);
  
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleChange = (field: keyof StyleDefinition, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error("样式名称不能为空");
      return;
    }
    onSave(formData as StyleDefinition);
    onClose();
  };

  const handleCopy = (text: string) => { // 此处开始添加4行
    navigator.clipboard.writeText(text);
    toast.success(`已复制: ${text}`);
  };

  if (!isOpen) return null;

  const docEntries = formData.dataType ? STYLE_CLASS_DOCUMENTATION[formData.dataType] : []; // 此处添加1行

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
                    </div>

                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Code size={14}/> HTML 模板 (可选, 暂未实现)</label>
                        <textarea
                            className="style-editor__textarea style-editor__textarea--html"
                            placeholder="使用 {{placeholder}} 语法..."
                            value={formData.html || ''}
                            onChange={(e) => handleChange('html', e.target.value)}
                            disabled={true}
                        />
                    </div>
                    
                    <div className="style-editor__form-group">
                        <label className="style-editor__label"><Code size={14}/> CSS 代码</label>
                        <textarea
                            className="style-editor__textarea style-editor__textarea--css"
                            placeholder={formData.dataType === 'theme' ? 'body { --color-primary: red; }' : '.numeric-renderer__progress-fill {\n  background: red;\n}'}
                            value={formData.css || ''}
                            onChange={(e) => handleChange('css', e.target.value)}
                        />
                    </div>

                    {/* CSS类名文档区 */}
                    {formData.dataType !== 'theme' && ( // 此处开始添加31行
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
