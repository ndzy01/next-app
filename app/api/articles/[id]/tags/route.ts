import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getArticleTags, setArticleTagsByNames } from '@/lib/tag';
import { getArticleByIdWithPermission } from '@/lib/article';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// 获取文章标签
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

    // 使用权限检查获取文章
    const article = await getArticleByIdWithPermission(id, payload.userId);
    if (!article) {
      return NextResponse.json({ error: '文章不存在或无权访问' }, { status: 404 });
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
