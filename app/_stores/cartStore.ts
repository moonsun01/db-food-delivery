import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Menu, Restaurant } from "@/app/_lib/types/restaurant";

export interface CartItem {
  menu_id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartRestaurant {
  restaurant_id: number;
  name: string;
  delivery_fee: number;
}

interface CartState {
  restaurant: CartRestaurant | null;
  items: CartItem[];
  /**
   * 메뉴 1개 담기. 다른 음식점 메뉴가 이미 담겨 있으면 담지 않고 "conflict"를 반환
   * → 화면에서 "장바구니를 비울까요?" 확인 후 replaceWith 호출 (한 주문 = 한 음식점)
   */
  add: (restaurant: Restaurant, menu: Menu) => "added" | "conflict";
  replaceWith: (restaurant: Restaurant, menu: Menu) => void;
  /** 이미 담긴 메뉴 수량 1 증가 (장바구니 화면용) */
  increase: (menuId: number) => void;
  /** 수량 1 감소. 1에서 감소하면 장바구니에서 제거 */
  decrease: (menuId: number) => void;
  clear: () => void;
}

const toCartRestaurant = (r: Restaurant): CartRestaurant => ({
  restaurant_id: r.restaurant_id,
  name: r.name,
  delivery_fee: r.delivery_fee,
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant: null,
      items: [],

      add: (restaurant, menu) => {
        const current = get().restaurant;
        if (current && current.restaurant_id !== restaurant.restaurant_id) return "conflict";

        set((state) => {
          const exists = state.items.find((it) => it.menu_id === menu.menu_id);
          return {
            restaurant: toCartRestaurant(restaurant),
            items: exists
              ? state.items.map((it) =>
                  it.menu_id === menu.menu_id ? { ...it, quantity: it.quantity + 1 } : it,
                )
              : [...state.items, { menu_id: menu.menu_id, name: menu.name, price: menu.price, quantity: 1 }],
          };
        });
        return "added";
      },

      replaceWith: (restaurant, menu) =>
        set({
          restaurant: toCartRestaurant(restaurant),
          items: [{ menu_id: menu.menu_id, name: menu.name, price: menu.price, quantity: 1 }],
        }),

      increase: (menuId) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.menu_id === menuId ? { ...it, quantity: it.quantity + 1 } : it,
          ),
        })),

      decrease: (menuId) =>
        set((state) => {
          const items = state.items
            .map((it) => (it.menu_id === menuId ? { ...it, quantity: it.quantity - 1 } : it))
            .filter((it) => it.quantity > 0);
          return { items, restaurant: items.length ? state.restaurant : null };
        }),

      clear: () => set({ restaurant: null, items: [] }),
    }),
    {
      name: "cart",
      storage: createJSONStorage(() => localStorage),
      // 서버 렌더링 결과와 맞추기 위해 AppProviders에서 마운트 후 rehydrate
      skipHydration: true,
    },
  ),
);

/** 장바구니 합계 계산 (컴포넌트에서 selector로 사용) */
export function getCartSummary(items: CartItem[]) {
  return {
    count: items.reduce((sum, it) => sum + it.quantity, 0),
    /** 주문금액 = 메뉴 합계 (배달비 제외) */
    totalAmount: items.reduce((sum, it) => sum + it.price * it.quantity, 0),
  };
}
