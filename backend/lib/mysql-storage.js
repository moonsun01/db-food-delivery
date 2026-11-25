const mysql = require("mysql2/promise");
const { ApiError } = require("./errors");
const KST = 9 * 3600000;
const spec = (table, collection, fields, role) => ({
  table,
  collection,
  fields,
  role,
});
// 팀의 13개 업무 테이블은 변경하지 않는다. 인증·중복 요청 상태는 별도 runtime DB에 둔다.
const mappings = [
  spec(
    "customer",
    "users",
    {
      id: "customer_id",
      name: "name",
      email: "email",
      phone: "phone",
      passwordHash: "password_hash",
    },
    "CUSTOMER",
  ),
  spec(
    "owner",
    "users",
    {
      id: "owner_id",
      name: "name",
      email: "email",
      passwordHash: "password_hash",
    },
    "OWNER",
  ),
  spec(
    "rider",
    "users",
    {
      id: "rider_id",
      name: "name",
      email: "email",
      phone: "phone",
      passwordHash: "password_hash",
      status: "rider_status",
    },
    "RIDER",
  ),
  spec("address", "addresses", {
    id: "address_id",
    customerId: "customer_id",
    address: "address",
    detailAddress: "address_detail",
  }),
  spec("restaurant", "stores", {
    id: "restaurant_id",
    name: "name",
    address: "address",
    status: "business_status",
    ownerId: "owner_id",
    deliveryFee: "delivery_fee",
  }),
  spec("menu", "menus", {
    id: "menu_id",
    storeId: "restaurant_id",
    name: "name",
    price: "price",
  }),
  spec("orders", "orders", {
    id: "order_id",
    customerId: "customer_id",
    storeId: "restaurant_id",
    createdAt: "ordered_time",
    status: "order_status",
    addressId: "address_id",
    addressSnapshot: "order_address",
    totalAmount: "total_amount",
    deliveryFee: "delivery_fee",
  }),
  spec("order_item", "orderItems", {
    id: "order_item_id",
    orderId: "order_id",
    menuId: "menu_id",
    quantity: "quantity",
    unitPrice: "unit_price",
  }),
  spec("payment", "payments", {
    id: "payment_id",
    orderId: "order_id",
    method: "method",
    amount: "amount",
    status: "payment_status",
    canceledAt: "canceled_at",
  }),
  spec("delivery", "deliveries", {
    id: "delivery_id",
    orderId: "order_id",
    riderId: "rider_id",
    status: "delivery_status",
  }),
  spec("delivery_history", "deliveryHistory", {
    id: "history_id",
    deliveryId: "delivery_id",
    status: "delivery_status",
    changedAt: "changed_at",
  }),
  spec("settlement", "settlements", {
    id: "settlement_id",
    storeId: "restaurant_id",
    riderId: "rider_id",
    startDate: "start_date",
    endDate: "end_date",
    amount: "amount",
    status: "settlement_status",
  }),
  spec("settlement_item", "settlementItems", {
    id: "settlement_item_id",
    settlementId: "settlement_id",
    orderId: "order_id",
    payTarget: "pay_target",
    payAmount: "pay_amount",
  }),
];
const instantFields = new Set(["createdAt", "canceledAt", "changedAt"]);
const identity = (mapping) =>
  mapping.role ? `users:${mapping.role}` : mapping.collection;
const rowsFor = (state, mapping) =>
  state[mapping.collection].filter(
    (row) => !mapping.role || row.role === mapping.role,
  );
function safeIdentifier(value) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(value))
    throw new Error("DB 이름은 영문·숫자·밑줄로 지정하세요.");
  return "`" + value + "`";
}
function sqlValue(key, value) {
  if (value == null) return null;
  return instantFields.has(key)
    ? new Date(Date.parse(value) + KST)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ")
    : value;
}
function domainValue(key, value) {
  if (value == null) return null;
  return instantFields.has(key)
    ? new Date(value.replace(" ", "T") + "+09:00").toISOString()
    : value;
}
function translate(error) {
  if (error instanceof ApiError) return error;
  if (error.code === "ER_DUP_ENTRY")
    return new ApiError(409, "이미 등록되었거나 처리된 값입니다.");
  if (["ER_ROW_IS_REFERENCED_2", "ER_NO_REFERENCED_ROW_2"].includes(error.code))
    return new ApiError(409, "관련 데이터가 사용 중이거나 존재하지 않습니다.");
  if (
    [
      "ER_CHECK_CONSTRAINT_VIOLATED",
      "ER_DATA_TOO_LONG",
      "ER_WARN_DATA_OUT_OF_RANGE",
    ].includes(error.code)
  )
    return new ApiError(400, "입력값이 DB의 범위를 벗어났습니다.");
  if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(error.code))
    return new ApiError(
      503,
      "다른 요청을 처리 중입니다. 잠시 후 다시 시도하세요.",
    );
  return error;
}
class MySQLStorage {
  constructor(config) {
    if (!config.dbName || !config.dbUser)
      throw new Error("MySQL 접속 정보를 설정하세요.");
    this.config = config;
    this.runtime = safeIdentifier(config.dbRuntimeName);
    safeIdentifier(config.dbName);
    this.pool = mysql.createPool({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      connectionLimit: 10,
      connectTimeout: 5000,
      dateStrings: true,
      timezone: "+09:00",
      charset: "utf8mb4",
    });
    this.ready = this.initialize();
  }
  async initialize() {
    const connection = await this.pool.getConnection();
    try {
      const [tables] = await connection.query(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=?",
        [this.config.dbName],
      );
      const available = new Set(tables.map((row) => row.TABLE_NAME));
      if (mappings.some((mapping) => !available.has(mapping.table)))
        throw new Error("먼저 팀의 13개 테이블을 로컬 테스트 DB에 준비하세요.");
      await connection.query(
        `CREATE TABLE IF NOT EXISTS ${this.runtime}.api_state (id TINYINT PRIMARY KEY, payload JSON NOT NULL) ENGINE=InnoDB`,
      );
      await connection.query(
        `INSERT IGNORE INTO ${this.runtime}.api_state (id,payload) VALUES (1,?)`,
        [JSON.stringify({ counters: {}, sessions: [], idempotency: [] })],
      );
    } finally {
      connection.release();
    }
  }
  async load(connection, write) {
    const [metadata] = await connection.query(
      `SELECT payload FROM ${this.runtime}.api_state WHERE id=1${write ? " FOR UPDATE" : ""}`,
    );
    const payload =
      typeof metadata[0].payload === "string"
        ? JSON.parse(metadata[0].payload)
        : metadata[0].payload;
    const state = { version: 2, ...payload };
    for (const mapping of mappings) state[mapping.collection] = [];
    // InnoDB 행·간격 잠금과 runtime 행 잠금으로 별도 서버 프로세스의 동시 쓰기도 직렬화한다.
    for (const mapping of mappings) {
      const [records] = await connection.query(
        `SELECT * FROM ${safeIdentifier(mapping.table)} ORDER BY ${safeIdentifier(mapping.fields.id)}${write ? " FOR UPDATE" : ""}`,
      );
      const converted = records.map((row) => {
        const value = Object.fromEntries(
          Object.entries(mapping.fields).map(([key, column]) => [
            key,
            domainValue(key, row[column]),
          ]),
        );
        if (mapping.role) value.role = mapping.role;
        return value;
      });
      state[mapping.collection].push(...converted);
      const [sequence] = await connection.query(
        "SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?",
        [this.config.dbName, mapping.table],
      );
      state.counters[identity(mapping)] = Math.max(
        state.counters[identity(mapping)] || 0,
        ...converted.map((row) => row.id),
        Number(sequence[0]?.AUTO_INCREMENT || 1) - 1,
      );
    }
    return state;
  }
  async persist(connection, before, after) {
    // FK 참조 순서의 역순으로 삭제하고 참조 순서대로 추가·변경한다.
    for (const mapping of [...mappings].reverse()) {
      const remaining = new Set(rowsFor(after, mapping).map((row) => row.id));
      for (const row of rowsFor(before, mapping))
        if (!remaining.has(row.id)) {
          await connection.execute(
            `DELETE FROM ${safeIdentifier(mapping.table)} WHERE ${safeIdentifier(mapping.fields.id)}=?`,
            [row.id],
          );
        }
    }
    for (const mapping of mappings) {
      const previous = new Map(
        rowsFor(before, mapping).map((row) => [row.id, row]),
      );
      const fields = Object.entries(mapping.fields);
      for (const row of rowsFor(after, mapping)) {
        const old = previous.get(row.id);
        if (
          old &&
          fields.every(
            ([key]) => sqlValue(key, old[key]) === sqlValue(key, row[key]),
          )
        )
          continue;
        if (old) {
          const changed = fields.filter(([key]) => key !== "id");
          await connection.execute(
            `UPDATE ${safeIdentifier(mapping.table)} SET ${changed.map(([, col]) => safeIdentifier(col) + "=?").join(",")} WHERE ${safeIdentifier(mapping.fields.id)}=?`,
            [...changed.map(([key]) => sqlValue(key, row[key])), row.id],
          );
        } else {
          await connection.execute(
            `INSERT INTO ${safeIdentifier(mapping.table)} (${fields.map(([, col]) => safeIdentifier(col)).join(",")}) VALUES (${fields.map(() => "?").join(",")})`,
            fields.map(([key]) => sqlValue(key, row[key])),
          );
        }
      }
    }
    await connection.execute(
      `UPDATE ${this.runtime}.api_state SET payload=? WHERE id=1`,
      [
        JSON.stringify({
          counters: after.counters,
          sessions: after.sessions,
          idempotency: after.idempotency,
        }),
      ],
    );
  }
  async run(callback, write) {
    await this.ready;
    const connection = await this.pool.getConnection();
    try {
      await connection.query("SET time_zone = '+09:00'");
      await connection.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
      await connection.query(
        write ? "START TRANSACTION" : "START TRANSACTION READ ONLY",
      );
      const before = await this.load(connection, write);
      const after = structuredClone(before);
      const result = callback(after);
      if (result && typeof result.then === "function")
        throw new Error("저장 트랜잭션 콜백은 동기 함수여야 합니다.");
      if (write) await this.persist(connection, before, after);
      await connection.commit();
      return structuredClone(result);
    } catch (error) {
      await connection.rollback();
      throw translate(error);
    } finally {
      connection.release();
    }
  }
  read(select) {
    return this.run(select, false);
  }
  transaction(update) {
    return this.run(update, true);
  }
  close() {
    return this.pool.end();
  }
}
module.exports = MySQLStorage;
