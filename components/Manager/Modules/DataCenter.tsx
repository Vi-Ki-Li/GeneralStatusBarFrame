import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem } from '../../../types';
import { getCategoryDefinition } from '../../../services/definitionRegistry';
import { getCharacterName, generateCharacterId } from '../../../utils/idManager';
import { useToast } from '../../Toast/ToastContext';
import CharacterListSidebar from '../CharacterListSidebar';
import CategoryEditor from '../Editor/CategoryEditor';
import { Plus } from 'lucide-react';

interface DataCenterProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  isMobile: boolean;
}

const DataCenter: React.FC<DataCenterProps> = ({ data, onUpdate, isMobile }) => {
  const [selectedId, setSelectedId] = useState<string>('SHARED');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const toast = useToast();

  // Prepare Character List
  const charIds = Object.keys(data.characters || {});
  const charList = charIds.map(id => ({
      id, 
      name: getCharacterName(data.id_map, id)
  })).sort((a, b) => {
      if (a.id === 'char_user') return -1;
      if (b.id === 'char_user') return 1;
      return a.name.localeCompare(b.name);
  });

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
      setSelectedId(newId);
      toast.success(`角色 "${name}" 已创建`);
  };

  const handleResetData = () => setShowResetConfirm(true);
  
  const executeReset = () => {
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

  const getCategoriesToRender = () => {
    const allKeys = Object.keys(data.categories || {});
    const sorted = allKeys.sort((a, b) => data.categories[a].order - data.categories[b].order);
    if (selectedId === 'SHARED') return ['ST', 'WP', 'MI'];
    return sorted.filter(c => !['ST', 'WP', 'MI'].includes(c));
  };

  const getCurrentItems = (category: string): StatusBarItem[] => {
    if (selectedId === 'SHARED') return data.shared?.[category] || [];
    return data.characters?.[selectedId]?.[category] || [];
  };

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
      
      {/* Sidebar (Desktop) or Tabs (Mobile) */}
      {!isMobile ? (
        <div style={{ width: '220px', height: '100%', borderRight: '1px solid var(--chip-border)' }}>
          <CharacterListSidebar 
            characters={charList.map(c => c.name)} 
            selectedId={selectedId === 'SHARED' ? 'SHARED' : getCharacterName(data.id_map, selectedId)}
            onSelect={(nameOrShared) => {
              if (nameOrShared === 'SHARED') setSelectedId('SHARED');
              else {
                const found = charList.find(c => c.name === nameOrShared);
                if (found) setSelectedId(found.id);
              }
            }}
            onAddCharacter={handleAddCharacter}
            onResetData={handleResetData}
          />
        </div>
      ) : (
         <div className="mobile-tabs-container">
            <button onClick={() => setSelectedId('SHARED')} className={`mobile-tab-item ${selectedId === 'SHARED' ? 'active' : ''}`}>共享</button>
            {charList.map(c => (
                <button key={c.id} onClick={() => setSelectedId(c.id)} className={`mobile-tab-item ${selectedId === c.id ? 'active' : ''}`}>{c.name}</button>
            ))}
            <button onClick={() => handleAddCharacter(prompt("角色名?")||"")} className="mobile-tab-item"><Plus size={14} /></button>
         </div>
      )}

      {/* Main Editor Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px', position: 'relative' }}>
          <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedId === 'SHARED' ? '共享世界数据' : getCharacterName(data.id_map, selectedId)}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                  ID: {selectedId}
              </div>
          </div>

          {getCategoriesToRender().map(catKey => (
            <CategoryEditor 
                key={catKey}
                categoryKey={catKey}
                categoryDef={getCategoryDefinition(data.categories, catKey)}
                itemDefinitions={data.item_definitions}
                items={getCurrentItems(catKey)}
                onUpdateItems={(newItems) => handleUpdateItems(catKey, newItems)}
            />
          ))}
          <div style={{ height: '40px' }} />
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="glass-panel" style={{ padding: '24px', width: '300px', border: '1px solid var(--color-danger)' }}>
             <h3 style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>确认重置?</h3>
             <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>将清空所有共享数据和角色数据（保留定义和样式）。</p>
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setShowResetConfirm(false)} className="btn btn--ghost">取消</button>
                <button onClick={executeReset} className="btn" style={{ background: 'var(--color-danger)', color: 'white' }}>确认</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCenter;