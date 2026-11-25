const createApp = require('./app');
async function start() {
  let app;
  try {
    app = createApp();
    await app.locals.store.ready;
    let stopScheduler = () => {};
    const server = app.listen(app.locals.config.port, '127.0.0.1', (error) => {
      if (error) { console.error('서버 시작 실패:', error.code); app.locals.store.close(); process.exitCode = 1; return; }
      stopScheduler = require('./services/settlements').startScheduler(app.locals.store);
      const base = `http://localhost:${server.address().port}`;
      console.log(`상태 확인: ${base}/api/health`);
      console.log(`음식점 목록: ${base}/api/stores`);
      console.log(`저장소: ${app.locals.config.storageMode}`);
    });
    let closing = false;
    const shutdown = () => {
      if (closing) return;
      closing = true;
      stopScheduler();
      server.close(async () => { await app.locals.store.close(); process.exit(0); });
      setTimeout(() => process.exit(1), 5000).unref();
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (error) {
    console.error('서버 설정 실패:', error.message);
    if (app) await app.locals.store.close();
    process.exitCode = 1;
  }
}
start();
