import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface isLoadedStore {
  isLoaded: boolean;
  hydrated: boolean;
  setIsLoaded: () => void;
  setHydrated: (value: boolean) => void;
}

export const useIsLoadedStore = create<isLoadedStore>()(
  persist(
    (set) => ({
      isLoaded: false,
      hydrated: false,
      setIsLoaded: () => set({ isLoaded: true }),
      setHydrated: (value: boolean) => set({ hydrated: value }),
    }),
    {
      name: "isLoadedStore",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    },
  ),
);
