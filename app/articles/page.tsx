'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { withRequiredAuth } from '@/lib/with-auth';
import ArticleList from '@/components/articles/ArticleList';
import ArticleSearch from '@/components/articles/ArticleSearch';
import TagSelector from '@/components/tags/TagSelector';
import MobileNavigation from '@/components/layout/MobileNavigation';
import MobileSearchModal from '@/components/layout/MobileSearchModal';
import { Plus, Filter, Grid, List } from 'lucide-react';

function ArticlesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showUserOnly] = useState(true); // 用户只能看到自己的文章
  const [showUnpublished, setShowUnpublished] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // 同步URL搜索参数
  useEffect(() => {
    const query = searchParams.get('q');
    const tab = searchParams.get('tab');
    
    if (query) {
      setSearchQuery(query);
    }
    
    // 根据URL参数设置标签页
    if (tab === 'drafts') {
      setShowUnpublished(true);
    } else if (tab === 'published') {
      setShowUnpublished(false);
    }
  }, [searchParams]);

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // 可以选择性地更新URL
    if (query) {
      window.history.replaceState({}, '', `/articles?q=${encodeURIComponent(query)}`);
    } else {
      window.history.replaceState({}, '', '/articles');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 桌面端导航栏 */}
      <nav className="hidden lg:block bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-white">
                NDZY App
              </Link>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  仪表板
                </Link>
                <span className="text-gray-900 dark:text-white px-3 py-2 rounded-md text-sm font-medium">
                  文章
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 桌面端搜索框 */}
              <div className="w-64">
                <ArticleSearch
                  onSearch={handleSearch}
                  placeholder="搜索文章..."
                />
              </div>
              
              {/* 写文章按钮 */}
              <Link
                href="/articles/create"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center"
              >
                <Plus size={16} className="mr-1" />
                写文章
              </Link>
              
              {/* 用户信息 */}
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {user?.name}
                </span>
                <Link
                  href="/dashboard"
                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  仪表盘
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 移动端导航栏 */}
      <MobileNavigation onSearchOpen={() => setIsMobileSearchOpen(true)} />

      {/* 移动端搜索模态框 */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        onSearch={handleSearch}
      />

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-3 lg:py-6 px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col space-y-4">
            {/* 标题和描述 */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                我的文章
              </h1>
              <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600 dark:text-gray-400">
                管理您的文章，包括草稿和已发布的内容
              </p>
            </div>

            {/* 文章状态切换 */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 inline-flex">
              <button
                onClick={() => setShowUnpublished(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  !showUnpublished
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                已发布
              </button>
              <button
                onClick={() => setShowUnpublished(true)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  showUnpublished
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                草稿
              </button>
            </div>
            
            {/* 操作按钮 - 移动端垂直排列，桌面端水平排列 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 创建文章按钮 - 移动端全宽 */}
              <Link
                href="/articles/create"
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus size={20} className="mr-2" />
                写文章
              </Link>
              
              {/* 过滤器按钮 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 rounded-lg border transition-colors font-medium ${
                  showFilters
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                <Filter size={20} className="mr-2" />
                筛选器
                {(selectedTags.length > 0 || showUnpublished) && (
                  <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full dark:bg-indigo-900 dark:text-indigo-200">
                    {[selectedTags.length > 0 ? '标签' : null, showUnpublished ? '草稿' : null].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 过滤器面板 - 移动端优化 */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-hidden">
            <div className="p-4 lg:p-6">
              {/* 移动端垂直布局，桌面端网格布局 */}
              <div className="space-y-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:space-y-0">
                {/* 文章状态 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    � 文章状态
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        checked={!showUnpublished}
                        onChange={() => setShowUnpublished(false)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                        已发布
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        checked={showUnpublished}
                        onChange={() => setShowUnpublished(true)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                        草稿
                      </span>
                    </label>
                  </div>
                </div>



                {/* 标签过滤 */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    🏷️ 标签过滤
                  </label>
                  <TagSelector
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    maxTags={5}
                    placeholder="选择标签过滤..."
                    allowCreate={false}
                    showCounts={true}
                  />
                </div>
              </div>
            </div>

            {/* 视图模式和操作 */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* 视图模式 */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    👁️ 视图模式
                  </span>
                  <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-600 dark:text-indigo-400'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      <Grid size={16} className="mr-1" />
                      <span className="hidden sm:inline">卡片</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-600 dark:text-indigo-400'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      <List size={16} className="mr-1" />
                      <span className="hidden sm:inline">列表</span>
                    </button>
                  </div>
                </div>

                {/* 清除筛选 */}
                {(selectedTags.length > 0 || showUnpublished) && (
                  <button
                    onClick={() => {
                      setSelectedTags([]);
                      setShowUnpublished(false);
                      setSearchQuery('');
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                  >
                    🔄 清除筛选
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 文章列表 */}
        <div className={viewMode === 'grid' ? 'space-y-6' : 'space-y-4'}>
          <ArticleList
            showUserOnly={showUserOnly}
            showUnpublished={showUnpublished}
            searchQuery={searchQuery}
            selectedTags={selectedTags}
            limit={20}
          />
        </div>
      </main>
    </div>
  );
}

export default withRequiredAuth(ArticlesPage);