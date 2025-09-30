import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getArticleTags, setArticleTagsByNames } from '@/lib/tag';
import { getArticleById } from '@/lib/article';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// 获取文章标签
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 检查文章是否存在
    const article = await getArticleById(id);
    if (!article) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    // 如果是未发布的文章，需要验证权限
    if (!article.published) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        return NextResponse.json({ error: '文章未发布' }, { status: 403 });
      }

      const payload = verifyToken(token);
      if (!payload || payload.userId !== article.user_id) {
        return NextResponse.json({ error: '无权访问此文章' }, { status: 403 });
      }
    }

    const tags = await getArticleTags(id);

    return NextResponse.json({
      tags
    });

  } catch (error) {
    console.error('Get article tags error:', error);
    return NextResponse.json({ error: '获取文章标签失败' }, { status: 500 });
  }
}

// 设置文章标签
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // 检查文章是否存在且用户有权限
    const article = await getArticleById(id);
    if (!article) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    if (article.user_id !== payload.userId) {
      return NextResponse.json({ error: '无权修改此文章的标签' }, { status: 403 });
    }

    const body = await request.json();
    const { tags = [] } = body;

    // 验证标签数据
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: '标签必须是数组格式' }, { status: 400 });
    }

    if (tags.length > 10) {
      return NextResponse.json({ error: '文章标签数量不能超过10个' }, { status: 400 });
    }

    // 验证每个标签
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        return NextResponse.json({ error: '标签名称不能为空' }, { status: 400 });
      }
      if (tag.length > 100) {
        return NextResponse.json({ error: '标签名称长度不能超过100字符' }, { status: 400 });
      }
    }

    // 设置文章标签
    await setArticleTagsByNames(id, tags);

    // 获取更新后的标签
    const updatedTags = await getArticleTags(id);

    return NextResponse.json({
      message: '标签设置成功',
      tags: updatedTags
    });

  } catch (error) {
    console.error('Set article tags error:', error);
    return NextResponse.json({ error: '设置文章标签失败' }, { status: 500 });
  }
}