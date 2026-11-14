"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { canGoBackInApp } from "@/app/_lib/utils/navigationHistory";

interface AppHeaderProps {
  title: string;
  /** true면 뒤로가기 버튼 표시 */
  back?: boolean;
  /** 이전 기록이 없을 때(링크로 바로 들어온 경우) 이동할 경로 */
  backFallback?: string;
  /** 오른쪽 액션 1개 */
  right?: React.ReactNode;
}

export function AppHeader({ title, back = false, backFallback = "/", right }: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    // 공유 링크 등으로 바로 들어오면 뒤로 갈 기록이 없어 앱 밖으로 나가 버림 → 대체 경로로 이동
    if (canGoBackInApp()) router.back();
    else router.push(backFallback);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-line bg-white px-2">
      <div className="flex w-11 justify-start">
        {back && (
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={handleBack}
            className="flex size-11 items-center justify-center rounded-md active:bg-fill"
          >
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
        )}
      </div>
      <h1 className="flex-1 truncate text-center font-semibold">{title}</h1>
      <div className="flex w-11 justify-end">{right}</div>
    </header>
  );
}
