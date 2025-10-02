'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Edit, Trash2, Calendar, User, EyeOff, Share2 } from 'lucide-react';
import { MdPreview } from 'md-editor-rt';
import 'md-editor-rt/lib/preview.css';
import SearchLocation from '@/components/articles/SearchLocation';
import { performSearchLocation } from '@/lib/search-utils';

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_email: string;
  user_id: string;
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

export default function ArticleDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = params.id as string;
  
  // 解析搜索参数
  const searchKeyword = searchParams.get('search') || '';
  const shouldHighlight = searchParams.get('highlight') === 'true';

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [highlightedContent, setHighlightedContent] = useState<string>('');
  const [showSearchLocation, setShowSearchLocation] = useState(false);

  // 转义正则表达式特殊字符
  const escapeRegExp = useCallback((string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);

  // 搜索高亮处理
  const highlightSearchResults = useCallback((content: string, query: string) => {
    if (!query) {
      setHighlightedContent(content);
      return;
    }

    // 使用简单的正则表达式高亮
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const highlighted = content.replace(regex, '<mark class="search-highlight">$1</mark>');
    setHighlightedContent(highlighted);
    
    // 显示搜索定位组件
    if (shouldHighlight) {
      setShowSearchLocation(true);
      
      // 延迟执行搜索定位，确保DOM已渲染
      setTimeout(() => {
        performSearchLocation(query);
      }, 1000);
    }
  }, [escapeRegExp, shouldHighlight]);

  // 获取文章详情
  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/articles/${articleId}`, { headers });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('文章不存在');
        } else if (response.status === 403) {
          throw new Error('无权访问此文章');
        }
        throw new Error('获取文章失败');
      }

      const data = await response.json();
      setArticle(data.article);
      
      // 处理搜索高亮
      if (searchKeyword && data.article.content) {
        highlightSearchResults(data.article.content, searchKeyword);
      } else {
        setHighlightedContent(data.article.content);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文章失败');
    } finally {
      setLoading(false);
    }
  }, [articleId, searchKeyword, highlightSearchResults]);



  // 删除文章
  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？此操作无法撤销。')) {
      return;
    }

    try {
      setDeleting(true);

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

      alert('文章删除成功');
      router.push('/articles');

    } catch (err) {
      alert(err instanceof Error ? err.message : '删除文章失败');
    } finally {
      setDeleting(false);
    }
  };

  // 分享文章
  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt || article?.title,
          url: url
        });
      } catch {
        // 用户取消分享或其他错误
      }
    } else {
      // 降级：复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(url);
        alert('链接已复制到剪贴板');
      } catch {
        // 降级：显示链接
        prompt('复制链接:', url);
      }
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 初始加载
  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId, fetchArticle]);

  // 检查是否为作者
  const isAuthor = user?.id === article?.user_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => fetchArticle()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              重试
            </button>
            <Link
              href="/articles"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              返回文章列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 导航栏 */}
      <nav className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                href="/articles"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft size={20} className="mr-2" />
                返回
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* 发布状态 */}
              {!article.published && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                  <EyeOff size={12} className="mr-1" />
                  草稿
                </span>
              )}
              
              {/* 分享按钮 */}
              {article.published && (
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                  title="分享文章"
                >
                  <Share2 size={18} />
                </button>
              )}

              {/* 作者操作 */}
              {isAuthor && (
                <>
                  <Link
                    href={`/articles/${article.id}/edit`}
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                    title="编辑文章"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-50"
                    title="删除文章"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 文章内容 */}
      <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 文章头部 */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>
          
          {/* 文章元信息 */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <User size={16} />
                <span>{article.author_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>{formatDate(article.created_at)}</span>
              </div>
              {article.updated_at !== article.created_at && (
                <span className="text-xs">
                  (更新于 {formatDate(article.updated_at)})
                </span>
              )}
            </div>
          </div>

          {/* 标签 */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/articles?tags=${encodeURIComponent(tag.name)}`}
                  className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900 dark:hover:text-indigo-300 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* 搜索提示 */}
        {searchKeyword && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              🔍 搜索关键词：<strong>{searchKeyword}</strong>，已高亮显示匹配内容
            </p>
            {shouldHighlight && (
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                使用右上角的搜索定位工具浏览所有匹配位置
              </p>
            )}
          </div>
        )}

        {/* 文章正文 */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <MdPreview
            modelValue={highlightedContent}
            theme="light"
            previewTheme="default"
            codeTheme="atom"
          />
        </div>

        {/* 文章底部 */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>作者：{article.author_name}</p>
              <p>发布时间：{formatDate(article.created_at)}</p>
              {article.updated_at !== article.created_at && (
                <p>最后更新：{formatDate(article.updated_at)}</p>
              )}
            </div>
            
            {/* 返回顶部 */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
            >
              返回顶部
            </button>
          </div>
        </footer>
      </article>

      {/* 搜索定位组件 */}
      {showSearchLocation && searchKeyword && (
        <SearchLocation 
          keyword={searchKeyword} 
          onClose={() => setShowSearchLocation(false)}
        />
      )}
    </div>
  );
}
