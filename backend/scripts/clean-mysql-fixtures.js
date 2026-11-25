const fs = require("node:fs");
const path = require("node:path");
// 이 테스트 코드가 만든 무작위 계정과 전용 가게만 정리한다. 팀 시연 계정은 해당하지 않는다.
async function cleanFixtures(store) {
  if (!/_test$/.test(store.config.dbName))
    throw new Error("Fixture cleanup is limited to dedicated _test databases.");
  const marker =
    /^(customer|owner|rider)-[a-f0-9]{10}(?:-other)?@example\.test$/;
  const backup = await store.read((s) => s);
  const matches = backup.users.filter((u) => marker.test(u.email));
  if (!matches.length) return 0;
  const dir = path.resolve(__dirname, "../../.local");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `test-fixtures-before-cleanup-${Date.now()}.json`),
    JSON.stringify(backup),
    { mode: 0o600 },
  );
  return store.transaction((state) => {
    const accounts = new Set(
      state.users
        .filter((u) => marker.test(u.email))
        .map((u) => `${u.role}:${u.id}`),
    );
    const stores = new Set(
      state.stores
        .filter((s) => accounts.has(`OWNER:${s.ownerId}`))
        .map((s) => s.id),
    );
    if (
      state.stores.some(
        (s) => stores.has(s.id) && s.name !== "MySQL 연동 테스트",
      )
    )
      throw new Error("Fixture marker mismatch; no records were removed.");
    const orders = new Set(
      state.orders
        .filter(
          (o) =>
            stores.has(o.storeId) || accounts.has(`CUSTOMER:${o.customerId}`),
        )
        .map((o) => o.id),
    );
    const deliveries = new Set(
      state.deliveries.filter((d) => orders.has(d.orderId)).map((d) => d.id),
    );
    const settlements = new Set(
      state.settlements
        .filter(
          (s) => stores.has(s.storeId) || accounts.has(`RIDER:${s.riderId}`),
        )
        .map((s) => s.id),
    );
    state.settlementItems = state.settlementItems.filter(
      (i) => !settlements.has(i.settlementId) && !orders.has(i.orderId),
    );
    state.settlements = state.settlements.filter((s) => !settlements.has(s.id));
    state.deliveryHistory = state.deliveryHistory.filter(
      (h) => !deliveries.has(h.deliveryId),
    );
    state.deliveries = state.deliveries.filter((d) => !deliveries.has(d.id));
    state.payments = state.payments.filter((p) => !orders.has(p.orderId));
    state.orderItems = state.orderItems.filter((i) => !orders.has(i.orderId));
    state.orders = state.orders.filter((o) => !orders.has(o.id));
    state.menus = state.menus.filter((m) => !stores.has(m.storeId));
    state.stores = state.stores.filter((s) => !stores.has(s.id));
    state.addresses = state.addresses.filter(
      (a) => !accounts.has(`CUSTOMER:${a.customerId}`),
    );
    state.sessions = state.sessions.filter(
      (s) => !accounts.has(`${s.role}:${s.userId}`),
    );
    state.idempotency = state.idempotency.filter(
      (i) => !accounts.has(i.account),
    );
    state.users = state.users.filter((u) => !accounts.has(`${u.role}:${u.id}`));
    return accounts.size;
  });
}
module.exports = cleanFixtures;
if (require.main === module) {
  const config = require("../lib/config")();
  const store = new (require("../lib/mysql-storage"))(config);
  cleanFixtures(store)
    .then((count) =>
      console.log(
        `Removed ${count} generated test accounts and their fixture rows; team seed and browser demo data retained.`,
      ),
    )
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    })
    .finally(() => store.close());
}
