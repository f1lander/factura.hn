import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface isLoadedStore {
  isLoaded: boolean;
  setIsLoaded: () => void;
}

export const useIsLoadedStore = create<isLoadedStore>()(
  persist(
    (set) => ({
      isLoaded: false,
      setIsLoaded: () => set({ isLoaded: true }),
    }),
    {
      name: "isLoadedStore",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
// export const useIsLoadedStore = create<IsLoadedStore>((set) => ({
//   isLoaded: false,
//   setIsLoaded: () => set({ isLoaded: true }),
// }));
