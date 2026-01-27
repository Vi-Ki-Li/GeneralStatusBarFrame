// types/layout.ts

/**
 * Represents a single item within a layout row.
 */
export interface LayoutItem {
  id: string;      // Unique ID for dnd-kit
  key: string;     // Corresponds to ItemDefinition.key
}

/**
 * Represents a single row in the layout canvas.
 * A row can contain one or more items.
 */
export interface LayoutRow {
  id: string;       // Unique ID for dnd-kit
  items: LayoutItem[];
}
