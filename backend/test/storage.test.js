const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Storage = require('../lib/storage');
const configuration = require('../lib/config');

function withDirectory(action) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'delivery-storage-'));
  const file = path.join(directory, 'data.json');
  const config = configuration({ storageMode: 'json', dataFile: file });
  try {
    action({ directory, file, config });
  } finally {
    // 이 테스트에서 직접 만든 파일과 빈 디렉터리만 제거합니다.
    for (const entry of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, entry));
    fs.rmdirSync(directory);
  }
}

test('JSON storage survives reopening and returns detached snapshots', () => withDirectory(({ file, config }) => {
  const first = new Storage(config);
  first.transaction((state) => { state.addresses.push({ id: 'A_test', customerId: 'C_test', address: '테스트 주소' }); });
  const snapshot = first.read((state) => state.addresses);
  snapshot[0].address = '외부 수정';
  assert.equal(first.read((state) => state.addresses[0].address), '테스트 주소');
  first.close();
  const second = new Storage(config);
  assert.equal(second.read((state) => state.addresses[0].address), '테스트 주소');
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).addresses.length, 1);
  second.close();
}));

test('failed business transaction and failed disk write do not partially update state', () => withDirectory(({ file, config }) => {
  const store = new Storage(config);
  const before = fs.readFileSync(file, 'utf8');
  assert.throws(() => store.transaction((state) => { state.orders.push({ id: 'partial' }); throw new Error('중간 오류'); }));
  assert.equal(store.read((state) => state.orders.length), 0);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  const originalPersist = store.persist;
  store.persist = () => { throw new Error('디스크 쓰기 실패'); };
  assert.throws(() => store.transaction((state) => { state.orders.push({ id: 'write-failed' }); }));
  assert.equal(store.read((state) => state.orders.length), 0);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  store.persist = originalPersist;
  store.close();
}));

test('two processes cannot share the same writable JSON file', () => withDirectory(({ config }) => {
  const first = new Storage(config);
  assert.throws(() => new Storage(config), /이미 실행/);
  first.close();
  const second = new Storage(config);
  second.close();
}));

test('corrupt storage is preserved and startup releases its lock', () => withDirectory(({ file, config }) => {
  fs.writeFileSync(file, '{broken', 'utf8');
  assert.throws(() => new Storage(config));
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
  assert.equal(fs.existsSync(`${file}.lock`), false);
}));

test('a stale process lock can be recovered', () => withDirectory(({ file, config }) => {
  fs.writeFileSync(`${file}.lock`, JSON.stringify({ pid: 2147483646, token: 'stale-test-lock' }));
  const store = new Storage(config);
  assert.equal(store.read((state) => state.version), 2);
  store.close();
}));

test('a second stale-lock recovery cannot remove the first recovery lock', () => withDirectory(({ file, config }) => {
  fs.writeFileSync(`${file}.lock`, JSON.stringify({ pid: 2147483646, token: 'stale-test-lock' }));
  fs.writeFileSync(`${file}.lock.recovery`, JSON.stringify({ pid: process.pid }));
  assert.throws(() => new Storage(config), /복구가 진행/);
  assert.equal(JSON.parse(fs.readFileSync(`${file}.lock`, 'utf8')).token, 'stale-test-lock');
}));
