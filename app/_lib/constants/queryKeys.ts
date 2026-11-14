/** TanStack Query 키 — 키 문자열은 여기서만 만든다 (invalidate 누락 방지) */
export const queryKeys = {
  restaurants: {
    all: ["restaurants"] as const,
    detail: (id: number) => ["restaurants", id] as const,
    menus: (id: number) => ["restaurants", id, "menus"] as const,
  },
  owner: {
    restaurant: ["owner", "restaurant"] as const,
    orders: ["owner", "orders"] as const,
  },
};
