const express = require('express');
const v = require('../lib/validation');
const { ensure } = require('../lib/errors');
const { now, find, ownsStore, canReadOrder, orderView, newest } = require('../lib/domain');
const { createOrder, ORDER_STATUSES } = require('../services/orders');
module.exports = ({ store, auth, config }) => {
  const router = express.Router();
  router.post('/', auth.role('CUSTOMER'), async (req, res) => {
    const input = v.body(req, ['storeId', 'addressId', 'items', 'payment']);
    const result = await store.transaction((state) => createOrder(state, input, req.user, req.get('Idempotency-Key'), config.mockPaymentResult));
    res.status(result.replay ? 200 : 201).json(result.value);
  });
  router.get('/', auth.required, async (req, res) => {
    const status = req.query.status === undefined ? undefined : v.choice(req.query.status, ORDER_STATUSES, 'status');
    res.json(await store.read((state) => state.orders.filter((order) => canReadOrder(state, order, req.user)
      && (!status || order.status === status)
      && (req.user.role !== 'OWNER' || state.payments.some((payment) => payment.orderId === order.id && ['완료', '취소완료'].includes(payment.status))))
      .sort(newest).map((order) => orderView(state, order))));
  });
  router.get('/:orderId', auth.required, async (req, res) => res.json(await store.read((state) => {
    const order = find(state.orders, v.id(req.params.orderId), '주문');
    ensure(canReadOrder(state, order, req.user), 403, '주문을 조회할 권한이 없습니다.');
    return orderView(state, order);
  })));
  router.patch('/:orderId/status', auth.role('OWNER'), async (req, res) => {
    const status = v.choice(v.body(req, ['status']).status, ['조리중', '조리완료', '거절'], 'status');
    res.json(await store.transaction((state) => {
      const order = find(state.orders, v.id(req.params.orderId), '주문');
      ownsStore(state, order.storeId, req.user);
      if (order.status === status) return orderView(state, order);
      const previous = { 조리중: '접수대기', 조리완료: '조리중', 거절: '접수대기' };
      ensure(order.status === previous[status], 409, '현재 주문상태에서 변경할 수 없습니다.');
      const payment = state.payments.find((item) => item.orderId === order.id);
      ensure(payment?.status === '완료', 409, '결제가 완료된 주문만 처리할 수 있습니다.');
      order.status = status;
      if (status === '거절') Object.assign(payment, { status: '취소완료', canceledAt: now() });
      return orderView(state, order);
    }));
  });
  return router;
};
