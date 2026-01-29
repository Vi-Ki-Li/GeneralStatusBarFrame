
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, GripHorizontal } from 'lucide-react';
import './DraggablePanel.css';

interface DraggablePanelProps {
  title?: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  onClose: () => void;
  isMobile?: boolean;
  className?: string;
  extraControls?: React.ReactNode; // Added extra controls
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({ 
  title, children, initialPosition, onClose, isMobile, className = '', extraControls
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition || { x: 20, y: 80 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Recenter if out of bounds on init/resize
    const checkBounds = () => {
        if (!panelRef.current || isMobile) return;
        const rect = panelRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let newX = position.x;
        let newY = position.y;
        
        // Simple bounds checking
        if (newX + rect.width > viewportWidth) newX = Math.max(0, viewportWidth - rect.width - 20);
        if (newX < 0) newX = 20;
        if (newY + rect.height > viewportHeight) newY = Math.max(0, viewportHeight - rect.height - 20);
        if (newY < 0) newY = 80; 
        
        if (newX !== position.x || newY !== position.y) {
            setPosition({ x: newX, y: newY });
        }
    };
    setTimeout(checkBounds, 0);
  }, [isMobile]); // simplified dependency

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    // Allow interacting with controls in header without dragging
    if (e.target instanceof Element && e.target.closest('button')) return;

    isDragging.current = true;
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    
    let newX = e.clientX - dragOffset.current.x;
    let newY = e.clientY - dragOffset.current.y;

    // Boundaries
    const panelWidth = panelRef.current?.offsetWidth || 300;
    const panelHeight = panelRef.current?.offsetHeight || 400;
    const maxX = window.innerWidth - panelWidth;
    const maxY = window.innerHeight - panelHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
  };

  const content = isMobile ? (
      <div className={`draggable-panel mobile-sheet ${className}`} ref={panelRef}>
          <div className="draggable-panel__header">
              <div style={{flex: 1}}>
                <div className="draggable-panel__drag-handle-bar" />
                {title && <div className="draggable-panel__title">{title}</div>}
              </div>
              <button onClick={onClose} className="draggable-panel__btn">
                  <X size={20} />
              </button>
          </div>
          <div className="draggable-panel__content">
              {children}
          </div>
      </div>
  ) : (
    <div 
        className={`draggable-panel ${className}`}
        ref={panelRef}
        style={{ left: position.x, top: position.y }}
    >
      <div className="draggable-panel__header" onMouseDown={handleMouseDown}>
        <div className="draggable-panel__title">
            <GripHorizontal size={14} />
            {title}
        </div>
        <div className="draggable-panel__controls">
            {extraControls}
            <button onClick={onClose} className="draggable-panel__btn" title="关闭/收起">
                <X size={14} />
            </button>
        </div>
      </div>
      <div className="draggable-panel__content">
        {children}
      </div>
    </div>
  );

  // Use Portal to attach to body, bypassing any parent transforms or overflow:hidden
  return createPortal(content, document.body);
};

export default DraggablePanel;
