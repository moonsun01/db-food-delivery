import { Suspense } from "react";
import { MobileShell } from "@/app/_components/MobileShell";
import { OwnerHeader } from "./_components/OwnerHeader";
import { OwnerTabBar } from "./_components/OwnerTabBar";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell tone="canvas">
      <OwnerHeader />
      {children}
      {/* 탭 바는 usePathname()을 쓰므로 Suspense로 감싼다 (Cache Components 규칙) */}
      <Suspense fallback={null}>
        <OwnerTabBar />
      </Suspense>
    </MobileShell>
  );
}
