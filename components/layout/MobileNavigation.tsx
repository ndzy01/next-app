'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Menu, 
  X, 
  Home, 
  PenTool, 
  FileText, 
  User, 
  LogOut,
  Search,
  Plus
} from 'lucide-react';

interface MobileNavigationProps {
  onSearchOpen?: () => void;
}

export default function MobileNavigation({ onSearchOpen }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // 关闭菜单当路由改变
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // 防止滚动当菜单打开
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const navigation = [
    {
      name: '首页',
      href: '/',
      icon: Home,
      current: pathname === '/'
    },
    {
      name: '仪表板',
      href: '/dashboard',
      icon: User,
      current: pathname === '/dashboard'
    },
    {
      name: '文章',
      href: '/articles',
      icon: FileText,
      current: pathname.startsWith('/articles')
    }
  ];

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  return (
    <>
      {/* 移动端导航栏 */}
      <nav className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              href="/"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              NDZY App
            </Link>

            {/* 右侧按钮组 */}
            <div className="flex items-center space-x-2">
              {/* 搜索按钮 */}
              {pathname.startsWith('/articles') && onSearchOpen && (
                <button
                  onClick={onSearchOpen}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="搜索"
                >
                  <Search size={20} />
                </button>
              )}

              {/* 写文章按钮 */}
              {user && (
                <Link
                  href="/articles/create"
                  className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  aria-label="写文章"
                >
                  <Plus size={20} />
                </Link>
              )}

              {/* 菜单按钮 */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 移动端菜单遮罩 */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 移动端侧边菜单 */}
      <div className={`
        lg:hidden fixed top-0 right-0 bottom-0 z-50 w-80 max-w-sm bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* 菜单头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            菜单
          </h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* 用户信息 */}
        {user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 导航菜单 */}
        <div className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors
                  ${item.current
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon size={20} className="mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* 菜单底部 */}
        {user && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={20} className="mr-3" />
              退出登录
            </button>
          </div>
        )}
      </div>
    </>
  );
}