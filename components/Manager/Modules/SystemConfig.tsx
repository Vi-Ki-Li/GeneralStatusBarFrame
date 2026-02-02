
import React, { useState, useEffect } from 'react';
import { StatusBarData, SnapshotMeta } from '../../../types';
import { styleService } from '../../../services/styleService';
import SnapshotSettings from '../SnapshotSettings';
import PresetList from '../Presets/PresetList';
import EntryList from '../Entries/EntryList';
import BackupManager from '../System/BackupManager'; 
import HelpGuide from '../Help/HelpGuide';
import { Camera, Layers, ListFilter, CircleHelp, Archive, PanelLeftOpen, PanelLeftClose, Settings } from 'lucide-react'; 
import { ManagerModule } from '../Navigation/ModuleNavigation';
import '../ManagerLayout.css'; 

interface SystemConfigProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  snapshotEnabled: boolean;
  onToggleSnapshot: (enabled: boolean) => void;
  snapshotMeta: SnapshotMeta | null;
  onNavigate: (module: ManagerModule) => void;
}

type SystemTab = 'SNAPSHOT' | 'PRESETS' | 'ENTRIES' | 'BACKUP' | 'HELP';

const SystemConfig: React.FC<SystemConfigProps> = ({ 
  data, onUpdate, snapshotEnabled, onToggleSnapshot, snapshotMeta, onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<SystemTab>('PRESETS'); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // 此处添加
  const allStyles = styleService.getStyleDefinitions();

  // 此处开始添加监听逻辑
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // 此处完成添加

  const tabs: { id: SystemTab; label: string; icon: React.ElementType, description?: string }[] = [
    { id: 'PRESETS', label: '配置预设', icon: Layers, description: '管理主题与布局配置' },
    { id: 'SNAPSHOT', label: '动态快照', icon: Camera, description: '自动生成世界叙事' },
    { id: 'ENTRIES', label: '条目管理', icon: ListFilter, description: '世界书条目列表' },
    { id: 'BACKUP', label: '备份与迁移', icon: Archive, description: '导入/导出数据' },
    { id: 'HELP', label: '使用指南', icon: CircleHelp, description: '帮助文档' },
  ];

  const renderContent = () => {
      switch (activeTab) {
          case 'SNAPSHOT': return <SnapshotSettings data={data} enabled={snapshotEnabled} onToggle={onToggleSnapshot} meta={snapshotMeta} />;
          case 'PRESETS': return <PresetList data={data} onUpdate={onUpdate} allStyles={allStyles} onNavigate={onNavigate} />;
          case 'ENTRIES': return <EntryList />;
          case 'BACKUP': return <BackupManager data={data} onUpdate={onUpdate} />;
          case 'HELP': return <HelpGuide />;
          default: return null;
      }
  };

  const activeTabInfo = tabs.find(t => t.id === activeTab);

  return (
    <div className="th-manager">
        <div className="th-manager__layout">
            
            {/* Sidebar Navigation (Desktop Only) */}
            {!isMobile && ( // 此处修改: 仅桌面端显示 Sidebar
                <div className={`th-manager__sidebar ${isSidebarCollapsed ? 'th-manager__sidebar--collapsed' : ''}`}>
                    <div className="th-manager__sidebar-header">
                        <div className="th-manager__sidebar-title">
                            <Settings size={16} /> 系统菜单
                        </div>
                        <button 
                            onClick={() => setIsSidebarCollapsed(true)} 
                            className="th-manager__icon-btn desktop-only"
                            title="收起侧边栏"
                        >
                            <PanelLeftClose size={16} />
                        </button>
                    </div>
                    
                    <div className="th-manager__sidebar-content">
                        {tabs.map(tab => (
                            <div 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`th-manager__list-item ${activeTab === tab.id ? 'th-manager__list-item--active' : ''}`}
                            >
                                <div className="th-manager__item-main">
                                    <div className="th-manager__item-icon"><tab.icon size={18} /></div>
                                    <span className="th-manager__item-text">{tab.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mobile Navigation Tabs */}
            {isMobile && ( // 此处添加: 移动端显示顶部 Tabs
                <div className="th-manager__mobile-tabs">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`th-manager__mobile-tab ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Main Content Area */}
            <div className="th-manager__main">
                <div className="th-manager__main-header">
                    <div className="th-manager__main-title-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {isSidebarCollapsed && !isMobile && ( // 此处修改: 仅桌面端显示展开按钮
                                <button 
                                    onClick={() => setIsSidebarCollapsed(false)} 
                                    className="th-manager__icon-btn desktop-only"
                                    title="展开侧边栏"
                                >
                                    <PanelLeftOpen size={16} />
                                </button>
                            )}
                            <h2 className="th-manager__main-title">{activeTabInfo?.label}</h2>
                        </div>
                        <div className="th-manager__main-subtitle">
                            {activeTabInfo?.description}
                        </div>
                    </div>
                </div>

                <div className="th-manager__main-content" style={{padding: 0}}>
                    {renderContent()}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SystemConfig;
