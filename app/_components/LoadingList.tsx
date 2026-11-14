/** 목록 로딩 스켈레톤 */
export function LoadingList({ rows = 4, height = 72 }: { rows?: number; height?: number }) {
  return (
    <div aria-busy="true" aria-label="불러오는 중" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center px-4" style={{ height }}>
          <div className="h-4 w-1/2 animate-pulse rounded bg-fill" />
        </div>
      ))}
    </div>
  );
}
