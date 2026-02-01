import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css'; // Explicitly import global styles
import { styleService } from './services/styleService';

// --- Global Safe Mode Listener (Strategy C: Hot-Fix without Reload) ---
// Use capture phase (true) to intercept event before React
window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Shortcut: Ctrl + Alt + Shift + R
    if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        e.stopPropagation();
        
        console.warn('[SafeMode] Triggered via Keyboard Shortcut.');

        // 1. Clear Storage Logic
        try {
            styleService.clearActiveTheme();
            console.log('[SafeMode] LocalStorage cleared.');
        } catch (err) {
            console.error('[SafeMode] Failed to clear storage:', err);
        }

        // 2. DOM Surgery: Remove the toxic style tag immediately
        const styleTag = document.getElementById('th-global-theme-style');
        if (styleTag) {
            styleTag.remove();
            console.log('[SafeMode] Toxic style tag removed from DOM.');
        }

        // 3. Notify React Components (Fix for Sync Issue)
        // This allows components like StyleManager to update their UI state immediately
        window.dispatchEvent(new CustomEvent('th:safe-mode-triggered')); // 此处添加1行

        // 4. Inject Safe Mode Overlay (Emergency UI)
        // We use inline styles with !important to ensure visibility even if global CSS is broken
        const overlayId = 'th-safe-mode-overlay';
        if (!document.getElementById(overlayId)) {
            const overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.style.cssText = `
                position: fixed !important;
                top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
                background: #1a1a1a !important;
                color: #ffffff !important;
                z-index: 2147483647 !important; /* Max Z-Index */
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: system-ui, -apple-system, sans-serif !important;
                text-align: center !important;
                padding: 20px !important;
            `;
            
            overlay.innerHTML = `
                <div style="font-size: 64px; margin-bottom: 24px;">🛡️</div>
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #fff;">安全模式已激活</h2>
                <p style="font-size: 16px; color: #aaa; margin-bottom: 32px; max-width: 400px; line-height: 1.5;">
                    检测到紧急重置请求。全局主题样式已被强制移除，恢复默认外观。
                </p>
                <button id="th-safe-mode-close-btn" style="
                    padding: 12px 32px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                    transition: transform 0.1s;
                ">返回应用</button>
            `;
            
            document.body.appendChild(overlay);

            // Bind click event to close button
            const btn = document.getElementById('th-safe-mode-close-btn');
            if (btn) {
                btn.onclick = () => {
                    overlay.remove();
                };
            }
        }
    }
}, true);

const container = document.getElementById('root');
const root = createRoot(container!); 
root.render(<App />);