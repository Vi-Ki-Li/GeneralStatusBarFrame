
import React, { useState, useEffect } from 'react';
import { StatusBarData, SnapshotMeta } from '../../types';
import ManagerModal from './ManagerModal';
import ModuleNavigation, { ManagerModule } from './Navigation/ModuleNavigation';
import DataCenter from './Modules/DataCenter';
import DefinitionList from './Definitions/DefinitionList';
import StyleManager from './Styles/StyleManager';
import LayoutComposer from './Modules/LayoutComposer';
import SystemConfig from './Modules/SystemConfig';
import { X } from 'lucide-react';
import './StatusBarManager.css';

interface StatusBarManagerProps {
  isOpen: boolean;
  onClose: () => void;
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  snapshotEnabled: boolean;
  onToggleSnapshot: (enabled: boolean) => void;
  snapshotMeta: SnapshotMeta | null;
}

const StatusBarManager: React.FC<StatusBarManagerProps> = ({ 
    isOpen, onClose, data, onUpdate, snapshotEnabled, onToggleSnapshot, snapshotMeta
}) => {
  const [activeModule, setActiveModule] = useState<ManagerModule>('DATA');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [styleEditRequest, setStyleEditRequest] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (styleEditRequest) {
      setActiveModule('STYLES');
    }
  }, [styleEditRequest]);

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'DATA':
        return <DataCenter data={data} onUpdate={onUpdate} isMobile={isMobile} onGoToStyleEditor={setStyleEditRequest} />;
      case 'DEFINITIONS':
        return <DefinitionList data={data} onUpdate={onUpdate} onGoToStyleEditor={setStyleEditRequest} />;
      case 'STYLES':
        return <StyleManager 
          data={data} 
          onUpdate={onUpdate} 
          isMobile={isMobile}
          styleEditRequest={styleEditRequest}
          onStyleEditRequestProcessed={() => setStyleEditRequest(null)}
        />;
      case 'LAYOUT':
        return <LayoutComposer data={data} onUpdate={onUpdate} isMobile={isMobile} />;
      case 'SYSTEM':
        return <SystemConfig 
            data={data} 
            onUpdate={onUpdate} 
            snapshotEnabled={snapshotEnabled} 
            onToggleSnapshot={onToggleSnapshot} 
            snapshotMeta={snapshotMeta}
            onNavigate={setActiveModule}
        />;
      default:
        return <div>Module not found</div>;
    }
  };

  return (
    <ManagerModal isOpen={isOpen} onClose={onClose}>
      <div className={`manager__layout ${isMobile ? 'manager__layout--mobile' : ''}`}>
        
        <ModuleNavigation 
          activeModule={activeModule} 
          onSelect={setActiveModule} 
          isMobile={isMobile} 
        />

        <div className="manager__main-content">
            <div className="manager__header">
                 <h3 className="manager__title">
                    TavernHelper Manager
                 </h3>
                 <button onClick={onClose} className="manager__close-btn">
                    <X size={24} />
                 </button>
            </div>

            <div className="manager__module-container">
                {renderModuleContent()}
            </div>
        </div>
      </div>
    </ManagerModal>
  );
};

export default StatusBarManager;
