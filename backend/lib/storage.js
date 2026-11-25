const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const collections = ['users', 'sessions', 'addresses', 'stores', 'menus', 'orders', 'orderItems',
  'payments', 'deliveries', 'deliveryHistory', 'settlements', 'settlementItems', 'idempotency'];
function initialState(config) {
  const state = { version: 2, counters: {} };
  for (const name of collections) state[name] = [];
  if (config.seedSample) {
    state.users.push({ id: 1, role: 'OWNER', name: '예시 점주', email: 'sample-owner@example.test', passwordHash: null });
    state.stores.push({ id: 10, ownerId: 1, name: '예시 중국집', address: '서울시 성북구 예시로 10', status: '영업중', deliveryFee: 3000 });
    state.menus.push({ id: 101, storeId: 10, name: '짜장면·탕수육 세트', price: 27000 },
      { id: 102, storeId: 10, name: '짜장면', price: 7000 }, { id: 103, storeId: 10, name: '탕수육', price: 20000 });
    Object.assign(state.counters, { 'users:OWNER': 1, stores: 10, menus: 103 });
  }
  return state;
}

class Storage {
  constructor(config) {
    this.file = config.storageMode === 'json' ? path.resolve(config.dataFile) : null;
    this.state = initialState(config);
    this.lockToken = randomUUID();
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    this.lockFile = `${this.file}.lock`;
    this.acquireLock();
    try {
      if (fs.existsSync(this.file)) {
        const loaded = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        if (loaded.version !== 2 || !loaded.counters || collections.some((name) => !Array.isArray(loaded[name]))) {
          throw new Error('API v0.5 저장 형식이 아닙니다. 기존 data.json을 보존하고 DATA_FILE을 새 파일로 지정하세요.');
        }
        this.state = loaded;
      } else {
        this.persist(this.state);
      }
    } catch (error) {
      this.close();
      throw error;
    }
  }

  acquireLock() {
    try {
      fs.writeFileSync(this.lockFile, JSON.stringify({ pid: process.pid, token: this.lockToken }), { flag: 'wx', mode: 0o600 });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const recoveryFile = `${this.lockFile}.recovery`;
      let recovery;
      try {
        recovery = fs.openSync(recoveryFile, 'wx', 0o600);
      } catch (recoveryError) {
        if (recoveryError.code === 'EEXIST') throw new Error('저장 파일의 잠금 복구가 진행 중입니다. 실행 중인 서버를 확인하세요.');
        throw recoveryError;
      }
      try {
        fs.writeFileSync(recovery, JSON.stringify({ pid: process.pid }));
        const owner = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
        if (!Number.isInteger(owner.pid) || owner.pid <= 0) throw new Error('저장 파일 잠금 정보가 올바르지 않습니다.');
        try {
          process.kill(owner.pid, 0);
        } catch (checkError) {
          if (checkError.code !== 'ESRCH') throw checkError;
          fs.unlinkSync(this.lockFile);
          fs.writeFileSync(this.lockFile, JSON.stringify({ pid: process.pid, token: this.lockToken }), { flag: 'wx', mode: 0o600 });
          return;
        }
        throw new Error('같은 저장 파일을 사용하는 서버가 이미 실행 중입니다.');
      } finally {
        fs.closeSync(recovery);
        fs.unlinkSync(recoveryFile);
      }
    }
  }

  persist(state) {
    if (!this.file) return;
    const temporary = `${this.file}.${this.lockToken}.tmp`;
    let descriptor;
    try {
      descriptor = fs.openSync(temporary, 'w', 0o600);
      fs.writeFileSync(descriptor, JSON.stringify(state, null, 2), 'utf8');
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor = undefined;
      fs.renameSync(temporary, this.file);
    } finally {
      if (descriptor !== undefined) fs.closeSync(descriptor);
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }

  read(select) {
    return structuredClone(select(this.state));
  }

  transaction(update) {
    const draft = structuredClone(this.state);
    const result = update(draft);
    if (result && typeof result.then === 'function') throw new Error('저장 트랜잭션 내부에서는 비동기 작업을 실행할 수 없습니다.');
    this.persist(draft);
    this.state = draft;
    return structuredClone(result);
  }

  close() {
    if (!this.lockFile || !fs.existsSync(this.lockFile)) return;
    const lock = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
    if (lock.token === this.lockToken) fs.unlinkSync(this.lockFile);
  }
}

module.exports = Storage;
