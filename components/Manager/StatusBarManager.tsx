import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem, SnapshotMeta } from '../../types';
import { getCategoryDefinition } from '../../services/definitionRegistry';
import { getCharacterName, generateCharacterId } from '../../utils/idManager';
import ManagerModal from './ManagerModal';
import CharacterListSidebar from './CharacterListSidebar';
import CategoryEditor from './Editor/CategoryEditor';
import SnapshotSettings from './SnapshotSettings';
import PresetList from './Presets/PresetList';
import EntryList from './Entries/EntryList';
import StyleManager from './Styles/StyleManager';
import DefinitionList from './Definitions/DefinitionList'; 
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
    isOpen, onClose, data, onUpdate, snapshotEnabled, onToggleSnapshot, snapshotMeta
}) => {
  const [selectedId, setSelectedId] = useState<string>('SHARED');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const toast = useToast();

  const charIds = Object.keys(data.characters || {});
  const charList = charIds.map(id => ({
      id, 
      name: getCharacterName(data.id_map, id)
  })).sort((a, b) => {
      if (a.id === 'char_user') return -1;
      if (b.id === 'char_user') return 1;
      return a.name.localeCompare(b.name);
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelect = (id: string) => setSelectedId(id);

  const handleAddCharacter = (name: string) => {
      const existingId = Object.keys(data.id_map).find(key => data.id_map[key] === name);
      if (existingId && data.characters[existingId]) {
          toast.warning("角色已存在");
          return;
      }

      const newId = existingId || generateCharacterId();
      const newData = JSON.parse(JSON.stringify(data));
      newData.id_map[newId] = name;
      newData.characters[newId] = {};
      
      onUpdate(newData);
      handleSelect(newId);
      toast.success(`角色 "${name}" 已创建`);
  };

  const handleUpdateItems = (category: string, newItems: StatusBarItem[]) => {
    const newData = JSON.parse(JSON.stringify(data));
    if (selectedId === 'SHARED') {
      if (!newData.shared) newData.shared = {};
      newData.shared[category] = newItems;
    } else {
      if (!newData.characters[selectedId]) newData.characters[selectedId] = {};
      newData.characters[selectedId][category] = newItems;
    }
    onUpdate(newData);
  };

  const handleResetData = () => setShowResetConfirm(true);
  
  const executeReset = () => {
     // Keep Definitions and User Map
     const emptyData: StatusBarData = { 
         categories: data.categories,
         item_definitions: data.item_definitions,
         id_map: { 'char_user': 'User' },
         shared: {}, 
         characters: { 'char_user': {} }, 
         _meta: { ...data._meta } 
     };
     onUpdate(emptyData);
     setSelectedId('SHARED');
     setShowResetConfirm(false);
     toast.info("数据已重置");
  };

  const isSpecialPage = ['SNAPSHOT', 'PRESETS', 'ENTRIES', 'STYLES', 'HELP', 'DEFINITIONS'].includes(selectedId);
  
  const getCategoriesToRender = () => {
    // Sort categories based on registry order
    const allKeys = Object.keys(data.categories || {});
    const sorted = allKeys.sort((a, b) => data.categories[a].order - data.categories[b].order);
    
    if (selectedId === 'SHARED') {
        return ['ST', 'WP', 'MI']; // Default shared categories
    }
    return sorted.filter(c => !['ST', 'WP', 'MI'].includes(c));
  };

  const getCurrentItems = (category: string): StatusBarItem[] => {
    if (selectedId === 'SHARED') return data.shared?.[category] || [];
    return data.characters?.[selectedId]?.[category] || [];
  };

  const renderContent = () => {
    if (isSpecialPage) {
        switch (selectedId) {
            case 'SNAPSHOT': return <SnapshotSettings data={data} enabled={snapshotEnabled} onToggle={onToggleSnapshot} meta={snapshotMeta} />;
            case 'PRESETS': return <PresetList />;
            case 'ENTRIES': return <EntryList />;
            case 'STYLES': return <StyleManager />;
            case 'DEFINITIONS': return <DefinitionList data={data} onUpdate={onUpdate} />;
            case 'HELP': return <HelpGuide />;
        }
    }

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px' }}>
            {getCategoriesToRender().map(catKey => (
            <CategoryEditor 
                key={catKey}
                categoryKey={catKey}
                categoryDef={getCategoryDefinition(data.categories, catKey)}
                itemDefinitions={data.item_definitions} // Pass item definitions
                items={getCurrentItems(catKey)}
                onUpdateItems={(newItems) => handleUpdateItems(catKey, newItems)}
            />
            ))}
            <div style={{ height: '40px' }} />
        </div>
    );
  };

  return (
    <ManagerModal isOpen={isOpen} onClose={onClose}>
      <div style={{ display: 'flex', height: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
          {!isMobile && (
              <div style={{ width: '240px', height: '100%', borderRight: '1px solid var(--chip-border)' }}>
                <CharacterListSidebar 
                    characters={charList.map(c => c.name)} 
                    selectedChar={isSpecialPage ? selectedId : getCharacterName(data.id_map, selectedId)}
                    onSelect={(val) => {
                        if (['SHARED', 'SNAPSHOT', 'PRESETS', 'ENTRIES', 'STYLES', 'HELP', 'DEFINITIONS'].includes(val)) {
                            handleSelect(val);
                        } else {
                            const found = charList.find(c => c.name === val);
                            if (found) handleSelect(found.id);
                        }
                    }}
                    onAddCharacter={handleAddCharacter}
                    onResetData={handleResetData}
                />
              </div>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
             <div style={{ 
                 padding: isMobile ? '12px 16px' : '16px 24px', 
                 borderBottom: '1px solid var(--chip-border)',
                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                 background: 'var(--glass-bg)', flexShrink: 0 
             }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {isMobile ? '管理器' : (selectedId === 'SHARED' ? '共享数据' : (isSpecialPage ? (selectedId === 'DEFINITIONS' ? '定义工作室' : selectedId) : getCharacterName(data.id_map, selectedId)))}
                 </h3>
                 <button onClick={onClose} style={{ border: 'none', background: 'transparent', padding: '4px', cursor: 'pointer' }}>
                    <X size={24} color="var(--text-secondary)" />
                 </button>
             </div>
             
             {isMobile && (
                <div className="mobile-tabs-container">
                    <button onClick={() => handleSelect('SHARED')} className={`mobile-tab-item ${selectedId === 'SHARED' ? 'active' : ''}`}>共享</button>
                    {charList.map(c => (
                        <button key={c.id} onClick={() => handleSelect(c.id)} className={`mobile-tab-item ${selectedId === c.id ? 'active' : ''}`}>{c.name}</button>
                    ))}
                    <button onClick={() => handleAddCharacter(prompt("Name?")||"")} className="mobile-tab-item"><Plus size={14} /></button>
                </div>
             )}

             <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
                {renderContent()}
             </div>
          </div>
      </div>
      
      {showResetConfirm && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="glass-panel" style={{ padding: '24px', width: '300px', border: '1px solid var(--color-danger)' }}>
             <h3 style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>确认重置?</h3>
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setShowResetConfirm(false)} className="btn btn--ghost">取消</button>
                <button onClick={executeReset} className="btn" style={{ background: 'var(--color-danger)', color: 'white' }}>确认</button>
             </div>
          </div>
        </div>
      )}
    </ManagerModal>
  );
};

export default StatusBarManager;