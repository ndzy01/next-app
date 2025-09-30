'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  article_count?: number;
}

interface TagSelectorProps {
  selectedTags?: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  allowCreate?: boolean;
  showCounts?: boolean;
}

export default function TagSelector({
  selectedTags = [],
  onTagsChange,
  maxTags = 10,
  placeholder = '搜索或添加标签...',
  allowCreate = true,
  showCounts = false
}: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 获取所有标签
  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const url = showCounts ? '/api/tags?includeCount=true' : '/api/tags';
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setAllTags(data.tags);
        setFilteredTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  }, [showCounts]);

  // 搜索标签
  const searchTags = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredTags(allTags);
      return;
    }

    try {
      const response = await fetch(`/api/tags?search=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setFilteredTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to search tags:', error);
      // 如果搜索失败，使用本地过滤
      const filtered = allTags.filter(tag =>
        tag.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTags(filtered);
    }
  }, [allTags]);

  // 处理搜索输入
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchTags(value);
  };

  // 添加标签
  const handleAddTag = (tagName: string) => {
    const trimmedName = tagName.trim();
    
    if (!trimmedName || selectedTags.includes(trimmedName)) {
      return;
    }

    if (selectedTags.length >= maxTags) {
      alert(`最多只能选择 ${maxTags} 个标签`);
      return;
    }

    onTagsChange([...selectedTags, trimmedName]);
    setSearchQuery('');
    setIsOpen(false);
  };

  // 移除标签
  const handleRemoveTag = (tagName: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagName));
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      if (allowCreate) {
        handleAddTag(searchQuery);
      } else {
        // 如果不允许创建，选择第一个匹配的标签
        const firstMatch = filteredTags.find(tag =>
          tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !selectedTags.includes(tag.name)
        );
        if (firstMatch) {
          handleAddTag(firstMatch.name);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // 初始化
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.tag-selector')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="tag-selector relative">
      {/* 已选标签显示 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tagName) => (
            <span
              key={tagName}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
            >
              {tagName}
              <button
                type="button"
                onClick={() => handleRemoveTag(tagName)}
                className="ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 搜索输入框 */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length >= maxTags ? `已达到最大标签数 (${maxTags})` : placeholder}
          disabled={selectedTags.length >= maxTags}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* 下拉箭头 */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          disabled={selectedTags.length >= maxTags}
        >
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 标签下拉列表 */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              加载中...
            </div>
          ) : (
            <>
              {/* 创建新标签选项 */}
              {allowCreate && searchQuery.trim() && !allTags.some(tag => tag.name.toLowerCase() === searchQuery.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => handleAddTag(searchQuery)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-indigo-600 dark:text-indigo-400"
                >
                  <Plus size={16} />
                  <span>创建 &ldquo;{searchQuery}&rdquo;</span>
                </button>
              )}

              {/* 现有标签列表 */}
              {filteredTags
                .filter(tag => !selectedTags.includes(tag.name))
                .map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTag(tag.name)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                  >
                    <span className="text-gray-900 dark:text-white">{tag.name}</span>
                    {showCounts && tag.article_count !== undefined && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tag.article_count}
                      </span>
                    )}
                  </button>
                ))}

              {/* 无结果提示 */}
              {filteredTags.filter(tag => !selectedTags.includes(tag.name)).length === 0 && (
                <div className="p-3 text-center text-gray-500">
                  {searchQuery ? '没有找到匹配的标签' : '暂无标签'}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 标签计数提示 */}
      <div className="text-xs text-gray-500 mt-1">
        {selectedTags.length}/{maxTags} 个标签
      </div>
    </div>
  );
}