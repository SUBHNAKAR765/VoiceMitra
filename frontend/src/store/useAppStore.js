import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),

      // Chat history
      messages: [],
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      clearMessages: () => set({ messages: [] }),

      // Recording state (never persisted)
      isRecording: false,
      setRecording: (v) => set({ isRecording: v }),

      // Loading state (never persisted)
      isLoading: false,
      setLoading: (v) => set({ isLoading: v }),

      // Toast notifications (never persisted)
      toasts: [],
      addToast: (toast) => {
        const id = Date.now()
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
        setTimeout(() => get().removeToast(id), toast.duration || 4000)
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // Volume (persisted)
      volume: 0.3,
      setVolume: (v) => set({ volume: v }),

      // Settings
      settings: {
        ttsEngine: 'gtts',
        whisperModel: 'base',
        groqApiKey: '',
        groqModel: 'llama-3.3-70b-versatile',
      },
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'voicemitra-store',
      // Only persist messages, settings, and user data
      partialize: (s) => ({ messages: s.messages, settings: s.settings, user: s.user, volume: s.volume }),
    }
  )
)
