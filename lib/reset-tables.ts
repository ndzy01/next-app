import pool from './db';

export async function resetTables() {
  try {
    console.log('Dropping users table...');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('Dropping trigger function...');
    await pool.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');

    console.log('Tables and functions dropped successfully');
    return { success: true };
  } catch (error) {
    console.error('Error dropping tables:', error);
    return { success: false, error: String(error) };
  }
}
