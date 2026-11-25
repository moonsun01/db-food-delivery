const express = require('express');
const v = require('../lib/validation');
const { ensure } = require('../lib/errors');
const { find, canReadOrder, newest } = require('../lib/domain');
module.exports = ({ store, auth }) => {
  const router = express.Router();
  router.get('/orders/:orderId/payments', auth.role('CUSTOMER', 'OWNER'), async (req, res) => res.json(await store.read((state) => {
    const order = find(state.orders, v.id(req.params.orderId), '주문');
    ensure(canReadOrder(state, order, req.user), 403, '결제를 조회할 권한이 없습니다.');
    return state.payments.filter((payment) => payment.orderId === order.id);
  })));
  router.get('/payments', auth.role('CUSTOMER', 'OWNER'), async (req, res) => res.json(await store.read((state) => state.payments.filter((payment) => {
    const order = state.orders.find((item) => item.id === payment.orderId);
    return order && canReadOrder(state, order, req.user);
  }).sort(newest))));
  router.get('/payments/:paymentId', auth.role('CUSTOMER', 'OWNER'), async (req, res) => res.json(await store.read((state) => {
    const payment = find(state.payments, v.id(req.params.paymentId), '결제');
    const order = find(state.orders, payment.orderId, '주문');
    ensure(canReadOrder(state, order, req.user), 403, '결제를 조회할 권한이 없습니다.');
    return payment;
  })));
  return router;
};
