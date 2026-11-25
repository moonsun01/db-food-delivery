const v = require('../lib/validation');
const { ensure } = require('../lib/errors');
const { id, now, find, idempotent, orderView } = require('../lib/domain');
const ORDER_STATUSES = ['결제실패', '접수대기', '조리중', '조리완료', '거절'];
function orderInput(input) {
  const storeId = v.integer(input.storeId, 'storeId', 1);
  const addressId = v.integer(input.addressId, 'addressId', 1);
  ensure(Array.isArray(input.items) && input.items.length > 0, 400, 'items에 주문할 메뉴를 입력하세요.');
  const quantities = new Map();
  for (const item of input.items) {
    ensure(item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).every((key) => ['menuId', 'quantity'].includes(key)), 400, '주문 메뉴 형식이 올바르지 않습니다.');
    const menuId = v.integer(item.menuId, 'menuId', 1);
    const quantity = v.integer(item.quantity, 'quantity', 1);
    quantities.set(menuId, v.integer((quantities.get(menuId) || 0) + quantity, 'quantity', 1));
  }
  ensure(input.payment && typeof input.payment === 'object' && !Array.isArray(input.payment)
    && Object.keys(input.payment).every((key) => key === 'method'), 400, 'payment에 결제수단을 입력하세요.');
  const method = v.choice(input.payment.method, ['카드', '간편결제'], 'payment.method');
  return { storeId, addressId, items: [...quantities].map(([menuId, quantity]) => ({ menuId, quantity })).sort((a, b) => a.menuId - b.menuId), payment: { method } };
}
function createOrder(state, input, user, key, paymentResult) {
  const payload = orderInput(input);
  return idempotent(state, user, 'orders:create', key, payload, () => {
    const restaurant = find(state.stores, payload.storeId, '음식점');
    ensure(restaurant.status === '영업중', 409, '주문할 수 없는 상태입니다.');
    const address = find(state.addresses, payload.addressId, '배송지');
    ensure(address.customerId === user.id, 403, '본인의 배송지만 사용할 수 있습니다.');
    const orderId = id(state, 'orders');
    const items = payload.items.map(({ menuId, quantity }) => {
      const menu = find(state.menus, menuId, '메뉴');
      ensure(menu.storeId === restaurant.id, 400, '선택한 음식점의 메뉴만 주문할 수 있습니다.');
      v.money(menu.price * quantity);
      return { id: id(state, 'orderItems'), orderId, menuId, quantity, unitPrice: menu.price };
    });
    const totalAmount = v.money(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
    const amount = v.money(totalAmount + restaurant.deliveryFee);
    const failed = paymentResult === 'failure';
    const order = { id: orderId, customerId: user.id, storeId: restaurant.id, addressId: address.id,
      addressSnapshot: [address.address, address.detailAddress].filter(Boolean).join(' '),
      status: failed ? '결제실패' : '접수대기', createdAt: now(), totalAmount, deliveryFee: restaurant.deliveryFee };
    ensure([...order.addressSnapshot].length <= 300, 400, '주문시주소는 300자 이하여야 합니다.');
    state.orders.push(order);
    state.orderItems.push(...items);
    state.payments.push({ id: id(state, 'payments'), orderId, method: payload.payment.method,
      amount, status: failed ? '실패' : '완료', canceledAt: null });
    return orderView(state, order);
  });
}
module.exports = { createOrder, ORDER_STATUSES };
