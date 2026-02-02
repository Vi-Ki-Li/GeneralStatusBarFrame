
export interface CssDocEntry {
  className: string;
  description: string;
  category: string;
  notes?: string;
}

class DocumentationParser {
  private cache: CssDocEntry[] = [];
  private parsed = false;

  /**
   * 解析单段 CSS 文本并提取文档条目
   */
  private parseCssText(text: string, entries: CssDocEntry[]) {
      // 正则匹配: /* @doc: Name | category: cat | desc: Description */ 后跟选择器
      const regex = /\/\*\s*@doc:\s*(.*?)\s*\*\/\s*([\s\S]*?)(?=\{|;)/g;
      
      let match;
      while ((match = regex.exec(text)) !== null) {
          const metaString = match[1];
          let selectorRaw = match[2].trim();
          
          // 清理选择器
          let selector = selectorRaw.split(':')[0].trim(); // 去掉伪类/伪元素前缀风险
          selector = selector.split(',')[0].trim();       // 取第一个选择器
          selector = selector.replace(/[\r\n]+/g, '');    // 去掉换行

          // 解析元数据
          const metaParts = metaString.split('|');
          const label = metaParts[0].trim();
          let category = 'other';
          let desc = '';
          let notes = '';

          metaParts.slice(1).forEach(part => {
              const p = part.trim();
              if (p.startsWith('category:')) category = p.replace('category:', '').trim();
              else if (p.startsWith('desc:')) desc = p.replace('desc:', '').trim();
              else if (p.startsWith('notes:')) notes = p.replace('notes:', '').trim();
          });

          const fullDesc = desc ? `${label} - ${desc}` : label;

          // 避免重复添加 (优先保留先扫描到的，或者覆盖？这里简单去重)
          if (!entries.some(e => e.className === selector && e.category === category)) {
              entries.push({
                  className: selector,
                  category,
                  description: fullDesc,
                  notes
              });
          }
      }
  }

  /**
   * 扫描 document.styleSheets
   */
  async parse(): Promise<CssDocEntry[]> {
    if (this.parsed) return this.cache;

    const entries: CssDocEntry[] = [];
    const sheets = Array.from(document.styleSheets);
    
    for (const sheet of sheets) {
        try {
            // Case 1: 外部 CSS (带有 href)
            if (sheet.href && (sheet.href.includes('style.css') || sheet.href.startsWith(window.location.origin))) {
                const response = await fetch(sheet.href);
                if (response.ok) {
                    const text = await response.text();
                    this.parseCssText(text, entries);
                }
            } 
            // Case 2: 内联 <style> 标签 (Bundler 注入的组件样式)
            else if (!sheet.href && sheet.ownerNode instanceof HTMLStyleElement) {
                const text = sheet.ownerNode.textContent;
                if (text) {
                    this.parseCssText(text, entries);
                }
            }
        } catch (e) {
            console.warn('[DocumentationParser] Failed to parse sheet:', sheet.href || 'inline', e);
        }
    }

    this.cache = entries;
    this.parsed = true;
    console.log(`[DocumentationParser] Parsed ${entries.length} entries.`);
    return this.cache;
  }

  getDocs(category: string): CssDocEntry[] {
      return this.cache.filter(x => x.category === category);
  }

  refresh() {
      this.parsed = false;
      this.cache = [];
      return this.parse();
  }
}

export const documentationParser = new DocumentationParser();
