import { StyleDefinition } from '../types';
import React from 'react';

// Helper to convert camelCase CSS properties to kebab-case
const toKebabCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/**
 * Generates a CSS string from a guiConfig object.
 * @param guiConfig The configuration object from StyleDefinition.
 * @returns A formatted CSS string.
 */
export function generateCssFromGuiConfig(
  guiConfig: StyleDefinition['guiConfig']
): string {
  if (!guiConfig) {
    return '';
  }

  return Object.entries(guiConfig)
    .map(([selector, properties]) => {
      if (!properties || Object.keys(properties).length === 0) {
        return '';
      }

      const propsString = Object.entries(properties)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => {
          // Assert key is a valid CSS property key
          return `  ${toKebabCase(key)}: ${value};`;
        })
        .join('\n');

      if (!propsString) {
        return '';
      }

      return `${selector} {\n${propsString}\n}`;
    })
    .filter(Boolean)
    .join('\n\n');
}