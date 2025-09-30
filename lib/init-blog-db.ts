import pool from './db';

export async function initBlogDatabase() {
  try {
    console.log('Initializing blog database tables...');

    // 创建文章表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        excerpt VARCHAR(1000),
        published BOOLEAN DEFAULT false,
        search_vector tsvector,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建标签表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建文章标签关联表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS article_tags (
        article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
        tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (article_id, tag_id)
      )
    `);

    // 为文章表创建更新时间触发器
    await pool.query(`
      DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
      CREATE TRIGGER update_articles_updated_at
        BEFORE UPDATE ON articles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // 创建搜索向量更新函数
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_article_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector = to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, '') || ' ' || coalesce(NEW.excerpt, ''));
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // 为文章表创建搜索向量更新触发器
    await pool.query(`
      DROP TRIGGER IF EXISTS update_articles_search_vector ON articles;
      CREATE TRIGGER update_articles_search_vector
        BEFORE INSERT OR UPDATE ON articles
        FOR EACH ROW
        EXECUTE FUNCTION update_article_search_vector();
    `);

    // 创建索引
    await pool.query(`
      CREATE INDEX IF NOT EXISTS articles_search_idx ON articles USING GIN(search_vector);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS articles_user_id_idx ON articles(user_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS articles_published_idx ON articles(published);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS articles_created_at_idx ON articles(created_at DESC);
    `);

    console.log('Blog database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing blog database:', error);
    throw error;
  }
}