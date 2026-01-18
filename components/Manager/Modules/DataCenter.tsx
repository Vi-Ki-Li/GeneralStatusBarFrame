import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem } from '../../../types';
import { getCategoryDefinition } from '../../../services/definitionRegistry';
import { resolveDisplayName } from '../../../utils/idManager';
import { useToast } from '../../Toast/ToastContext';
import CharacterListSidebar from '../CharacterListSidebar';
import CategoryEditor from '../Editor/CategoryEditor';
import MobileAddCharacterModal from '../MobileAddCharacterModal';
import { Plus } from 'lucide-react';

interface DataCenterProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  isMobile: boolean;
}

const DataCenter: React.FC<DataCenterProps> = ({ data, onUpdate, isMobile }) => {
  const [selectedId, setSelectedId] = useState<string>('SHARED');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMobileAdd, setShowMobileAdd] = useState(false);
  const toast = useToast();

  // Prepare Character List
  const charIds = Object.keys(data.characters || {});
  const charList = charIds.map(id => ({
      id, 
      name: resolveDisplayName(data, id)
  })).sort((a, b) => {
      if (a.id === 'char_user') return -1;
      if (b.id === 'char_user') return 1;
      return a.name.localeCompare(b.name);
  });

  const handleAddCharacter = (id: string, name: string) => {
      // 1. 检查 ID 是否已存在
      if (data.id_map[id] || data.characters[id]) {
          toast.warning("ID 已存在，无法创建重复角色");
          return;
      }

      const newData = JSON.parse(JSON.stringify(data));
      
      // 2. 注册 ID 映射 (ID -> Name)
      // 注意：这里的 Name 仅作为 id_map 的回退值
      newData.id_map[id] = name;
      
      // 3. 初始化角色数据结构
      newData.characters[id] = {};
      
      // 4. 自动添加 [CP|名字] 条目 (数据驱动的显示名)
      newData.characters[id]['CP'] = [{
          key: '名字',
          values: [name],
          source_id: 9999,
          user_modified: true, // 标记为用户修改，防止被 AI 轻易覆盖（除非 AI 也是更新这个 Key）
          category: 'CP'
      }];

      onUpdate(newData);
      setSelectedId(id);
      toast.success(`角色 "${name}" (${id}) 已创建`);
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
            characters={charList} 
            selectedId={selectedId}
            onSelect={setSelectedId}
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
            <button onClick={() => setShowMobileAdd(true)} className="mobile-tab-item"><Plus size={14} /></button>
         </div>
      )}

      {/* Main Editor Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px', position: 'relative' }}>
          <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedId === 'SHARED' ? '共享世界数据' : resolveDisplayName(data, selectedId)}
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

      {/* Mobile Add Modal */}
      <MobileAddCharacterModal 
         isOpen={showMobileAdd} 
         onClose={() => setShowMobileAdd(false)}
         onConfirm={handleAddCharacter}
         existingIds={charList.map(c => c.id)}
      />

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