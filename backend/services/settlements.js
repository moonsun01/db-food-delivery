const v = require('../lib/validation');
const { ensure } = require('../lib/errors');
const { id, find } = require('../lib/domain');
const DAY = 86400000;
const KST = 9 * 3600000;
function weekBounds(startDate) {
  v.dateOnly(startDate);
  const midnight = Date.parse(startDate + 'T00:00:00Z');
  ensure(new Date(midnight).getUTCDay() === 1, 400, '정산시작일은 월요일 날짜로 입력해 주세요.');
  return { startDate, endDate: new Date(midnight + 6 * DAY).toISOString().slice(0, 10),
    from: midnight - KST, until: midnight + 7 * DAY - KST };
}
function previousWeek(clock = new Date()) {
  const korea = new Date(clock.getTime() + KST);
  const midnight = Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth(), korea.getUTCDate());
  const monday = midnight - ((korea.getUTCDay() + 6) % 7) * DAY;
  return new Date(monday - 7 * DAY).toISOString().slice(0, 10);
}
function detail(state, settlement) {
  return { ...settlement, items: state.settlementItems.filter((item) => item.settlementId === settlement.id) };
}
function generateWeek(state, startDate, clock = new Date()) {
  const week = weekBounds(startDate);
  ensure(week.until <= clock.getTime(), 409, '종료된 주의 정산만 생성할 수 있습니다.');
  const groups = new Map();
  for (const delivery of state.deliveries) {
    if (delivery.status !== '배달완료') continue;
    const completed = state.deliveryHistory.find((item) => item.deliveryId === delivery.id && item.status === '배달완료');
    const timestamp = completed && Date.parse(completed.changedAt);
    if (!Number.isFinite(timestamp) || timestamp < week.from || timestamp >= week.until) continue;
    const order = find(state.orders, delivery.orderId, '주문');
    if (!state.payments.some((payment) => payment.orderId === order.id && payment.status === '완료')) continue;
    for (const [payTarget, recipientId, payAmount] of [['음식점', order.storeId, order.totalAmount], ['라이더', delivery.riderId, order.deliveryFee]]) {
      const key = `${payTarget}:${recipientId}`;
      if (!groups.has(key)) groups.set(key, { payTarget, recipientId, items: [] });
      groups.get(key).items.push({ orderId: order.id, payAmount });
    }
  }
  const created = [];
  for (const group of groups.values()) {
    const storeId = group.payTarget === '음식점' ? group.recipientId : null;
    const riderId = group.payTarget === '라이더' ? group.recipientId : null;
    if (state.settlements.some((item) => item.startDate === startDate && item.storeId === storeId && item.riderId === riderId)) continue;
    for (const item of group.items) ensure(!state.settlementItems.some((existing) => existing.orderId === item.orderId && existing.payTarget === group.payTarget),
      409, '같은 주문의 같은 지급대상은 이미 정산되었습니다.');
    const settlement = { id: id(state, 'settlements'), storeId, riderId, startDate,
      endDate: week.endDate, amount: v.money(group.items.reduce((sum, item) => sum + item.payAmount, 0)), status: '생성완료' };
    state.settlements.push(settlement);
    state.settlementItems.push(...group.items.map((item) => ({ id: id(state, 'settlementItems'), settlementId: settlement.id,
      orderId: item.orderId, payTarget: group.payTarget, payAmount: item.payAmount })));
    created.push(detail(state, settlement));
  }
  return created;
}
function canRead(state, settlement, user) {
  if (user.role === 'RIDER') return settlement.riderId === user.id;
  return user.role === 'OWNER' && state.stores.some((restaurant) => restaurant.id === settlement.storeId && restaurant.ownerId === user.id);
}
function startScheduler(store) {
  let processedWeek;
  const run = async () => {
    const clock = new Date();
    if (new Date(clock.getTime() + KST).getUTCDay() !== 1) return;
    const week = previousWeek(clock);
    if (processedWeek === week) return;
    try {
      await store.transaction((state) => generateWeek(state, week, clock));
      processedWeek = week;
    } catch (error) { console.error('주간 정산 생성 실패:', error.message); }
  };
  run();
  const timer = setInterval(run, 60000);
  timer.unref();
  return () => clearInterval(timer);
}
module.exports = { weekBounds, previousWeek, generateWeek, detail, canRead, startScheduler };
