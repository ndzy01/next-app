import { NextRequest, NextResponse } from 'next/server';
import { searchUserArticles } from '@/lib/article';
import { verifyToken } from '@/lib/auth';
import { initBlogDatabase } from '@/lib/init-blog-db';

export async function GET(request: NextRequest) {
  try {
    await initBlogDatabase();

    // 验证用户认证
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: '需要登录才能搜索文章' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: '搜索关键词不能为空' }, { status: 400 });
    }

    if (query.length > 100) {
      return NextResponse.json({ error: '搜索关键词长度不能超过100字符' }, { status: 400 });
    }

    if (limit > 50) {
      return NextResponse.json({ error: '搜索结果数量不能超过50' }, { status: 400 });
    }

    // 只搜索当前用户的文章
    const results = await searchUserArticles(payload.userId, query.trim(), limit);

    return NextResponse.json({
      query: query.trim(),
      results,
      total: results.length
    });

  } catch (error) {
    console.error('Search articles error:', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}