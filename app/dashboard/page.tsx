'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { withRequiredAuth } from '@/lib/with-auth';

function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 导航栏 */}
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">NDZY App</h1>
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
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">用户信息</h2>

              <div className="space-y-4">
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

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">更新时间</label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {new Date(user!.updated_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
              返回首页
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withRequiredAuth(DashboardPage);
