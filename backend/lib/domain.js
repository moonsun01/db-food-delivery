const { ensure } = require('./errors');
const v = require('./validation');
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
function id(state, collection) {
  const next = v.integer((state.counters[collection] || 0) + 1, 'ID', 1);
  state.counters[collection] = next;
  return next;
}
function find(records, recordId, name) {
  const record = records.find((item) => item.id === recordId);
  ensure(record, 404, `${name}을 찾을 수 없습니다.`);
  return record;
}
function userRecord(state, role, userId) {
  const user = state.users.find((item) => item.role === role && item.id === userId);
  ensure(user, 404, '계정을 찾을 수 없습니다.');
  return user;
}
function ownsStore(state, storeId, user) {
  const restaurant = find(state.stores, storeId, '음식점');
  ensure(user.role === 'OWNER' && restaurant.ownerId === user.id, 403, '본인 음식점만 관리할 수 있습니다.');
  return restaurant;
}
function canReadOrder(state, order, user) {
  const restaurant = state.stores.find((item) => item.id === order.storeId);
  const delivery = state.deliveries.find((item) => item.orderId === order.id);
  return (user.role === 'CUSTOMER' && order.customerId === user.id)
    || (user.role === 'OWNER' && restaurant?.ownerId === user.id)
    || (user.role === 'RIDER' && delivery?.riderId === user.id);
}
function publicUser(user) {
  const safe = { id: user.id, role: user.role, name: user.name, email: user.email };
  if (user.role !== 'OWNER') safe.phone = user.phone;
  if (user.role === 'RIDER') safe.status = user.status;
  return safe;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function idempotent(state, user, operation, key, payload, create) {
  if (key === undefined) return { value: create(), replay: false };
  v.text(key, 'Idempotency-Key', 200);
  const fingerprint = JSON.stringify(canonical(payload));
  const account = `${user.role}:${user.id}`;
  const previous = state.idempotency.find((item) => item.account === account && item.operation === operation && item.key === key);
  if (previous) {
    ensure(previous.fingerprint === fingerprint, 409, '같은 Idempotency-Key로 다른 요청을 보낼 수 없습니다.');
    return { value: previous.response, replay: true };
  }
  const value = create();
  state.idempotency.push({ account, operation, key, fingerprint, response: structuredClone(value) });
  return { value, replay: false };
}
function deliveryView(state, delivery) {
  const order = find(state.orders, delivery.orderId, '주문');
  const restaurant = find(state.stores, order.storeId, '음식점');
  const completed = state.deliveryHistory.find((item) => item.deliveryId === delivery.id && item.status === '배달완료');
  return { ...delivery, pickupAddress: restaurant.address, addressSnapshot: order.addressSnapshot,
    deliveryFee: order.deliveryFee, completedAt: completed?.changedAt || null };
}
function orderView(state, order) {
  const payment = state.payments.find((item) => item.orderId === order.id);
  ensure(payment, 500, '주문의 결제 정보를 찾을 수 없습니다.');
  const delivery = state.deliveries.find((item) => item.orderId === order.id);
  return { ...order, items: state.orderItems.filter((item) => item.orderId === order.id).map((item) => ({
    ...item, menuName: find(state.menus, item.menuId, '메뉴').name, lineTotal: item.quantity * item.unitPrice,
  })), payment, delivery: delivery ? deliveryView(state, delivery) : null };
}
const newest = (a, b) => b.id - a.id;
module.exports = { id, now, find, userRecord, ownsStore, canReadOrder, publicUser, idempotent, orderView, deliveryView, newest };
