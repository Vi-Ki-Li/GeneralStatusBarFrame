import React, { useState, useMemo } from 'react';
import { StyleDefinition } from '../../../types';
import { STYLE_CLASS_DOCUMENTATION } from '../../../services/styleDocumentation';
import { ChevronDown, Palette, Type, VenetianMask, Blend } from 'lucide-react';
import './StyleGuiControls.css';

type GuiConfig = StyleDefinition['guiConfig'];

// Reusable Section Component
const GuiSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = useState(true);
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
const ColorControl: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <div className="gui-controls__control">
    <label>{label}</label>
    <div className="gui-controls__color-input-wrapper">
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
      <span>{value || 'N/A'}</span>
    </div>
  </div>
);

const TextControl: React.FC<{ label: string; placeholder: string; value: string; onChange: (value: string) => void }> = ({ label, placeholder, value, onChange }) => (
  <div className="gui-controls__control">
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
}

const StyleGuiControls: React.FC<StyleGuiControlsProps> = ({ guiConfig, onUpdate, dataType }) => {
  const [selectedSelector, setSelectedSelector] = useState('');

  const availableSelectors = useMemo(() => {
    return dataType ? STYLE_CLASS_DOCUMENTATION[dataType] || [] : [];
  }, [dataType]);

  // Effect to select the first available selector when dataType changes
  React.useEffect(() => {
    if (availableSelectors.length > 0) {
      setSelectedSelector(availableSelectors[0].className);
    } else {
      setSelectedSelector('');
    }
  }, [availableSelectors]);
  
  const currentProperties = useMemo(() => {
    return (guiConfig && guiConfig[selectedSelector]) || {};
  }, [guiConfig, selectedSelector]);
  
  const handlePropertyChange = (property: keyof React.CSSProperties, value: any) => {
    if (!selectedSelector) return;
    
    const newConfig = { ...guiConfig };
    if (!newConfig[selectedSelector]) {
      newConfig[selectedSelector] = {};
    }
    
    const newProperties = { ...newConfig[selectedSelector], [property]: value };
    
    // Cleanup: remove property if value is empty
    if (value === '' || value === undefined || value === null) {
      delete newProperties[property];
    }
    
    newConfig[selectedSelector] = newProperties;
    onUpdate(newConfig);
  };

  return (
    <div className="style-gui-controls">
      <div className="gui-controls__target-selector">
        <label>目标元素</label>
        <select value={selectedSelector} onChange={(e) => setSelectedSelector(e.target.value)}>
          {availableSelectors.map(doc => (
            <option key={doc.className} value={doc.className}>
              {doc.description} ({doc.className})
            </option>
          ))}
        </select>
      </div>

      <div className="gui-controls__scroll-container">
          <GuiSection title="字体与文本" icon={Type}>
            <ColorControl label="颜色" value={currentProperties.color as string} onChange={(v) => handlePropertyChange('color', v)} />
            <TextControl label="字号" placeholder="e.g. 1rem, 16px" value={currentProperties.fontSize as string} onChange={(v) => handlePropertyChange('fontSize', v)} />
            <TextControl label="字重" placeholder="e.g. 400, bold" value={currentProperties.fontWeight as string} onChange={(v) => handlePropertyChange('fontWeight', v)} />
          </GuiSection>

          <GuiSection title="背景与边框" icon={Palette}>
            <ColorControl label="背景色" value={currentProperties.backgroundColor as string} onChange={(v) => handlePropertyChange('backgroundColor', v)} />
            <TextControl label="边框" placeholder="e.g. 1px solid #ccc" value={currentProperties.border as string} onChange={(v) => handlePropertyChange('border', v)} />
            <TextControl label="圆角" placeholder="e.g. 8px" value={currentProperties.borderRadius as string} onChange={(v) => handlePropertyChange('borderRadius', v)} />
          </GuiSection>

          <GuiSection title="布局与间距" icon={VenetianMask}>
            <TextControl label="内边距" placeholder="e.g. 8px, 4px 8px" value={currentProperties.padding as string} onChange={(v) => handlePropertyChange('padding', v)} />
            <TextControl label="外边距" placeholder="e.g. 8px" value={currentProperties.margin as string} onChange={(v) => handlePropertyChange('margin', v)} />
          </GuiSection>
          
          <GuiSection title="特效" icon={Blend}>
            <TextControl label="阴影" placeholder="e.g. 0 2px 4px #000" value={currentProperties.boxShadow as string} onChange={(v) => handlePropertyChange('boxShadow', v)} />
            <TextControl label="不透明度" placeholder="e.g. 0.8" value={currentProperties.opacity as string} onChange={(v) => handlePropertyChange('opacity', v)} />
          </GuiSection>
      </div>
    </div>
  );
};

export default StyleGuiControls;
