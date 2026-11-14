import { AppHeader } from "@/app/_components/AppHeader";
import { CartHeaderButton } from "./_components/CartHeaderButton";
import { RestaurantList } from "./_components/RestaurantList";

export default function CustomerHomePage() {
  return (
    <>
      <AppHeader title="음식점" right={<CartHeaderButton />} />
      <main className="flex-1">
        <RestaurantList />
      </main>
    </>
  );
}
