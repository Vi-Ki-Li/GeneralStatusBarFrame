
import { StyleDefinition } from '../types';

interface ClassDoc {
  className: string;
  description: string;
  notes?: string;
}

// v8.1: 样式文档数据源
// 从各个硬编码的 Renderer.css 文件中提取了可供用户覆盖的关键类名
export const STYLE_CLASS_DOCUMENTATION: Partial<Record<StyleDefinition['dataType'], ClassDoc[]>> = {
  numeric: [
    { className: '.status-item-row--numeric', description: '数值条目整体容器' },
    { className: '.numeric-renderer__progress-container', description: '进度条背景容器' },
    { className: '.numeric-renderer__progress-fill', description: '进度条填充部分', notes: '可通过 background 实现渐变' },
    { className: '.numeric-renderer__value-group', description: '右侧数值显示区域（包含当前值、最大值、变化量）' },
    { className: '.numeric-renderer__value', description: '当前值文本' },
    { className: '.numeric-renderer__change-indicator', description: '变化量指示器（例如 "+5"）' },
    { className: '.numeric-renderer__sub-row', description: '描述和原因的副行容器' },
    { className: '.numeric-renderer__description', description: '状态描述文本' },
    { className: '.status-item-row__label', description: '通用 - 条目左侧的标签文本' },
    { className: '.status-item-row__icon', description: '通用 - 标签左侧的图标' },
  ],
  array: [
    { className: '.status-item-row--array', description: '标签组条目整体容器' },
    { className: '.array-renderer__tags-container', description: '所有标签的容器' },
    { className: '.array-renderer__tag-chip', description: '单个标签元素', notes: '可修改背景、边框、圆角等' },
    { className: '.status-item-row__label', description: '通用 - 条目左侧的标签文本' },
  ],
  'list-of-objects': [
    { className: '.status-item-row--object-list', description: '对象列表条目整体容器' },
    { className: '.object-list-renderer__card-container', description: '所有对象卡片的网格容器' },
    { className: '.object-card', description: '单个对象卡片' },
    { className: '.object-card__property', description: '卡片内单行属性的容器 (标签+值)' },
    { className: '.object-card__label', description: '属性标签文本 (e.g., "等级:")' },
    { className: '.object-card__value', description: '属性值文本 (e.g., "5")' },
    { className: '.status-item-row__label', description: '通用 - 条目左侧的标签文本' },
  ],
  text: [
    { className: '.status-item-row--text-inline', description: '单行文本模式的容器' },
    { className: '.status-item-row--text-block', description: '多行文本块模式的容器' },
    { className: '.text-renderer__value', description: '文本值本身', notes: '在多行模式下，它是一个带背景和边框的块' },
    { className: '.status-item-row__label', description: '通用 - 条目左侧的标签文本' },
  ],
  theme: [ // 此处开始添加15行
    { className: ':root', description: 'CSS 变量定义根节点', notes: '定义 --color-primary 等全局变量' },
    { className: 'body.dark-mode', description: '深色模式下的根覆盖' },
    { className: '.glass-panel', description: '通用玻璃拟态面板背景', notes: '影响所有弹窗和卡片' },
    { className: '.btn--primary', description: '主要按钮样式' },
    { className: '.btn--ghost', description: '次要/幽灵按钮样式' },
    { className: '--color-primary', description: '变量：主品牌色 (Indigo)' },
    { className: '--color-secondary', description: '变量：次品牌色 (Pink)' },
    { className: '--bg-app', description: '变量：应用背景色' },
    { className: '--bg-surface', description: '变量：面板/卡片表面颜色' },
    { className: '--text-primary', description: '变量：主要文字颜色' },
    { className: '--border-base', description: '变量：基础边框颜色' },
    { className: '--font-family-base', description: '变量：全局字体' },
  ] // 此处完成添加
};
