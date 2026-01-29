
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css'; // Explicitly import global styles
import { styleService } from './services/styleService';

// --- Global Safe Mode Listener (Strategy B) ---
// This runs outside of React to ensure it works even if the UI crashes or is hidden by CSS.
window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Shortcut: Ctrl + Alt + Shift + R
    if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        e.stopPropagation();
        
        const confirmed = window.confirm(
            "🛡️【安全模式】检测到紧急重置指令。\n\n" +
            "这通常用于修复由自定义CSS导致的界面白屏、不可见或无法交互的情况。\n\n" +
            "点击【确定】将清除当前应用的自定义主题并刷新页面。\n" +
            "您的数据（角色、定义等）不会丢失。"
        );

        if (confirmed) {
            console.warn('[SafeMode] Triggered via Keyboard Shortcut. Clearing active theme...');
            try {
                styleService.clearActiveTheme();
                console.log('[SafeMode] Theme cleared. Reloading...');
                window.location.reload();
            } catch (err) {
                console.error('[SafeMode] Failed to clear theme:', err);
                alert("重置失败，请尝试手动清除 LocalStorage。");
            }
        }
    }
});

const container = document.getElementById('root');
const root = createRoot(container!); 
root.render(<App />);
