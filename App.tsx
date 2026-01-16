
import React, { useEffect, useState, useRef } from 'react';
import { tavernService } from './services/mockTavernService';
import { StatusBarData, SnapshotMeta, LorebookEntry } from './types';
import { Moon, Sun, LayoutDashboard, Wrench, MessageSquare, FastForward, Menu, X, Layers, Paintbrush } from 'lucide-react';
import LogicTester from './components/DevTools/LogicTester';
import StatusBar from './components/StatusBar/StatusBar';
import StatusBarManager from './components/Manager/StatusBarManager';
import Skeleton from './components/Shared/Skeleton';
import { detectChanges, generateNarrative } from './utils/snapshotGenerator';
import { ToastProvider, useToast } from './components/Toast/ToastContext';

// Mobile Action Sheet Component
const MobileActionSheet = ({ isOpen, onClose, actions }: { isOpen: boolean, onClose: () => void, actions: any[] }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className={`mobile-sheet-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`mobile-action-sheet ${isOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>菜单</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '8px' }}>
            <X size={24} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => { action.onClick(); onClose(); }}
              className="glass-panel"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '20px', gap: '8px', border: '1px solid var(--chip-border)',
                background: action.primary ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'var(--glass-bg)',
                color: action.primary ? 'white' : 'var(--text-primary)',
                gridColumn: action.fullWidth ? '1 / -1' : 'auto'
              }}
            >
              {action.icon}
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Wrap the main content to use the hook
const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatusBarData | null>(null);
  const [darkMode, setDarkMode] = useState(false); 
  const [showDevTools, setShowDevTools] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Mobile Menu State
  
  // 叙事引擎状态
  const [snapshotEnabled, setSnapshotEnabled] = useState(true);
  const [snapshotMeta, setSnapshotMeta] = useState<SnapshotMeta | null>(null);
  
  const prevDataRef = useRef<StatusBarData | null>(null);
  const batchStartDataRef = useRef<StatusBarData | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useToast();

  // CSS 注入引擎
  const injectStyles = (entries: LorebookEntry[]) => {
    // 查找启用的样式条目
    const activeStyleEntry = entries.find(e => e.enabled && e.comment.startsWith('样式-'));
    
    // 获取或创建注入点
    let styleTag = document.getElementById('theme-injector');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'theme-injector';
        document.head.appendChild(styleTag);
    }

    if (activeStyleEntry) {
        console.log(`[App] Injecting Theme: ${activeStyleEntry.comment}`);
        styleTag.textContent = activeStyleEntry.content;
    } else {
        styleTag.textContent = ''; // 清空样式，恢复默认
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const vars = tavernService.getVariables();
        if (vars.statusBarCharacterData) {
          const loadedData = vars.statusBarCharacterData;
          setData(loadedData);
          prevDataRef.current = JSON.parse(JSON.stringify(loadedData));
        }
        
        // 订阅世界书变更 (包括样式)
        const unsubscribe = tavernService.subscribe((entries) => {
            injectStyles(entries);
        });

        // 初始加载一次
        const entries = await tavernService.getLorebookEntries();
        injectStyles(entries); // 确保初始样式被应用

        return () => unsubscribe(); // Cleanup subscription
      } catch (e) {
        console.error(e);
        toast.error("初始化数据加载失败");
      } finally {
        setTimeout(() => setLoading(false), 800); // 稍微延长一点 Loading 时间以展示骨架屏效果
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // 模拟下一回合 (Next Turn Simulation)
  const handleSimulateNextTurn = () => {
      if (!data) return;
      const newData = JSON.parse(JSON.stringify(data)) as StatusBarData;
      
      // 1. Increment message count
      if (!newData._meta) newData._meta = {};
      const currentCount = newData._meta.message_count || 0;
      newData._meta.message_count = currentCount + 1;

      // 2. Unlock all user-modified items (Priority Downgrade)
      // 在真实脚本中，这是通过监听 message_sent 事件触发的
      let unlockedCount = 0;
      
      // Helper to unlock items in a list
      const unlockItems = (items: any[]) => {
          items.forEach(item => {
              if (item.user_modified) {
                  item.user_modified = false;
                  // 重要修复: 将 source_id 重置为 0
                  // 这样确保下一条 AI 消息（ID > 0）能够覆盖这个值，而不是被判定为旧数据而被忽略
                  item.source_id = 0; 
                  unlockedCount++;
              }
          });
      };

      // Check Shared
      if (newData.shared) {
          Object.values(newData.shared).forEach(items => unlockItems(items));
      }
      // Check Characters
      if (newData.characters) {
          Object.values(newData.characters).forEach(charData => {
              Object.values(charData).forEach(items => unlockItems(items));
          });
      }

      handleDataUpdate(newData);
      toast.info(`回合已推进 (ID: ${newData._meta.message_count})`, { 
          description: unlockedCount > 0 ? `已解锁 ${unlockedCount} 个手动修改项` : '无锁定条目需解锁'
      });
  };

  const handleDataUpdate = (newData: StatusBarData) => {
    if (snapshotEnabled) {
        if (!batchStartDataRef.current) {
            batchStartDataRef.current = JSON.parse(JSON.stringify(prevDataRef.current || newData));
        }

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            const startData = batchStartDataRef.current;
            if (startData) {
                 try {
                    const events = detectChanges(startData, newData);
                    
                    if (events.length > 0) {
                        const narrative = generateNarrative(events);
                        if (narrative) {
                            tavernService.updateWorldbookEntry(
                                '[通用状态栏世界书]', 
                                '[动态世界快照]', 
                                narrative
                            );
                            
                            const newMeta: SnapshotMeta = {
                                timestamp: new Date().toISOString(),
                                message_count: newData._meta?.message_count || 0,
                                description_summary: narrative.slice(0, 50) + (narrative.length > 50 ? '...' : '')
                            };
                            setSnapshotMeta(newMeta);
                            
                            // 使用 Toast 通知
                            toast.success("自动快照已生成", {
                                description: `检测到 ${events.length} 处变动，已写入世界书。`
                            });
                        }
                    }
                } catch (err) {
                    console.error("[App] Snapshot generation failed:", err);
                    toast.error("快照生成失败", { description: "请检查控制台日志" });
                }
            }
            batchStartDataRef.current = null;
            debounceTimerRef.current = null;
        }, 800);
    }

    prevDataRef.current = JSON.parse(JSON.stringify(newData));
    setData(newData);
    tavernService.saveVariables({ statusBarCharacterData: newData });
  };

  // Mobile Menu Actions
  const mobileActions = [
    { label: 'Next Turn', icon: <FastForward size={24} />, onClick: handleSimulateNextTurn, primary: true, fullWidth: true },
    { label: '状态管理器', icon: <LayoutDashboard size={24} />, onClick: () => setShowManager(true) },
    { label: '开发工具', icon: <Wrench size={24} />, onClick: () => setShowDevTools(!showDevTools) },
    { label: darkMode ? '亮色模式' : '深色模式', icon: darkMode ? <Sun size={24} /> : <Moon size={24} />, onClick: toggleTheme },
  ];

  if (loading) {
    return (
      <div className="app-layout">
        <header className="app-header container">
            <Skeleton width="200px" height="24px" />
            <div style={{ display: 'flex', gap: '10px' }}>
                <Skeleton width="40px" height="36px" />
                <Skeleton width="40px" height="36px" />
                <Skeleton width="40px" height="36px" />
            </div>
        </header>
        <main className="app-layout__content container" style={{ marginTop: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
                <Skeleton width="40%" height="24px" style={{ marginBottom: '20px' }} />
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <Skeleton width="80px" height="32px" />
                    <Skeleton width="80px" height="32px" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <Skeleton height="60px" />
                    <Skeleton height="60px" />
                    <Skeleton height="60px" />
                </div>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <header className="app-header container">
        <div className="app-title">
          TavernHelper Remastered
        </div>
        
        {/* Desktop Buttons */}
        <div className="desktop-only" style={{ gap: '10px', alignItems: 'center' }}>
           <button
              className="btn btn--ghost"
              onClick={handleSimulateNextTurn}
              title="模拟下一回合"
              style={{ color: 'var(--color-info)' }}
           >
              <FastForward size={18} />
              <span>Next Turn</span>
           </button>
           <div style={{ width: '1px', background: 'var(--chip-border)', height: '20px', margin: '0 4px' }}></div>
           <button 
              className={`btn ${showDevTools ? 'btn--primary' : 'btn--ghost'}`} 
              onClick={() => setShowDevTools(!showDevTools)}
              title="开发工具"
            >
            <Wrench size={18} />
            <span>Dev</span>
          </button>
           <button 
              className={`btn ${showManager ? 'btn--primary' : 'btn--ghost'}`} 
              onClick={() => setShowManager(true)}
              title="状态栏管理器"
            >
            <LayoutDashboard size={18} />
            <span>管理器</span>
          </button>
          <button className="btn btn--ghost" onClick={toggleTheme} title="切换主题">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="mobile-only">
           <button 
              className="btn btn--ghost" 
              onClick={() => setShowMobileMenu(true)}
              style={{ padding: '8px' }}
           >
              <Menu size={24} />
           </button>
        </div>
      </header>

      {/* Mobile Action Sheet */}
      <MobileActionSheet 
         isOpen={showMobileMenu} 
         onClose={() => setShowMobileMenu(false)} 
         actions={mobileActions} 
      />

      <main className="app-layout__content container">
        {showDevTools && data && (
          <section style={{ marginBottom: '40px' }} className="animate-fade-in">
            <LogicTester initialData={data} onUpdate={handleDataUpdate} />
          </section>
        )}

        {data ? (
           <StatusBar data={data} />
        ) : (
           <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>暂无状态数据</div>
        )}
      </main>

      {data && (
        <StatusBarManager 
          isOpen={showManager} 
          onClose={() => setShowManager(false)}
          data={data}
          onUpdate={handleDataUpdate}
          snapshotEnabled={snapshotEnabled}
          onToggleSnapshot={setSnapshotEnabled}
          snapshotMeta={snapshotMeta}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
