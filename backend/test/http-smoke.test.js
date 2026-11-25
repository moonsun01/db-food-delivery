const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const runDemo = require('../scripts/demo-flow');

test('server.js over real HTTP, full demo and persisted idempotency after process restart', { timeout: 45000 }, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'delivery-http-'));
  const file = path.join(directory, 'api-v05.json');
  let running;
  async function start() {
    const child = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), windowsHide: true,
      env: { ...process.env, PORT: '0', STORAGE_MODE: 'json', DATA_FILE: file, SEED_SAMPLE_DATA: 'true',
        PAYMENT_MODE: 'mock', MOCK_PAYMENT_RESULT: 'success' }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    let output = '';
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server startup timeout: ' + output)), 10000);
      child.on('error', (error) => { clearTimeout(timer); reject(error); });
      child.stderr.on('data', (chunk) => { output += chunk; });
      child.stdout.on('data', (chunk) => {
        output += chunk;
        const found = output.match(/http:\/\/localhost:(\d+)\/api\/health/);
        if (found) { clearTimeout(timer); resolve(`http://localhost:${found[1]}`); }
      });
      child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`server exited (${code}): ${output}`)); });
    });
    return { child, url };
  }
  async function stop() {
    if (!running || running.child.exitCode !== null) return;
    const child = running.child;
    await new Promise((resolve) => { child.once('exit', resolve); child.kill(); });
  }
  try {
    running = await start();
    const health = await fetch(running.url + '/api/health');
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });
    const menus = await fetch(running.url + '/api/stores/10/menus');
    assert.equal(menus.status, 200);
    assert.equal((await menus.json())[0].id, 101);
    const result = await runDemo(running.url);
    assert.equal(result.summary.orderAmount, 27000);
    assert.equal(result.summary.paymentAmount, 30000);
    assert.equal(result.summary.orderStatus, '조리완료');
    assert.equal(result.summary.deliveryStatus, '배달완료');
    assert.deepEqual(result.summary.history, ['배정완료', '픽업완료', '배달중', '배달완료']);
    await stop();
    running = await start();
    const replay = await fetch(running.url + '/api/orders', { method: 'POST', headers: {
      'Content-Type': 'application/json', Authorization: `Bearer ${result.customerToken}`, 'Idempotency-Key': result.key }, body: JSON.stringify(result.payload) });
    assert.equal(replay.status, 200);
    const frozen = await replay.json();
    assert.equal(frozen.id, result.summary.orderId);
    assert.equal(frozen.delivery, null, 'replay returns original creation response');
    const current = await fetch(running.url + `/api/orders/${frozen.id}`, { headers: { Authorization: `Bearer ${result.customerToken}` } });
    assert.equal((await current.json()).delivery.status, '배달완료');
    console.log('HTTP 확인: health=200, menus=200, 결제 30000원, 배달완료, 재시작 후 데이터·중복 방지 유지');
  } finally {
    await stop();
    // 이 테스트가 직접 만든 파일과 빈 디렉터리만 제거한다.
    for (const entry of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, entry));
    fs.rmdirSync(directory);
  }
});

test('demo refuses a remote server before sending account information', async () => {
  await assert.rejects(runDemo('https://example.test'), /로컬 서버/);
});
