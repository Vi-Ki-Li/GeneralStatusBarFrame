import React, { useState, useEffect } from 'react';
import { StatusBarData, SnapshotMeta } from '../../types';
import ManagerModal from './ManagerModal';
import ModuleNavigation, { ManagerModule } from './Navigation/ModuleNavigation';

// Modules
import DataCenter from './Modules/DataCenter';
import DefinitionList from './Definitions/DefinitionList'; // Reusing existing component as DefinitionStudio
import StyleManager from './Styles/StyleManager'; // Reusing as StyleAtelier
import LayoutComposer from './Modules/LayoutComposer';
import SystemConfig from './Modules/SystemConfig';

import { X } from 'lucide-react';

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'DATA':
        return <DataCenter data={data} onUpdate={onUpdate} isMobile={isMobile} />;
      case 'DEFINITIONS':
        return <DefinitionList data={data} onUpdate={onUpdate} />;
      case 'STYLES':
        return <StyleManager />;
      case 'LAYOUT':
        return <LayoutComposer data={data} onUpdate={onUpdate} />;
      case 'SYSTEM':
        return <SystemConfig 
            data={data} 
            snapshotEnabled={snapshotEnabled} 
            onToggleSnapshot={onToggleSnapshot} 
            snapshotMeta={snapshotMeta} 
        />;
      default:
        return <div>Module not found</div>;
    }
  };

  return (
    <ManagerModal isOpen={isOpen} onClose={onClose}>
      <div style={{ display: 'flex', height: '100%', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
        
        {/* Navigation Bar */}
        <ModuleNavigation 
          activeModule={activeModule} 
          onSelect={setActiveModule} 
          isMobile={isMobile} 
        />

        {/* Module Content Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: 'var(--bg-app)' }}>
            
            {/* Top Bar for Close (Mobile/Desktop) */}
            <div style={{ 
                 padding: isMobile ? '12px 16px' : '16px 24px', 
                 borderBottom: '1px solid var(--chip-border)',
                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                 background: 'var(--glass-bg)', flexShrink: 0 
            }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    TavernHelper Manager
                 </h3>
                 <button onClick={onClose} style={{ border: 'none', background: 'transparent', padding: '4px', cursor: 'pointer' }}>
                    <X size={24} color="var(--text-secondary)" />
                 </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {renderModuleContent()}
            </div>
        </div>
      </div>
    </ManagerModal>
  );
};

export default StatusBarManager;