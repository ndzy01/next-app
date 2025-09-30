import pool from './db';

export interface Article {
  id: string;
  user_id: string;
  title: string;
  content: string;
  excerpt?: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ArticleWithAuthor extends Article {
  author_name: string;
  author_email: string;
}

export interface CreateArticleData {
  user_id: string;
  title: string;
  content: string;
  excerpt?: string;
  published?: boolean;
}

export interface UpdateArticleData {
  title?: string;
  content?: string;
  excerpt?: string;
  published?: boolean;
}

export interface SearchResult extends ArticleWithAuthor {
  rank: number;
  highlight?: string;
}

// 创建文章
export async function createArticle(articleData: CreateArticleData): Promise<Article> {
  const { user_id, title, content, excerpt, published = false } = articleData;
  
  const result = await pool.query(
    `INSERT INTO articles (user_id, title, content, excerpt, published) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, user_id, title, content, excerpt, published, created_at, updated_at`,
    [user_id, title, content, excerpt, published]
  );
  
  return result.rows[0];
}

// 根据ID获取文章（包含作者信息）
export async function getArticleById(id: string): Promise<ArticleWithAuthor | null> {
  const result = await pool.query(
    `SELECT a.*, u.name as author_name, u.email as author_email
     FROM articles a
     JOIN users u ON a.user_id = u.id
     WHERE a.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

// 根据ID获取文章（带权限检查）
export async function getArticleByIdWithPermission(id: string, userId?: string): Promise<ArticleWithAuthor | null> {
  const result = await pool.query(
    `SELECT a.*, u.name as author_name, u.email as author_email
     FROM articles a
     JOIN users u ON a.user_id = u.id
     WHERE a.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }

  const article = result.rows[0];
  
  // 如果文章未发布，只有作者可以访问
  if (!article.published && (!userId || article.user_id !== userId)) {
    return null;
  }
  
  return article;
}

// 更新文章
export async function updateArticle(id: string, userId: string, updates: UpdateArticleData): Promise<Article> {
  // 验证文章归属
  const ownership = await pool.query('SELECT user_id FROM articles WHERE id = $1', [id]);
  if (ownership.rows.length === 0) {
    throw new Error('文章不存在');
  }
  if (ownership.rows[0].user_id !== userId) {
    throw new Error('没有权限编辑此文章');
  }

  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    fields.push(`content = $${paramCount++}`);
    values.push(updates.content);
  }
  if (updates.excerpt !== undefined) {
    fields.push(`excerpt = $${paramCount++}`);
    values.push(updates.excerpt);
  }
  if (updates.published !== undefined) {
    fields.push(`published = $${paramCount++}`);
    values.push(updates.published);
  }

  if (fields.length === 0) {
    throw new Error('没有要更新的字段');
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE articles SET ${fields.join(', ')} 
     WHERE id = $${paramCount}
     RETURNING id, user_id, title, content, excerpt, published, created_at, updated_at`,
    values
  );

  return result.rows[0];
}

// 删除文章
export async function deleteArticle(id: string, userId: string): Promise<void> {
  // 验证文章归属
  const ownership = await pool.query('SELECT user_id FROM articles WHERE id = $1', [id]);
  if (ownership.rows.length === 0) {
    throw new Error('文章不存在');
  }
  if (ownership.rows[0].user_id !== userId) {
    throw new Error('没有权限删除此文章');
  }

  await pool.query('DELETE FROM articles WHERE id = $1', [id]);
}

// 获取用户文章
export async function getUserArticles(userId: string, published?: boolean): Promise<Article[]> {
  let query = 'SELECT * FROM articles WHERE user_id = $1';
  const params: (string | boolean)[] = [userId];

  if (published !== undefined) {
    query += ' AND published = $2';
    params.push(published);
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

// 获取公开文章列表（分页）
export async function getPublishedArticles(limit: number = 20, offset: number = 0): Promise<ArticleWithAuthor[]> {
  const result = await pool.query(
    `SELECT a.*, u.name as author_name, u.email as author_email
     FROM articles a
     JOIN users u ON a.user_id = u.id
     WHERE a.published = true
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
}

// 全文搜索文章
export async function searchArticles(query: string, limit: number = 10): Promise<SearchResult[]> {
  const result = await pool.query(
    `SELECT a.*, u.name as author_name, u.email as author_email,
            ts_rank(a.search_vector, plainto_tsquery('english', $1)) as rank,
            ts_headline('english', a.content, plainto_tsquery('english', $1), 'MaxWords=20, MinWords=5') as highlight
     FROM articles a
     JOIN users u ON a.user_id = u.id
     WHERE a.published = true 
       AND a.search_vector @@ plainto_tsquery('english', $1)
     ORDER BY rank DESC, a.created_at DESC
     LIMIT $2`,
    [query, limit]
  );

  return result.rows;
}

// 搜索用户自己的文章
export async function searchUserArticles(userId: string, query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    console.log('🔍 Searching articles for userId:', userId, 'query:', query);
    
    // 检查用户是否有文章
    const userArticlesCheck = await pool.query(
      'SELECT COUNT(*) as count FROM articles WHERE user_id = $1',
      [userId]
    );
    console.log('📊 User has', userArticlesCheck.rows[0].count, 'articles total');
    
    // 如果用户没有文章，直接返回空结果
    if (userArticlesCheck.rows[0].count === '0') {
      console.log('❌ No articles found for user');
      return [];
    }
    
    // 检查搜索向量字段
    const vectorCheck = await pool.query(
      'SELECT COUNT(*) as count FROM articles WHERE user_id = $1 AND search_vector IS NOT NULL',
      [userId]
    );
    console.log('📈 Articles with search_vector:', vectorCheck.rows[0].count);
    
    let result;
    
    // 如果有搜索向量，尝试全文搜索
    if (vectorCheck.rows[0].count > 0) {
      console.log('🎯 Trying full-text search...');
      result = await pool.query(
        `SELECT a.*, u.name as author_name, u.email as author_email,
                ts_rank(a.search_vector, plainto_tsquery('english', $1)) as rank,
                ts_headline('english', a.content, plainto_tsquery('english', $1), 'MaxWords=20, MinWords=5') as highlight
         FROM articles a
         JOIN users u ON a.user_id = u.id
         WHERE a.user_id = $3
           AND a.search_vector IS NOT NULL
           AND a.search_vector @@ plainto_tsquery('english', $1)
         ORDER BY rank DESC, a.created_at DESC
         LIMIT $2`,
        [query, limit, userId]
      );
      console.log('✅ Full-text search results:', result.rows.length);
    }

    // 如果全文搜索没有结果或不可用，尝试简单的LIKE搜索
    if (!result || result.rows.length === 0) {
      console.log('🔄 Falling back to LIKE search...');
      result = await pool.query(
        `SELECT a.*, u.name as author_name, u.email as author_email,
                1 as rank,
                CASE 
                  WHEN a.title ILIKE $1 THEN a.title
                  WHEN a.excerpt ILIKE $1 THEN a.excerpt
                  ELSE substring(a.content, 1, 100)
                END as highlight
         FROM articles a
         JOIN users u ON a.user_id = u.id
         WHERE a.user_id = $3
           AND (a.title ILIKE $1 OR a.content ILIKE $1 OR a.excerpt ILIKE $1)
         ORDER BY a.created_at DESC
         LIMIT $2`,
        [`%${query}%`, limit, userId]
      );
      console.log('✅ LIKE search results:', result.rows.length);
    }

    return result.rows || [];
  } catch (error) {
    console.error('❌ Search error:', error);
    throw error;
  }
}

// 获取文章总数
export async function getArticlesCount(published?: boolean): Promise<number> {
  let query = 'SELECT COUNT(*) FROM articles';
  const params: boolean[] = [];

  if (published !== undefined) {
    query += ' WHERE published = $1';
    params.push(published);
  }

  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count);
}