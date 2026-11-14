import { AppHeader } from "@/app/_components/AppHeader";
import { EmptyState } from "@/app/_components/EmptyState";

// TODO: 다음 작업
export default function CustomerOrdersPage() {
  return (
    <>
      <AppHeader title="주문내역" />
      <main className="flex-1">
        <EmptyState message="주문내역 화면은 다음 작업에서 만들어요." />
      </main>
    </>
  );
}
