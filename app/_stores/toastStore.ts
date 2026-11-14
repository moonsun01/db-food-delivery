import { create } from "zustand";

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  show: (message) => {
    clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => set({ message: null }), 2_400);
  },
  hide: () => set({ message: null }),
}));

/** 컴포넌트 밖에서도 호출 가능: toast("저장했어요") */
export const toast = (message: string) => useToastStore.getState().show(message);
