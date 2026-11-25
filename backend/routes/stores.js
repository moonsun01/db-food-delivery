const express = require('express');
const v = require('../lib/validation');
const { ensure } = require('../lib/errors');
const { id, find, ownsStore } = require('../lib/domain');
module.exports = ({ store, auth }) => {
  const router = express.Router();
  function storeChanges(input) {
    const changes = {};
    if (input.name !== undefined) changes.name = v.text(input.name, 'name', 50);
    if (input.address !== undefined) changes.address = v.text(input.address, 'address', 200);
    if (input.status !== undefined) changes.status = v.choice(input.status, ['영업중', '영업종료'], 'status');
    if (input.deliveryFee !== undefined) changes.deliveryFee = v.integer(input.deliveryFee, 'deliveryFee');
    return changes;
  }
  function menuChanges(input) {
    const changes = {};
    if (input.name !== undefined) changes.name = v.text(input.name, 'name', 50);
    if (input.price !== undefined) changes.price = v.integer(input.price, 'price');
    return changes;
  }
  router.get('/stores', async (req, res) => {
    const query = req.query.q === undefined ? '' : v.text(req.query.q, 'q', 50).toLowerCase();
    res.json(await store.read((state) => state.stores.filter((item) => item.name.toLowerCase().includes(query)).sort((a, b) => a.id - b.id)));
  });
  router.get('/me/stores', auth.role('OWNER'), async (req, res) => res.json(await store.read((state) => state.stores.filter((item) => item.ownerId === req.user.id))));
  router.post('/stores', auth.role('OWNER'), async (req, res) => {
    const input = v.body(req, ['name', 'address', 'status', 'deliveryFee']);
    const changes = storeChanges(input);
    changes.name = v.text(input.name, 'name', 50);
    changes.address = v.text(input.address, 'address', 200);
    res.status(201).json(await store.transaction((state) => {
      ensure(!state.stores.some((item) => item.ownerId === req.user.id), 409, '이미 등록한 음식점이 있습니다.');
      const created = { id: id(state, 'stores'), ownerId: req.user.id, status: '영업종료', deliveryFee: 0, ...changes };
      state.stores.push(created);
      return created;
    }));
  });
  router.get('/stores/:storeId', async (req, res) => res.json(await store.read((state) => find(state.stores, v.id(req.params.storeId), '음식점'))));
  router.patch('/stores/:storeId', auth.role('OWNER'), async (req, res) => {
    const changes = v.changes(storeChanges(v.body(req, ['name', 'address', 'status', 'deliveryFee'])));
    res.json(await store.transaction((state) => Object.assign(ownsStore(state, v.id(req.params.storeId), req.user), changes)));
  });
  router.get('/stores/:storeId/menus', async (req, res) => res.json(await store.read((state) => {
    const restaurant = find(state.stores, v.id(req.params.storeId), '음식점');
    return state.menus.filter((item) => item.storeId === restaurant.id).sort((a, b) => a.id - b.id);
  })));
  router.post('/stores/:storeId/menus', auth.role('OWNER'), async (req, res) => {
    const input = v.body(req, ['name', 'price']);
    const name = v.text(input.name, 'name', 50);
    const price = v.integer(input.price, 'price');
    res.status(201).json(await store.transaction((state) => {
      const restaurant = ownsStore(state, v.id(req.params.storeId), req.user);
      const menu = { id: id(state, 'menus'), storeId: restaurant.id, name, price };
      state.menus.push(menu);
      return menu;
    }));
  });
  router.patch('/stores/:storeId/menus/:menuId', auth.role('OWNER'), async (req, res) => {
    const changes = v.changes(menuChanges(v.body(req, ['name', 'price'])));
    res.json(await store.transaction((state) => {
      const restaurant = ownsStore(state, v.id(req.params.storeId), req.user);
      const menu = find(state.menus, v.id(req.params.menuId), '메뉴');
      ensure(menu.storeId === restaurant.id, 404, '음식점의 메뉴를 찾을 수 없습니다.');
      return Object.assign(menu, changes);
    }));
  });
  return router;
};
