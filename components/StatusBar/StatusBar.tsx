import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem } from '../../types';
import { getCategoryDefinition, getItemDefinition } from '../../services/definitionRegistry';
import { resolveDisplayName } from '../../utils/idManager';
import StatusSection from './StatusSection';
import CharacterTabs from './CharacterTabs';
import NumericRenderer from './Renderers/NumericRenderer';
import ArrayRenderer from './Renderers/ArrayRenderer';
import TextRenderer from './Renderers/TextRenderer';
import ObjectListRenderer from './Renderers/ObjectListRenderer';
import StyledItemRenderer from './Renderers/StyledItemRenderer'; // 此处添加1行
import { useToast } from '../Toast/ToastContext';
import './StatusBar.css';

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

  const allCharIds = Object.keys(data.characters || {});
  
  const presentCharIds = allCharIds.filter(id => {
      const meta = data.character_meta?.[id];
      return meta?.isPresent !== false;
  });

  if (presentCharIds.includes('char_user')) {
    presentCharIds.splice(presentCharIds.indexOf('char_user'), 1);
    presentCharIds.unshift('char_user');
  }

  const [activeCharId, setActiveCharId] = useState<string>(presentCharIds[0] || '');

  useEffect(() => {
    if (presentCharIds.length > 0 && !presentCharIds.includes(activeCharId)) {
      setActiveCharId(presentCharIds[0]);
    } else if (presentCharIds.length === 0) {
      setActiveCharId('');
    }
  }, [presentCharIds, activeCharId]);

  const renderItem = (item: StatusBarItem) => {
    const def = getItemDefinition(data.item_definitions, item.key);
    const label = def.name || item.key;
    
    const commonProps = {
        key: item._uuid, // Use UUID for key
        item: item,
        label: label,
        icon: def.icon,
        definition: def,
        onInteract: (interactItem: StatusBarItem, val?: string) => {
            const text = val || (Array.isArray(interactItem.values) ? interactItem.values.join(', ') : '');
            console.log(`[Interaction] ${interactItem.key}: ${text}`);
            toast.info(`引用: ${text}`);
        }
    };

    let rendererComponent; // 此处开始修改

    switch (def.type) {
      case 'numeric': rendererComponent = <NumericRenderer {...commonProps} />; break;
      case 'array': rendererComponent = <ArrayRenderer {...commonProps} />; break;
      case 'list-of-objects': rendererComponent = <ObjectListRenderer {...commonProps} />; break;
      default: rendererComponent = <TextRenderer {...commonProps} />;
    }

    return (
      <StyledItemRenderer item={item} definition={def}>
        {rendererComponent}
      </StyledItemRenderer>
    ); // 此处完成修改
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
          className="status-bar__section-wrapper"
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

  const charMapForTabs = presentCharIds.map(id => ({
      id,
      name: resolveDisplayName(data, id)
  }));

  return (
    <div className="status-bar glass-panel">
      {topSharedCats.map(cat => renderSection(data.shared[cat], cat, true))}

      {presentCharIds.length > 0 && (
        <div className="status-bar__character-block">
            <CharacterTabs 
                characters={charMapForTabs.map(c => c.name)} 
                activeChar={resolveDisplayName(data, activeCharId)}
                onSelect={(name) => {
                    const found = charMapForTabs.find(c => c.name === name);
                    if (found) setActiveCharId(found.id);
                }} 
            />
            
            {activeCharData && (
                <div className="status-bar__character-content animate-fade-in">
                    {charCategories.map(cat => renderSection(activeCharData[cat], cat))}
                </div>
            )}
        </div>
      )}
      
      <div className="status-bar__shared-block--bottom">
          {bottomSharedCats.map(cat => renderSection(data.shared[cat], cat))}
      </div>
    </div>
  );
};

export default StatusBar;
