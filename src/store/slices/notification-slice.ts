import { StateCreator } from 'zustand'

export type NotificationType = 'error' | 'success' | 'warning' | 'info'

export interface Notification {
    id: string
    title: string
    message: string
    type: NotificationType
    duration?: number // ms, if 0 it's manual close
}

export interface NotificationSlice {
    notification: Notification | null
    showNotification: (params: { title: string; message: string; type?: NotificationType; duration?: number }) => void
    hideNotification: () => void
}

export const createNotificationSlice: StateCreator<
    NotificationSlice,
    [['zustand/immer', never]],
    [],
    NotificationSlice
> = (set) => ({
    notification: null,
    showNotification: ({ title, message, type = 'error', duration = 0 }) => {
        set((state) => {
            state.notification = {
                id: crypto.randomUUID(),
                title,
                message,
                type,
                duration
            }
        })
    },
    hideNotification: () => {
        set((state) => {
            state.notification = null
        })
    }
})
