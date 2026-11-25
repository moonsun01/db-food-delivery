const express = require('express');
const v = require('../lib/validation');
const { ensure } = require('../lib/errors');
const { id, now, find, userRecord, canReadOrder, deliveryView, publicUser, newest } = require('../lib/domain');
const deliveryStatuses = ['배정완료', '픽업완료', '배달중', '배달완료'];
module.exports = ({ store, auth }) => {
  const router = express.Router();
  function readable(state, deliveryId, user) {
    const delivery = find(state.deliveries, deliveryId, '배달');
    const order = find(state.orders, delivery.orderId, '주문');
    ensure(canReadOrder(state, order, user), 403, '배달을 조회할 권한이 없습니다.');
    return delivery;
  }
  router.patch('/riders/me/status', auth.role('RIDER'), async (req, res) => {
    const status = v.choice(v.body(req, ['status']).status, ['운행가능', '운행종료'], 'status');
    res.json(await store.transaction((state) => {
      const rider = userRecord(state, 'RIDER', req.user.id);
      ensure(!state.deliveries.some((item) => item.riderId === rider.id && item.status !== '배달완료'), 409, '배달 중에는 운행상태를 변경할 수 없습니다.');
      rider.status = status;
      return publicUser(rider);
    }));
  });
  router.get('/deliveries/available', auth.role('RIDER'), async (req, res) => res.json(await store.read((state) => state.orders
    .filter((order) => order.status === '조리완료' && !state.deliveries.some((delivery) => delivery.orderId === order.id))
    .sort((a, b) => a.id - b.id).map((order) => {
      const restaurant = find(state.stores, order.storeId, '음식점');
      return { orderId: order.id, storeId: restaurant.id, storeName: restaurant.name, pickupAddress: restaurant.address, deliveryFee: order.deliveryFee };
    }))));
  router.post('/orders/:orderId/delivery/accept', auth.role('RIDER'), async (req, res) => {
    v.body(req, []);
    const result = await store.transaction((state) => {
      const order = find(state.orders, v.id(req.params.orderId), '주문');
      const existing = state.deliveries.find((item) => item.orderId === order.id);
      if (existing) {
        ensure(existing.riderId === req.user.id, 409, '현재 이 주문을 수락할 수 없습니다.');
        return { delivery: deliveryView(state, existing), replay: true };
      }
      const rider = userRecord(state, 'RIDER', req.user.id);
      ensure(order.status === '조리완료' && rider.status === '운행가능'
        && state.payments.some((item) => item.orderId === order.id && item.status === '완료')
        && !state.deliveries.some((item) => item.riderId === rider.id && item.status !== '배달완료'), 409, '현재 이 주문을 수락할 수 없습니다.');
      const delivery = { id: id(state, 'deliveries'), orderId: order.id, riderId: rider.id, status: '배정완료' };
      state.deliveries.push(delivery);
      state.deliveryHistory.push({ id: id(state, 'deliveryHistory'), deliveryId: delivery.id, status: '배정완료', changedAt: now() });
      rider.status = '배달중';
      return { delivery: deliveryView(state, delivery), replay: false };
    });
    res.status(result.replay ? 200 : 201).json(result.delivery);
  });
  router.get('/orders/:orderId/delivery', auth.required, async (req, res) => res.json(await store.read((state) => {
    const order = find(state.orders, v.id(req.params.orderId), '주문');
    ensure(canReadOrder(state, order, req.user), 403, '배달을 조회할 권한이 없습니다.');
    const delivery = state.deliveries.find((item) => item.orderId === order.id);
    ensure(delivery, 404, '배달 정보가 아직 없거나 주문을 찾을 수 없습니다.');
    return deliveryView(state, delivery);
  })));
  router.get('/deliveries', auth.required, async (req, res) => res.json(await store.read((state) => state.deliveries.filter((delivery) =>
    canReadOrder(state, find(state.orders, delivery.orderId, '주문'), req.user)).sort(newest).map((delivery) => deliveryView(state, delivery)))));
  router.get('/deliveries/:deliveryId', auth.required, async (req, res) => res.json(await store.read((state) => deliveryView(state, readable(state, v.id(req.params.deliveryId), req.user)))));
  router.get('/deliveries/:deliveryId/history', auth.required, async (req, res) => res.json(await store.read((state) => {
    const delivery = readable(state, v.id(req.params.deliveryId), req.user);
    return state.deliveryHistory.filter((item) => item.deliveryId === delivery.id).sort((a, b) => a.changedAt.localeCompare(b.changedAt) || a.id - b.id);
  })));
  router.patch('/deliveries/:deliveryId/status', auth.role('RIDER'), async (req, res) => {
    const status = v.choice(v.body(req, ['status']).status, deliveryStatuses.slice(1), 'status');
    res.json(await store.transaction((state) => {
      const delivery = find(state.deliveries, v.id(req.params.deliveryId), '배달');
      ensure(delivery.riderId === req.user.id, 403, '배정받은 라이더만 상태를 변경할 수 있습니다.');
      if (delivery.status === status) return deliveryView(state, delivery);
      ensure(deliveryStatuses.indexOf(status) === deliveryStatuses.indexOf(delivery.status) + 1, 409, '현재 배달상태에서 변경할 수 없습니다.');
      ensure(!state.deliveryHistory.some((item) => item.deliveryId === delivery.id && item.status === status), 409, '이미 기록된 배달상태입니다.');
      delivery.status = status;
      state.deliveryHistory.push({ id: id(state, 'deliveryHistory'), deliveryId: delivery.id, status, changedAt: now() });
      if (status === '배달완료') userRecord(state, 'RIDER', delivery.riderId).status = '운행가능';
      return deliveryView(state, delivery);
    }));
  });
  return router;
};
