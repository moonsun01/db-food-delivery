import { AppHeader } from "@/app/_components/AppHeader";
import { EmptyState } from "@/app/_components/EmptyState";

// TODO: 다음 작업
export default function MyPage() {
  return (
    <>
      <AppHeader title="내 정보" />
      <main className="flex-1">
        <EmptyState message="배송지 관리 화면은 다음 작업에서 만들어요." />
      </main>
    </>
  );
}
