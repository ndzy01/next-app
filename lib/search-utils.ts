// 搜索定位工具函数

// 在文本中查找关键词的所有位置
export function findKeywordPositions(text: string, keyword: string): Array<{start: number, end: number}> {
  const positions: Array<{start: number, end: number}> = [];
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  let index = 0;
  
  while ((index = lowerText.indexOf(lowerKeyword, index)) !== -1) {
    positions.push({
      start: index,
      end: index + keyword.length
    });
    index += keyword.length;
  }
  
  return positions;
}

// 在HTML内容中高亮关键词
export function highlightKeywordsInHTML(html: string, keyword: string): string {
  if (!keyword.trim()) return html;
  
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
  return html.replace(regex, '<mark class="search-highlight bg-yellow-200 dark:bg-yellow-600 px-1 rounded">$1</mark>');
}

// 在Markdown内容中高亮关键词
export function highlightKeywordsInMarkdown(markdown: string, keyword: string): string {
  if (!keyword.trim()) return markdown;
  
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
  return markdown.replace(regex, '**$1**');
}

// 转义正则表达式特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 获取第一个匹配位置的DOM元素
export function getFirstMatchElement(keyword: string): HTMLElement | null {
  const elements = document.querySelectorAll('*');
  for (const element of elements) {
    if (element.textContent?.toLowerCase().includes(keyword.toLowerCase())) {
      return element as HTMLElement;
    }
  }
  return null;
}

// 滚动到第一个匹配位置
export function scrollToFirstMatch(keyword: string): boolean {
  const element = getFirstMatchElement(keyword);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // 临时高亮效果
    element.classList.add('search-match-highlight');
    setTimeout(() => {
      element.classList.remove('search-match-highlight');
    }, 2000);
    
    return true;
  }
  return false;
}

// 获取所有匹配位置的DOM元素
export function getAllMatchElements(keyword: string): HTMLElement[] {
  const elements: HTMLElement[] = [];
  const allElements = document.querySelectorAll('*');
  
  for (const element of allElements) {
    if (element.textContent?.toLowerCase().includes(keyword.toLowerCase())) {
      elements.push(element as HTMLElement);
    }
  }
  
  return elements;
}

// 创建匹配位置导航
export function createMatchNavigation(keyword: string): { elements: HTMLElement[], currentIndex: number } {
  const elements = getAllMatchElements(keyword);
  return {
    elements,
    currentIndex: 0
  };
}

// 导航到下一个匹配位置
export function navigateToNextMatch(navigation: { elements: HTMLElement[], currentIndex: number }): { elements: HTMLElement[], currentIndex: number } {
  const { elements, currentIndex } = navigation;
  
  if (elements.length === 0) return navigation;
  
  const nextIndex = (currentIndex + 1) % elements.length;
  const element = elements[nextIndex];
  
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // 临时高亮效果
    element.classList.add('search-match-highlight');
    setTimeout(() => {
      element.classList.remove('search-match-highlight');
    }, 2000);
  }
  
  return {
    elements,
    currentIndex: nextIndex
  };
}

// 导航到上一个匹配位置
export function navigateToPrevMatch(navigation: { elements: HTMLElement[], currentIndex: number }): { elements: HTMLElement[], currentIndex: number } {
  const { elements, currentIndex } = navigation;
  
  if (elements.length === 0) return navigation;
  
  const prevIndex = (currentIndex - 1 + elements.length) % elements.length;
  const element = elements[prevIndex];
  
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // 临时高亮效果
    element.classList.add('search-match-highlight');
    setTimeout(() => {
      element.classList.remove('search-match-highlight');
    }, 2000);
  }
  
  return {
    elements,
    currentIndex: prevIndex
  };
}

// 解析URL中的搜索参数
export function parseSearchParams(url: string): { keyword?: string, highlight?: boolean } {
  try {
    const urlObj = new URL(url, window.location.origin);
    const keyword = urlObj.searchParams.get('search') || undefined;
    const highlight = urlObj.searchParams.get('highlight') === 'true';
    
    return { keyword, highlight };
  } catch {
    return {};
  }
}

// 构建带搜索参数的URL
export function buildSearchUrl(baseUrl: string, keyword: string, highlight: boolean = true): string {
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('search', keyword);
  if (highlight) {
    url.searchParams.set('highlight', 'true');
  }
  return url.toString();
}

// 检查是否应该执行搜索定位
export function shouldPerformSearchLocation(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('search') && urlParams.has('highlight');
}

// 执行完整的搜索定位流程
export function performSearchLocation(keyword: string): void {
  if (!keyword.trim()) return;
  
  // 首先尝试滚动到第一个匹配位置
  const found = scrollToFirstMatch(keyword);
  
  if (found) {
    console.log(`🔍 已定位到关键词 "${keyword}" 的第一个匹配位置`);
  } else {
    console.log(`❌ 未找到关键词 "${keyword}" 的匹配位置`);
  }
}
