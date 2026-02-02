
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
   * 扫描 document.styleSheets 并 fetch 相应的 CSS 文件内容进行正则解析。
   * 仅处理同源且带有 href 的样式表。
   */
  async parse(): Promise<CssDocEntry[]> {
    if (this.parsed) return this.cache;

    const entries: CssDocEntry[] = [];
    const sheets = Array.from(document.styleSheets);
    
    for (const sheet of sheets) {
        // 简单过滤：仅处理本地 style.css 或同源 CSS
        if (sheet.href && (sheet.href.includes('style.css') || sheet.href.startsWith(window.location.origin))) {
            try {
                const response = await fetch(sheet.href);
                if (!response.ok) continue;
                const text = await response.text();
                
                // 正则匹配: /* @doc: Name | category: cat | desc: Description */ 后跟选择器
                // 解释:
                // \/\*\s*@doc:\s*(.*?)\s*\*\/  --> 匹配 /* @doc: ... */
                // \s*                          --> 空白
                // ([\s\S]*?)                   --> 捕获选择器部分
                // (?=\{|;)                     --> 向前查找，直到遇到 { (规则块开始) 或 ; (变量定义结束)
                const regex = /\/\*\s*@doc:\s*(.*?)\s*\*\/\s*([\s\S]*?)(?=\{|;)/g;
                
                let match;
                while ((match = regex.exec(text)) !== null) {
                    const metaString = match[1];
                    let selectorRaw = match[2].trim();
                    
                    // 清理选择器
                    // 1. 处理 CSS 变量: "--var: value" -> "--var"
                    let selector = selectorRaw.split(':')[0].trim();
                    // 2. 处理多选择器: ".a, .b" -> ".a"
                    selector = selector.split(',')[0].trim();
                    // 3. 处理换行
                    selector = selector.replace(/[\r\n]+/g, '');

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

                    // 格式化描述文本
                    const fullDesc = desc ? `${label} - ${desc}` : label;

                    entries.push({
                        className: selector,
                        category,
                        description: fullDesc,
                        notes
                    });
                }
            } catch (e) {
                console.warn('[DocumentationParser] Failed to parse sheet:', sheet.href, e);
            }
        }
    }

    this.cache = entries;
    this.parsed = true;
    console.log(`[DocumentationParser] Parsed ${entries.length} entries.`);
    return this.cache;
  }

  /**
   * 获取指定分类的文档
   */
  getDocs(category: string): CssDocEntry[] {
      return this.cache.filter(x => x.category === category);
  }

  /**
   * 强制重新解析
   */
  refresh() {
      this.parsed = false;
      this.cache = [];
      return this.parse();
  }
}

export const documentationParser = new DocumentationParser();
