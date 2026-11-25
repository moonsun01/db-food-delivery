const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { client, OPERATIONS_KEY } = require("./helpers");
const { previousWeek, weekBounds } = require("../services/settlements");
const { createOrder } = require("../services/orders");
const { id } = require("../lib/domain");

test(
  "real MySQL: bcrypt seeds, transactions, two API instances, rider race, settlement and restart",
  { skip: process.env.RUN_MYSQL_TESTS !== "1", timeout: 60000 },
  async (t) => {
    const settings = require("../lib/config")();
    assert.match(settings.dbName, /_test$/, "MySQL integration tests require a dedicated _test database.");
    assert.equal(settings.dbRuntimeName, settings.dbName + "_runtime", "Use a separate runtime database for MySQL tests.");
    const c = client({ storageMode: "mysql" });
    const second = client({ storageMode: "mysql" });
    t.after(async () => {
      try {
        await require("../scripts/clean-mysql-fixtures")(c.app.locals.store);
      } finally {
        await c.app.locals.store.close();
        await second.app.locals.store.close();
      }
    });
    await Promise.all([
      c.app.locals.store.ready,
      second.app.locals.store.ready,
    ]);
    const seed = await c.call("POST", "/api/auth/login", {
      role: "CUSTOMER",
      email: "customer@test.com",
      password: "test1234",
    });
    assert.equal(seed.user.name, "김손님");
    assert.equal(
      (await c.call("GET", "/api/addresses", undefined, seed.token)).length,
      2,
    );
    const suffix = "-" + randomBytes(5).toString("hex");
    const customer = await c.account("CUSTOMER", suffix);
    const owner = await c.account("OWNER", suffix);
    const rider = await c.account("RIDER", suffix);
    const other = await c.account("RIDER", suffix + "-other");
    const restaurant = await c.call(
      "POST",
      "/api/stores",
      {
        name: "MySQL 연동 테스트",
        address: "서울시 테스트 주소",
        status: "영업중",
        deliveryFee: 3000,
      },
      owner.token,
      201,
    );
    const menu = await c.call(
      "POST",
      `/api/stores/${restaurant.id}/menus`,
      { name: "테스트 세트", price: 27000 },
      owner.token,
      201,
    );
    const address = await c.call(
      "POST",
      "/api/addresses",
      { address: "주문시 주소", detailAddress: "101호" },
      customer.token,
      201,
    );
    const input = {
      storeId: restaurant.id,
      addressId: address.id,
      items: [{ menuId: menu.id, quantity: 1 }],
      payment: { method: "카드" },
    };
    const key = { "Idempotency-Key": "mysql-" + suffix };
    const failedClient = client({
      storageMode: "mysql",
      mockPaymentResult: "failure",
    });
    try {
      const failed = await failedClient.call(
        "POST",
        "/api/orders",
        input,
        customer.token,
        201,
      );
      assert.equal(failed.status, "결제실패");
      assert.equal(failed.payment.status, "실패");
      assert.equal(
        (
          await c.call(
            "GET",
            `/api/orders/${failed.id}`,
            undefined,
            customer.token,
          )
        ).payment.status,
        "실패",
      );
      assert.equal(
        (await c.call("GET", "/api/orders", undefined, owner.token)).some(
          (o) => o.id === failed.id,
        ),
        false,
      );
    } finally {
      await failedClient.app.locals.store.close();
    }
    const rejected = await c.call(
      "POST",
      "/api/orders",
      input,
      customer.token,
      201,
    );
    const canceled = await c.call(
      "PATCH",
      `/api/orders/${rejected.id}/status`,
      { status: "거절" },
      owner.token,
    );
    assert.equal(canceled.payment.status, "취소완료");
    assert.ok(canceled.payment.canceledAt);
    assert.equal(
      (await c.call("GET", "/api/orders", undefined, owner.token)).find(
        (o) => o.id === rejected.id,
      ).payment.id,
      rejected.payment.id,
    );
    const [a, b] = await Promise.all([
      c.call("POST", "/api/orders", input, customer.token, [200, 201], key),
      second.call(
        "POST",
        "/api/orders",
        input,
        customer.token,
        [200, 201],
        key,
      ),
    ]);
    assert.equal(a.id, b.id);
    assert.equal(a.payment.amount, 30000);
    assert.equal(
      await c.app.locals.store.read(
        (state) => state.orders.filter((order) => order.id === a.id).length,
      ),
      1,
    );
    assert.equal(
      await c.app.locals.store.read(
        (state) =>
          state.orders.filter((order) => order.customerId === customer.user.id)
            .length,
      ),
      3,
    );
    await c.call(
      "PATCH",
      `/api/addresses/${address.id}`,
      { address: "수정한 주소" },
      customer.token,
    );
    await c.call(
      "PATCH",
      `/api/stores/${restaurant.id}/menus/${menu.id}`,
      { price: 10000 },
      owner.token,
    );
    assert.equal(
      (await c.call("GET", `/api/orders/${a.id}`, undefined, customer.token))
        .addressSnapshot,
      "주문시 주소 101호",
    );
    const before = await c.app.locals.store.read((state) => ({
      orders: state.orders.length,
      items: state.orderItems.length,
      payments: state.payments.length,
    }));
    await assert.rejects(
      c.app.locals.store.transaction((state) => {
        createOrder(state, input, customer.user, undefined, "success");
        state.payments.push({
          id: id(state, "payments"),
          orderId: 2147483647,
          method: "카드",
          amount: 1,
          status: "완료",
          canceledAt: null,
        });
      }),
    );
    assert.deepEqual(
      await c.app.locals.store.read((state) => ({
        orders: state.orders.length,
        items: state.orderItems.length,
        payments: state.payments.length,
      })),
      before,
    );
    for (const status of ["조리중", "조리완료"])
      await c.call(
        "PATCH",
        `/api/orders/${a.id}/status`,
        { status },
        owner.token,
      );
    for (const token of [rider.token, other.token])
      await c.call(
        "PATCH",
        "/api/riders/me/status",
        { status: "운행가능" },
        token,
      );
    const accepted = await Promise.all([
      c.call(
        "POST",
        `/api/orders/${a.id}/delivery/accept`,
        {},
        rider.token,
        [201, 409],
      ),
      second.call(
        "POST",
        `/api/orders/${a.id}/delivery/accept`,
        {},
        other.token,
        [201, 409],
      ),
    ]);
    const delivery = accepted.find((row) => row.id);
    assert.ok(delivery);
    const winner = delivery.riderId === rider.user.id ? rider : other;
    assert.equal(
      await c.app.locals.store.read(
        (state) =>
          state.deliveries.filter((row) => row.orderId === a.id).length,
      ),
      1,
    );
    for (const status of ["픽업완료", "배달중", "배달완료"])
      await c.call(
        "PATCH",
        `/api/deliveries/${delivery.id}/status`,
        { status },
        winner.token,
      );
    const history = await c.call(
      "GET",
      `/api/deliveries/${delivery.id}/history`,
      undefined,
      winner.token,
    );
    assert.deepEqual(
      history.map((row) => row.status),
      ["배정완료", "픽업완료", "배달중", "배달완료"],
    );
    const startDate = previousWeek();
    const week = weekBounds(startDate);
    await c.app.locals.store.transaction((state) => {
      state.deliveryHistory
        .filter((row) => row.deliveryId === delivery.id)
        .forEach((row, index) => {
          row.changedAt = new Date(
            week.from + 3600000 + index * 60000,
          ).toISOString();
        });
    });
    const ops = { "X-Operations-Key": OPERATIONS_KEY };
    await c.call(
      "POST",
      "/internal/settlements/generate",
      { startDate },
      undefined,
      201,
      ops,
    );
    const ownerSettlements = await c.call(
      "GET",
      "/api/settlements",
      undefined,
      owner.token,
    );
    const riderSettlements = await c.call(
      "GET",
      "/api/settlements",
      undefined,
      winner.token,
    );
    assert.equal(ownerSettlements[0].amount, 27000);
    assert.equal(riderSettlements[0].amount, 3000);
    const detail = await c.call(
      "GET",
      `/api/settlements/${riderSettlements[0].id}`,
      undefined,
      winner.token,
    );
    assert.equal(detail.items[0].payTarget, "라이더");
    assert.deepEqual(
      await c.call(
        "POST",
        "/internal/settlements/generate",
        { startDate },
        undefined,
        200,
        ops,
      ),
      [],
    );
    const restarted = client({ storageMode: "mysql" });
    try {
      const replay = await restarted.call(
        "POST",
        "/api/orders",
        input,
        customer.token,
        200,
        key,
      );
      assert.equal(replay.id, a.id);
      assert.equal(replay.delivery, null);
      const current = await restarted.call(
        "GET",
        `/api/orders/${a.id}`,
        undefined,
        customer.token,
      );
      assert.equal(current.delivery.status, "배달완료");
      assert.equal(current.items[0].unitPrice, 27000);
    } finally {
      await restarted.app.locals.store.close();
    }
    console.log(
      "MySQL 검증 완료: 시연 로그인, 실제 13개 테이블 저장, SQL 롤백, 서버 간 중복 요청·선착순, 정산, 재연결 보존",
    );
  },
);
