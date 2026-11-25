const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
module.exports = function configuration(overrides = {}) {
  const config = {
    dbHost: process.env.DB_HOST || '127.0.0.1',
    dbPort: Number(process.env.DB_PORT || 3306),
    dbUser: process.env.DB_USER || '',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || '',
    dbRuntimeName: process.env.DB_RUNTIME_NAME || ((process.env.DB_NAME || 'delivery_app') + '_runtime'),
    port: Number(process.env.PORT || 4000),
    dataFile: process.env.DATA_FILE || path.join(__dirname, '..', 'storage', 'api-v05.json'),
    storageMode: process.env.STORAGE_MODE || 'json',
    seedSample: process.env.SEED_SAMPLE_DATA !== 'false',
    mockPaymentResult: process.env.MOCK_PAYMENT_RESULT || 'success',
    operationsKey: process.env.OPERATIONS_API_KEY || '',
    paymentMode: process.env.PAYMENT_MODE || 'mock',
    sessionHours: Number(process.env.SESSION_HOURS || 8),
    corsOrigins: (process.env.FRONTEND_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean),
    ...overrides,
  };
  if (!Number.isInteger(config.port) || config.port < 0 || config.port > 65535) throw new Error('PORT 설정 오류');
  if (!['success', 'failure'].includes(config.mockPaymentResult)) throw new Error('MOCK_PAYMENT_RESULT는 success 또는 failure여야 합니다.');
  if (config.paymentMode !== 'mock') throw new Error('PAYMENT_MODE=mock만 지원합니다. 외부 결제 연동은 제공하지 않습니다.');
  if (!['memory', 'json', 'mysql'].includes(config.storageMode)) throw new Error('STORAGE_MODE는 memory, json 또는 mysql이어야 합니다.');
  if (!Number.isFinite(config.sessionHours) || config.sessionHours <= 0 || config.sessionHours > 168) throw new Error('SESSION_HOURS 설정 오류');
  return config;
};
