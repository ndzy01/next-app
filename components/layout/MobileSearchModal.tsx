'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import ArticleSearch from '@/components/articles/ArticleSearch';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export default function MobileSearchModal({ isOpen, onClose, onSearch }: MobileSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 当模态框打开时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleSearch = (searchQuery: string) => {
    onSearch(searchQuery);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* 遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 搜索模态框 */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg animate-slide-down">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            搜索文章
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* 搜索内容 */}
        <div className="p-4">
          {/* 简单搜索输入框 */}
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入关键词搜索文章..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-base"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-3 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-base transition-colors"
            >
              搜索
            </button>
          </form>

          {/* 或者使用完整搜索组件 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              高级搜索（支持智能匹配）
            </p>
            <div className="w-full">
              <ArticleSearch
                onSearch={handleSearch}
                placeholder="智能搜索..."
              />
            </div>
          </div>

          {/* 搜索提示 */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              搜索小贴士
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 支持标题、内容、作者搜索</li>
              <li>• 支持模糊匹配，不需要完全匹配</li>
              <li>• 可搜索标签名称</li>
              <li>• 英文搜索不区分大小写</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 添加动画样式（如果需要的话，可以在全局CSS中添加）
const styles = `
@keyframes slide-down {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
`;