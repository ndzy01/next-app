import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/user';

export async function GET(request: NextRequest) {
  try {
    // 从Authorization header中获取Bearer token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    console.log('Token extracted:', token ? `YES (${token.substring(0, 10)}...)` : 'NO');

    if (!token) {
      console.log('No Bearer token found in Authorization header');
      return NextResponse.json({ error: '未找到认证令牌' }, { status: 401 });
    } // 验证令牌
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 });
    }

    // 获取用户信息
    const user = await getUserById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error('Get user info error:', error);

    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}
