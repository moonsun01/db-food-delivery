"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/**
 * msw/browser는 브라우저 전용 모듈이라 서버 번들에 들어가면 빌드가 깨진다.
 * → ssr: false 로 브라우저에서만 불러온다.
 */
const MswStarter = dynamic(() => import("./MswStarter").then((m) => m.MswStarter), { ssr: false });

/**
 * NEXT_PUBLIC_API_MOCKING=enabled 일 때만 MSW 워커를 켠다.
 *
 * - children은 항상 그린다. 워커 준비 전 API 요청은 apiClient가 기다렸다가 보낸다 (client.ts mockReady).
 *   children을 막아 버리면 서버 렌더링 결과가 빈 화면이 되고 Cache Components의 instant 검증도 실패한다.
 * - ssr:false 컴포넌트는 서버에서 "브라우저 전용" 신호를 던지므로 Suspense로 감싸야 한다.
 *   감싸지 않으면 개발 서버에서 `Could not validate instant` 에러가 난다.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {MOCKING_ENABLED && (
        <Suspense fallback={null}>
          <MswStarter />
        </Suspense>
      )}
      {children}
    </>
  );
}
