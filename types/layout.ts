
// types/layout.ts

export type LayoutNodeType = 'row' | 'col' | 'item' | 'category' | 'placeholder';

export interface LayoutNode {
  id: string;
  type: LayoutNodeType;
  children?: LayoutNode[]; // Row has Cols; Col has Items
  props?: {
    width?: number; // Percent width for columns
    flex?: number;
    className?: string;
  };
  data?: {
    key: string; // ItemDefinition.key or CategoryDefinition.key
  };
}

// Helper to define the root structure (List of Rows)
export type LayoutStructure = LayoutNode[];
