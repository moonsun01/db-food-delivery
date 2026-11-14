import { cn } from "@/app/_lib/utils/cn";

/**
 * 모든 화면의 바깥 틀. 데스크톱 브라우저로 열어도 480px 폭으로 고정한다.
 * tone="white": 고객 화면 / tone="canvas": 카드가 쌓이는 점주 화면
 */
export function MobileShell({
  children,
  tone = "white",
}: {
  children: React.ReactNode;
  tone?: "white" | "canvas";
}) {
  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col border-x border-line",
        tone === "white" ? "bg-white" : "bg-canvas",
      )}
    >
      {children}
    </div>
  );
}
