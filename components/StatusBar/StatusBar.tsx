
import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem, StyleDefinition, CategoryDefinition } from '../../types';
import { LayoutNode } from '../../types/layout';
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

// --- Layout Renderer Components ---

const LayoutNodeRenderer: React.FC<{ 
    node: LayoutNode; 
    data: StatusBarData; 
    itemsMap: Record<string, StatusBarItem[]>; // Keyed by item key or category key
    styleOverride?: StyleDefinition | null;
    onInteract: (item: StatusBarItem, val?: string) => void;
}> = ({ node, data, itemsMap, styleOverride, onInteract }) => {
    
    // 1. Render Row
    if (node.type === 'row') {
        const customStyle = node.props?.style || {};
        return (
            <div className="status-row" style={{ 
                display: 'flex', 
                gap: node.props?.style?.gap || '8px', // Prioritize gap from props
                marginBottom: '8px',
                ...customStyle 
            }}>
                {node.children?.map(child => (
                    <LayoutNodeRenderer 
                        key={child.id} 
                        node={child} 
                        data={data} 
                        itemsMap={itemsMap} 
                        styleOverride={styleOverride}
                        onInteract={onInteract}
                    />
                ))}
            </div>
        );
    }

    // 2. Render Column
    if (node.type === 'col') {
        const customStyle = node.props?.style || {};
        return (
            <div className="status-col" style={{ 
                flex: node.props?.width ? `${node.props.width}%` : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: 0, // Fix flex overflow
                ...customStyle
            }}>
                {node.children?.map(child => (
                    <LayoutNodeRenderer 
                        key={child.id} 
                        node={child} 
                        data={data} 
                        itemsMap={itemsMap} 
                        styleOverride={styleOverride}
                        onInteract={onInteract}
                    />
                ))}
            </div>
        );
    }

    // 3. Render Item
    if (node.type === 'item' && node.data?.key) {
        const items = itemsMap[node.data.key] || [];
        if (items.length === 0) return null; // Don't render empty items (or maybe render placeholder?)
        
        const wrapperStyle = node.props?.style || {}; // Wrapper styles for item (e.g. margins)

        // Items in itemsMap are grouped by key. Usually there is only 1 item per key per character.
        // But shared items might have multiple. Render all found.
        return (
            <div style={wrapperStyle}>
                {items.map(item => {
                    const originalDef = getItemDefinition(data.item_definitions, item.key);
                    let finalDef = originalDef;
                    // Apply Preset overrides (Copied logic)
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
                    return (
                        <StyledItemRenderer 
                            key={item._uuid}
                            item={item} 
                            definition={finalDef}
                            styleOverride={styleOverride}
                            onInteract={onInteract}
                        />
                    );
                })}
            </div>
        );
    }

    // 4. Render Category (Container)
    if (node.type === 'category' && node.data?.key) {
        const catItems = itemsMap[`__CAT__${node.data.key}`] || [];
        if (catItems.length === 0) return null;
        
        const catDef = getCategoryDefinition(data.categories, node.data.key);
        const wrapperStyle = node.props?.style || {};
        
        return (
            <div style={wrapperStyle}>
                <StatusSection 
                    title={catDef.name} 
                    iconName={catDef.icon}
                    defaultExpanded={true}
                    layoutMode={catDef.layout_mode}
                    gridColumns={catDef.grid_columns}
                >
                    {catItems.map(item => {
                        // Duplicate Item render logic (refactor later)
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
                        return (
                            <StyledItemRenderer 
                                key={item._uuid}
                                item={item} 
                                definition={finalDef}
                                styleOverride={styleOverride}
                                onInteract={onInteract}
                            />
                        );
                    })}
                </StatusSection>
            </div>
        );
    }

    return null;
};


const StatusBar: React.FC<StatusBarProps> = ({ data, styleOverride }) => {
  const toast = useToast();

  const handleInteract = (interactItem: StatusBarItem, val?: string) => {
      const text = val || (Array.isArray(interactItem.values) ? interactItem.values.join(', ') : '');
      console.log(`[Interaction] ${interactItem.key}: ${text}`);
      toast.info(`引用: ${text}`);
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

  const charMapForTabs = presentCharIds.map(id => ({
      id,
      name: resolveDisplayName(data, id)
  }));

  // --- Data Preparation for Layout Engine ---
  // Combine Shared + Active Character Data into a single map for easier lookup by the renderer
  const itemsMap = React.useMemo(() => {
      const map: Record<string, StatusBarItem[]> = {};
      
      // 1. Shared Data
      if (data.shared) {
          Object.keys(data.shared).forEach(cat => {
              // Store by Item Key
              data.shared[cat].forEach(item => {
                  if (!map[item.key]) map[item.key] = [];
                  map[item.key].push(item);
              });
              // Store by Category Key (Special Prefix)
              if (!map[`__CAT__${cat}`]) map[`__CAT__${cat}`] = [];
              map[`__CAT__${cat}`].push(...data.shared[cat]);
          });
      }

      // 2. Active Character Data
      const charData = data.characters?.[activeCharId];
      if (charData) {
          Object.keys(charData).forEach(cat => {
              charData[cat].forEach(item => {
                  if (!map[item.key]) map[item.key] = [];
                  map[item.key].push(item);
              });
              if (!map[`__CAT__${cat}`]) map[`__CAT__${cat}`] = [];
              map[`__CAT__${cat}`].push(...charData[cat]);
          });
      }
      return map;
  }, [data.shared, data.characters, activeCharId]);


  // --- Mode Switching ---
  if (data.layout && data.layout.length > 0) {
      // === LAYOUT MODE ===
      return (
          <div className="status-bar glass-panel">
              {presentCharIds.length > 0 && (
                  <CharacterTabs 
                      characters={charMapForTabs.map(c => c.name)} 
                      activeChar={resolveDisplayName(data, activeCharId)}
                      onSelect={(name) => {
                          const found = charMapForTabs.find(c => c.name === name);
                          if (found) setActiveCharId(found.id);
                      }} 
                  />
              )}
              <div className="status-bar__layout-root">
                  {data.layout.map(node => (
                      <LayoutNodeRenderer 
                          key={node.id} 
                          node={node} 
                          data={data} 
                          itemsMap={itemsMap}
                          styleOverride={styleOverride}
                          onInteract={handleInteract}
                      />
                  ))}
              </div>
          </div>
      );
  }

  // === LEGACY/DEFAULT MODE (Category List) ===
  const getSortedCategories = (categoryKeys: string[]) => {
    return categoryKeys.sort((a, b) => {
      const defA = getCategoryDefinition(data.categories, a);
      const defB = getCategoryDefinition(data.categories, b);
      return (defA.order || 99) - (defB.order || 99);
    });
  };

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
    return (
      <StyledItemRenderer 
        key={item._uuid}
        item={item} 
        definition={finalDef}
        styleOverride={styleOverride}
        onInteract={handleInteract}
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
