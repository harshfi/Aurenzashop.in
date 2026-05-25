import { useSyncExternalStore } from "react";
import { useCartStore } from "@/store/cartStore";

export function useCartHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribeHydrate = useCartStore.persist.onHydrate(onStoreChange);
      const unsubscribeFinishHydration = useCartStore.persist.onFinishHydration(onStoreChange);

      return () => {
        unsubscribeHydrate();
        unsubscribeFinishHydration();
      };
    },
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
}
