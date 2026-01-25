import React, { useMemo } from 'react';
import { StyleDefinition } from '../../../types';
import { STYLE_CLASS_DOCUMENTATION } from '../../../services/styleDocumentation';
import { ChevronDown, Palette, Type, VenetianMask, Blend, MousePointerClick } from 'lucide-react';
import './StyleGuiControls.css';

type GuiConfig = StyleDefinition['guiConfig'];

// Reusable Section Component
const GuiSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  return (
    <div className={`gui-controls__section ${isOpen ? 'open' : ''}`}>
      <button className="gui-controls__section-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="gui-controls__section-title">
            <Icon size={14} />
            <span>{title}</span>
        </div>
        <ChevronDown size={16} className="gui-controls__section-arrow" />
      </button>
      {isOpen && <div className="gui-controls__section-content">{children}</div>}
    </div>
  );
};

// Reusable Control Components
const ColorControl: React.FC<{ label: string; value: string; onChange: (value: string) => void, title: string }> = ({ label, value, onChange, title }) => (
  <div className="gui-controls__control" title={title}>
    <label>{label}</label>
    <div className="gui-controls__color-input-wrapper">
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
      <input 
        type="text" 
        className="gui-controls__color-text-input"
        value={value || ''}
        placeholder="#FFFFFF"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

const TextControl: React.FC<{ label: string; placeholder: string; value: string; onChange: (value: string) => void, title: string }> = ({ label, placeholder, value, onChange, title }) => (
  <div className="gui-controls__control" title={title}>
    <label>{label}</label>
    <input
      type="text"
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="gui-controls__text-input"
    />
  </div>
);


interface StyleGuiControlsProps {
  guiConfig: GuiConfig;
  onUpdate: (newConfig: GuiConfig) => void;
  dataType: StyleDefinition['dataType'];
  activeSelector: string | null;
}

const StyleGuiControls: React.FC<StyleGuiControlsProps> = ({ guiConfig, onUpdate, dataType, activeSelector }) => {

  const selectorInfo = useMemo(() => {
    const docs = dataType ? STYLE_CLASS_DOCUMENTATION[dataType] || [] : [];
    return docs.find(d => d.className === activeSelector);
  }, [dataType, activeSelector]);

  const currentProperties = useMemo(() => {
    return (activeSelector && guiConfig && guiConfig[activeSelector]) || {};
  }, [guiConfig, activeSelector]);
  
  const handlePropertyChange = (property: keyof React.CSSProperties, value: any) => {
    if (!activeSelector) return;
    
    const newConfig = { ...guiConfig };
    if (!newConfig[activeSelector]) newConfig[activeSelector] = {};
    
    const newProperties = { ...newConfig[activeSelector], [property]: value };
    
    if (value === '' || value === undefined || value === null) {
      delete newProperties[property];
    }
    
    newConfig[activeSelector] = newProperties;
    onUpdate(newConfig);
  };

  return (
    <div className="style-gui-controls">
      <div className="gui-controls__target-display">
        <div className="gui-controls__target-label">
            <MousePointerClick size={14}/>
            <span>当前编辑</span>
        </div>
        <div className="gui-controls__target-name-wrapper">
          {selectorInfo ? (
            <>
              <span className="gui-controls__target-description">{selectorInfo.description}</span>
              <code className="gui-controls__target-selector-name">{selectorInfo.className}</code>
            </>
          ) : (
            <span className="gui-controls__target-placeholder">请在右侧预览区点击一个元素</span>
          )}
        </div>
      </div>

      <div className={`gui-controls__scroll-container ${!activeSelector ? 'disabled' : ''}`}>
          <GuiSection title="字体与文本" icon={Type}>
            <ColorControl title="设置文字颜色 (CSS: color)" label="颜色 (color)" value={currentProperties.color as string} onChange={(v) => handlePropertyChange('color', v)} />
            <TextControl title="设置文字大小 (CSS: font-size)" label="字号 (font-size)" placeholder="e.g. 1rem, 16px" value={currentProperties.fontSize as string} onChange={(v) => handlePropertyChange('fontSize', v)} />
            <TextControl title="设置文字粗细 (CSS: font-weight)" label="字重 (font-weight)" placeholder="e.g. 400, bold" value={currentProperties.fontWeight as string} onChange={(v) => handlePropertyChange('fontWeight', v)} />
          </GuiSection>

          <GuiSection title="背景与边框" icon={Palette}>
            <ColorControl title="设置背景颜色 (CSS: background-color)" label="背景色 (background-color)" value={currentProperties.backgroundColor as string} onChange={(v) => handlePropertyChange('backgroundColor', v)} />
            <TextControl title="设置边框样式 (CSS: border)" label="边框 (border)" placeholder="e.g. 1px solid #ccc" value={currentProperties.border as string} onChange={(v) => handlePropertyChange('border', v)} />
            <TextControl title="设置边角圆润程度 (CSS: border-radius)" label="圆角 (border-radius)" placeholder="e.g. 8px" value={currentProperties.borderRadius as string} onChange={(v) => handlePropertyChange('borderRadius', v)} />
          </GuiSection>

          <GuiSection title="布局与间距" icon={VenetianMask}>
            <TextControl title="设置内部留白 (CSS: padding)" label="内边距 (padding)" placeholder="e.g. 8px, 4px 8px" value={currentProperties.padding as string} onChange={(v) => handlePropertyChange('padding', v)} />
            <TextControl title="设置外部距离 (CSS: margin)" label="外边距 (margin)" placeholder="e.g. 8px" value={currentProperties.margin as string} onChange={(v) => handlePropertyChange('margin', v)} />
          </GuiSection>
          
          <GuiSection title="特效" icon={Blend}>
            <TextControl title="设置盒子阴影 (CSS: box-shadow)" label="阴影 (box-shadow)" placeholder="e.g. 0 2px 4px #000" value={currentProperties.boxShadow as string} onChange={(v) => handlePropertyChange('boxShadow', v)} />
            <TextControl title="设置透明度 (CSS: opacity)" label="不透明度 (opacity)" placeholder="e.g. 0.8" value={currentProperties.opacity as string} onChange={(v) => handlePropertyChange('opacity', v)} />
          </GuiSection>
      </div>
    </div>
  );
};

export default StyleGuiControls;