const express = require('express');
const v = require('../lib/validation');
const { ensure } = require('../lib/errors');
const { find } = require('../lib/domain');
const { weekBounds, detail, canRead } = require('../services/settlements');
module.exports = ({ store, auth }) => {
  const router = express.Router();
  router.use(auth.role('OWNER', 'RIDER'));
  router.get('/', async (req, res) => {
    const startDate = req.query.startDate === undefined ? undefined : weekBounds(req.query.startDate).startDate;
    res.json(await store.read((state) => state.settlements.filter((item) => canRead(state, item, req.user) && (!startDate || item.startDate === startDate))
      .sort((a, b) => b.startDate.localeCompare(a.startDate) || b.id - a.id)));
  });
  router.get('/:settlementId', async (req, res) => res.json(await store.read((state) => {
    const settlement = find(state.settlements, v.id(req.params.settlementId), '정산');
    ensure(canRead(state, settlement, req.user), 403, '정산을 조회할 권한이 없습니다.');
    return detail(state, settlement);
  })));
  return router;
};
