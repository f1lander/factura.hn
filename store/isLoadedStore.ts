import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useIsLoadedStore = create(
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
