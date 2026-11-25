const express = require('express');
const v = require('../lib/validation');
const { ensure } = require('../lib/errors');
const { id, find } = require('../lib/domain');
module.exports = ({ store, auth }) => {
  const router = express.Router();
  router.use(auth.role('CUSTOMER'));
  const owned = (state, addressId, user) => {
    const address = find(state.addresses, addressId, '배송지');
    ensure(address.customerId === user.id, 403, '본인의 배송지만 관리할 수 있습니다.');
    return address;
  };
  router.get('/', async (req, res) => res.json(await store.read((state) => state.addresses.filter((item) => item.customerId === req.user.id))));
  router.post('/', async (req, res) => {
    const input = v.body(req, ['address', 'detailAddress']);
    const address = v.text(input.address, 'address', 200);
    const detailAddress = v.detail(input.detailAddress === undefined ? null : input.detailAddress);
    res.status(201).json(await store.transaction((state) => {
      const created = { id: id(state, 'addresses'), customerId: req.user.id, address, detailAddress };
      state.addresses.push(created);
      return created;
    }));
  });
  router.get('/:addressId', async (req, res) => res.json(await store.read((state) => owned(state, v.id(req.params.addressId), req.user))));
  router.patch('/:addressId', async (req, res) => {
    const input = v.body(req, ['address', 'detailAddress']);
    const changes = {};
    if (input.address !== undefined) changes.address = v.text(input.address, 'address', 200);
    if (input.detailAddress !== undefined) changes.detailAddress = v.detail(input.detailAddress);
    v.changes(changes);
    res.json(await store.transaction((state) => Object.assign(owned(state, v.id(req.params.addressId), req.user), changes)));
  });
  router.delete('/:addressId', async (req, res) => {
    await store.transaction((state) => {
      const address = owned(state, v.id(req.params.addressId), req.user);
      ensure(!state.orders.some((order) => order.addressId === address.id), 409, '주문에 사용된 배송지는 삭제할 수 없습니다.');
      state.addresses = state.addresses.filter((item) => item.id !== address.id);
    });
    res.status(204).end();
  });
  return router;
};
