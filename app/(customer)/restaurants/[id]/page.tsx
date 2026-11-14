import { Suspense } from "react";
import { LoadingList } from "@/app/_components/LoadingList";
import { RestaurantDetail } from "./_components/RestaurantDetail";

/**
 * Cache Components 규칙: params(요청 시점 값)는 Suspense 안쪽 컴포넌트에서 읽는다.
 * 페이지는 params Promise를 그대로 넘기고, 클라이언트 컴포넌트에서 use()로 꺼낸다.
 */
export default function RestaurantPage({ params }: PageProps<"/restaurants/[id]">) {
  return (
    <Suspense fallback={<LoadingList rows={6} />}>
      <RestaurantDetail params={params} />
    </Suspense>
  );
}
