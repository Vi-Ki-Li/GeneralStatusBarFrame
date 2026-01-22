
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './LayoutComposer.css';
// FIX: Import StatusBarData to define component props.
import { StatusBarData } from '../../../types';

// FIX: Define props for the component to accept `data` and `onUpdate`.
interface LayoutComposerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const LayoutComposer: React.FC<LayoutComposerProps> = () => {
  return (
    <div className="layout-composer-placeholder">
      <AlertTriangle size={48} />
      <h3>功能降级</h3>
      <p>
        由于拖拽功能存在兼容性问题，布局编排器暂时禁用。
        <br />
        我们将在后续版本中修复并重新启用此功能。
      </p>
    </div>
  );
};

export default LayoutComposer;
