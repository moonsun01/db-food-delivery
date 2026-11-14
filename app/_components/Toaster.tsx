"use client";

import { useToastStore } from "@/app/_stores/toastStore";

/** 하단 탭 바 바로 위에 뜨는 토스트 (상단은 노치에 가려짐) */
export function Toaster() {
  const message = useToastStore((s) => s.message);
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-32px)] max-w-[448px] -translate-x-1/2 rounded-md bg-ink px-4 py-3 text-caption text-white"
    >
      {message}
    </div>
  );
}
