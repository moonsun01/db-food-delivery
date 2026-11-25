const { test } = require('node:test');
const assert = require('node:assert/strict');
const { client, fixture } = require('./helpers');
const { generateWeek, previousWeek, weekBounds } = require('../services/settlements');

test('ownership, limits, malformed requests, removed routes and role-scoped sessions', async () => {
  const c = await fixture();
  const stranger = await c.account('CUSTOMER', '-stranger');
  const otherOwner = await c.account('OWNER', '-stranger');
  await c.call('GET', '/api/me', undefined, undefined, 401);
  await c.call('PATCH', `/api/stores/${c.restaurant.id}`, { status: '영업종료' }, c.customer.token, 403);
  await c.call('GET', `/api/addresses/${c.address.id}`, undefined, stranger.token, 403);
  await c.call('PATCH', `/api/stores/${c.restaurant.id}`, { deliveryFee: -1 }, c.owner.token, 400);
  await c.call('PATCH', `/api/stores/${c.restaurant.id}`, { name: '남의 가게' }, otherOwner.token, 403);
  await c.call('GET', '/api/stores/S_1', undefined, undefined, 400);
  await c.call('GET', '/api/stores/1.5', undefined, undefined, 400);
  await c.call('GET', '/api/stores/999999', undefined, undefined, 404);
  await c.call('PATCH', '/api/me', {}, c.customer.token, 400);
  await c.call('PATCH', '/api/me', { phone: '010-0000-0000' }, c.owner.token, 400);
  await c.call('POST', '/api/addresses', { address: 'a'.repeat(201) }, c.customer.token, 400);
  await c.call('PATCH', `/api/stores/${c.restaurant.id}/menus/${c.menu.id}`, { price: 2147483648 }, c.owner.token, 400);
  const order = await c.call('POST', '/api/orders', c.orderInput, c.customer.token, 201);
  await c.call('GET', `/api/orders/${order.id}`, undefined, stranger.token, 403);
  await c.call('GET', `/api/payments/${order.payment.id}`, undefined, c.rider.token, 403);
  for (const path of [`/api/orders/${order.id}/cancel`, `/api/orders/${order.id}/payments`, `/api/payments/${order.payment.id}/cancel`]) {
    await c.call('POST', path, {}, c.customer.token, 404);
  }
  await c.call('GET', '/api/settlements', undefined, c.customer.token, 403);
  await c.call('GET', '/api/settlements?startDate=2026-11-17', undefined, c.owner.token, 400);
  await c.call('GET', '/api/settlements?startDate=2026-02-30', undefined, c.owner.token, 400);
  const rejected = await c.call('PATCH', `/api/orders/${order.id}/status`, { status: '거절' }, c.owner.token);
  assert.equal(rejected.payment.status, '취소완료');
  assert.ok(rejected.payment.canceledAt);
  assert.equal(rejected.payment.id, order.payment.id);
  await c.call('PATCH', `/api/orders/${order.id}/status`, { status: '조리중' }, c.owner.token, 409);
  assert.equal(c.app.locals.store.state.payments.length, 1);
  c.app.locals.store.transaction((state) => { state.sessions.find((row) => row.userId === c.owner.user.id && row.role === 'OWNER').expiresAt = '2000-01-01T00:00:00Z'; });
  await c.call('GET', '/api/me', undefined, c.owner.token, 401);
  assert.equal((await c.call('GET', '/api/me', undefined, c.customer.token)).role, 'CUSTOMER');
});

test('atomic order rollback, stored payment failure, integer overflow, snapshots and idempotency', async () => {
  const c = await fixture();
  const store = c.app.locals.store;
  const before = structuredClone(store.state);
  const persist = store.persist;
  store.persist = () => { throw new Error('test disk failure'); };
  await c.call('POST', '/api/orders', c.orderInput, c.customer.token, 500);
  assert.deepEqual(store.state, before);
  store.persist = persist;
  await c.call('POST', '/api/orders', { ...c.orderInput, payment: { method: 'BANK_TRANSFER' } }, c.customer.token, 400);
  await c.call('POST', '/api/orders', { ...c.orderInput, items: [{ menuId: c.menu.id, quantity: 2147483647 }] }, c.customer.token, 400);
  assert.deepEqual(store.state, before);
  c.app.locals.config.mockPaymentResult = 'failure';
  const failed = await c.call('POST', '/api/orders', c.orderInput, c.customer.token, 201, { 'Idempotency-Key': 'failure' });
  assert.equal(failed.status, '결제실패');
  assert.equal(failed.payment.status, '실패');
  assert.equal(store.state.orderItems.length, 1);
  await c.call('PATCH', `/api/orders/${failed.id}/status`, { status: '조리중' }, c.owner.token, 409);
  c.app.locals.config.mockPaymentResult = 'success';
  assert.equal((await c.call('POST', '/api/orders', c.orderInput, c.customer.token, 200, { 'Idempotency-Key': 'failure' })).status, '결제실패');
  const key = { 'Idempotency-Key': 'new-order' };
  const duplicateItems = { ...c.orderInput, items: [{ menuId: c.menu.id, quantity: 1 }, { menuId: c.menu.id, quantity: 1 }] };
  const [one, two] = await Promise.all([
    c.call('POST', '/api/orders', duplicateItems, c.customer.token, 201, key),
    c.call('POST', '/api/orders', { payment: { method: '카드' }, items: [{ quantity: 2, menuId: c.menu.id }], addressId: c.address.id, storeId: c.restaurant.id }, c.customer.token, 200, key),
  ]);
  assert.equal(one.id, two.id);
  assert.notEqual(one.id, failed.id);
  assert.notEqual(one.payment.id, failed.payment.id);
  assert.equal(one.items.length, 1);
  assert.equal(one.items[0].quantity, 2);
  await c.call('PATCH', `/api/stores/${c.restaurant.id}/menus/${c.menu.id}`, { price: 10000 }, c.owner.token);
  await c.call('PATCH', `/api/stores/${c.restaurant.id}`, { deliveryFee: 9000 }, c.owner.token);
  await c.call('PATCH', `/api/addresses/${c.address.id}`, { address: '변경된 주소' }, c.customer.token);
  const past = await c.call('GET', `/api/orders/${one.id}`, undefined, c.customer.token);
  assert.equal(past.items[0].unitPrice, 27000);
  assert.equal(past.deliveryFee, 3000);
  assert.equal(past.payment.amount, 57000);
  assert.equal(past.addressSnapshot, '서울시 성북구 예시로 1 101호');
  await c.call('PATCH', `/api/stores/${c.restaurant.id}`, { status: '영업종료' }, c.owner.token);
  await c.call('POST', '/api/orders', c.orderInput, c.customer.token, 409);
  assert.equal(store.state.orders.length, 2);
  assert.equal(store.state.payments.length, 2);
});

test('concurrent rider acceptance produces one delivery, one initial history and one busy rider', async () => {
  const c = await fixture();
  const other = await c.account('RIDER', '-second');
  const order = await c.call('POST', '/api/orders', c.orderInput, c.customer.token, 201);
  for (const status of ['조리중', '조리완료']) await c.call('PATCH', `/api/orders/${order.id}/status`, { status }, c.owner.token);
  for (const token of [c.rider.token, other.token]) await c.call('PATCH', '/api/riders/me/status', { status: '운행가능' }, token);
  const route = `/api/orders/${order.id}/delivery/accept`;
  await Promise.all([c.call('POST', route, {}, c.rider.token, 201), c.call('POST', route, {}, other.token, 409)]);
  const state = c.app.locals.store.state;
  assert.equal(state.deliveries.length, 1);
  assert.equal(state.deliveryHistory.length, 1);
  assert.equal(state.users.filter((row) => row.role === 'RIDER' && row.status === '배달중').length, 1);
  const delivery = state.deliveries[0];
  await c.call('PATCH', `/api/deliveries/${delivery.id}/status`, { status: '픽업완료' }, other.token, 403);
  await c.call('POST', `/api/deliveries/${delivery.id}/unassign`, {}, c.rider.token, 404);
});

test('weekly settlements: two orders, three recipients, four details; Korean midnight boundary; no repeated shares', () => {
  const c = client();
  const state = c.app.locals.store.state;
  const clock = new Date('2026-11-23T00:00:00+09:00');
  assert.equal(previousWeek(clock), '2026-11-16');
  assert.equal(previousWeek(new Date('2026-11-15T23:59:59+09:00')), '2026-11-02');
  state.orders.push({ id: 100, storeId: 10, totalAmount: 27000, deliveryFee: 3000 },
    { id: 101, storeId: 10, totalAmount: 20000, deliveryFee: 3000 },
    { id: 102, storeId: 10, totalAmount: 5000, deliveryFee: 0 },
    { id: 103, storeId: 10, totalAmount: 9999, deliveryFee: 1000 });
  for (const order of state.orders) {
    state.payments.push({ id: order.id, orderId: order.id, status: order.id === 103 ? '취소완료' : '완료' });
    state.deliveries.push({ id: order.id, orderId: order.id, riderId: order.id === 100 ? 7 : 8, status: '배달완료' });
    state.deliveryHistory.push({ id: order.id, deliveryId: order.id, status: '배달완료',
      changedAt: order.id === 102 ? '2026-11-16T00:00:00+09:00' : '2026-11-15T23:59:59+09:00' });
  }
  const generated = c.app.locals.store.transaction((draft) => generateWeek(draft, '2026-11-09', clock));
  assert.equal(generated.length, 3);
  assert.equal(c.app.locals.store.state.settlementItems.length, 4);
  assert.equal(generated.find((item) => item.storeId === 10).amount, 47000);
  assert.equal(generated.find((item) => item.riderId === 7).amount, 3000);
  assert.equal(generated.find((item) => item.riderId === 8).amount, 3000);
  assert.ok(generated.every((item) => (item.storeId === null) !== (item.riderId === null)));
  assert.deepEqual(c.app.locals.store.transaction((draft) => generateWeek(draft, '2026-11-09', clock)), []);
  const next = c.app.locals.store.transaction((draft) => generateWeek(draft, '2026-11-16', clock));
  assert.deepEqual(next.map((item) => item.amount).sort((a,b) => a-b), [0, 5000]);
  const before = structuredClone(c.app.locals.store.state);
  assert.throws(() => c.app.locals.store.transaction((draft) => generateWeek(draft, '2026-11-23', clock)), /종료된 주/);
  assert.deepEqual(c.app.locals.store.state, before);
  assert.throws(() => weekBounds('2026-11-17'), /월요일/);
  assert.throws(() => weekBounds('2026-02-30'), /유효/);
});

test('simultaneous duplicate signup allows one account; public API CORS preflight and validation', async () => {
  const c = client({ corsOrigins: ['http://localhost:5173'] });
  const input = { role: 'CUSTOMER', name: '테스트', email: 'same@example.test', phone: '010-0000-0000', password: 'Example-password!' };
  await Promise.all([c.call('POST', '/api/auth/register', input, undefined, [201, 409]), c.call('POST', '/api/auth/register', input, undefined, [201, 409])]);
  assert.equal(c.app.locals.store.state.users.length, 1);
  const inject = require('./inject');
  const preflight = await inject(c.app, '/api/orders', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const denied = await inject(c.app, '/api/orders', { method: 'OPTIONS', headers: { Origin: 'https://unlisted.example.test' } });
  assert.equal(denied.status, 403);
  const malformed = await inject(c.app, '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' });
  assert.equal(malformed.status, 400);
  assert.deepEqual(Object.keys(await malformed.json()), ['message']);
});
