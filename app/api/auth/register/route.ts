import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/user';
import { generateToken } from '@/lib/auth';
import { initDatabase } from '@/lib/init-db';

export async function POST(request: NextRequest) {
  try {
    // 确保数据库已初始化
    await initDatabase();

    const body = await request.json();
    const { email, password, name } = body;

    // 基本验证
    if (!email || !password || !name) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
    }

    // 密码长度验证
    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    // 创建用户
    const user = await createUser({ email, password, name });

    // 生成JWT令牌
    const token = generateToken(user);

    console.log('Registration successful, token generated:', {
      tokenLength: token.length,
      userId: user.id,
    });

    // 直接返回token给客户端
    return NextResponse.json({
      message: '注册成功',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error) {
      if (error.message === '用户已存在') {
        return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
      }
    }

    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
