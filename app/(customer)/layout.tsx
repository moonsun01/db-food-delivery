import { Suspense } from "react";
import { MobileShell } from "@/app/_components/MobileShell";
import { CustomerTabBar } from "./_components/CustomerTabBar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell>
      {children}
      {/* 탭 바는 usePathname()을 쓰므로 Suspense로 감싼다 (Cache Components 규칙) */}
      <Suspense fallback={null}>
        <CustomerTabBar />
      </Suspense>
    </MobileShell>
  );
}
