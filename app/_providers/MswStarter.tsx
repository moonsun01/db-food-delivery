"use client";

import { useEffect } from "react";
import { markMockReady } from "@/app/_lib/api/client";
import { worker } from "@/app/_mocks/browser";

let started: Promise<unknown> | null = null;

export function MswStarter() {
  useEffect(() => {
    // 개발 모드에서 effect가 두 번 실행돼도 워커는 한 번만 시작
    started ??= worker.start({ onUnhandledFrame: "bypass", quiet: true });
    started.then(markMockReady);
  }, []);

  return null;
}
