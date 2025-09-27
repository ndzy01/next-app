import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/user';
import { generateToken } from '@/lib/auth';
import { initDatabase } from '@/lib/init-db';

export async function POST(request: NextRequest) {
  try {
    // 确保数据库已初始化
    await initDatabase();

    const body = await request.json();
    const { email, password } = body;

    // 基本验证
    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }

    // 验证用户
    const user = await validateUser({ email, password });

    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // 生成JWT令牌
    const token = generateToken(user);

    console.log('Login successful, token generated:', {
      tokenLength: token.length,
      userId: user.id,
    });

    // 直接返回token给客户端
    return NextResponse.json({
      message: '登录成功',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
