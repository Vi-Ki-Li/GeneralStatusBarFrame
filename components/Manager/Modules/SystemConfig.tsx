import React, { useState } from 'react';
import { StatusBarData, SnapshotMeta } from '../../../types';
import SnapshotSettings from '../SnapshotSettings';
import PresetList from '../Presets/PresetList';
import EntryList from '../Entries/EntryList';
import HelpGuide from '../Help/HelpGuide';
import { Camera, Layers, ListFilter, CircleHelp } from 'lucide-react';
import './SystemConfig.css';

interface SystemConfigProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void; // 此处添加1行
  snapshotEnabled: boolean;
  onToggleSnapshot: (enabled: boolean) => void;
  snapshotMeta: SnapshotMeta | null;
}

type SystemTab = 'SNAPSHOT' | 'PRESETS' | 'ENTRIES' | 'HELP';

const SystemConfig: React.FC<SystemConfigProps> = ({ 
  data, onUpdate, snapshotEnabled, onToggleSnapshot, snapshotMeta // 此处修改1行
}) => {
  const [activeTab, setActiveTab] = useState<SystemTab>('PRESETS'); // Default to presets

  const tabs: { id: SystemTab; label: string; icon: React.ElementType }[] = [
    { id: 'SNAPSHOT', label: '动态快照', icon: Camera },
    { id: 'PRESETS', label: '配置预设', icon: Layers },
    { id: 'ENTRIES', label: '条目管理', icon: ListFilter },
    { id: 'HELP', label: '使用指南', icon: CircleHelp },
  ];

  return (
    <div className="system-config">
      <div className="system-config__tabs-container">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`system-config__tab ${isActive ? 'active' : ''}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="system-config__content-area">
        {activeTab === 'SNAPSHOT' && (
          <SnapshotSettings 
            data={data} 
            enabled={snapshotEnabled} 
            onToggle={onToggleSnapshot} 
            meta={snapshotMeta} 
          />
        )}
        {activeTab === 'PRESETS' && <PresetList data={data} onUpdate={onUpdate} />}
        {activeTab === 'ENTRIES' && <EntryList />}
        {activeTab === 'HELP' && <HelpGuide />}
      </div>
    </div>
  );
};

export default SystemConfig;
