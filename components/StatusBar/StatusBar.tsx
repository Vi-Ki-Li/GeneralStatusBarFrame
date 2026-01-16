import React, { useState, useEffect } from 'react';
import { StatusBarData, StatusBarItem, StatusBarCategoryKey } from '../../types';
import { CATEGORY_MAPPING, CATEGORY_ORDER } from '../../constants';
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

  // 1. 角色管理逻辑
  const charNames = Object.keys(data.characters || {});
  if (charNames.includes('User')) {
    charNames.splice(charNames.indexOf('User'), 1);
    charNames.unshift('User');
  }

  const [activeChar, setActiveChar] = useState<string>(charNames[0] || '');

  useEffect(() => {
    if (!charNames.includes(activeChar) && charNames.length > 0) {
      setActiveChar(charNames[0]);
    } else if (charNames.length > 0 && !activeChar) {
      setActiveChar(charNames[0]);
    }
  }, [charNames, activeChar]);

  // 交互处理
  const handleInteract = (item: StatusBarItem, valueOverride?: string) => {
      const textToInsert = valueOverride || item.values.join(', ');
      // 模拟 /setinput 行为
      console.log(`[StatusBar] Interaction: ${item.key} -> ${textToInsert}`);
      toast.info(`已填入输入框: ${textToInsert}`, { description: `引用了 [${item.key}]` });
  };

  // 2. 渲染器工厂
  const renderItem = (item: StatusBarItem, uiType: 'text' | 'numeric' | 'array') => {
    const commonProps = {
        key: item.key,
        item: item,
        onInteract: handleInteract
    };

    switch (uiType) {
      case 'numeric':
        return <NumericRenderer {...commonProps} />;
      case 'array':
        return <ArrayRenderer {...commonProps} />;
      case 'text':
      default:
        return <TextRenderer {...commonProps} />;
    }
  };

  const renderSectionContent = (items: StatusBarItem[], categoryKey: string) => {
    if (!items || items.length === 0) return null;
    
    // 获取该分类配置的 UI 类型
    const def = CATEGORY_MAPPING[categoryKey as StatusBarCategoryKey] || { uiType: 'text' };
    
    return items.map(item => renderItem(item, def.uiType));
  };

  const sharedST = data.shared?.['ST'] || [];
  const activeCharData = data.characters?.[activeChar];

  return (
    <div className="status-bar-container glass-panel" style={{ 
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* 1. 共享场景信息 (ST) - 始终显示在顶部 */}
      {sharedST.length > 0 && (
        <StatusSection 
            title={CATEGORY_MAPPING['ST'].name} 
            iconName={CATEGORY_MAPPING['ST'].icon}
            defaultExpanded={true}
        >
            {renderSectionContent(sharedST, 'ST')}
        </StatusSection>
      )}

      {/* 2. 角色区域 */}
      {charNames.length > 0 && (
        <div style={{ marginTop: '20px' }}>
            <CharacterTabs 
                characters={charNames} 
                activeChar={activeChar} 
                onSelect={setActiveChar} 
            />
            
            {/* 选中角色的详细数据 */}
            {activeCharData && (
                <div className="status-character-content active animate-fade-in">
                    {CATEGORY_ORDER.map(catKey => {
                        const items = activeCharData[catKey];
                        if (!items || items.length === 0) return null;
                        if (['ST', 'WP', 'MI'].includes(catKey as string)) return null; // Skip shared

                        const def = CATEGORY_MAPPING[catKey];
                        return (
                            <StatusSection 
                                key={catKey}
                                title={def.name}
                                iconName={def.icon}
                                className="mb-3"
                            >
                                {renderSectionContent(items, catKey)}
                            </StatusSection>
                        );
                    })}
                </div>
            )}
        </div>
      )}
      
      {/* 3. 其他共享信息 (WP, MI) - 底部 */}
      {['WP', 'MI'].map(catKey => {
          const items = data.shared?.[catKey];
          if (!items || items.length === 0) return null;
          const def = CATEGORY_MAPPING[catKey as any];
          return (
            <StatusSection 
                key={catKey}
                title={def.name}
                iconName={def.icon}
                className="mt-4"
            >
                {renderSectionContent(items, catKey)}
            </StatusSection>
          );
      })}
    </div>
  );
};

export default StatusBar;