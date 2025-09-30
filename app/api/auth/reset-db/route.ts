import { NextResponse } from 'next/server';
import { resetTables } from '@/lib/reset-tables';
import { initDatabase } from '@/lib/init-db';

export async function POST() {
  try {
    // 重置表
    const resetResult = await resetTables();
    if (!resetResult.success) {
      return NextResponse.json({ 
        error: 'Failed to reset tables', 
        details: resetResult.error 
      }, { status: 500 });
    }

    // 重新初始化数据库
    await initDatabase();

    return NextResponse.json({ 
      message: 'Database reset and reinitialized successfully with UUID support' 
    });
  } catch (error) {
    console.error('Reset database error:', error);
    return NextResponse.json({ 
      error: 'Database reset failed', 
      details: String(error) 
    }, { status: 500 });
  }
}
