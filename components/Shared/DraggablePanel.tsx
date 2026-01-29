
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, GripHorizontal, ArrowDownRight } from 'lucide-react'; // Changed ChevronDownRight to ArrowDownRight
import './DraggablePanel.css';

interface DraggablePanelProps {
  title?: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number }; // New prop
  onClose: () => void;
  isMobile?: boolean;
  className?: string;
  extraControls?: React.ReactNode;
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({ 
  title, children, initialPosition, initialSize, onClose, isMobile, className = '', extraControls
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition || { x: 20, y: 80 });
  const [size, setSize] = useState(initialSize || { width: 320, height: 500 }); // Default size state
  
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

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
  }, [isMobile]); 

  // --- Dragging Logic (Mouse) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
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
    if (isDragging.current) {
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        const panelWidth = panelRef.current?.offsetWidth || size.width;
        const panelHeight = panelRef.current?.offsetHeight || size.height;
        const maxX = window.innerWidth - panelWidth;
        const maxY = window.innerHeight - panelHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
  };

  // --- Dragging Logic (Touch) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) return; // If explicitly in mobile sheet mode, don't drag
    if (e.target instanceof Element && e.target.closest('button')) return;

    isDragging.current = true;
    const touch = e.touches[0];
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
        dragOffset.current = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging.current) {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        let newX = touch.clientX - dragOffset.current.x;
        let newY = touch.clientY - dragOffset.current.y;

        const panelWidth = panelRef.current?.offsetWidth || size.width;
        const panelHeight = panelRef.current?.offsetHeight || size.height;
        const maxX = window.innerWidth - panelWidth;
        const maxY = window.innerHeight - panelHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  // --- Resizing Logic (Mouse) ---
  const handleResizeDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isResizing.current = true;
      resizeStart.current = {
          x: e.clientX,
          y: e.clientY,
          w: size.width,
          h: size.height
      };
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'nwse-resize';
  };

  const handleResizeMove = (e: MouseEvent) => {
      if (isResizing.current) {
          const deltaX = e.clientX - resizeStart.current.x;
          const deltaY = e.clientY - resizeStart.current.y;
          
          const newWidth = Math.max(250, resizeStart.current.w + deltaX); // Min width 250
          const newHeight = Math.max(300, resizeStart.current.h + deltaY); // Min height 300
          
          setSize({ width: newWidth, height: newHeight });
      }
  };

  const handleResizeUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
  };

  // --- Resizing Logic (Touch) ---
  const handleResizeTouchStart = (e: React.TouchEvent) => {
      e.stopPropagation();
      isResizing.current = true;
      const touch = e.touches[0];
      resizeStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          w: size.width,
          h: size.height
      };
      document.addEventListener('touchmove', handleResizeTouchMove, { passive: false });
      document.addEventListener('touchend', handleResizeTouchEnd);
  };

  const handleResizeTouchMove = (e: TouchEvent) => {
      if (isResizing.current) {
          e.preventDefault(); // Prevent scrolling
          const touch = e.touches[0];
          const deltaX = touch.clientX - resizeStart.current.x;
          const deltaY = touch.clientY - resizeStart.current.y;
          
          const newWidth = Math.max(250, resizeStart.current.w + deltaX);
          const newHeight = Math.max(300, resizeStart.current.h + deltaY);
          
          setSize({ width: newWidth, height: newHeight });
      }
  };

  const handleResizeTouchEnd = () => {
      isResizing.current = false;
      document.removeEventListener('touchmove', handleResizeTouchMove);
      document.removeEventListener('touchend', handleResizeTouchEnd);
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
        style={{ 
            left: position.x, 
            top: position.y,
            width: size.width,
            height: size.height
        }}
    >
      <div 
        className="draggable-panel__header" 
        onMouseDown={handleMouseDown} 
        onTouchStart={handleTouchStart}
        style={{ touchAction: 'none' }} // Prevent scrolling when dragging header
      >
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
      {/* Resize Handle */}
      <div 
        className="draggable-panel__resize-handle" 
        onMouseDown={handleResizeDown}
        onTouchStart={handleResizeTouchStart}
        style={{ touchAction: 'none' }} // Prevent scrolling when resizing
      >
          <ArrowDownRight size={16} />
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default DraggablePanel;
