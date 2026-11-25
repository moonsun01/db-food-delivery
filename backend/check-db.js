async function checkDatabase() {
  let pool;

  try {
    pool = require('./db');
    await pool.query('SELECT 1');
    console.log('MySQL 연결 성공');
  } catch (error) {
    console.error('MySQL 연결 실패:', error.code || error.message);
    process.exitCode = 1;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

checkDatabase();
