"use client";

import { MapPin } from "lucide-react";
import { use, useState } from "react";
import { AppHeader } from "@/app/_components/AppHeader";
import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { EmptyState } from "@/app/_components/EmptyState";
import { LoadingList } from "@/app/_components/LoadingList";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { useMenus, useRestaurant } from "@/app/_hooks/queries/useRestaurants";
import { formatWon } from "@/app/_lib/utils/format";
import type { Menu } from "@/app/_lib/types/restaurant";
import { useCartStore } from "@/app/_stores/cartStore";
import { CartHeaderButton } from "../../../_components/CartHeaderButton";
import { CartBar } from "./CartBar";
import { MenuRow } from "./MenuRow";

export function RestaurantDetail({ params }: { params: Promise<{ id: string }> }) {
  const restaurantId = Number(use(params).id);
  const restaurantQuery = useRestaurant(restaurantId);
  const menusQuery = useMenus(restaurantId);

  const add = useCartStore((s) => s.add);
  const replaceWith = useCartStore((s) => s.replaceWith);
  const cartRestaurant = useCartStore((s) => s.restaurant);

  // 다른 가게 메뉴가 담겨 있을 때 담으려던 메뉴
  const [pendingMenu, setPendingMenu] = useState<Menu | null>(null);

  if (restaurantQuery.isError) {
    return (
      <>
        <AppHeader title="음식점" back />
        <EmptyState message="음식점 정보를 불러오지 못했어요." />
      </>
    );
  }

  const restaurant = restaurantQuery.data;
  const isOpen = restaurant?.status === "영업중";

  const handleAdd = (menu: Menu) => {
    if (!restaurant) return;
    if (add(restaurant, menu) === "conflict") setPendingMenu(menu);
  };

  return (
    <>
      <AppHeader title={restaurant?.name ?? ""} back right={<CartHeaderButton />} />

      {restaurant ? (
        <section className="border-b border-line px-4 pt-5 pb-5">
          <StatusBadge status={restaurant.status} dot />
          <h2 className="mt-2 text-xl font-bold">{restaurant.name}</h2>
          <p className="mt-1 flex items-center gap-1 text-caption text-ink-2">
            <MapPin size={16} strokeWidth={1.75} className="shrink-0" />
            {restaurant.address}
          </p>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            <div className="flex justify-between py-2.5">
              <dt className="text-ink-2">배달비</dt>
              <dd className="font-semibold tabular-nums">
                {restaurant.delivery_fee === 0 ? "무료" : formatWon(restaurant.delivery_fee)}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-ink-2">결제</dt>
              <dd>카드, 간편결제</dd>
            </div>
          </dl>
          {!isOpen && (
            <p className="mt-3 rounded-md bg-fill px-3 py-2.5 text-caption text-ink-2">
              지금은 영업 시간이 아니에요. 메뉴만 볼 수 있어요.
            </p>
          )}
        </section>
      ) : (
        <div className="h-48 border-b border-line" />
      )}

      <main className="flex-1">
        <h3 className="px-4 pt-5 pb-1 text-caption font-semibold text-ink-3">
          메뉴 {menusQuery.data && <span className="tabular-nums">{menusQuery.data.length}</span>}
        </h3>
        {menusQuery.isPending ? (
          <LoadingList rows={5} />
        ) : menusQuery.isError ? (
          <EmptyState message="메뉴를 불러오지 못했어요." />
        ) : menusQuery.data.length === 0 ? (
          <EmptyState message="아직 등록된 메뉴가 없어요." />
        ) : (
          <ul className="divide-y divide-line">
            {menusQuery.data.map((menu) => (
              <MenuRow key={menu.menu_id} menu={menu} disabled={!isOpen} onAdd={handleAdd} />
            ))}
          </ul>
        )}
      </main>

      <CartBar restaurantId={restaurantId} isOpen={isOpen} />

      <ConfirmDialog
        open={pendingMenu !== null}
        title="장바구니를 비울까요?"
        description={
          <>
            장바구니에 <b className="text-ink">{cartRestaurant?.name}</b> 메뉴가 담겨 있어요. 한 번에 한
            가게에서만 주문할 수 있어요.
          </>
        }
        confirmLabel="비우고 담기"
        onClose={() => setPendingMenu(null)}
        onConfirm={() => {
          if (restaurant && pendingMenu) replaceWith(restaurant, pendingMenu);
          setPendingMenu(null);
        }}
      />
    </>
  );
}
