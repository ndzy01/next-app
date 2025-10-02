import { Pool } from '@neondatabase/serverless';

// 创建 Neon serverless 连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 连接池事件监听（可选）
pool.on('connect', () => {
  console.log('Connected to Neon PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('Neon PostgreSQL connection error:', err);
});

export default pool;
