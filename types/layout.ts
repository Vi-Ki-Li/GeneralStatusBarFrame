
// types/layout.ts
import React from 'react';

export type LayoutNodeType = 'row' | 'col' | 'item' | 'category' | 'placeholder';

export interface LayoutNode {
  id: string;
  type: LayoutNodeType;
  children?: LayoutNode[]; // Row has Cols; Col has Items
  props?: {
    width?: number; // Percent width for columns
    flex?: number;
    className?: string;
    style?: React.CSSProperties; // Added for Phase 3: Custom styles
  };
  data?: {
    key: string; // ItemDefinition.key or CategoryDefinition.key
  };
}

// v9.8: Layout Snapshot Type
export interface LayoutSnapshot {
    id: string;
    name: string;
    layout: LayoutNode[];
    timestamp: number;
}

// Helper to define the root structure (List of Rows)
export type LayoutStructure = LayoutNode[];
