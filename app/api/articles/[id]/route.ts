import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getArticleByIdWithPermission, updateArticle, deleteArticle } from '@/lib/article';
import { getArticleTags, setArticleTagsByNames } from '@/lib/tag';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// 获取单篇文章
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 获取用户token以进行权限检查
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let currentUserId = null;

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        currentUserId = payload.userId;
      }
    }

    // 使用权限检查获取文章
    const article = await getArticleByIdWithPermission(id, currentUserId || undefined);
    if (!article) {
      return NextResponse.json({ error: '文章不存在或无权访问' }, { status: 404 });
    }

    // 获取文章标签
    const tags = await getArticleTags(id);

    return NextResponse.json({
      article: {
        ...article,
        tags
      }
    });
  } catch (error) {
    console.error('Get article error:', error);
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 });
  }
}

// 更新文章
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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
    const { title, content, excerpt, published, tags } = body;

    // 基本验证
    if (title && title.length > 500) {
      return NextResponse.json({ error: '标题长度不能超过500字符' }, { status: 400 });
    }

    if (excerpt && excerpt.length > 1000) {
      return NextResponse.json({ error: '摘要长度不能超过1000字符' }, { status: 400 });
    }

    // 更新文章
    const article = await updateArticle(id, payload.userId, {
      title,
      content,
      excerpt,
      published
    });

    // 更新标签
    if (tags !== undefined) {
      await setArticleTagsByNames(id, tags);
    }

    // 获取更新后的标签
    const updatedTags = await getArticleTags(id);

    return NextResponse.json({
      message: '文章更新成功',
      article: {
        ...article,
        tags: updatedTags
      }
    });

  } catch (error) {
    console.error('Update article error:', error);
    
    if (error instanceof Error) {
      if (error.message === '文章不存在') {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 });
      }
      if (error.message === '没有权限编辑此文章') {
        return NextResponse.json({ error: '无权编辑此文章' }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: '更新文章失败' }, { status: 500 });
  }
}

// 删除文章
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // 删除文章
    await deleteArticle(id, payload.userId);

    return NextResponse.json({
      message: '文章删除成功'
    });

  } catch (error) {
    console.error('Delete article error:', error);
    
    if (error instanceof Error) {
      if (error.message === '文章不存在') {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 });
      }
      if (error.message === '没有权限删除此文章') {
        return NextResponse.json({ error: '无权删除此文章' }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: '删除文章失败' }, { status: 500 });
  }
}