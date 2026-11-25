const { randomBytes } = require('node:crypto');
async function runDemo(baseUrl = process.env.BASE_URL || `http://localhost:${require('../lib/config')().port}`) {
  const base = new URL(baseUrl);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) || !['http:', 'https:'].includes(base.protocol)
    || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('데모는 localhost 또는 127.0.0.1의 로컬 서버에서만 실행합니다.');
  }
  async function request(method, path, body, token, headers = {}) {
    const response = await fetch(new URL(path, base), { method, redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${data.message}`);
    return data;
  }
  const suffix = randomBytes(6).toString('hex');
  async function account(role) {
    const input = { role, email: `demo-${role.toLowerCase()}-${suffix}@example.test`, name: `시연 ${role}`, password: randomBytes(18).toString('base64url') };
    if (role !== 'OWNER') input.phone = '010-0000-0000';
    await request('POST', '/api/auth/register', input);
    return request('POST', '/api/auth/login', { role, email: input.email, password: input.password });
  }
  await request('GET', '/api/health');
  const customer = await account('CUSTOMER');
  const owner = await account('OWNER');
  const rider = await account('RIDER');
  const restaurant = await request('POST', '/api/stores', { name: '시연 중국집', address: '서울시 성북구 예시로 10', status: '영업중', deliveryFee: 3000 }, owner.token);
  const menu = await request('POST', `/api/stores/${restaurant.id}/menus`, { name: '짜장면·탕수육 세트', price: 27000 }, owner.token);
  const address = await request('POST', '/api/addresses', { address: '서울시 성북구 예시로 1', detailAddress: '101호' }, customer.token);
  const payload = { storeId: restaurant.id, addressId: address.id, items: [{ menuId: menu.id, quantity: 1 }], payment: { method: '카드' } };
  const key = `demo-${suffix}`;
  const order = await request('POST', '/api/orders', payload, customer.token, { 'Idempotency-Key': key });
  if (order.status === '결제실패') throw new Error('개발용 결제 실패 모드입니다. MOCK_PAYMENT_RESULT=success로 실행하세요.');
  for (const status of ['조리중', '조리완료']) await request('PATCH', `/api/orders/${order.id}/status`, { status }, owner.token);
  await request('PATCH', '/api/riders/me/status', { status: '운행가능' }, rider.token);
  const delivery = await request('POST', `/api/orders/${order.id}/delivery/accept`, {}, rider.token);
  for (const status of ['픽업완료', '배달중', '배달완료']) await request('PATCH', `/api/deliveries/${delivery.id}/status`, { status }, rider.token);
  const finalOrder = await request('GET', `/api/orders/${order.id}`, undefined, customer.token);
  const history = await request('GET', `/api/deliveries/${delivery.id}/history`, undefined, rider.token);
  const summary = { mode: 'mock', orderId: finalOrder.id, orderStatus: finalOrder.status,
    paymentStatus: finalOrder.payment.status, deliveryStatus: finalOrder.delivery.status,
    orderAmount: finalOrder.totalAmount, deliveryFee: finalOrder.deliveryFee, paymentAmount: finalOrder.payment.amount,
    storeShare: finalOrder.totalAmount, riderShare: finalOrder.deliveryFee,
    history: history.map((item) => item.status) };
  // 다음 정산일은 배달완료가 속한 주의 다음 월요일이다.
  const completed = new Date(Date.parse(finalOrder.delivery.completedAt) + 9 * 3600000);
  const daysUntilMonday = 7 - ((completed.getUTCDay() + 6) % 7);
  summary.nextSettlementDate = new Date(Date.UTC(completed.getUTCFullYear(), completed.getUTCMonth(), completed.getUTCDate() + daysUntilMonday)).toISOString().slice(0, 10);
  return { summary, customerToken: customer.token, payload, key };
}
module.exports = runDemo;
if (require.main === module) runDemo().then(({ summary }) => console.log(JSON.stringify(summary, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
