
import React, { useEffect, useState, useRef } from 'react';
import { tavernService } from './services/mockTavernService';
import { styleService } from './services/styleService';
import { StatusBarData, SnapshotMeta } from './types';
import { getDefaultCategoriesMap, getDefaultItemDefinitionsMap } from './services/definitionRegistry';
import { Moon, Sun, LayoutDashboard, Wrench, FastForward, Menu, X } from 'lucide-react';
import LogicTester from './components/DevTools/LogicTester';
import StatusBar from './components/StatusBar/StatusBar';
import StatusBarManager from './components/Manager/StatusBarManager';
import Skeleton from './components/Shared/Skeleton';
import { detectChanges, generateNarrative } from './utils/snapshotGenerator';
import { ToastProvider, useToast } from './components/Toast/ToastContext';
import './App.css';

// Mobile Action Sheet
const MobileActionSheet = ({ isOpen, onClose, actions }: { isOpen: boolean, onClose: () => void, actions: any[] }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className={`mobile-action-sheet__backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`mobile-action-sheet ${isOpen ? 'open' : ''}`}>
        <div className="mobile-action-sheet__header">
          <span className="mobile-action-sheet__title">菜单</span>
          <button onClick={onClose} className="mobile-action-sheet__close-btn">
            <X size={24} />
          </button>
        </div>
        <div className="mobile-action-sheet__grid">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => { action.onClick(); onClose(); }}
              className={`mobile-action-sheet__action-item glass-panel ${action.primary ? 'primary' : ''} ${action.fullWidth ? 'full-width' : ''}`}
            >
              {action.icon}
              <span className="mobile-action-sheet__action-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatusBarData | null>(null);
  const [darkMode, setDarkMode] = useState(false); 
  const [showDevTools, setShowDevTools] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const [snapshotEnabled, setSnapshotEnabled] = useState(true);
  const [snapshotMeta, setSnapshotMeta] = useState<SnapshotMeta | null>(null);
  
  const prevDataRef = useRef<StatusBarData | null>(null);
  const batchStartDataRef = useRef<StatusBarData | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const toast = useToast();

  // 数据初始化与迁移逻辑
  const initializeData = (rawData: any): StatusBarData => {
    // Check if it's new structure (has categories AND item_definitions)
    if (!rawData || !rawData.categories || !rawData.item_definitions) {
        console.log('[App] Initializing v6.0 Data Structure...');
        return {
            categories: getDefaultCategoriesMap(),
            item_definitions: getDefaultItemDefinitionsMap(),
            id_map: { 'char_user': 'User' },
            shared: {},
            characters: { 'char_user': {} }, 
            _meta: { message_count: 0, version: 6 }
        };
    }
    return rawData;
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const vars = tavernService.getVariables();
        const processedData = initializeData(vars.statusBarCharacterData);
        
        setData(processedData);
        prevDataRef.current = JSON.parse(JSON.stringify(processedData));
        
        // Save back initialized data if needed
        if (vars.statusBarCharacterData !== processedData) {
            tavernService.saveVariables({ statusBarCharacterData: processedData });
        }
        
        styleService.initializeActiveTheme(); 
        
      } catch (e) {
        console.error(e);
        toast.error("初始化失败");
      } finally {
        setTimeout(() => setLoading(false), 800);
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

  const handleSimulateNextTurn = () => {
      if (!data) return;
      const newData = JSON.parse(JSON.stringify(data)) as StatusBarData;
      
      if (!newData._meta) newData._meta = {};
      const currentCount = newData._meta.message_count || 0;
      newData._meta.message_count = currentCount + 1;

      let unlockedCount = 0;
      const unlockItems = (items: any[]) => {
          items.forEach(item => {
              if (item.user_modified) {
                  item.user_modified = false;
                  item.source_id = 0; 
                  unlockedCount++;
              }
          });
      };

      if (newData.shared) Object.values(newData.shared).forEach(items => unlockItems(items));
      if (newData.characters) Object.values(newData.characters).forEach(charData => {
          Object.values(charData).forEach(items => unlockItems(items));
      });

      handleDataUpdate(newData);
      toast.info(`回合推进 (ID: ${newData._meta.message_count})`, { 
          description: unlockedCount > 0 ? `解锁 ${unlockedCount} 项` : undefined
      });
  };

  const handleDataUpdate = (newData: StatusBarData) => {
    if (snapshotEnabled) {
        if (!batchStartDataRef.current) {
            batchStartDataRef.current = JSON.parse(JSON.stringify(prevDataRef.current || newData));
        }
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(() => {
            const startData = batchStartDataRef.current;
            if (startData) {
                 try {
                    const events = detectChanges(startData, newData);
                    if (events.length > 0) {
                        const narrative = generateNarrative(events);
                        if (narrative) {
                            tavernService.updateWorldbookEntry('[通用状态栏]', '[动态快照]', narrative);
                            setSnapshotMeta({
                                timestamp: new Date().toISOString(),
                                message_count: newData._meta?.message_count || 0,
                                description_summary: narrative.slice(0, 50) + '...'
                            });
                            toast.success("快照已生成");
                        }
                    }
                } catch (err) { console.error(err); }
            }
            batchStartDataRef.current = null;
            debounceTimerRef.current = null;
        }, 800);
    }

    prevDataRef.current = JSON.parse(JSON.stringify(newData));
    setData(newData);
    tavernService.saveVariables({ statusBarCharacterData: newData });
  };

  const mobileActions = [
    { label: 'Next Turn', icon: <FastForward size={24} />, onClick: handleSimulateNextTurn, primary: true, fullWidth: true },
    { label: '状态管理器', icon: <LayoutDashboard size={24} />, onClick: () => setShowManager(true) },
    { label: '开发工具', icon: <Wrench size={24} />, onClick: () => setShowDevTools(!showDevTools) },
    { label: darkMode ? '亮色模式' : '深色模式', icon: darkMode ? <Sun size={24} /> : <Moon size={24} />, onClick: toggleTheme },
  ];

  if (loading) {
    return (
      <div className="app">
        <header className="app__header container"><Skeleton height="40px" /></header>
        <main className="container">
            <Skeleton height="200px" borderRadius="var(--radius-xl)" />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header container">
        <div className="app__title">TavernHelper Remastered</div>
        <div className="app__actions desktop-only">
           <button className="btn btn--ghost" onClick={handleSimulateNextTurn}><FastForward size={18} /> Next Turn</button>
           <div className="app__actions-divider"></div>
           <button className={`btn ${showDevTools ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setShowDevTools(!showDevTools)}><Wrench size={18} /> Dev</button>
           <button className={`btn ${showManager ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setShowManager(true)}><LayoutDashboard size={18} /> 管理器</button>
           <button className="btn btn--ghost" onClick={toggleTheme}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
        </div>
        <div className="mobile-only">
           <button className="btn btn--ghost" onClick={() => setShowMobileMenu(true)}><Menu size={24} /></button>
        </div>
      </header>

      <MobileActionSheet isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} actions={mobileActions} />

      <main className="app__content container">
        {showDevTools && data && (
          <section className="app__devtools-section animate-fade-in">
            <LogicTester initialData={data} onUpdate={handleDataUpdate} />
          </section>
        )}

        {data ? <StatusBar data={data} /> : <div>无数据</div>}
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
