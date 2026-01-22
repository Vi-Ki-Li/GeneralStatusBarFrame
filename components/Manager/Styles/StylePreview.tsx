

import React, { useEffect, useMemo } from 'react';
// FIX: Replaced non-exported 'StyleUnit' with 'StyleDefinition'.
import { StyleDefinition, StatusBarItem, ItemDefinition } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { Info, LayoutDashboard } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './StylePreview.css';

interface StylePreviewProps {
  // FIX: Use StyleDefinition type.
  unit: StyleDefinition;
}

// --- MOCK DATA FOR COMPONENTS ---
const MOCK_ITEMS: Record<string, StatusBarItem> = {
    numeric: { key: 'PreviewHP', values: ['75', '100', '+10', '治疗', '状态良好'], category: 'CV', source_id: 999, user_modified: false, _uuid: uuidv4() },
    array: { key: 'PreviewInventory', values: ['治疗药水', '魔法卷轴', '新手地图'], category: 'CR', source_id: 999, user_modified: false, _uuid: uuidv4() },
    text: { key: 'PreviewStatus', values: ['警惕地观察四周'], category: 'CS', source_id: 999, user_modified: false, _uuid: uuidv4() }
};
const MOCK_DEFINITIONS: Record<string, ItemDefinition> = {
    numeric: { key: 'PreviewHP', type: 'numeric', name: '生命值', icon: 'Heart', structure: { parts: ['current', 'max', 'change', 'reason', 'description'] } },
    array: { key: 'PreviewInventory', type: 'array', name: '物品', icon: 'Backpack' },
    text: { key: 'PreviewStatus', type: 'text', name: '状态', icon: 'UserCheck' }
};

// --- PREVIEW COMPONENTS ---
const ThemeMockStatusBar = () => {
    return (
        <div className="theme-mock-wrapper">
             <div className="theme-mock-header glass-panel">
                <span>Mock Status Bar</span>
                <div className="theme-mock-actions">
                    <button className="btn btn--ghost">Btn</button>
                    <button className="btn btn--primary">Primary</button>
                </div>
             </div>
             
             <div className="theme-mock-grid">
                <div className="theme-mock-card glass-panel">
                    <div className="status-item-row__label">生命值</div>
                    <div className="progress-container">
                        <div className="progress-fill" style={{ width: '70%', background: 'var(--color-primary)' }}></div>
                    </div>
                </div>
                <div className="theme-mock-card glass-panel">
                    <div className="status-item-row__label">物品栏</div>
                    <div className="tag-chip">剑</div>
                    <div className="tag-chip">盾</div>
                </div>
             </div>
        </div>
    );
};

const StylePreview: React.FC<StylePreviewProps> = ({ unit }) => {
    const scopeClass = `style-unit-${unit.id}`;
    const isTheme = unit.dataType === 'theme';

    // Inject the scoped CSS globally for the preview
    useEffect(() => {
        const styleId = 'temp-style-preview-injector';
        let styleTag = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        // For Theme: We want to inject CSS that applies to the preview container.
        // We replace :root with .scopeClass to simulate global vars locally.
        const processCss = (rawCss: string, scope: string) => {
             if (isTheme) {
                 return rawCss.replace(/:root/g, `.${scope}`);
             } else {
                 // For components, we scope generic classes
                 return rawCss.replace(/(^|})([^{}]+)({)/g, (match, p1, p2, p3) => {
                    if (p2.includes('@')) return match;
                    const scopedSelectors = p2.split(',').map(s => `.${scope} ${s.trim()}`).join(',');
                    return `${p1}${scopedSelectors}${p3}`;
                });
             }
        };
        
        styleTag.textContent = processCss(unit.css, scopeClass);

        return () => {
            styleTag.textContent = '';
        };
    }, [unit.css, scopeClass, isTheme]);
    
    // Select mock data
    const mockType = unit.dataType === 'theme' ? 'numeric' : unit.dataType;
    const mockDataForType = {
        ...MOCK_ITEMS[mockType],
        ...MOCK_DEFINITIONS[mockType],
        label: MOCK_DEFINITIONS[mockType].name
    };

    return (
        <div className={`style-preview ${isTheme ? 'style-preview--theme' : ''}`}>
            <div className="style-preview__header">
                <h4>{isTheme ? <LayoutDashboard size={14}/> : null} 正在预览: '{unit.name}'</h4>
            </div>
            
            <div className={`style-preview__canvas ${isTheme ? scopeClass : ''}`}>
                {isTheme ? (
                    // For themes, we render a structure that uses standard classes 
                    // and rely on the injected scoped CSS variables
                    <ThemeMockStatusBar />
                ) : (
                    // For components, we wrap the HTML
                    <div className="style-preview__item-wrapper">
                        <div className={scopeClass} dangerouslySetInnerHTML={{ __html: parsePlaceholders(unit.html || '', mockDataForType) }} />
                    </div>
                )}
            </div>
            
            <div className="style-preview__info">
                <Info size={14}/>
                <p>
                    {isTheme 
                        ? "全局主题模式：CSS 中的 :root 变量将被应用到预览容器，模拟全局效果。"
                        : "组件模式：HTML 模板中的 {{handlebars}} 占位符将被 mock 数据替换。"
                    }
                </p>
            </div>
        </div>
    );
};

function parsePlaceholders(html: string, data: any): string {
    let processed = html;
    processed = processed.replace(/{{#each\s+([\w.[\]]+)}}(.*?){{\/each}}/gs, (match, arrayKey, innerTemplate) => {
        const array = data[arrayKey] || [];
        if (!Array.isArray(array)) return '';
        return array.map(item => innerTemplate.replace(/{{this}}/g, String(item))).join('');
    });
    processed = processed.replace(/{{\s*([\w.[\]]+)\s*}}/g, (match, key) => {
        if (key === 'percentage') {
            const current = parseFloat(data.values?.[0] || '0');
            const max = parseFloat(data.values?.[1] || '100');
            return String(max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0);
        }
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
}

export default StylePreview;