import jwt from 'jsonwebtoken';
import { User } from './user';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

// 生成JWT令牌
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // 7天过期
  });
}

// 验证JWT令牌
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JWTPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}
