import pool from './db';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// 创建新用户
export async function createUser(userData: CreateUserData): Promise<User> {
  const { email, password, name } = userData;
  
  // 检查用户是否已存在
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  
  if (existingUser.rows.length > 0) {
    throw new Error('用户已存在');
  }
  
  // 加密密码
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  // 插入新用户
  const result = await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at, updated_at',
    [email, hashedPassword, name]
  );
  
  return result.rows[0];
}

// 验证用户登录
export async function validateUser(loginData: LoginData): Promise<User | null> {
  const { email, password } = loginData;
  
  // 查找用户
  const result = await pool.query(
    'SELECT id, email, password, name, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  
  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    return null;
  }
  
  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// 根据ID获取用户
export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

// 根据邮箱获取用户
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, email, name, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}
