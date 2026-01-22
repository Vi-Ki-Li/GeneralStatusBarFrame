
import React, { useEffect, useMemo } from 'react';
import { StyleUnit, StatusBarItem, ItemDefinition } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { Info } from 'lucide-react';
import './StylePreview.css';

interface StylePreviewProps {
  unit: StyleUnit;
}

// --- MOCK DATA --- (Remains the same)
const MOCK_ITEMS: Record<StyleUnit['dataType'], StatusBarItem> = {
    numeric: { key: 'PreviewHP', values: ['75', '100', '+10', '治疗', '状态良好'], category: 'CV', source_id: 999, user_modified: false, _uuid: uuidv4() },
    array: { key: 'PreviewInventory', values: ['治疗药水', '魔法卷轴', '新手地图'], category: 'CR', source_id: 999, user_modified: false, _uuid: uuidv4() },
    text: { key: 'PreviewStatus', values: ['警惕地观察四周'], category: 'CS', source_id: 999, user_modified: false, _uuid: uuidv4() }
};
const MOCK_DEFINITIONS: Record<StyleUnit['dataType'], ItemDefinition> = {
    numeric: { key: 'PreviewHP', type: 'numeric', name: '生命值', icon: 'Heart', structure: { parts: ['current', 'max', 'change', 'reason', 'description'] } },
    array: { key: 'PreviewInventory', type: 'array', name: '物品', icon: 'Backpack' },
    text: { key: 'PreviewStatus', type: 'text', name: '状态', icon: 'UserCheck' }
};

// --- NEW: Custom Renderer Component ---
const CustomRenderer = ({ htmlTemplate, css, data }: { htmlTemplate: string, css: string, data: any }) => {
    const scopeClass = `style-unit-preview-${data.id}`;

    const parsedHtml = useMemo(() => {
        let processed = htmlTemplate;

        // 1. Handle loops first (e.g., {{#each values}}...{{/each}})
        processed = processed.replace(/{{#each\s+([\w.[\]]+)}}(.*?){{\/each}}/gs, (match, arrayKey, innerTemplate) => {
            const array = data[arrayKey] || [];
            if (!Array.isArray(array)) return '';
            return array.map(item => innerTemplate.replace(/{{this}}/g, item)).join('');
        });

        // 2. Handle simple placeholders (e.g., {{label}}, {{values[0]}})
        processed = processed.replace(/{{\s*([\w.[\]]+)\s*}}/g, (match, key) => {
            // Calculated properties
            if (key === 'percentage') {
                const current = parseFloat(data.values?.[0] || '0');
                const max = parseFloat(data.values?.[1] || '100');
                return max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
            }
            // Object path access (e.g., values[0])
            const keys = key.split(/[.\[\]]/).filter(Boolean);
            let value = data;
            try {
                for (const k of keys) {
                    value = value[k];
                }
            } catch { return ''; }
            return value !== undefined ? value : '';
        });
        return processed;
    }, [htmlTemplate, data]);

    return (
        <>
            <style>{`.${scopeClass} { ${css} }`}</style>
            <div className={scopeClass} dangerouslySetInnerHTML={{ __html: parsedHtml }} />
        </>
    );
};


const StylePreview: React.FC<StylePreviewProps> = ({ unit }) => { // 此处开始修改
    const scopeClass = `style-unit-${unit.id}`;

    // Inject the scoped CSS globally for the preview
    useEffect(() => {
        const styleId = 'temp-style-preview-injector';
        let styleTag = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        const scopeCss = (css: string, scope: string): string => {
            return css.replace(/(^|})([^{}]+)({)/g, (match, p1, p2, p3) => {
                const scopedSelectors = p2.split(',').map(s => `.${scope} ${s.trim()}`).join(',');
                return `${p1}${scopedSelectors}${p3}`;
            });
        };
        
        styleTag.textContent = scopeCss(unit.css, scopeClass);

        return () => {
            styleTag.textContent = '';
        };
    }, [unit.css, scopeClass]);
    
    const mockDataForType = {
        ...MOCK_ITEMS[unit.dataType],
        ...MOCK_DEFINITIONS[unit.dataType],
        label: MOCK_DEFINITIONS[unit.dataType].name
    };

    return (
        <div className="style-preview">
            <div className="style-preview__header">
                <h4>正在预览: '{unit.name}'</h4>
            </div>
            <div className="style-preview__canvas">
                <div className="style-preview__item-wrapper">
                    <div className={scopeClass} dangerouslySetInnerHTML={{ __html: parsePlaceholders(unit.html || '', mockDataForType) }} />
                </div>
            </div>
            <div className="style-preview__info">
                <Info size={14}/>
                <p>
                    <strong>关联数据类型</strong> 用于切换此处的模拟数据和默认模板。
                </p>
            </div>
        </div>
    );
};

// New parsing function
function parsePlaceholders(html: string, data: any): string {
    let processed = html;

    // 1. Handle loops first (e.g., {{#each values}}...{{/each}})
    processed = processed.replace(/{{#each\s+([\w.[\]]+)}}(.*?){{\/each}}/gs, (match, arrayKey, innerTemplate) => {
        const array = data[arrayKey] || [];
        if (!Array.isArray(array)) return '';
        return array.map(item => innerTemplate.replace(/{{this}}/g, String(item))).join('');
    });

    // 2. Handle simple placeholders (e.g., {{label}}, {{values[0]}})
    processed = processed.replace(/{{\s*([\w.[\]]+)\s*}}/g, (match, key) => {
        // Calculated properties
        if (key === 'percentage') {
            const current = parseFloat(data.values?.[0] || '0');
            const max = parseFloat(data.values?.[1] || '100');
            return String(max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0);
        }
        // Object path access (e.g., values[0])
        const keys = key.split(/[.\[\]]/).filter(Boolean);
        let value: any = data;
        try {
            for (const k of keys) {
                if (value === undefined) break;
                value = value[k];
            }
        } catch { return ''; }
        return value !== undefined ? String(value) : '';
    });
    return processed;
} // 此处完成修改

export default StylePreview;
