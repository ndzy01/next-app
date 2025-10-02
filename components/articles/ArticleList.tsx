'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import ArticleCard from '@/components/articles/ArticleCard';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_email?: string;
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

interface ArticleListProps {
  showUserOnly?: boolean;
  showUnpublished?: boolean;
  searchQuery?: string;
  selectedTags?: string[];
  limit?: number;
}

export default function ArticleList({
  showUserOnly = false,
  showUnpublished = false,
  searchQuery = '',
  selectedTags = [],
  limit = 20
}: ArticleListProps) {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 获取文章列表
  const fetchArticles = useCallback(async (pageNum = 1, reset = true) => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/articles?page=${pageNum}&limit=${limit}`;
      
      // 现在系统只允许用户查看自己的文章，所以总是使用用户ID
      if (user) {
        if (showUnpublished) {
          // 只获取草稿文章
          url += `&published=false`;
        } else {
          // 只获取已发布文章
          url += `&published=true`;
        }
      }

      const headers: Record<string, string> = {};
      
      // 总是尝试添加认证头，用于权限检查
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '获取文章列表失败');
      }

      const data = await response.json();
      
      if (reset) {
        setArticles(data.articles);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
      }
      
      setHasMore(data.articles.length === limit);
    } catch (err) {
      console.error('获取文章列表错误:', err);
      setError(err instanceof Error ? err.message : '获取文章列表失败');
    } finally {
      setLoading(false);
    }
  }, [limit, user, showUnpublished]);

  // 搜索文章
  const searchArticles = useCallback(async () => {
    if (!searchQuery.trim()) {
      fetchArticles(1, true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 添加认证头
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/articles/search?q=${encodeURIComponent(searchQuery.trim())}&limit=${limit}`,
        { headers }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '搜索失败');
      }

      const data = await response.json();
      setArticles(data.results);
      setHasMore(false); // 搜索结果不分页
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, limit, fetchArticles]);

  // 过滤标签
  const filterByTags = (articleList: Article[]) => {
    if (selectedTags.length === 0) return articleList;
    
    return articleList.filter(article => {
      if (!article.tags) return false;
      return selectedTags.every(selectedTag =>
        article.tags!.some(tag => tag.name === selectedTag)
      );
    });
  };

  // 删除文章
  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证令牌');
      }

      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除文章失败');
      }

      // 从列表中移除已删除的文章
      setArticles(prev => prev.filter(article => article.id !== articleId));
      
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除文章失败');
    }
  };

  // 加载更多
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArticles(nextPage, false);
    }
  };

  // 初始加载和搜索效果
  useEffect(() => {
    if (searchQuery) {
      searchArticles();
    } else {
      setPage(1);
      fetchArticles(1, true);
    }
  }, [showUserOnly, showUnpublished, searchQuery, searchArticles, fetchArticles]);

  // 过滤后的文章列表
  const filteredArticles = filterByTags(articles);

  if (loading && articles.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => fetchArticles(1, true)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          重试
        </button>
      </div>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {searchQuery ? '没有找到相关文章' : '暂无文章'}
        </p>
        {showUserOnly && (
          <Link
            href="/articles/create"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            写第一篇文章
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 文章列表 */}
      <div className="grid gap-6">
        {filteredArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            showActions={showUserOnly} // 现在总是显示操作按钮，因为用户只能看到自己的文章
            onDelete={() => handleDeleteArticle(article.id)}
            searchQuery={searchQuery} // 传递搜索关键词用于定位
          />
        ))}
      </div>

      {/* 加载更多按钮 */}
      {hasMore && !searchQuery && (
        <div className="text-center py-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
}
