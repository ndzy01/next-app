import pool from './db';

export interface Tag {
  id: string;
  name: string;
  created_at: Date;
}

export interface TagWithCount extends Tag {
  article_count: number;
}

// 创建标签
export async function createTag(name: string): Promise<Tag> {
  // 检查标签是否已存在
  const existing = await pool.query('SELECT * FROM tags WHERE name = $1', [name]);
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await pool.query(
    'INSERT INTO tags (name) VALUES ($1) RETURNING *',
    [name]
  );
  
  return result.rows[0];
}

// 获取所有标签
export async function getAllTags(): Promise<Tag[]> {
  const result = await pool.query('SELECT * FROM tags ORDER BY name ASC');
  return result.rows;
}

// 获取标签及其文章数量
export async function getTagsWithCount(): Promise<TagWithCount[]> {
  const result = await pool.query(`
    SELECT t.*, COUNT(at.article_id) as article_count
    FROM tags t
    LEFT JOIN article_tags at ON t.id = at.tag_id
    LEFT JOIN articles a ON at.article_id = a.id AND a.published = true
    GROUP BY t.id, t.name, t.created_at
    ORDER BY t.name ASC
  `);
  
  return result.rows.map(row => ({
    ...row,
    article_count: parseInt(row.article_count)
  }));
}

// 根据名称获取标签
export async function getTagByName(name: string): Promise<Tag | null> {
  const result = await pool.query('SELECT * FROM tags WHERE name = $1', [name]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
}

// 获取文章的标签
export async function getArticleTags(articleId: string): Promise<Tag[]> {
  const result = await pool.query(`
    SELECT t.*
    FROM tags t
    JOIN article_tags at ON t.id = at.tag_id
    WHERE at.article_id = $1
    ORDER BY t.name ASC
  `, [articleId]);
  
  return result.rows;
}

// 设置文章标签
export async function setArticleTags(articleId: string, tagIds: string[]): Promise<void> {
  // 开始事务
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 删除现有的文章标签关联
    await client.query('DELETE FROM article_tags WHERE article_id = $1', [articleId]);

    // 添加新的标签关联
    for (const tagId of tagIds) {
      await client.query(
        'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2)',
        [articleId, tagId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 通过标签名称设置文章标签（自动创建不存在的标签）
export async function setArticleTagsByNames(articleId: string, tagNames: string[]): Promise<void> {
  const tagIds: string[] = [];
  
  // 为每个标签名称获取或创建标签
  for (const name of tagNames) {
    const tag = await createTag(name.trim());
    tagIds.push(tag.id);
  }
  
  await setArticleTags(articleId, tagIds);
}

// 根据标签获取文章
export async function getArticlesByTag(tagId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
  const result = await pool.query(`
    SELECT a.*, u.name as author_name, u.email as author_email
    FROM articles a
    JOIN users u ON a.user_id = u.id
    JOIN article_tags at ON a.id = at.article_id
    WHERE at.tag_id = $1 AND a.published = true
    ORDER BY a.created_at DESC
    LIMIT $2 OFFSET $3
  `, [tagId, limit, offset]);
  
  return result.rows;
}

// 删除标签（如果没有文章关联）
export async function deleteTag(tagId: string): Promise<void> {
  // 检查是否有文章使用此标签
  const usage = await pool.query('SELECT COUNT(*) FROM article_tags WHERE tag_id = $1', [tagId]);
  
  if (parseInt(usage.rows[0].count) > 0) {
    throw new Error('无法删除仍在使用的标签');
  }
  
  await pool.query('DELETE FROM tags WHERE id = $1', [tagId]);
}

// 搜索标签
export async function searchTags(query: string, limit: number = 10): Promise<Tag[]> {
  const result = await pool.query(
    'SELECT * FROM tags WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2',
    [`%${query}%`, limit]
  );
  
  return result.rows;
}