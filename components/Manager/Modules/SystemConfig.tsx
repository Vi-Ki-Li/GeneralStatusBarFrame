import React, { useState } from 'react';
import { StatusBarData, SnapshotMeta } from '../../../types';
import SnapshotSettings from '../SnapshotSettings';
import PresetList from '../Presets/PresetList';
import EntryList from '../Entries/EntryList';
import HelpGuide from '../Help/HelpGuide';
import { Camera, Layers, ListFilter, CircleHelp } from 'lucide-react';

interface SystemConfigProps {
  data: StatusBarData;
  snapshotEnabled: boolean;
  onToggleSnapshot: (enabled: boolean) => void;
  snapshotMeta: SnapshotMeta | null;
}

type SystemTab = 'SNAPSHOT' | 'PRESETS' | 'ENTRIES' | 'HELP';

const SystemConfig: React.FC<SystemConfigProps> = ({ 
  data, snapshotEnabled, onToggleSnapshot, snapshotMeta 
}) => {
  const [activeTab, setActiveTab] = useState<SystemTab>('SNAPSHOT');

  const tabs: { id: SystemTab; label: string; icon: React.ElementType }[] = [
    { id: 'SNAPSHOT', label: '动态快照', icon: Camera },
    { id: 'PRESETS', label: '配置预设', icon: Layers },
    { id: 'ENTRIES', label: '条目管理', icon: ListFilter },
    { id: 'HELP', label: '使用指南', icon: CircleHelp },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab Navigation */}
      <div style={{ 
          display: 'flex', 
          gap: '12px', 
          padding: '16px 24px 0', 
          borderBottom: '1px solid var(--chip-border)',
          background: 'var(--glass-bg)'
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-1px'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-app)' }}>
        {activeTab === 'SNAPSHOT' && (
          <SnapshotSettings 
            data={data} 
            enabled={snapshotEnabled} 
            onToggle={onToggleSnapshot} 
            meta={snapshotMeta} 
          />
        )}
        {activeTab === 'PRESETS' && <PresetList />}
        {activeTab === 'ENTRIES' && <EntryList />}
        {activeTab === 'HELP' && <HelpGuide />}
      </div>
    </div>
  );
};

export default SystemConfig;