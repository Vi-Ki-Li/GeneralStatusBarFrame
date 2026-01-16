import React from 'react';
import { BookOpen, Camera, Paintbrush, Globe, User, Edit3, Lock } from 'lucide-react';

const HelpGuide: React.FC = () => {
  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Banner */}
        <div style={{ 
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', 
            borderRadius: '16px', 
            padding: '30px',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.3)'
        }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>TavernHelper Remastered</h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                新一代的沉浸式状态管理系统。实时追踪角色状态，自动记录世界变迁，随心定制视觉风格。
            </p>
        </div>

        {/* 1. 快速入门 */}
        <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
                <BookOpen size={24} className="text-primary" />
                快速入门
            </h3>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: 'var(--chip-bg)', padding: '8px', borderRadius: '8px', height: 'fit-content' }}>
                        <User size={20} className="text-primary" />
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>添加角色</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            点击左侧侧边栏顶部的 <span style={{ fontWeight: 600 }}>“+”</span> 号，输入角色名（如 "Eria"）。
                            <br/>
                            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>提示：AI 会自动识别并创建角色，您也可以手动预设。</span>
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: 'var(--chip-bg)', padding: '8px', borderRadius: '8px', height: 'fit-content' }}>
                        <Edit3 size={20} className="text-primary" />
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>编辑数值</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            选中某个角色或“共享数据”，直接修改右侧的输入框。
                            <br/>
                            支持格式：<code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>80@100</code> (当前/最大) 或纯文本。
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: 'var(--chip-bg)', padding: '8px', borderRadius: '8px', height: 'fit-content' }}>
                        <Lock size={20} className="text-warning" />
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>用户锁定</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            当您手动修改某个数值后，该条目会自动<strong>“锁定”</strong>，图标变为黄色锁。
                            <br/>
                            这意味着 AI 暂时无法修改它。在下一次发送消息后，锁定会自动解除。
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* 2. 动态世界快照 */}
        <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
                <Camera size={24} className="text-primary" />
                动态世界快照 (Narrative Engine)
            </h3>
            <div className="glass-panel" style={{ padding: '20px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.6 }}>
                    这是一个后台运行的“史官”系统。它会监控所有状态数据的变化，并在检测到重要事件时（如数值剧烈波动、获得新道具、角色进场），自动生成一段叙事文本。
                </p>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--color-success)' }}>
                    <h5 style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>示例输出：</h5>
                    <p style={{ fontFamily: 'serif', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                        “一股强大的力量涌入，Eria的体力，因为‘治疗药水’，从20/100增加了50，达到了70/100！”
                    </p>
                </div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '12px' }}>
                    * 这些内容会被写入 <code>[通用状态栏世界书]</code> 的 <code>[动态世界快照]</code> 条目，作为 AI 的短期记忆。
                </p>
            </div>
        </section>

        {/* 3. 样式定制 */}
        <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
                <Paintbrush size={24} className="text-primary" />
                样式定制指南
            </h3>
            <div className="glass-panel" style={{ padding: '20px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                    您可以通过编写 CSS 来完全改变状态栏的外观。为了支持系统的亮色/深色模式切换，建议使用 CSS 变量。
                </p>
                
                <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>推荐模板：</h5>
                <pre style={{ 
                    background: 'var(--bg-app)', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--chip-border)',
                    overflowX: 'auto',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)'
                }}>
{`/* 基础变量 (亮色模式) */
:root {
  --color-primary: #3b82f6; /* 主色调 */
  --bg-app: #ffffff;        /* 背景色 */
  --text-primary: #333333;  /* 文字颜色 */
}

/* 深色模式覆盖 */
body.dark-mode {
  --color-primary: #60a5fa;
  --bg-app: #111827;
  --text-primary: #f3f4f6;
}

/* 组件样式覆盖 */
.glass-panel {
  border-radius: 0px; /* 直角风格 */
  border: 1px solid var(--color-primary);
}`}
                </pre>
            </div>
        </section>

        <div style={{ height: '40px' }}></div>
      </div>
    </div>
  );
};

export default HelpGuide;