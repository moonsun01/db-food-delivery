const assert = require('node:assert/strict');
const createApp = require('../app');
const inject = require('./inject');
const PASSWORD = 'Example-password!';
const OPERATIONS_KEY = 'local-test-only-operations-key-00000000';
function client(config = {}) {
  const app = createApp({ config: { storageMode: 'memory', seedSample: false, operationsKey: OPERATIONS_KEY, ...config } });
  const seen = new Set();
  async function call(method, path, body, token, expected = 200, headers = {}) {
    const response = await inject(app, path, { method, body: body === undefined ? undefined : JSON.stringify(body),
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers } });
    const content = await response.text();
    const data = content ? JSON.parse(content) : null;
    if (Array.isArray(expected)) assert.ok(expected.includes(response.status), `${method} ${path}: ${response.status} ${content}`);
    else assert.equal(response.status, expected, `${method} ${path}: ${content}`);
    if (response.status < 300) {
      const cleanPath = path.split('?')[0];
      for (const definition of require('../docs/api-contract.json')) {
        const pattern = '^' + definition.url.replace(/\{[^}]+\}/g, '[1-9]\\d*') + '$';
        if (definition.method === method && new RegExp(pattern).test(cleanPath)) seen.add(`${method} ${definition.url}`);
      }
    }
    return data;
  }
  async function account(role, suffix = '') {
    const input = { role, name: `${role} 테스트`, email: `${role.toLowerCase()}${suffix}@example.test`, password: PASSWORD };
    if (role !== 'OWNER') input.phone = '010-0000-0000';
    const user = await call('POST', '/api/auth/register', input, undefined, 201);
    const login = await call('POST', '/api/auth/login', { role, email: input.email, password: PASSWORD });
    return { user, token: login.token, input };
  }
  return { app, call, account, seen };
}
async function fixture(config) {
  const c = client(config);
  c.customer = await c.account('CUSTOMER');
  c.owner = await c.account('OWNER');
  c.rider = await c.account('RIDER');
  c.address = await c.call('POST', '/api/addresses', { address: '서울시 성북구 예시로 1', detailAddress: '101호' }, c.customer.token, 201);
  c.restaurant = await c.call('POST', '/api/stores', { name: '테스트 중국집', address: '서울시 성북구 예시로 10' }, c.owner.token, 201);
  await c.call('PATCH', `/api/stores/${c.restaurant.id}`, { status: '영업중', deliveryFee: 3000 }, c.owner.token);
  c.menu = await c.call('POST', `/api/stores/${c.restaurant.id}/menus`, { name: '짜장면·탕수육 세트', price: 27000 }, c.owner.token, 201);
  c.orderInput = { storeId: c.restaurant.id, addressId: c.address.id, items: [{ menuId: c.menu.id, quantity: 1 }], payment: { method: '카드' } };
  return c;
}
module.exports = { client, fixture, PASSWORD, OPERATIONS_KEY };
