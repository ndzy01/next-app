import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createArticle, getPublishedArticles, getUserArticles } from '@/lib/article';
import { setArticleTagsByNames } from '@/lib/tag';
import { initBlogDatabase } from '@/lib/init-blog-db';

// 获取文章列表
export async function GET(request: NextRequest) {
  try {
    await initBlogDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const published = searchParams.get('published');
    
    const offset = (page - 1) * limit;

    // 验证用户认证 - 必须登录才能访问文章列表
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: '需要登录才能访问文章' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 });
    }

    // 用户只能获取自己的文章
    const currentUserId = payload.userId;
    const publishedFilter = published === 'true' ? true : published === 'false' ? false : undefined;
    const articles = await getUserArticles(currentUserId, publishedFilter);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total: articles.length
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 });
  }
}

// 创建文章
export async function POST(request: NextRequest) {
  try {
    await initBlogDatabase();

    // 验证用户认证
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: '未找到认证令牌' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, published = false, tags = [] } = body;

    // 基本验证
    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
    }

    if (title.length > 500) {
      return NextResponse.json({ error: '标题长度不能超过500字符' }, { status: 400 });
    }

    if (excerpt && excerpt.length > 1000) {
      return NextResponse.json({ error: '摘要长度不能超过1000字符' }, { status: 400 });
    }

    // 创建文章
    const article = await createArticle({
      user_id: payload.userId,
      title,
      content,
      excerpt,
      published
    });

    // 设置标签
    if (tags && tags.length > 0) {
      await setArticleTagsByNames(article.id, tags);
    }

    return NextResponse.json({
      message: '文章创建成功',
      article
    }, { status: 201 });

  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json({ error: '创建文章失败' }, { status: 500 });
  }
}