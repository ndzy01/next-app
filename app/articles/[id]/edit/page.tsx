'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { withAuth } from '@/lib/with-auth';
import ArticleEditor from '@/components/articles/ArticleEditor';
import { ArrowLeft, Save, Eye } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  published: boolean;
  tags: string[];
}

function ArticleEditPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    excerpt: '',
    published: false,
    tags: []
  });

  // 获取文章详情
  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证令牌');
      }

      const response = await fetch(`/api/articles/${articleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('文章不存在');
        } else if (response.status === 403) {
          throw new Error('无权编辑此文章');
        }
        throw new Error('获取文章失败');
      }

      const data = await response.json();
      const articleData = data.article;

      setArticle(articleData);
      setFormData({
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt || '',
        published: articleData.published,
        tags: articleData.tags?.map((tag: any) => tag.name) || []
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文章失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存文章
  const handleSave = async (data: ArticleFormData, saveAsPublished: boolean = false) => {
    try {
      setSaving(true);
      setError(null);

      // 验证必填字段
      if (!data.title.trim()) {
        throw new Error('请输入文章标题');
      }

      if (!data.content.trim()) {
        throw new Error('请输入文章内容');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证令牌');
      }

      // 自动生成摘要（如果未提供）
      let excerpt = data.excerpt.trim();
      if (!excerpt) {
        // 从内容中提取前200个字符作为摘要
        const textContent = data.content.replace(/[#*`]/g, '').replace(/\n+/g, ' ').trim();
        excerpt = textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');
      }

      const payload = {
        title: data.title.trim(),
        content: data.content,
        excerpt: excerpt,
        published: saveAsPublished,
        tags: data.tags.filter(tag => tag.trim()).map(tag => tag.trim())
      };

      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新文章失败');
      }

      const result = await response.json();
      
      // 更新本地状态
      setFormData(prev => ({ ...prev, published: saveAsPublished }));
      
      // 提示用户并跳转
      const message = saveAsPublished 
        ? '文章已发布！' 
        : '文章已保存为草稿！';
      
      alert(message);
      
      // 跳转到文章详情页
      router.push(`/articles/${articleId}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : '保存文章失败');
    } finally {
      setSaving(false);
    }
  };

  // 预览文章
  const handlePreview = () => {
    router.push(`/articles/${articleId}`);
  };

  // 初始加载
  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                href={`/articles/${articleId}`}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft size={20} className="mr-2" />
                返回文章
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* 预览按钮 */}
              <button
                onClick={handlePreview}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <Eye size={16} className="mr-1" />
                预览
              </button>

              {/* 发布状态 */}
              {!formData.published && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                  草稿模式
                </span>
              )}
              
              {formData.published && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                  已发布
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            编辑文章
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            修改您的文章内容，支持 Markdown 格式
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* 文章编辑器 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <ArticleEditor
            title={formData.title}
            content={formData.content}
            excerpt={formData.excerpt}
            tags={formData.tags}
            published={formData.published}
            onSave={handleSave}
            onCancel={() => router.push(`/articles/${articleId}`)}
            saving={saving}
            mode="edit"
          />
        </div>

        {/* 帮助提示 */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 编辑提示
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• 支持 Markdown 语法，实时预览效果</li>
            <li>• 修改后点击"保存草稿"暂存，或"发布文章"立即发布</li>
            <li>• 标签用逗号或回车分隔，系统会自动处理重复标签</li>
            <li>• 如果不填写摘要，系统会自动从内容中提取前200字符</li>
            <li>• 草稿状态的文章只有作者可见，发布后所有人可见</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default withAuth(ArticleEditPage);