import pool from './db';
import { resetBlogDbInitFlag } from './init-blog-db';

export async function resetTables() {
  try {
    console.log('Dropping blog-related tables...');
    await pool.query('DROP TABLE IF EXISTS article_tags CASCADE');
    await pool.query('DROP TABLE IF EXISTS tags CASCADE');
    await pool.query('DROP TABLE IF EXISTS articles CASCADE');

    console.log('Dropping users table...');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('Dropping trigger function...');
    await pool.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');

    console.log('All tables and functions dropped successfully');
    
    // 重置博客数据库初始化标志
    resetBlogDbInitFlag();
    
    return { success: true };
  } catch (error) {
    console.error('Error dropping tables:', error);
    return { success: false, error: String(error) };
  }
}
