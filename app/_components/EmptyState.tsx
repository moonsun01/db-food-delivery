/** 빈 화면 안내 — 한 줄 문구, 일러스트 없음 */
export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-ink-3">{message}</p>
      {action}
    </div>
  );
}
