import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createPerfilSlice, type PerfilSlice } from './slices/perfil-slice'
import { createPlanAnualSlice, type PlanAnualSlice } from './slices/plan-anual-slice'
import { createUnidadesSlice, type UnidadesSlice } from './slices/unidades-slice'
import { createAIConfigSlice, type AIConfigSlice } from './slices/ai-config-slice'
import { createNotificationSlice, type NotificationSlice } from './slices/notification-slice'

/**
 * PlanX System — Store Global
 * Zustand + Immer (inmutabilidad) + Persist (localStorage)
 *
 * Persistencia híbrida:
 *  - localStorage → perfil, aiConfig (estado ligero)
 *  - IndexedDB → planes, unidades, sesiones (documentos pesados)
 */

export type AppStore = PerfilSlice & PlanAnualSlice & UnidadesSlice & AIConfigSlice & NotificationSlice

export const useStore = create<AppStore>()(
    persist(
        immer((...args) => ({
            ...createPerfilSlice(...args),
            ...createPlanAnualSlice(...args),
            ...createUnidadesSlice(...args),
            ...createAIConfigSlice(...args),
            ...createNotificationSlice(...args),
        })),
        {
            name: 'planx-storage',
            // Solo persistir en localStorage lo ligero
            partialize: (state) => ({
                perfil: state.perfil,
                isAuthenticated: state.isAuthenticated,
                aiConfig: state.aiConfig,
            }),
        },
    ),
)

// ============================================
// Selector Hooks (tipados)
// ============================================

// === Perfil ===
export const usePerfilStore = () => useStore((s) => ({
    perfil: s.perfil,
    isAuthenticated: s.isAuthenticated,
    isLoading: s.isLoading,
    error: s.error,
    login: s.login,
    register: s.register,
    solicitarCuenta: s.solicitarCuenta,
    notificarPago: s.notificarPago,
    verificarAliasLibre: s.verificarAliasLibre,
    logout: s.logout,
    checkAuth: s.checkAuth,
    updatePerfil: s.updatePerfil,
    updatePin: s.updatePin,
    updateOnboarding: s.updateOnboarding,
    syncScheduleWithPlanes: s.syncScheduleWithPlanes,
    resetDatabase: s.resetDatabase,
    clearError: s.clearError,
}))

// === Plan Anual ===
export const usePlanAnualStore = () => useStore((s) => ({
    planes: s.planes,
    planActivo: s.planActivo,
    planesLoaded: s.planesLoaded,
    loadPlanes: s.loadPlanes,
    createPlan: s.createPlan,
    selectPlan: s.selectPlan,
    updatePlan: s.updatePlan,
    deletePlan: s.deletePlan,
    isSyncing: s.isSyncing,
}))

// === Unidades ===
export const useUnidadesStore = () => useStore((s) => ({
    unidades: s.unidades,
    sesiones: s.sesiones,
    unidadesLoaded: s.unidadesLoaded,
    loadUnidades: s.loadUnidades,
    createUnidad: s.createUnidad,
    updateUnidad: s.updateUnidad,
    deleteUnidad: s.deleteUnidad,
    getUnidadesByPlan: s.getUnidadesByPlan,
    loadSesiones: s.loadSesiones,
    upsertSesion: s.upsertSesion,
    upsertSesiones: s.upsertSesiones,
    createSesion: s.createSesion,
    deleteSesion: s.deleteSesion,
    deleteAllSesiones: s.deleteAllSesiones,
    getSesionesByUnidad: s.getSesionesByUnidad,
    isSyncing: s.isSyncing,
}))

// === AI Config ===
export const useAIConfigStore = () => useStore((s) => ({
    aiConfig: s.aiConfig,
    isSettingsOpen: s.isSettingsOpen,
    toggleSettings: s.toggleSettings,
    setProvider: s.setProvider,
    setGeminiApiKey: s.setGeminiApiKey,
    setLMStudioUrl: s.setLMStudioUrl,
    setVertexConfig: s.setVertexConfig,
    setActiveModel: s.setActiveModel,
    setAutoRetry: s.setAutoRetry,
    setEnableLogging: s.setEnableLogging,
    getActiveModel: s.getActiveModel,
    getDecryptedApiKey: s.getDecryptedApiKey,
    getDecryptedVertexKey: s.getDecryptedVertexKey,
}))

// === Notifications ===
export const useNotificationStore = () => useStore((s) => ({
    notification: s.notification,
    showNotification: s.showNotification,
    hideNotification: s.hideNotification,
}))
