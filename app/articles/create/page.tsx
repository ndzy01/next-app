'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { withRequiredAuth } from '@/lib/with-auth';
import ArticleEditor from '@/components/articles/ArticleEditor';
import { ArrowLeft } from 'lucide-react';

function CreateArticlePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // 保存文章
  const handleSave = async (articleData: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    published: boolean;
  }) => {
    try {
      setSaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证令牌');
      }

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(articleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建文章失败');
      }

      const data = await response.json();
      console.log('文章保存成功:', data);
      
      // 显示成功消息
      const successMessage = articleData.published ? '文章发布成功！' : '文章保存为草稿成功！';
      alert(successMessage);
      
      // 跳转到文章列表页面而不是详情页，确保用户能看到文章
      if (articleData.published) {
        router.push('/articles?tab=published');
      } else {
        router.push('/articles?tab=drafts');
      }
      
    } catch (error) {
      console.error('Save article error:', error);
      alert(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 取消创建
  const handleCancel = () => {
    if (confirm('确定要取消创建文章吗？未保存的内容将丢失。')) {
      router.push('/articles');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 导航栏 */}
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                href="/articles"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mr-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                返回文章列表
              </Link>
              <span className="text-gray-400">|</span>
              <h1 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
                创建新文章
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
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
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            写一篇新文章
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            使用Markdown语法创作您的文章，支持实时预览。您可以先保存为草稿，稍后再发布。
          </p>
        </div>

        {/* 创作提示 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 创作小贴士
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• 使用清晰、吸引人的标题来概括文章主题</li>
            <li>• 添加简洁的摘要帮助读者快速了解内容</li>
            <li>• 选择相关标签让您的文章更容易被发现</li>
            <li>• 可以随时保存草稿，无需担心内容丢失</li>
          </ul>
        </div>

        {/* 编辑器 */}
        <ArticleEditor
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
          mode="create"
        />

        {/* 快捷键说明 */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            快捷键说明
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+S</kbd> 保存草稿</div>
            <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+Enter</kbd> 发布文章</div>
            <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+K</kbd> 插入链接</div>
            <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+B</kbd> 粗体</div>
            <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+I</kbd> 斜体</div>
            <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+U</kbd> 下划线</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withRequiredAuth(CreateArticlePage);