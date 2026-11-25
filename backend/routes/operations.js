const express = require('express');
const v = require('../lib/validation');
const { find } = require('../lib/domain');
const { previousWeek, generateWeek, detail } = require('../services/settlements');
// 프론트 API와 분리한 로컬 운영 도구. 실제 송금은 하지 않는다.
module.exports = ({ store, auth }) => {
  const router = express.Router();
  router.use(auth.operations);
  router.post('/settlements/generate', async (req, res) => {
    const input = v.body(req, ['startDate']);
    const created = await store.transaction((state) => generateWeek(state, input.startDate === undefined ? previousWeek() : input.startDate));
    res.status(created.length ? 201 : 200).json(created);
  });
  router.post('/settlements/:settlementId/pay', async (req, res) => {
    v.body(req, []);
    res.json(await store.transaction((state) => {
      const settlement = find(state.settlements, v.id(req.params.settlementId), '정산');
      settlement.status = '지급완료';
      return detail(state, settlement);
    }));
  });
  return router;
};
