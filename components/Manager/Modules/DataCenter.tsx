
import React, { useState, useEffect, useRef } from 'react';
import { StatusBarData, StatusBarItem } from '../../../types';
import { getCategoryDefinition } from '../../../services/definitionRegistry';
import { resolveDisplayName } from '../../../utils/idManager';
import { syncMetaFromData } from '../../../utils/dataMerger';
import { useToast } from '../../Toast/ToastContext';
import CharacterListSidebar from '../CharacterListSidebar';
import CategoryEditor from '../Editor/CategoryEditor';
import MobileAddCharacterModal from '../MobileAddCharacterModal';
import { Plus, Save, RotateCcw, AlertCircle } from 'lucide-react';
import _ from 'lodash';

interface DataCenterProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  isMobile: boolean;
}

const DataCenter: React.FC<DataCenterProps> = ({ data, onUpdate, isMobile }) => {
  // 1. 本地暂存状态
  const [localData, setLocalData] = useState<StatusBarData>(data);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 2. 选择状态
  const [selectedId, setSelectedId] = useState<string>('SHARED');
  const [showMobileAdd, setShowMobileAdd] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const toast = useToast();

  // 3. 监听外部数据更新 (当用户未编辑时自动同步)
  useEffect(() => {
    if (!hasUnsavedChanges) {
        setLocalData(data);
    }
  }, [data, hasUnsavedChanges]);

  // 4. 数据变更处理 (只更新 localData)
  const handleLocalUpdate = (newData: StatusBarData) => {
      setLocalData(newData);
      setHasUnsavedChanges(true);
  };

  // 5. 保存所有更改
  const handleSaveChanges = () => {
      // 在保存前，执行一次 Meta 同步，确保 UI 上的修改 (如 Present: false) 被应用到逻辑层
      const dataToSave = _.cloneDeep(localData);
      syncMetaFromData(dataToSave); 
      
      onUpdate(dataToSave);
      setHasUnsavedChanges(false);
      toast.success("所有更改已保存");
  };

  // 6. 放弃更改
  const handleDiscardChanges = () => {
      setLocalData(data);
      setHasUnsavedChanges(false);
      toast.info("已放弃未保存的更改");
  };

  // Prepare Character List (with IsPresent)
  const charIds = Object.keys(localData.characters || {});
  const charList = charIds.map(id => ({
      id, 
      name: resolveDisplayName(localData, id),
      isPresent: localData.character_meta?.[id]?.isPresent !== false
  })).sort((a, b) => {
      if (a.id === 'char_user') return -1;
      if (b.id === 'char_user') return 1;
      return a.name.localeCompare(b.name);
  });

  const handleAddCharacter = (id: string, name: string) => {
      if (localData.id_map[id] || localData.characters[id]) {
          toast.warning("ID 已存在");
          return;
      }

      const newData = _.cloneDeep(localData);
      newData.id_map[id] = name;
      newData.characters[id] = {};
      newData.characters[id]['CP'] = [{
          key: '名字', values: [name], source_id: 9999, user_modified: true, category: 'CP'
      }];
      if (!newData.character_meta) newData.character_meta = {};
      newData.character_meta[id] = { isPresent: true };

      handleLocalUpdate(newData);
      setSelectedId(id);
      toast.success(`角色 "${name}" (暂存) 已创建`);
  };

  const handleTogglePresence = (id: string) => {
      const newData = _.cloneDeep(localData);
      if (!newData.character_meta) newData.character_meta = {};
      const current = newData.character_meta[id]?.isPresent !== false;
      newData.character_meta[id] = { isPresent: !current };
      
      // 同时尝试同步 Meta 分类下的 Present 条目 (双向绑定)
      if (newData.characters[id] && newData.characters[id]['Meta']) {
          const presentItem = newData.characters[id]['Meta'].find(i => i.key === 'Present' || i.key === 'Visible');
          if (presentItem) {
              presentItem.values = [(!current).toString()];
              presentItem.user_modified = true;
          }
      }

      handleLocalUpdate(newData);
  };

  const handleResetData = () => setShowResetConfirm(true);
  
  const executeReset = () => {
     const emptyData: StatusBarData = { 
         categories: localData.categories,
         item_definitions: localData.item_definitions,
         id_map: { 'char_user': 'User' },
         character_meta: { 'char_user': { isPresent: true } },
         shared: {}, 
         characters: { 'char_user': {} }, 
         _meta: { ...localData._meta } 
     };
     handleLocalUpdate(emptyData);
     setSelectedId('SHARED');
     setShowResetConfirm(false);
     toast.info("数据已重置 (需点击保存以生效)");
  };

  const handleUpdateItems = (category: string, newItems: StatusBarItem[]) => {
    const newData = _.cloneDeep(localData);
    if (selectedId === 'SHARED') {
      if (!newData.shared) newData.shared = {};
      newData.shared[category] = newItems;
    } else {
      if (!newData.characters[selectedId]) newData.characters[selectedId] = {};
      newData.characters[selectedId][category] = newItems;
    }
    handleLocalUpdate(newData);
  };

  const getCategoriesToRender = () => {
    const allKeys = Object.keys(localData.categories || {});
    const sorted = allKeys.sort((a, b) => localData.categories[a].order - localData.categories[b].order);
    if (selectedId === 'SHARED') return ['ST', 'WP', 'MI'];
    return sorted.filter(c => !['ST', 'WP', 'MI'].includes(c));
  };

  const getCurrentItems = (category: string): StatusBarItem[] => {
    if (selectedId === 'SHARED') return localData.shared?.[category] || [];
    return localData.characters?.[selectedId]?.[category] || [];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
            
            {/* Sidebar / Tabs */}
            {!isMobile ? (
                <div style={{ width: '220px', height: '100%', borderRight: '1px solid var(--chip-border)' }}>
                <CharacterListSidebar 
                    characters={charList} 
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onAddCharacter={handleAddCharacter}
                    onResetData={handleResetData}
                    onTogglePresence={handleTogglePresence}
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

            {/* Main Editor */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px', position: 'relative' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedId === 'SHARED' ? '共享世界数据' : resolveDisplayName(localData, selectedId)}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                        {hasUnsavedChanges && <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>[未保存] </span>}
                        ID: {selectedId}
                    </div>
                </div>

                {getCategoriesToRender().map(catKey => (
                    <CategoryEditor 
                        key={catKey}
                        categoryKey={catKey}
                        categoryDef={getCategoryDefinition(localData.categories, catKey)}
                        itemDefinitions={localData.item_definitions}
                        items={getCurrentItems(catKey)}
                        onUpdateItems={(newItems) => handleUpdateItems(catKey, newItems)}
                    />
                ))}
                <div style={{ height: '40px' }} />
            </div>
        </div>

        {/* Action Bar (Fixed Bottom) */}
        <div className="glass-panel" style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid var(--chip-border)', 
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px',
            borderRadius: '0', flexShrink: 0
        }}>
            {hasUnsavedChanges && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', marginRight: 'auto' }} className="animate-fade-in">
                    <AlertCircle size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>有未保存的更改</span>
                </div>
            )}

            <button 
                onClick={handleDiscardChanges}
                disabled={!hasUnsavedChanges}
                className="btn btn--ghost"
                style={{ opacity: hasUnsavedChanges ? 1 : 0.5 }}
            >
                <RotateCcw size={16} /> 放弃
            </button>
            <button 
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges}
                className="btn btn--primary"
                style={{ opacity: hasUnsavedChanges ? 1 : 0.5, transform: hasUnsavedChanges ? 'scale(1.05)' : 'scale(1)' }}
            >
                <Save size={16} /> 保存所有更改
            </button>
        </div>

        {/* Modals */}
        <MobileAddCharacterModal 
            isOpen={showMobileAdd} onClose={() => setShowMobileAdd(false)}
            onConfirm={handleAddCharacter} existingIds={charList.map(c => c.id)}
        />
        {showResetConfirm && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="glass-panel" style={{ padding: '24px', width: '300px', border: '1px solid var(--color-danger)' }}>
                    <h3 style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>确认重置?</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>将清空所有暂存数据。</p>
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
