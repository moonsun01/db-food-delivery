"use client";

import { House, ReceiptText, User } from "lucide-react";
import { BottomTabBar, type TabItem } from "@/app/_components/BottomTabBar";

const TABS: TabItem[] = [
  { href: "/", label: "홈", icon: House, exact: true },
  { href: "/orders", label: "주문내역", icon: ReceiptText },
  { href: "/me", label: "내 정보", icon: User },
];

/** 하단 고정 CTA가 있는 화면(메뉴, 장바구니)에서는 탭 바를 숨긴다 */
export function CustomerTabBar() {
  return <BottomTabBar items={TABS} hideOn={["/restaurants/", "/cart"]} />;
}
