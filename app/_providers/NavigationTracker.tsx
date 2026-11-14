"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { recordNavigation } from "@/app/_lib/utils/navigationHistory";

/** 경로가 바뀔 때마다 기록 → AppHeader 뒤로가기에서 사용 */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    recordNavigation();
  }, [pathname]);
  return null;
}
