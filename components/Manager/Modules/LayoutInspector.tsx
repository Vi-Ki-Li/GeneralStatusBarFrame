
import React from 'react';
import { LayoutNode } from '../../../types/layout';
import { ItemDefinition } from '../../../types';
import { Settings, Trash2, AlignLeft, AlignCenter, AlignRight, Layout, Plus, Minus, Columns, PanelRightClose, BringToFront, PanelRightOpen, Sliders } from 'lucide-react'; 
import { Palette, VenetianMask } from 'lucide-react'; 
import './LayoutComposer.css'; 

interface LayoutInspectorProps {
  node: LayoutNode | null;
  onUpdate: (id: string, updates: Partial<LayoutNode>) => void;
  onDelete: (id: string) => void;
  allDefinitions: { [key: string]: ItemDefinition };
  onSelectParent: (id: string) => void; 
  onAddColumn?: () => void; 
  onRemoveColumn?: () => void;
  onClose?: () => void; 
  onToggleDock?: () => void;
  isDocked?: boolean;
}

const ControlSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="inspector-section">
    <div className="inspector-section__header">
      <Icon size={14} />
      <span>{title}</span>
    </div>
    <div className="inspector-section__content">
      {children}
    </div>
  </div>
);

const NumberInput: React.FC<{ label: string; value: any; onChange: (val: any) => void; unit?: string }> = ({ label, value, onChange, unit }) => (
  <div className="inspector-control">
    <label>{label}</label>
    <div className="inspector-input-group">
      <input 
        type="number" 
        value={typeof value === 'number' ? value : parseInt(value) || ''} 
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
        placeholder="Auto"
      />
      {unit && <span className="inspector-unit">{unit}</span>}
    </div>
  </div>
);

const TextInput: React.FC<{ label: string; value: any; onChange: (val: any) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="inspector-control">
    <label>{label}</label>
    <input 
      type="text" 
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const ColorInput: React.FC<{ label: string; value: any; onChange: (val: any) => void }> = ({ label, value, onChange }) => (
  <div className="inspector-control">
    <label>{label}</label>
    <div className="inspector-color-wrapper">
        <input 
            type="color" 
            value={value || '#ffffff'} 
            onChange={e => onChange(e.target.value)}
        />
        <input 
            type="text" 
            value={value || ''} 
            onChange={e => onChange(e.target.value)}
            placeholder="transparent"
            className="inspector-color-text"
        />
    </div>
  </div>
);

const LayoutInspector: React.FC<LayoutInspectorProps> = ({ node, onUpdate, onDelete, allDefinitions, onAddColumn, onRemoveColumn, onClose, onToggleDock, isDocked }) => {
  
  // Universal Header Rendering
  const renderHeader = (title: string, icon: React.ElementType, showDelete: boolean = false) => (
      <div className="inspector-header">
        <div className="inspector-title">
            {React.createElement(icon, { size: 16 })}
            <span>{title}</span>
        </div>
        <div className="inspector-actions">
            {showDelete && node && (
                <button onClick={() => onDelete(node.id)} className="inspector-btn delete" title="删除">
                    <Trash2 size={16} />
                </button>
            )}
            
            {showDelete && <div className="inspector-divider" />}
            
            {onToggleDock && (
               <button onClick={onToggleDock} className="inspector-btn" title={isDocked ? "脱离面板 (浮窗)" : "停靠面板"}>
                   {isDocked ? <BringToFront size={16} /> : <PanelRightOpen size={16} />}
               </button>
            )}
            
            {onClose && (
                <button onClick={onClose} className="inspector-btn" title="关闭/收起">
                    <PanelRightClose size={16} />
                </button>
            )}
        </div>
      </div>
  );

  // Render empty state WITH HEADER if no node
  if (!node) {
    return (
      <div className="layout-inspector">
        {renderHeader("属性面板", Sliders, false)}
        <div className="layout-inspector--empty">
            <div className="layout-inspector__empty-content">
                <Settings size={48} strokeWidth={1} style={{opacity: 0.2}} />
                <p>请在画布中选择一个元素<br/>以编辑其属性</p>
            </div>
        </div>
      </div>
    );
  }

  const styles = node.props?.style || {};
  
  const updateStyle = (key: string, value: any) => {
    const newStyle = { ...styles, [key]: value };
    if (value === undefined || value === '') delete (newStyle as any)[key];
    
    onUpdate(node.id, {
        props: {
            ...node.props,
            style: newStyle
        }
    });
  };

  const updateProp = (key: string, value: any) => {
      onUpdate(node.id, {
          props: {
              ...node.props,
              [key]: value
          }
      });
  };

  const renderRowSettings = () => (
    <>
      {renderHeader("行容器 (Row)", AlignLeft, true)}

      <ControlSection title="列管理 (Columns)" icon={Columns}>
          <div className="inspector-action-row">
              <button onClick={onAddColumn} className="inspector-action-btn" title="添加一列">
                  <Plus size={14} /> 添加列
              </button>
              <button onClick={onRemoveColumn} className="inspector-action-btn" title="删除最后一列">
                  <Minus size={14} /> 删除列
              </button>
          </div>
          <div className="inspector-hint" style={{marginTop: 8}}>
              当前列数: {node.children?.length || 0}
          </div>
      </ControlSection>

      <ControlSection title="布局与间距" icon={Layout}>
        <NumberInput label="最小高度 (px)" value={styles.minHeight} onChange={v => updateStyle('minHeight', v)} unit="px" />
        <NumberInput label="内边距 (px)" value={styles.padding} onChange={v => updateStyle('padding', v)} unit="px" />
        <NumberInput label="外边距-下 (px)" value={styles.marginBottom} onChange={v => updateStyle('marginBottom', v)} unit="px" />
        <div className="inspector-control">
            <label>列间距 (Gap)</label>
            <select value={styles.gap || '8px'} onChange={e => updateStyle('gap', e.target.value)}>
                <option value="0px">无间距 (0px)</option>
                <option value="4px">紧凑 (4px)</option>
                <option value="8px">默认 (8px)</option>
                <option value="16px">宽松 (16px)</option>
                <option value="24px">超宽 (24px)</option>
            </select>
        </div>
      </ControlSection>

      <ControlSection title="外观" icon={Palette}>
        <ColorInput label="背景颜色" value={styles.backgroundColor} onChange={v => updateStyle('backgroundColor', v)} />
        <NumberInput label="圆角 (px)" value={styles.borderRadius} onChange={v => updateStyle('borderRadius', v)} unit="px" />
        <div className="inspector-control">
            <label>边框样式</label>
            <select value={styles.border || 'none'} onChange={e => updateStyle('border', e.target.value)}>
                <option value="none">无边框</option>
                <option value="1px solid var(--chip-border)">细边框</option>
                <option value="1px solid var(--color-primary)">高亮边框</option>
            </select>
        </div>
        <div className="inspector-checkbox">
            <label>
                <input 
                    type="checkbox" 
                    checked={!!styles.boxShadow} 
                    onChange={e => updateStyle('boxShadow', e.target.checked ? 'var(--shadow-md)' : undefined)} 
                />
                启用阴影 (Shadow)
            </label>
        </div>
      </ControlSection>
    </>
  );

  const renderColumnSettings = () => (
    <>
      {renderHeader("列容器 (Column)", AlignCenter, true)}

      <ControlSection title="布局" icon={Layout}>
        <NumberInput label="宽度 (%)" value={node.props?.width} onChange={v => updateProp('width', v)} unit="%" />
        <div className="inspector-hint">提示：通常可以通过拖拽画布中的调整条来改变宽度。</div>
        <div className="inspector-control">
            <label>垂直对齐</label>
            <select value={styles.justifyContent || 'flex-start'} onChange={e => updateStyle('justifyContent', e.target.value)}>
                <option value="flex-start">顶部对齐</option>
                <option value="center">居中对齐</option>
                <option value="flex-end">底部对齐</option>
                <option value="space-between">两端对齐</option>
            </select>
        </div>
      </ControlSection>

      <ControlSection title="外观" icon={Palette}>
        <ColorInput label="背景颜色" value={styles.backgroundColor} onChange={v => updateStyle('backgroundColor', v)} />
        <NumberInput label="内边距 (px)" value={styles.padding} onChange={v => updateStyle('padding', v)} unit="px" />
        <NumberInput label="圆角 (px)" value={styles.borderRadius} onChange={v => updateStyle('borderRadius', v)} unit="px" />
      </ControlSection>
    </>
  );

  const renderItemSettings = () => {
      const def = node.data?.key ? allDefinitions[node.data.key] : null;
      return (
        <>
          {renderHeader("组件 (Item)", AlignRight, true)}

          <div className="inspector-info-card">
              <div className="inspector-info-row">
                  <span className="label">Key:</span>
                  <span className="value">{def?.key || node.data?.key}</span>
              </div>
              <div className="inspector-info-row">
                  <span className="label">Name:</span>
                  <span className="value">{def?.name || '-'}</span>
              </div>
              <div className="inspector-info-row">
                  <span className="label">Type:</span>
                  <span className="value">{def?.type || '-'}</span>
              </div>
          </div>

          <ControlSection title="容器样式" icon={VenetianMask}>
             <div className="inspector-hint">此处样式仅应用于组件的外层包裹器。要修改组件内部样式，请使用“样式工坊”。</div>
             <NumberInput label="外边距-下 (px)" value={styles.marginBottom} onChange={v => updateStyle('marginBottom', v)} unit="px" />
             <ColorInput label="背景色 (Wrapper)" value={styles.backgroundColor} onChange={v => updateStyle('backgroundColor', v)} />
          </ControlSection>
        </>
      );
  };

  return (
    <div className="layout-inspector">
        {node.type === 'row' && renderRowSettings()}
        {node.type === 'col' && renderColumnSettings()}
        {(node.type === 'item' || node.type === 'category') && renderItemSettings()}
    </div>
  );
};

export default LayoutInspector;
