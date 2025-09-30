'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 获取token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // 设置token
  const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  };

  // 移除token
  const removeToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  };

  // 获取用户信息
  const fetchUser = async () => {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        removeToken(); // 如果token无效，清除它
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      removeToken();
    }
  };

  // 登录
  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '登录失败');
    }

    // 存储token并设置用户信息
    setToken(data.token);
    setUser(data.user);
    
    // 导航到dashboard
    router.push('/dashboard');
  };

  // 注册
  const register = async (name: string, email: string, password: string) => {
    console.log('执行注册API请求...');
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    console.log('注册API响应:', { status: response.status, data });

    if (!response.ok) {
      throw new Error(data.error || '注册失败');
    }

    // 存储token并设置用户信息
    console.log('保存token和用户信息...');
    setToken(data.token);
    setUser(data.user);
    
    // 导航到dashboard
    console.log('准备跳转到dashboard...');
    try {
      await router.push('/dashboard');
      console.log('跳转成功');
    } catch (routerError) {
      console.error('路由跳转失败:', routerError);
      // 如果路由跳转失败，使用window.location
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    }
  };

  // 退出登录
  const logout = async () => {
    removeToken();
    setUser(null);
    router.push('/');
  };

  // 刷新用户信息
  const refreshUser = async () => {
    await fetchUser();
  };

  useEffect(() => {
    const initAuth = async () => {
      await fetchUser();
      setLoading(false);
    };

    initAuth();
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
