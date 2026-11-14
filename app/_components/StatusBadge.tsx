import { STATUS_TONE, type StatusTone } from "@/app/_lib/constants/status";
import { cn } from "@/app/_lib/utils/cn";

const TONE_CLASS: Record<StatusTone, { badge: string; dot: string }> = {
  waiting: { badge: "bg-waiting-bg text-waiting", dot: "bg-waiting" },
  progress: { badge: "bg-progress-bg text-progress", dot: "bg-progress" },
  success: { badge: "bg-success-bg text-success", dot: "bg-success" },
  danger: { badge: "bg-danger-bg text-danger", dot: "bg-danger" },
  neutral: { badge: "bg-neutral-bg text-neutral", dot: "bg-neutral" },
};

/** 모든 상태값을 같은 모양·색 규칙으로 표시 */
export function StatusBadge({
  status,
  dot = false,
}: {
  status: keyof typeof STATUS_TONE;
  /** 영업상태처럼 "켜짐/꺼짐" 느낌이 필요할 때 점 표시 */
  dot?: boolean;
}) {
  const tone = TONE_CLASS[STATUS_TONE[status]];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-caption font-semibold",
        tone.badge,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", tone.dot)} />}
      {status}
    </span>
  );
}
