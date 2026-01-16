import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem } from '../../types';
import { getCategoryDefinition, getItemDefinition } from '../../services/definitionRegistry';
import { getCharacterName } from '../../utils/idManager';
import StatusSection from './StatusSection';
import CharacterTabs from './CharacterTabs';
import NumericRenderer from './Renderers/NumericRenderer';
import ArrayRenderer from './Renderers/ArrayRenderer';
import TextRenderer from './Renderers/TextRenderer';
import { useToast } from '../Toast/ToastContext';

interface StatusBarProps {
  data: StatusBarData;
}

const StatusBar: React.FC<StatusBarProps> = ({ data }) => {
  const toast = useToast();

  const getSortedCategories = (categoryKeys: string[]) => {
    return categoryKeys.sort((a, b) => {
      const defA = getCategoryDefinition(data.categories, a);
      const defB = getCategoryDefinition(data.categories, b);
      return (defA.order || 99) - (defB.order || 99);
    });
  };

  const charIds = Object.keys(data.characters || {});
  if (charIds.includes('char_user')) {
    charIds.splice(charIds.indexOf('char_user'), 1);
    charIds.unshift('char_user');
  }

  const [activeCharId, setActiveCharId] = useState<string>(charIds[0] || '');

  useEffect(() => {
    if (!charIds.includes(activeCharId) && charIds.length > 0) {
      setActiveCharId(charIds[0]);
    } else if (charIds.length > 0 && !activeCharId) {
      setActiveCharId(charIds[0]);
    }
  }, [charIds, activeCharId]);

  const renderItem = (item: StatusBarItem) => {
    // 关键修正: 根据 Item Key 查找 Definition
    const def = getItemDefinition(data.item_definitions, item.key);
    
    const commonProps = {
        key: item.key,
        item: item,
        onInteract: (item: StatusBarItem, val?: string) => {
            const text = val || item.values.join(', ');
            console.log(`[Interaction] ${item.key}: ${text}`);
            toast.info(`引用: ${text}`);
        }
    };

    switch (def.type) {
      case 'numeric': return <NumericRenderer {...commonProps} />;
      case 'array': return <ArrayRenderer {...commonProps} />;
      default: return <TextRenderer {...commonProps} />;
    }
  };

  const renderSection = (items: StatusBarItem[], categoryKey: string, defaultExpanded = true) => {
    if (!items || items.length === 0) return null;
    const catDef = getCategoryDefinition(data.categories, categoryKey);

    return (
      <StatusSection 
          key={categoryKey}
          title={catDef.name} 
          iconName={catDef.icon}
          defaultExpanded={defaultExpanded}
          className="mb-3"
          layoutMode={catDef.layout_mode}
          gridColumns={catDef.grid_columns}
      >
          {items.map(item => renderItem(item))}
      </StatusSection>
    );
  };

  const sharedCategories = Object.keys(data.shared || {});
  const topSharedCats = sharedCategories.filter(c => c === 'ST'); 
  const bottomSharedCats = getSortedCategories(sharedCategories.filter(c => c !== 'ST'));

  const activeCharData = data.characters?.[activeCharId];
  const charCategories = activeCharData ? getSortedCategories(Object.keys(activeCharData)) : [];

  const charMapForTabs = charIds.map(id => ({
      id,
      name: getCharacterName(data.id_map, id)
  }));

  return (
    <div className="status-bar-container glass-panel" style={{ 
      padding: '20px', maxWidth: '800px', margin: '0 auto' 
    }}>
      {topSharedCats.map(cat => renderSection(data.shared[cat], cat, true))}

      {charIds.length > 0 && (
        <div style={{ marginTop: '20px' }}>
            <CharacterTabs 
                characters={charMapForTabs.map(c => c.name)} 
                activeChar={getCharacterName(data.id_map, activeCharId)}
                onSelect={(name) => {
                    const found = charMapForTabs.find(c => c.name === name);
                    if (found) setActiveCharId(found.id);
                }} 
            />
            
            {activeCharData && (
                <div className="status-character-content active animate-fade-in">
                    {charCategories.map(cat => renderSection(activeCharData[cat], cat))}
                </div>
            )}
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
          {bottomSharedCats.map(cat => renderSection(data.shared[cat], cat))}
      </div>
    </div>
  );
};

export default StatusBar;