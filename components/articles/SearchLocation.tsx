'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { 
  createMatchNavigation, 
  navigateToNextMatch, 
  navigateToPrevMatch,
  performSearchLocation,
  shouldPerformSearchLocation 
} from '@/lib/search-utils';

interface SearchLocationProps {
  keyword: string;
  onClose?: () => void;
}

export default function SearchLocation({ keyword, onClose }: SearchLocationProps) {
  const [navigation, setNavigation] = useState<{ elements: HTMLElement[], currentIndex: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 初始化搜索定位
  useEffect(() => {
    if (keyword.trim()) {
      const nav = createMatchNavigation(keyword);
      setNavigation(nav);
      setIsVisible(nav.elements.length > 0);
      
      // 自动滚动到第一个匹配位置
      if (nav.elements.length > 0) {
        setTimeout(() => {
          performSearchLocation(keyword);
        }, 100);
      }
    }
  }, [keyword]);

  // 检查URL参数并自动执行搜索定位
  useEffect(() => {
    if (shouldPerformSearchLocation()) {
      const urlParams = new URLSearchParams(window.location.search);
      const searchKeyword = urlParams.get('search');
      if (searchKeyword) {
        performSearchLocation(searchKeyword);
      }
    }
  }, []);

  const handleNext = () => {
    if (navigation) {
      const newNav = navigateToNextMatch(navigation);
      setNavigation(newNav);
    }
  };

  const handlePrev = () => {
    if (navigation) {
      const newNav = navigateToPrevMatch(navigation);
      setNavigation(newNav);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
    
    // 清除URL中的搜索参数
    const url = new URL(window.location.href);
    url.searchParams.delete('search');
    url.searchParams.delete('highlight');
    window.history.replaceState({}, '', url.toString());
  };

  if (!isVisible || !navigation || navigation.elements.length === 0) {
    return null;
  }

  const { elements, currentIndex } = navigation;
  const totalMatches = elements.length;

  return (
    <div className="fixed top-20 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-64">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          搜索定位
        </h3>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* 关键词显示 */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          关键词：
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-white bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
          &quot;{keyword}&quot;
        </p>
      </div>

      {/* 匹配统计 */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          找到 {totalMatches} 个匹配位置
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          当前：{currentIndex + 1} / {totalMatches}
        </p>
      </div>

      {/* 导航按钮 */}
      <div className="flex space-x-2">
        <button
          onClick={handlePrev}
          disabled={totalMatches <= 1}
          className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp size={16} className="mr-1" />
          上一个
        </button>
        
        <button
          onClick={handleNext}
          disabled={totalMatches <= 1}
          className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown size={16} className="mr-1" />
          下一个
        </button>
      </div>

      {/* 进度指示器 */}
      {totalMatches > 1 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalMatches) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 使用提示 */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 使用导航按钮浏览所有匹配位置
        </p>
      </div>
    </div>
  );
}

// 高亮样式
const highlightStyles = `
  .search-highlight {
    background-color: rgb(254 240 138);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 600;
  }
  
  .dark .search-highlight {
    background-color: rgb(101 163 13);
    color: rgb(255 255 255);
  }
  
  .search-match-highlight {
    animation: searchPulse 2s ease-in-out;
    background-color: rgba(255, 255, 0, 0.3);
    border-radius: 0.25rem;
  }
  
  @keyframes searchPulse {
    0% {
      background-color: rgba(255, 255, 0, 0.8);
    }
    50% {
      background-color: rgba(255, 255, 0, 0.4);
    }
    100% {
      background-color: rgba(255, 255, 0, 0);
    }
  }
`;

// 添加高亮样式到文档
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = highlightStyles;
  document.head.appendChild(styleElement);
}
