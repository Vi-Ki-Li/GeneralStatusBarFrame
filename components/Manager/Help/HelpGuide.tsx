
import React, { useState, useRef, useEffect } from 'react';
import { 
    BookOpen, Camera, Paintbrush, Globe, User, Edit3, Lock, Box, 
    LayoutTemplate, Layers, MousePointerClick, UploadCloud, Zap, 
    Code, Settings, FileJson, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import './HelpGuide.css';

// --- Reusable Visualizers for Help ---
const MockProgressBar = () => (
    <div style={{width: '100%', maxWidth: '200px'}}>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', marginBottom:'4px', color:'var(--text-secondary)'}}>
            <span>HP</span>
            <span>75/100</span>
        </div>
        <div style={{height:'6px', background:'var(--bar-bg)', borderRadius:'99px', overflow:'hidden'}}>
            <div style={{width:'75%', height:'100%', background:'linear-gradient(90deg, #ef4444, #f59e0b)', borderRadius:'99px'}}></div>
        </div>
    </div>
);

const MockTags = () => (
    <div style={{display:'flex', gap:'4px', flexWrap:'wrap'}}>
        <span style={{padding:'2px 8px', borderRadius:'4px', background:'rgba(99, 102, 241, 0.1)', color:'var(--color-primary)', fontSize:'0.75rem', border:'1px solid rgba(99, 102, 241, 0.2)'}}>中毒</span>
        <span style={{padding:'2px 8px', borderRadius:'4px', background:'rgba(16, 185, 129, 0.1)', color:'var(--color-success)', fontSize:'0.75rem', border:'1px solid rgba(16, 185, 129, 0.2)'}}>加速</span>
    </div>
);

// --- Help Section Component ---
const HelpSection = ({ id, title, icon: Icon, children }: any) => (
    <section id={id} className="help-section animate-slide-up">
        <div className="help-section__header">
            <div className="help-section__icon-wrapper">
                <Icon size={24} />
            </div>
            <h2 className="help-section__title">{title}</h2>
        </div>
        <div className="help-section__content">
            {children}
        </div>
    </section>
);

const FeatureCard = ({ title, icon: Icon, children, visual }: any) => (
    <div className="help-card glass-panel">
        <div className="help-card__header">
            <Icon size={18} className="help-card__icon"/>
            <h4 className="help-card__title">{title}</h4>
        </div>
        <div className="help-card__body">
            {children}
        </div>
        {visual && <div className="help-card__visual">{visual}</div>}
    </div>
);

const HelpGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simple ScrollSpy
  const handleScroll = () => {
      if (!scrollRef.current) return;
      const sections = ['intro', 'data', 'definitions', 'styles', 'layout', 'presets', 'snapshots'];
      for (const id of sections) {
          const el = document.getElementById(id);
          if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top >= 0 && rect.top < 300) {
                  setActiveSection(id);
                  break;
              }
          }
      }
  };

  const scrollTo = (id: string) => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
  };

  return (
    <div className="help-guide-layout">
        {/* Sidebar Nav */}
        <nav className="help-sidebar glass-panel">
            <div className="help-sidebar__header">
                <BookOpen size={20} /> 目录
            </div>
            <ul className="help-nav">
                {[
                    { id: 'intro', label: '快速入门', icon: Zap },
                    { id: 'data', label: '数据中心', icon: User },
                    { id: 'definitions', label: '定义工坊', icon: Box },
                    { id: 'styles', label: '样式工坊', icon: Paintbrush },
                    { id: 'layout', label: '布局编排', icon: LayoutTemplate },
                    { id: 'presets', label: '配置预设', icon: Layers },
                    { id: 'snapshots', label: '动态快照', icon: Camera },
                ].map(item => (
                    <li key={item.id}>
                        <button 
                            className={`help-nav__btn ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => scrollTo(item.id)}
                        >
                            <item.icon size={16} />
                            <span>{item.label}</span>
                            {activeSection === item.id && <ArrowRight size={14} className="active-arrow"/>}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>

        {/* Main Content */}
        <div className="help-content" ref={scrollRef} onScroll={handleScroll}>
            
            <div className="help-hero">
                <div className="help-hero__bg"></div>
                <h1 className="help-hero__title">TavernHelper <span className="highlight">Remastered</span></h1>
                <p className="help-hero__subtitle">
                    下一代沉浸式状态管理系统。
                    <br/>定义驱动 · 完全可视化 · 高度可定制
                </p>
            </div>

            <HelpSection id="intro" title="快速入门" icon={Zap}>
                <div className="help-grid-2">
                    <FeatureCard title="基本概念" icon={BookOpen}>
                        <p>本系统通过读取 SillyTavern 的世界书或聊天记录，实时解析并展示角色的状态。</p>
                        <p>核心流程：<strong>定义规则 -> AI 输出 -> 解析展示 -> 样式渲染</strong>。</p>
                    </FeatureCard>
                    <FeatureCard title="锁定机制" icon={Lock}>
                        <p>当您在“数据中心”手动修改某个数值后，该条目会自动<strong>锁定</strong>（显示黄色锁图标）。</p>
                        <div className="help-hint">
                            <AlertTriangle size={12}/> 锁定期内 AI 无法修改该数值。发送新消息推进回合后，锁定自动解除。
                        </div>
                    </FeatureCard>
                </div>
            </HelpSection>

            <HelpSection id="data" title="数据中心 (Data Center)" icon={User}>
                <p className="help-text">
                    所有数据的总控室。在这里，您可以查看和编辑所有角色的实时状态。
                </p>
                <div className="help-grid-2">
                    <FeatureCard title="多角色管理" icon={User}>
                        <p>支持 User、NPC 以及共享世界数据。左侧栏可快速切换不同视角的角色数据。</p>
                    </FeatureCard>
                    <FeatureCard title="智能补全" icon={Edit3}>
                        <p>添加新条目时，系统会根据“定义工坊”中的规则，自动补全 Key 和数据结构。</p>
                    </FeatureCard>
                </div>
            </HelpSection>

            <HelpSection id="definitions" title="定义工坊 (Definitions)" icon={Box}>
                <p className="help-text">
                    系统的核心大脑。任何数据想要被正确显示，都需要先在这里定义它的“规则”。
                </p>
                <div className="help-grid-2">
                    <FeatureCard title="数据结构" icon={LayoutTemplate}>
                        <ul className="help-list">
                            <li><strong>数值</strong>: 适合 HP、MP (当前/最大)。</li>
                            <li><strong>文本</strong>: 适合状态描述、地点。</li>
                            <li><strong>标签组</strong>: 适合 Buff、物品栏。</li>
                            <li><strong>对象列表</strong>: 适合复杂的技能列表 (名称+等级)。</li>
                        </ul>
                    </FeatureCard>
                    <FeatureCard title="注入世界书" icon={UploadCloud}>
                        <p>定义完成后，点击<strong>“注入/同步”</strong>。</p>
                        <p>系统会自动生成一条正则替换指令写入世界书，教导 AI 如何输出这种格式的数据。</p>
                    </FeatureCard>
                </div>
            </HelpSection>

            <HelpSection id="styles" title="样式工坊 (Style Atelier)" icon={Paintbrush}>
                <p className="help-text">
                    拒绝千篇一律。在这里，您可以为每一个数据条目定制独特的外观。
                </p>
                <div className="help-grid-2">
                    <FeatureCard title="可视化编辑 (GUI)" icon={MousePointerClick} visual={<MockProgressBar />}>
                        <p>无需编写代码。点击右侧预览区的元素，左侧面板会自动显示可调整的属性（颜色、边框、圆角等）。</p>
                    </FeatureCard>
                    <FeatureCard title="全局主题" icon={Layers}>
                        <p>创建类型为 <strong>Theme</strong> 的样式，可以一键改变整个应用的主色调、字体和圆角风格。</p>
                    </FeatureCard>
                </div>
                <div className="help-code-snippet">
                    <div className="label"><Code size={12}/> 高级: CSS 变量</div>
                    <code>var(--color-primary)</code> - 主品牌色<br/>
                    <code>var(--bg-surface)</code> - 卡片背景色
                </div>
            </HelpSection>

            <HelpSection id="layout" title="布局编排 (Layout)" icon={LayoutTemplate}>
                <p className="help-text">
                    像搭积木一样设计您的状态栏。不再受限于固定的列表。
                </p>
                <ul className="help-list-steps">
                    <li><strong>行 (Row)</strong>: 基础容器，从左侧拖拽组件到画布中心即可创建新行。</li>
                    <li><strong>列 (Column)</strong>: 将组件拖拽到现有列的左右边缘，可将列一分为二。</li>
                    <li><strong>调整</strong>: 拖动列中间的分隔线可调整宽度比例。</li>
                </ul>
            </HelpSection>

            <HelpSection id="presets" title="配置预设 (Presets)" icon={Layers}>
                <p className="help-text">
                    一键切换不同的世界观配置。
                </p>
                <FeatureCard title="打包内容" icon={Box}>
                    <p>预设可以包含：</p>
                    <ul className="help-list compact">
                        <li>启用的定义列表</li>
                        <li>每个定义的样式映射</li>
                        <li>布局快照</li>
                        <li>叙事风格配置</li>
                    </ul>
                </FeatureCard>
            </HelpSection>

            <HelpSection id="snapshots" title="动态快照 (Narrative)" icon={Camera}>
                <p className="help-text">
                    自动记录世界变迁的史官系统。
                </p>
                <div className="help-visual-box">
                    <div className="quote">
                        “Eria的HP因为‘受击’，从 80 骤降至 45！”
                    </div>
                    <p>系统会对比每回合的数据变化，根据模板生成自然语言描述，并自动写入世界书，作为 AI 的短期记忆。</p>
                </div>
            </HelpSection>

            <div style={{height: '100px'}}></div>
        </div>
    </div>
  );
};

export default HelpGuide;
