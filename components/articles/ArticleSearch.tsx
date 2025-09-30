'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import Fuse from 'fuse.js';

interface SearchResult {
  id: string;
  title: string;
  excerpt?: string;
  author_name: string;
  created_at: string;
  rank: number;
  highlight?: string;
}

interface ArticleSearchProps {
  onSearch?: (query: string, results?: SearchResult[]) => void;
  placeholder?: string;
  showResults?: boolean;
  maxResults?: number;
}

export default function ArticleSearch({
  onSearch,
  placeholder = '搜索文章...',
  showResults = true,
  maxResults = 5
}: ArticleSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 初始化搜索历史
  useEffect(() => {
    const history = localStorage.getItem('article_search_history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('article_search_history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // 清空搜索历史
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('article_search_history');
  }, []);

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      
      // 添加认证头
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `/api/articles/search?q=${encodeURIComponent(searchQuery)}&limit=${maxResults}`,
        { 
          headers,
          signal: abortControllerRef.current.signal
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        
        if (onSearch) {
          onSearch(searchQuery, data.results);
        }
      } else {
        const errorText = await response.text();
        console.error('Search failed:', errorText);
        setResults([]);
        // 如果是401错误，可以显示登录提示
        if (response.status === 401) {
          console.warn('搜索需要登录，请检查登录状态');
        }
      }
    } catch (error) {
      // 如果请求被取消，不处理错误
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [maxResults, onSearch]);

  // 防抖搜索 - 增加延迟时间，减少最小搜索长度
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 只有输入长度>=2才进行搜索
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 600); // 增加到600ms，减少频繁搜索
  }, [performSearch]);

  // 处理输入变化
  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setIsOpen(true);
      // 只有输入长度>=2才触发搜索
      if (value.trim().length >= 2) {
        debouncedSearch(value);
      } else {
        setResults([]);
      }
    } else {
      setResults([]);
      setIsOpen(false);
      // 清除防抖定时器
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }
  };

  // 处理搜索提交
  const handleSearchSubmit = (searchQuery: string = query) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    saveSearchHistory(trimmedQuery);
    performSearch(trimmedQuery);
    setQuery(trimmedQuery);
    setIsOpen(false);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // 清空搜索
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (onSearch) {
      onSearch('', []);
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 高亮搜索关键词
  const highlightText = (text: string, highlight: string) => {
    if (!highlight || !query) return text;
    
    const fuse = new Fuse([text], {
      includeMatches: true,
      threshold: 0.3,
      ignoreLocation: true
    });
    
    const result = fuse.search(query);
    if (result.length > 0 && result[0].matches) {
      // 简单的高亮实现
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-700">$1</mark>');
    }
    
    return text;
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      {/* 搜索输入框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* 搜索下拉面板 */}
      {isOpen && showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">搜索中...</p>
            </div>
          ) : (
            <>
              {/* 搜索结果 */}
              {query && results.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b dark:border-gray-600">
                    搜索结果 ({results.length})
                  </div>
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={`/articles/${result.id}`}
                      onClick={() => {
                        handleSearchSubmit();
                        setIsOpen(false);
                      }}
                      className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        <span dangerouslySetInnerHTML={{
                          __html: highlightText(result.title, result.highlight || '')
                        }} />
                      </div>
                      {(result.excerpt || result.highlight) && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          <span dangerouslySetInnerHTML={{
                            __html: highlightText(result.excerpt || result.highlight || '', result.highlight || '')
                          }} />
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {result.author_name} · {new Date(result.created_at).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* 搜索提示 - 输入长度不足 */}
              {query && query.trim().length > 0 && query.trim().length < 2 && (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  <p>至少输入2个字符开始搜索</p>
                </div>
              )}

              {/* 无搜索结果 */}
              {query && query.trim().length >= 2 && results.length === 0 && !loading && (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  没有找到相关文章
                </div>
              )}

              {/* 搜索历史 */}
              {!query && searchHistory.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b dark:border-gray-600 flex justify-between items-center">
                    <span>搜索历史</span>
                    <button
                      onClick={clearSearchHistory}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      清空
                    </button>
                  </div>
                  {searchHistory.slice(0, 5).map((historyItem, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(historyItem);
                        handleSearchSubmit(historyItem);
                      }}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {historyItem}
                    </button>
                  ))}
                </div>
              )}

              {/* 空状态 */}
              {!query && searchHistory.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  <p>输入至少2个字符开始搜索</p>
                  <p className="text-xs mt-1">支持标题、内容和摘要搜索</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}