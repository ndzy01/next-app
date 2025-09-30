import { NextRequest, NextResponse } from 'next/server';
import { getAllTags, getTagsWithCount, createTag, searchTags } from '@/lib/tag';
import { initBlogDatabase } from '@/lib/init-blog-db';

// 获取标签列表
export async function GET(request: NextRequest) {
  try {
    await initBlogDatabase();

    const { searchParams } = new URL(request.url);
    const includeCount = searchParams.get('includeCount') === 'true';
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    let tags;

    if (search) {
      // 搜索标签
      tags = await searchTags(search, limit);
    } else if (includeCount) {
      // 获取标签及其文章数量
      tags = await getTagsWithCount();
    } else {
      // 获取所有标签
      tags = await getAllTags();
    }

    return NextResponse.json({
      tags,
      total: tags.length
    });

  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json({ error: '获取标签失败' }, { status: 500 });
  }
}

// 创建标签
export async function POST(request: NextRequest) {
  try {
    await initBlogDatabase();

    const body = await request.json();
    const { name } = body;

    // 基本验证
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: '标签名称不能为空' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: '标签名称长度不能超过100字符' }, { status: 400 });
    }

    // 标签名称格式验证
    const tagName = name.trim();
    if (!/^[\w\u4e00-\u9fa5\s-]+$/.test(tagName)) {
      return NextResponse.json({ error: '标签名称只能包含字母、数字、中文、空格和连字符' }, { status: 400 });
    }

    const tag = await createTag(tagName);

    return NextResponse.json({
      message: '标签创建成功',
      tag
    }, { status: 201 });

  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json({ error: '创建标签失败' }, { status: 500 });
  }
}