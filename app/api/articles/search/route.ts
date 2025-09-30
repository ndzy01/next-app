import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/article';
import { initBlogDatabase } from '@/lib/init-blog-db';

export async function GET(request: NextRequest) {
  try {
    await initBlogDatabase();

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

    const results = await searchArticles(query.trim(), limit);

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