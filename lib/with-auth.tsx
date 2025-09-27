'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

interface WithAuthProps {
  requireAuth?: boolean;
  redirectTo?: string;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthProps = {}
) {
  const { requireAuth = true, redirectTo = '/auth/login' } = options;

  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (requireAuth && !user) {
          router.push(redirectTo);
        } else if (!requireAuth && user) {
          // 如果页面不需要认证但用户已登录，可以重定向到仪表盘 TODO: 使其可配置
          router.push('/dashboard');
        }
      }
    }, [user, loading, router]);

    // 显示加载状态
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      );
    }

    // 如果需要认证但用户未登录，不渲染组件（等待重定向）
    if (requireAuth && !user) {
      return null;
    }

    // 如果不需要认证但用户已登录，不渲染组件（等待重定向）
    if (!requireAuth && user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// 快捷方式：需要认证的页面
export function withRequiredAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return withAuth(WrappedComponent, { requireAuth: true });
}

// 快捷方式：只有未认证用户可以访问的页面
export function withGuestOnly<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return withAuth(WrappedComponent, { requireAuth: false });
}
