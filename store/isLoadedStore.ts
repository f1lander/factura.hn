import { create } from "zustand";

type IsLoadedStore = {
  isLoaded: boolean;
  setIsLoaded: () => void;
};

export const useIsLoadedStore = create<IsLoadedStore>((set) => ({
  isLoaded: false,
  setIsLoaded: () => set({ isLoaded: true }),
}));
