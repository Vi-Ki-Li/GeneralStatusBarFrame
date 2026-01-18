import React from 'react';
import { BookOpen, Camera, Paintbrush, Globe, User, Edit3, Lock } from 'lucide-react';
import './HelpGuide.css';

const HelpGuide: React.FC = () => {
  return (
    <div className="help-guide">
      <div className="help-guide__container">
        
        <div className="help-guide__banner">
            <h2 className="help-guide__banner-title">TavernHelper Remastered</h2>
            <p className="help-guide__banner-subtitle">
                新一代的沉浸式状态管理系统。实时追踪角色状态，自动记录世界变迁，随心定制视觉风格。
            </p>
        </div>

        <section className="help-guide__section">
            <h3 className="help-guide__section-title">
                <BookOpen size={24} /> 快速入门
            </h3>
            <div className="help-guide__card glass-panel">
                <div className="help-guide__step">
                    <div className="help-guide__step-icon"><User size={20} /></div>
                    <div>
                        <h4 className="help-guide__step-title">添加角色</h4>
                        <p className="help-guide__step-description">
                            点击左侧侧边栏顶部的 <strong>“+”</strong> 号，输入角色名（如 "Eria"）。
                            <br/>
                            <span className="help-guide__step-hint">提示：AI 会自动识别并创建角色，您也可以手动预设。</span>
                        </p>
                    </div>
                </div>

                <div className="help-guide__step">
                    <div className="help-guide__step-icon"><Edit3 size={20} /></div>
                    <div>
                        <h4 className="help-guide__step-title">编辑数值</h4>
                        <p className="help-guide__step-description">
                            选中某个角色或“共享数据”，直接修改右侧的输入框。
                            <br/>
                            支持格式：<code>80@100</code> (当前/最大) 或纯文本。
                        </p>
                    </div>
                </div>

                <div className="help-guide__step">
                    <div className="help-guide__step-icon lock-icon"><Lock size={20} /></div>
                    <div>
                        <h4 className="help-guide__step-title">用户锁定</h4>
                        <p className="help-guide__step-description">
                            当您手动修改某个数值后，该条目会自动<strong>“锁定”</strong>，图标变为黄色锁。
                            <br/>
                            这意味着 AI 暂时无法修改它。在下一次发送消息后，锁定会自动解除。
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section className="help-guide__section">
            <h3 className="help-guide__section-title">
                <Camera size={24} /> 动态世界快照 (Narrative Engine)
            </h3>
            <div className="help-guide__card glass-panel">
                <p className="help-guide__card-paragraph">
                    这是一个后台运行的“史官”系统。它会监控所有状态数据的变化，并在检测到重要事件时（如数值剧烈波动、获得新道具、角色进场），自动生成一段叙事文本。
                </p>
                <div className="help-guide__example-output">
                    <h5>示例输出：</h5>
                    <p>
                        “一股强大的力量涌入，Eria的体力，因为‘治疗药水’，从20/100增加了50，达到了70/100！”
                    </p>
                </div>
                <p className="help-guide__card-footnote">
                    * 这些内容会被写入 <code>[通用状态栏世界书]</code> 的 <code>[动态世界快照]</code> 条目，作为 AI 的短期记忆。
                </p>
            </div>
        </section>

        <section className="help-guide__section">
            <h3 className="help-guide__section-title">
                <Paintbrush size={24} /> 样式定制指南
            </h3>
            <div className="help-guide__card glass-panel">
                <p className="help-guide__card-paragraph">
                    您可以通过编写 CSS 来完全改变状态栏的外观。为了支持系统的亮色/深色模式切换，建议使用 CSS 变量。
                </p>
                
                <h5 className="help-guide__code-title">推荐模板：</h5>
                <pre className="help-guide__code-block">
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

        <div className="help-guide__footer-spacer"></div>
      </div>
    </div>
  );
};

export default HelpGuide;