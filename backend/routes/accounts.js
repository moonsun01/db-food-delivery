const express = require('express');
const { randomBytes } = require('node:crypto');
const v = require('../lib/validation');
const { ensure } = require('../lib/errors');
const { hashPassword, verifyPassword, digest } = require('../lib/security');
const { id, userRecord, publicUser } = require('../lib/domain');
module.exports = ({ store, auth, config }) => {
  const router = express.Router();
  const failures = new Map();
  router.post('/auth/register', async (req, res) => {
    const input = v.body(req, ['role', 'email', 'password', 'name', 'phone']);
    const role = v.choice(input.role, ['CUSTOMER', 'OWNER', 'RIDER'], 'role');
    const email = v.email(input.email);
    const name = v.text(input.name, 'name', 30);
    ensure(role !== 'OWNER' || input.phone === undefined, 400, '점주 계정에는 phone을 보내지 않습니다.');
    const phone = role === 'OWNER' ? undefined : v.text(input.phone, 'phone', 20);
    const password = v.password(input.password);
    const duplicate = (state) => state.users.some((item) => item.role === role && item.email === email);
    ensure(!await store.read(duplicate), 409, '이미 가입된 이메일입니다.');
    const passwordHash = await hashPassword(password);
    const result = await store.transaction((state) => {
      ensure(!duplicate(state), 409, '이미 가입된 이메일입니다.');
      const user = { id: id(state, `users:${role}`), role, name, email, passwordHash };
      if (role !== 'OWNER') user.phone = phone;
      if (role === 'RIDER') user.status = '운행종료';
      state.users.push(user);
      return publicUser(user);
    });
    res.status(201).json(result);
  });
  router.post('/auth/login', async (req, res) => {
    const input = v.body(req, ['role', 'email', 'password']);
    const role = v.choice(input.role, ['CUSTOMER', 'OWNER', 'RIDER'], 'role');
    const email = v.email(input.email);
    const password = v.password(input.password);
    const key = JSON.stringify([req.ip, role, email]);
    const previous = failures.get(key);
    ensure(!previous || previous.until <= Date.now() || previous.count < 10, 429, '로그인 시도가 많습니다. 15분 후 다시 시도하세요.');
    const user = await store.read((state) => state.users.find((item) => item.email === email && item.role === role));
    const valid = await verifyPassword(password, user?.passwordHash);
    if (!user || !user.passwordHash || !valid) {
      failures.set(key, { count: previous?.until > Date.now() ? previous.count + 1 : 1, until: Date.now() + 900000 });
      if (failures.size > 10000) {
        for (const [entry, value] of failures) if (value.until <= Date.now()) failures.delete(entry);
        if (failures.size > 10000) failures.delete(failures.keys().next().value);
      }
      ensure(false, 401, '이메일 또는 비밀번호를 확인해 주세요.');
    }
    failures.delete(key);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + config.sessionHours * 3600000).toISOString();
    const currentUser = await store.transaction((state) => {
      const current = userRecord(state, role, user.id);
      ensure(current.passwordHash === user.passwordHash, 401, '다시 로그인하세요.');
      state.sessions = state.sessions.filter((session) => Date.parse(session.expiresAt) > Date.now());
      state.sessions.push({ id: id(state, 'sessions'), userId: current.id, role, tokenHash: digest(token), expiresAt });
      return publicUser(current);
    });
    res.json({ token, tokenType: 'Bearer', expiresAt, user: currentUser });
  });
  router.post('/auth/logout', auth.required, async (req, res) => {
    await store.transaction((state) => { state.sessions = state.sessions.filter((session) => session.id !== req.sessionId); });
    res.status(204).end();
  });
  router.get('/me', auth.required, async (req, res) => res.json(publicUser(req.user)));
  router.patch('/me', auth.required, async (req, res) => {
    const input = v.body(req, req.user.role === 'OWNER' ? ['name'] : ['name', 'phone']);
    const changes = {};
    if (input.name !== undefined) changes.name = v.text(input.name, 'name', 30);
    if (input.phone !== undefined) changes.phone = v.text(input.phone, 'phone', 20);
    v.changes(changes);
    res.json(await store.transaction((state) => publicUser(Object.assign(userRecord(state, req.user.role, req.user.id), changes))));
  });
  return router;
};
