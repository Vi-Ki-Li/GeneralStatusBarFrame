
import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem, SnapshotMeta } from '../../types';
import { CATEGORY_ORDER } from '../../constants';
import ManagerModal from './ManagerModal';
import CharacterListSidebar from './CharacterListSidebar';
import CategoryEditor from './Editor/CategoryEditor';
import SnapshotSettings from './SnapshotSettings';
import PresetList from './Presets/PresetList';
import EntryList from './Entries/EntryList';
import StyleManager from './Styles/StyleManager';
import HelpGuide from './Help/HelpGuide';
import { useToast } from '../Toast/ToastContext';
import { AlertTriangle, Trash2, X, Plus } from 'lucide-react';

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
    isOpen, 
    onClose, 
    data, 
    onUpdate,
    snapshotEnabled,
    onToggleSnapshot,
    snapshotMeta
}) => {
  const [selectedId, setSelectedId] = useState<string | 'SHARED' | 'SNAPSHOT' | 'PRESETS' | 'ENTRIES' | 'STYLES' | 'HELP'>('SHARED');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const toast = useToast();
  
  // Sort characters
  const charNames = Object.keys(data.characters || {}).sort((a, b) => {
    if (a === 'User') return -1;
    if (b === 'User') return 1;
    return a.localeCompare(b);
  });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset selection if deleted
  useEffect(() => {
    const specialIds = ['SHARED', 'SNAPSHOT', 'PRESETS', 'ENTRIES', 'STYLES', 'HELP'];
    if (!specialIds.includes(selectedId) && !charNames.includes(selectedId)) {
      setSelectedId('SHARED');
    }
  }, [data, selectedId, charNames]);

  // --- Handlers ---

  const handleSelect = (id: any) => {
      setSelectedId(id);
  };

  const handleAddCharacter = () => {
    // 简化的移动端添加角色：使用 prompt
    const name = window.prompt("请输入新角色名称:");
    if (!name) return;
    try {
      const newData: StatusBarData = JSON.parse(JSON.stringify(data));
      if (!newData.characters) newData.characters = {};
      if (newData.characters[name]) {
          toast.warning("角色已存在");
          return;
      }
      newData.characters[name] = {};
      onUpdate(newData);
      handleSelect(name);
      toast.success(`角色 "${name}" 已创建`);
    } catch (e) {
      toast.error("添加角色失败");
    }
  };

  const handleUpdateItems = (category: string, newItems: StatusBarItem[]) => {
    const newData: StatusBarData = JSON.parse(JSON.stringify(data));
    if (selectedId === 'SHARED') {
      if (!newData.shared) newData.shared = {};
      newData.shared[category] = newItems;
    } else if (!['SNAPSHOT', 'PRESETS', 'ENTRIES', 'STYLES', 'HELP'].includes(selectedId)) {
      if (!newData.characters[selectedId]) newData.characters[selectedId] = {};
      newData.characters[selectedId][category] = newItems;
    }
    onUpdate(newData);
  };

  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  const executeReset = () => {
     const emptyData: StatusBarData = { 
         shared: {}, 
         characters: {}, 
         _meta: { ...data._meta } 
     };
     onUpdate(emptyData);
     setSelectedId('SHARED');
     setShowResetConfirm(false);
     toast.info("所有数据已重置为空");
  };

  // --- Render Logic ---

  const getCategoriesToRender = () => {
    if (selectedId === 'SHARED') {
      return ['ST', 'WP', 'MI'];
    }
    if (['SNAPSHOT', 'PRESETS', 'ENTRIES', 'STYLES', 'HELP'].includes(selectedId)) return [];
    return CATEGORY_ORDER.filter(c => !['ST', 'WP', 'MI'].includes(c));
  };

  const getCurrentItems = (category: string): StatusBarItem[] => {
    if (selectedId === 'SHARED') {
      return data.shared?.[category] || [];
    }
    if (!['SNAPSHOT', 'PRESETS', 'ENTRIES', 'STYLES', 'HELP'].includes(selectedId)) {
        return data.characters?.[selectedId]?.[category] || [];
    }
    return [];
  };

  const renderContent = () => {
    switch (selectedId) {
        case 'SNAPSHOT':
            return <SnapshotSettings 
                data={data} 
                enabled={snapshotEnabled}
                onToggle={onToggleSnapshot}
                meta={snapshotMeta}
            />;
        case 'PRESETS':
            return <PresetList />;
        case 'ENTRIES':
            return <EntryList />;
        case 'STYLES':
            return <StyleManager />;
        case 'HELP':
            return <HelpGuide />;
        default:
            return (
                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px' }}>
                  {getCategoriesToRender().map(catKey => (
                    <CategoryEditor 
                      key={catKey}
                      categoryKey={catKey}
                      items={getCurrentItems(catKey)}
                      onUpdateItems={(newItems) => handleUpdateItems(catKey, newItems)}
                    />
                  ))}
                  <div style={{ height: '40px' }} /> {/* Spacer */}
                </div>
            );
    }
  };

  // Mobile Tabs Renderer
  const renderMobileTabs = () => {
      const tabs = [
          { id: 'SHARED', label: '共享数据' },
          ...charNames.map(c => ({ id: c, label: c })),
          { id: 'ENTRIES', label: '条目' },
          { id: 'PRESETS', label: '预设' },
          { id: 'STYLES', label: '样式' },
          { id: 'SNAPSHOT', label: '快照' },
          { id: 'HELP', label: '帮助' }
      ];

      return (
          <div className="mobile-tabs-container">
             {tabs.map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => handleSelect(tab.id)}
                    className={`mobile-tab-item ${selectedId === tab.id ? 'active' : ''}`}
                 >
                    {tab.label}
                 </button>
             ))}
             <button 
                onClick={handleAddCharacter}
                className="mobile-tab-item"
                style={{ borderStyle: 'dashed' }}
             >
                <Plus size={14} />
             </button>
          </div>
      );
  };

  return (
    <ManagerModal isOpen={isOpen} onClose={onClose}>
      
      <div style={{ display: 'flex', height: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
          
          {/* Desktop Sidebar (Left) */}
          {!isMobile && (
              <div style={{ width: '240px', height: '100%', borderRight: '1px solid var(--chip-border)' }}>
                <CharacterListSidebar 
                    characters={charNames}
                    selectedChar={selectedId}
                    onSelect={handleSelect}
                    onAddCharacter={(name) => {
                        const newData = JSON.parse(JSON.stringify(data));
                        if (!newData.characters[name]) {
                            newData.characters[name] = {};
                            onUpdate(newData);
                            handleSelect(name);
                        }
                    }}
                    onResetData={handleResetData}
                />
              </div>
          )}

          {/* Main Content Area (Right) */}
          {/* 
            关键修复: 
            minWidth: 0 避免 Flex 子元素溢出
            overflow: hidden 确保内部滚动条能正常工作 (限制高度)
          */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
             
             {/* Header - Now visible on both Desktop and Mobile */}
             <div style={{ 
                 padding: isMobile ? '12px 16px' : '16px 24px', 
                 borderBottom: '1px solid var(--chip-border)',
                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                 background: 'var(--glass-bg)',
                 flexShrink: 0 /* 确保头部不被压缩 */
             }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {isMobile ? '状态栏管理' : (selectedId === 'SHARED' ? '共享数据' : selectedId)}
                 </h3>
                 
                 {/* Close Button - Always visible now since we removed modal frame header */}
                 <button onClick={onClose} style={{ border: 'none', background: 'transparent', padding: '4px', cursor: 'pointer', borderRadius: '50%' }} className="hover-bg">
                    <X size={24} style={{ color: 'var(--text-secondary)' }} />
                 </button>
             </div>

             {/* Mobile Scrollable Tabs */}
             {isMobile && renderMobileTabs()}

             {/* Content */}
             <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
                {renderContent()}
             </div>
          </div>
      </div>

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="glass-panel" style={{ 
            padding: '24px', width: '90%', maxWidth: '400px',
            border: '1px solid var(--color-danger)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-danger)' }}>
              <AlertTriangle size={32} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>警告</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>您确定要清空所有数据吗？此操作不可撤销。</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowResetConfirm(false)} className="btn btn--ghost">取消</button>
              <button onClick={executeReset} className="btn" style={{ background: 'var(--color-danger)', color: 'white' }}>
                <Trash2 size={16} /> 确认
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerModal>
  );
};

export default StatusBarManager;
