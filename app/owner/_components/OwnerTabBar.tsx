"use client";

import { ClipboardList, Store, UtensilsCrossed, Wallet } from "lucide-react";
import { BottomTabBar } from "@/app/_components/BottomTabBar";
import { useOwnerOrders } from "@/app/_hooks/queries/useOwnerOrders";

export function OwnerTabBar() {
  // 주문 목록은 폴링 중이므로 어느 탭에 있든 새 주문 수가 배지로 갱신된다
  const { data: orders } = useOwnerOrders();
  const waitingCount = orders?.filter((o) => o.status === "접수대기").length ?? 0;

  return (
    <BottomTabBar
      items={[
        { href: "/owner/orders", label: "주문", icon: ClipboardList, badge: waitingCount },
        { href: "/owner/menus", label: "메뉴", icon: UtensilsCrossed },
        { href: "/owner/settlements", label: "정산", icon: Wallet },
        { href: "/owner/store", label: "가게", icon: Store },
      ]}
    />
  );
}
