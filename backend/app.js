const express = require('express');
const configuration = require('./lib/config');
const Storage = require('./lib/storage');
const authentication = require('./lib/auth');
const { ApiError, ensure } = require('./lib/errors');

function createApp(options = {}) {
  const config = configuration(options.config);
  const store = options.store || (config.storageMode === 'mysql' ? new (require('./lib/mysql-storage'))(config) : new Storage(config));
  const auth = authentication(store, config);
  const context = { config, store, auth };
  const app = express();
  app.disable('x-powered-by');
  app.locals.store = store;
  app.locals.config = config;
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store');
    const origin = req.get('Origin');
    if (origin) {
      res.vary('Origin');
      if (config.corsOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,Idempotency-Key');
        res.set('Access-Control-Expose-Headers', 'Location');
      }
      if (req.method === 'OPTIONS') {
        ensure(config.corsOrigins.includes(origin), 403, '허용되지 않은 프론트엔드 주소입니다.');
        return res.status(204).end();
      }
    }
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.get(['/', '/api/health'], (req, res) => res.json({ status: 'ok' }));
  for (const name of ['accounts', 'stores', 'payments', 'deliveries']) {
    app.use('/api', require(`./routes/${name}`)(context));
  }
  app.use('/api/addresses', require('./routes/addresses')(context));
  app.use('/api/orders', require('./routes/orders')(context));
  app.use('/api/settlements', require('./routes/settlements')(context));
  app.use('/internal', require('./routes/operations')(context));
  app.use((req, res) => res.status(404).json({ message: '요청한 API를 찾을 수 없습니다.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: '요청 본문을 올바른 JSON으로 보내주세요.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: '요청 본문 크기는 100KB 이하여야 합니다.' });
    if (error instanceof ApiError) return res.status(error.status).json({ message: error.message });
    console.error('요청 처리 실패:', error.message);
    res.status(500).json({ message: '서버에서 요청을 처리하지 못했습니다.' });
  });
  return app;
}

module.exports = createApp;
