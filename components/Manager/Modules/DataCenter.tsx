
import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem, ItemDefinition, CategoryDefinition } from '../../../types'; 
import { getCategoryDefinition } from '../../../services/definitionRegistry';
import { resolveDisplayName } from '../../../utils/idManager';
import { syncMetaFromData } from '../../../utils/dataMerger';
import { useToast } from '../../Toast/ToastContext';
import CharacterListSidebar from '../CharacterListSidebar';
import CategoryEditor from '../Editor/CategoryEditor';
import MobileAddCharacterModal from '../MobileAddCharacterModal';
import DefinitionDrawer from '../Definitions/DefinitionDrawer';
import CategoryDrawer from '../Definitions/CategoryDrawer'; 
import ContextHelpButton from '../../Shared/ContextHelpButton'; 
import { tavernService } from '../../../services/mockTavernService';
import { Plus, Save, RotateCcw, AlertCircle, PanelLeftOpen, Trash2, Eraser } from 'lucide-react'; // 此处修改1行
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import '../ManagerLayout.css'; 
import './DataCenter.css'; 

interface DataCenterProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
  isMobile: boolean;
  onGoToStyleEditor: (itemKey: string) => void;
}

const DataCenter: React.FC<DataCenterProps> = ({ data, onUpdate, isMobile, onGoToStyleEditor }) => {
  const [localData, setLocalData] = useState<StatusBarData>(data);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('SHARED');
  const [showMobileAdd, setShowMobileAdd] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [deletingCharId, setDeletingCharId] = useState<string | null>(null);
  const [clearingScopeId, setClearingScopeId] = useState<string | null>(null); // 此处添加1行

  const [editingDefinition, setEditingDefinition] = useState<ItemDefinition | null>(null);
  const [isDefDrawerOpen, setIsDefDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null); 
  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState(false); 
  
  const toast = useToast();

  useEffect(() => {
    const patchedData: StatusBarData = _.cloneDeep(data);
    let patched = false;

    const ensureUUID = (items: StatusBarItem[]) => {
        if (!Array.isArray(items)) return;
        items.forEach(item => {
            if (!item._uuid) {
                item._uuid = uuidv4();
                patched = true;
            }
        });
    };

    if (patchedData.shared) {
        Object.values(patchedData.shared).forEach(items => ensureUUID(items));
    }
    if (patchedData.characters) {
        Object.values(patchedData.characters).forEach(charData => {
            Object.values(charData).forEach((items) => ensureUUID(items as unknown as StatusBarItem[]));
        });
    }

    if (patched) {
        console.log('[DataCenter] Global UUID patch applied');
        setLocalData(patchedData);
    } else {
        if (!hasUnsavedChanges) {
             setLocalData(data);
        }
    }
  }, [data, hasUnsavedChanges]);

  const handleLocalUpdate = (newData: StatusBarData) => {
      setLocalData(newData);
      setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
      const dataToSave = _.cloneDeep(localData);
      syncMetaFromData(dataToSave); 
      
      onUpdate(dataToSave);
      setHasUnsavedChanges(false);
      toast.success("所有更改已保存");
  };

  const handleDiscardChanges = () => {
      setLocalData(data);
      setHasUnsavedChanges(false);
      toast.info("已放弃未保存的更改");
  };

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
          key: '名字', values: [name], source_id: 9999, user_modified: true, category: 'CP', _uuid: uuidv4()
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

  const executeDeleteCharacter = () => {
      if (!deletingCharId) return;

      const newData = _.cloneDeep(localData);

      // Remove from data structures
      delete newData.characters[deletingCharId];
      delete newData.id_map[deletingCharId];
      if (newData.character_meta) {
          delete newData.character_meta[deletingCharId];
      }

      // If current view is the deleted char, switch to SHARED
      if (selectedId === deletingCharId) {
          setSelectedId('SHARED');
      }

      handleLocalUpdate(newData);
      setDeletingCharId(null);
      toast.info("角色及数据已删除 (需保存以生效)");
  };

  const executeClearScope = () => { // 此处开始添加19行
      if (!clearingScopeId) return;
      const newData = _.cloneDeep(localData);
      
      if (clearingScopeId === 'SHARED') {
          newData.shared = {};
      } else {
          // Keep the character object but empty its categories
          if (newData.characters[clearingScopeId]) {
              newData.characters[clearingScopeId] = {};
          }
      }
      
      handleLocalUpdate(newData);
      setClearingScopeId(null);
      toast.info("数据已清空 (需保存以生效)");
  }; // 此处完成添加

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

  const handleEditDefinition = (itemKey: string) => {
    const def = localData.item_definitions[itemKey];
    if (def) {
      setEditingDefinition(def);
      setIsDefDrawerOpen(true);
    } else {
      toast.warning(`未找到定义: ${itemKey}`);
    }
  };

  const handleSaveDefinition = (updatedDef: ItemDefinition) => {
    const newData = _.cloneDeep(localData);
    newData.item_definitions[updatedDef.key] = updatedDef;
    handleLocalUpdate(newData);
    toast.success(`定义 "${updatedDef.key}" 已暂存`);
  };
  
  const handleEditCategory = (categoryKey: string) => { 
    const catDef = localData.categories[categoryKey];
    if (catDef) {
      setEditingCategory(catDef);
      setIsCatDrawerOpen(true);
    }
  };

  const handleSaveCategory = (updatedCat: CategoryDefinition) => { 
    const newData = _.cloneDeep(localData);
    newData.categories[updatedCat.key] = updatedCat;
    handleLocalUpdate(newData);
    toast.success(`分类 "${updatedCat.name}" 已暂存`);
  };

  const handleInjectDefinition = async (def: ItemDefinition) => {
    const result = await tavernService.injectDefinition(def, localData.categories);
    switch (result.status) {
        case 'created':
            toast.success(`规则 "${def.key}" 已注入`, { description: '新世界书条目已创建' });
            break;
        case 'updated':
            toast.success(`规则 "${def.key}" 已同步`);
            break;
        case 'no_change':
            toast.info(`规则 "${def.key}" 无需更新`);
            break;
        case 'error':
            toast.error(`注入 "${def.key}" 失败`);
            break;
    }
  };


  const getCategoriesToRender = () => { 
    const allCategories = Object.values(localData.categories || {}) as CategoryDefinition[];
    const sorted = allCategories.sort((a, b) => a.order - b.order);
    if (selectedId === 'SHARED') {
      return sorted.filter(c => c.scope === 'shared').map(c => c.key);
    }
    return sorted.filter(c => c.scope === 'character' || !c.scope).map(c => c.key);
  };

  const getCurrentItems = (category: string): StatusBarItem[] => {
    if (selectedId === 'SHARED') return localData.shared?.[category] || [];
    return localData.characters?.[selectedId]?.[category] || [];
  };

  return (
    <div className="th-manager">
        <div className="th-manager__layout">
            
            {/* Sidebar (Desktop) or Tabs (Mobile) */}
            {!isMobile && (
                <div className={`th-manager__sidebar ${isSidebarCollapsed ? 'th-manager__sidebar--collapsed' : ''}`}>
                  <CharacterListSidebar 
                      characters={charList} 
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onAddCharacter={handleAddCharacter}
                      onResetData={handleResetData}
                      onTogglePresence={handleTogglePresence}
                      onDeleteCharacter={setDeletingCharId} 
                      onClose={() => setIsSidebarCollapsed(true)}
                  />
                </div>
            )}
            
            {isMobile && (
                <div className="th-manager__mobile-tabs">
                    <button onClick={() => setSelectedId('SHARED')} className={`th-manager__mobile-tab ${selectedId === 'SHARED' ? 'active' : ''}`}>共享</button>
                    {charList.map(c => (
                        <button key={c.id} onClick={() => setSelectedId(c.id)} className={`th-manager__mobile-tab ${selectedId === c.id ? 'active' : ''}`}>{c.name}</button>
                    ))}
                    <button onClick={() => setShowMobileAdd(true)} className="th-manager__mobile-tab"><Plus size={14} /></button>
                </div>
            )}

            {/* Main Content */}
            <div className="th-manager__main">
                <div className="th-manager__main-header">
                    <div className="th-manager__main-title-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {isSidebarCollapsed && !isMobile && (
                                <button 
                                    onClick={() => setIsSidebarCollapsed(false)} 
                                    className="th-manager__icon-btn desktop-only"
                                    title="展开侧边栏"
                                >
                                    <PanelLeftOpen size={16} />
                                </button>
                            )}
                            <h2 className="th-manager__main-title">
                                {selectedId === 'SHARED' ? '共享世界数据' : resolveDisplayName(localData, selectedId)}
                            </h2>
                            {/* Help Button */}
                            <ContextHelpButton 
                                title="数据中心帮助" 
                                content={
                                    <>
                                        <p>这里是所有状态数据的实时编辑器。</p>
                                        <ul>
                                            <li><strong>左侧栏/顶部标签</strong>: 切换不同的数据源（共享世界或特定角色）。</li>
                                            <li><strong>添加新条目</strong>: 在对应分类下点击“添加新条目”。系统会根据您在“定义工坊”中的设置提供智能建议。</li>
                                            <li><strong>锁定机制</strong>: 您手动修改过的数值会自动“锁定”（黄色锁图标），此时 AI 将无法修改它，直到您发送一条新消息后自动解锁。</li>
                                            <li><strong>暂存与保存</strong>: 所有修改首先是“暂存”的。请务必点击底部的“保存所有更改”按钮以生效。</li>
                                        </ul>
                                    </>
                                } 
                            />
                            {/* Clear Scope Button - Start Add */}
                            <button
                                onClick={() => setClearingScopeId(selectedId)}
                                className="th-manager__icon-btn th-manager__icon-btn--danger"
                                title={selectedId === 'SHARED' ? "清空共享数据" : "清空此角色数据"}
                            >
                                <Eraser size={18} />
                            </button>
                            {/* Clear Scope Button - End Add */}
                        </div>
                        <div className="th-manager__main-subtitle">
                            {hasUnsavedChanges && <span className="data-center__unsaved-indicator" style={{color: 'var(--color-warning)'}}>[未保存] </span>}
                            ID: {selectedId}
                        </div>
                    </div>
                </div>

                <div className="th-manager__main-content">
                    {getCategoriesToRender().map(catKey => (
                        <CategoryEditor 
                            key={catKey}
                            categoryKey={catKey}
                            categoryDef={getCategoryDefinition(localData.categories, catKey)}
                            itemDefinitions={localData.item_definitions}
                            items={getCurrentItems(catKey)}
                            onUpdateItems={(newItems) => handleUpdateItems(catKey, newItems)}
                            onEditDefinition={handleEditDefinition}
                            onEditCategory={handleEditCategory} 
                        />
                    ))}
                    <div style={{ height: '60px' }} /> {/* Spacer */}
                </div>
            </div>
        </div>

        {/* Toolbar Footer */}
        <div className="th-manager__toolbar">
            {hasUnsavedChanges && (
                <div className="data-center__unsaved-prompt animate-fade-in" style={{marginRight: 'auto'}}>
                    <AlertCircle size={18} color="var(--color-warning)" />
                    <span style={{color: 'var(--color-warning)', fontWeight: 500}}>有未保存的更改</span>
                </div>
            )}
            <button 
                onClick={handleDiscardChanges}
                disabled={!hasUnsavedChanges}
                className="btn btn--ghost"
            >
                <RotateCcw size={16} /> 放弃
            </button>
            <button 
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges}
                className={`btn btn--primary ${hasUnsavedChanges ? 'pulse' : ''}`}
            >
                <Save size={16} /> 保存所有更改
            </button>
        </div>

        <MobileAddCharacterModal 
            isOpen={showMobileAdd} onClose={() => setShowMobileAdd(false)}
            onConfirm={handleAddCharacter} existingIds={charList.map(c => c.id)}
        />

        {showResetConfirm && (
            <div className="data-center__reset-confirm-overlay">
                <div className="data-center__reset-confirm-modal glass-panel">
                    <h3>确认重置?</h3>
                    <p>将清空所有暂存数据。</p>
                    <div className="data-center__reset-confirm-actions">
                        <button onClick={() => setShowResetConfirm(false)} className="btn btn--ghost">取消</button>
                        <button onClick={executeReset} className="btn btn--danger">确认</button>
                    </div>
                </div>
            </div>
        )}

        {deletingCharId && ( 
            <div className="data-center__reset-confirm-overlay">
                <div className="data-center__reset-confirm-modal glass-panel">
                    <h3><Trash2 size={20} /> 确认删除角色?</h3>
                    <p>
                        即将删除 <strong>{resolveDisplayName(localData, deletingCharId)}</strong> ({deletingCharId})。<br/>
                        该角色的所有数据将被移除。此操作不可撤销。
                    </p>
                    <div className="data-center__reset-confirm-actions">
                        <button onClick={() => setDeletingCharId(null)} className="btn btn--ghost">取消</button>
                        <button onClick={executeDeleteCharacter} className="btn btn--danger">确认删除</button>
                    </div>
                </div>
            </div>
        )}

        {clearingScopeId && ( // 此处开始添加16行
            <div className="data-center__reset-confirm-overlay">
                <div className="data-center__reset-confirm-modal glass-panel">
                    <h3><Eraser size={20} /> 确认清空?</h3>
                    <p>
                        即将清空 <strong>{clearingScopeId === 'SHARED' ? '共享/世界' : resolveDisplayName(localData, clearingScopeId)}</strong> 的所有数据条目。<br/>
                        分类结构将被保留。此操作不可撤销。
                    </p>
                    <div className="data-center__reset-confirm-actions">
                        <button onClick={() => setClearingScopeId(null)} className="btn btn--ghost">取消</button>
                        <button onClick={executeClearScope} className="btn btn--danger">确认清空</button>
                    </div>
                </div>
            </div>
        )}

        <DefinitionDrawer 
            isOpen={isDefDrawerOpen}
            onClose={() => setIsDefDrawerOpen(false)}
            definition={editingDefinition}
            categories={localData.categories}
            onSave={handleSaveDefinition}
            onInject={handleInjectDefinition}
            existingKeys={Object.keys(localData.item_definitions)}
            onGoToStyleEditor={onGoToStyleEditor}
        />
        <CategoryDrawer 
            isOpen={isCatDrawerOpen}
            onClose={() => setIsCatDrawerOpen(false)}
            category={editingCategory}
            onSave={handleSaveCategory}
            existingKeys={Object.keys(localData.categories)}
        />
    </div>
  );
};

export default DataCenter;