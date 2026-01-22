

import React from 'react';
import { Construction } from 'lucide-react';
import './StyleManager.css';

interface StyleManagerProps {
    isMobile: boolean;
}

const StyleManager: React.FC<StyleManagerProps> = () => {
    return (
        <div className="style-atelier">
            <div className="style-atelier__placeholder">
                <Construction size={48} />
                <h2>功能重构中</h2>
                <p>全新的“主题与样式引擎”即将上线，敬请期待。</p>
            </div>
        </div>
    );
};

export default StyleManager;