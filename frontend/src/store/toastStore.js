import { create } from 'zustand'

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now() + Math.random()
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, toast.duration ?? 5000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  error: (message) => useToastStore.getState().addToast({ type: 'error', message }),
  success: (message) => useToastStore.getState().addToast({ type: 'success', message }),
  info: (message) => useToastStore.getState().addToast({ type: 'info', message }),
}

export default useToastStore
