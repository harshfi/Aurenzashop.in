import { create } from 'zustand';

interface UserState {
  isGuest: boolean;
  setGuest: (guest: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  isGuest: false,
  setGuest: (guest) => set({ isGuest: guest }),
}));
