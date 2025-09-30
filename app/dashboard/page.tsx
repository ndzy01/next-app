'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { withRequiredAuth } from '@/lib/with-auth';
import { useState, useEffect } from 'react';

interface ArticleStats {
  total: number;
  published: number;
  drafts: number;
}

function DashboardPage() {
  const { user, logout } = useAuth();
  const [articleStats, setArticleStats] = useState<ArticleStats>({
    total: 0,
    published: 0,
    drafts: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // 获取文章统计
  useEffect(() => {
    const fetchArticleStats = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // 获取所有文章
        const allResponse = await fetch(`/api/articles?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // 获取已发布文章
        const publishedResponse = await fetch(`/api/articles?userId=${user.id}&published=true`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (allResponse.ok && publishedResponse.ok) {
          const allData = await allResponse.json();
          const publishedData = await publishedResponse.json();
          
          const total = allData.articles.length;
          const published = publishedData.articles.length;
          const drafts = total - published;

          setArticleStats({ total, published, drafts });
        }
      } catch (error) {
        console.error('获取文章统计失败:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchArticleStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 导航栏 */}
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">NDZY App</h1>
              <div className="hidden md:flex items-center space-x-4">
                <Link 
                  href="/dashboard"
                  className="text-gray-900 dark:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  仪表板
                </Link>
                <Link 
                  href="/articles"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  文章
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">欢迎，{user?.name}</span>
              <button
                onClick={logout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 文章统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总文章数</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {statsLoading ? '...' : articleStats.total}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">已发布</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {statsLoading ? '...' : articleStats.published}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">草稿</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {statsLoading ? '...' : articleStats.drafts}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/articles" className="group">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        我的文章
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">查看和管理您的文章</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/articles/create" className="group">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                        写文章
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">创建新的文章</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/" className="group">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0H8v0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        首页
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">返回应用首页</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* 用户信息 */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">用户信息</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{user?.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">姓名</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{user?.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">邮箱</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{user?.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">注册时间</label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {new Date(user!.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">最后更新时间</label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {new Date(user!.updated_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withRequiredAuth(DashboardPage);
