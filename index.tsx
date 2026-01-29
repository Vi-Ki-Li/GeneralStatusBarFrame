
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
        
        console.warn('[SafeMode] Triggered via Keyboard Shortcut. Clearing active theme...');
        try {
            // Build环境iframe可能拦截confirm，直接执行清理
            styleService.clearActiveTheme();
            console.log('[SafeMode] Theme cleared. Reloading...');
            window.location.reload();
        } catch (err) {
            console.error('[SafeMode] Failed to clear theme:', err);
            // alert("重置失败，请尝试手动清除 LocalStorage。"); // alert也可能被拦截，只打印log
        }
    }
});

const container = document.getElementById('root');
const root = createRoot(container!); 
root.render(<App />);
