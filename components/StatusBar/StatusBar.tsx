import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem, StyleDefinition } from '../../types';
import { getCategoryDefinition, getItemDefinition } from '../../services/definitionRegistry';
import { resolveDisplayName } from '../../utils/idManager';
import StatusSection from './StatusSection';
import CharacterTabs from './CharacterTabs';
import StyledItemRenderer from './Renderers/StyledItemRenderer';
import { useToast } from '../Toast/ToastContext';
import { presetService } from '../../services/presetService';
import './StatusBar.css';

interface StatusBarProps {
  data: StatusBarData;
  styleOverride?: StyleDefinition | null;
}

const StatusBar: React.FC<StatusBarProps> = ({ data, styleOverride }) => {
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
    const originalDef = getItemDefinition(data.item_definitions, item.key);
    let finalDef = originalDef;

    const activePresetId = data._meta?.activePresetIds?.[0];

    if (activePresetId) {
      const allPresets = presetService.getPresets();
      const activePreset = allPresets.find(p => p.id === activePresetId);
      const overrideStyleId = activePreset?.styleOverrides?.[item.key];

      if (overrideStyleId) {
        finalDef = {
          ...originalDef,
          styleId: overrideStyleId === 'style_default' ? undefined : overrideStyleId
        };
      }
    }

    // V9.2: Decoupled - Removed Strict Compatibility Check
    // All styleOverrides are now allowed.
    
    return (
      <StyledItemRenderer 
        key={item._uuid}
        item={item} 
        definition={finalDef}
        styleOverride={styleOverride}
        onInteract={(interactItem: StatusBarItem, val?: string) => {
            const text = val || (Array.isArray(interactItem.values) ? interactItem.values.join(', ') : '');
            console.log(`[Interaction] ${interactItem.key}: ${text}`);
            toast.info(`引用: ${text}`);
        }}
      />
    );
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