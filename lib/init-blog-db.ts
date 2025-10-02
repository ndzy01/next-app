import pool from './db';

let isInitialized = false;

export function resetBlogDbInitFlag() {
  isInitialized = false;
}

export async function initBlogDatabase() {
  if (isInitialized) {
    console.log('Blog database already initialized, skipping...');
    return;
  }

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



    // 创建基础索引（简化版）
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
    isInitialized = true;
  } catch (error) {
    console.error('Error initializing blog database:', error);
    throw error;
  }
}
