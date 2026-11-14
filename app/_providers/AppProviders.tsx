"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { Toaster } from "@/app/_components/Toaster";
import { useCartStore } from "@/app/_stores/cartStore";
import { MswProvider } from "./MswProvider";
import { NavigationTracker } from "./NavigationTracker";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // 컴포넌트마다 QueryClient가 새로 생기지 않도록 useState로 한 번만 생성
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  // 장바구니는 localStorage에 저장 → 서버 렌더링 결과와 어긋나지 않게 마운트 후 복원
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return (
    <MswProvider>
      <QueryClientProvider client={queryClient}>
        {/* usePathname()은 동적 라우트([id])에서 요청 시점 값 → Suspense 필요 (Cache Components) */}
        <Suspense fallback={null}>
          <NavigationTracker />
        </Suspense>
        {children}
        <Toaster />
      </QueryClientProvider>
    </MswProvider>
  );
}
