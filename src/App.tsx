import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { OnboardingWizard } from './features/onboarding/OnboardingWizard'
import { DashboardLayout } from './components/layouts/Dashboard'
import { PrivateRoute } from './features/auth/PrivateRoute'
import { DiagnosticoIntegralEditor } from './features/plan-anual/DiagnosticoIntegralEditor'
import { IdentidadInstitucionalEditor } from './features/plan-anual/IdentidadInstitucionalEditor'
import { PropositosEditor } from './features/plan-anual/PropositosEditor'
import { EstrategiaAnualEditor } from './features/plan-anual/EstrategiaAnualEditor'
import { OrientacionesEditor } from './features/plan-anual/OrientacionesEditor'
import { DocumentPreview } from './features/plan-anual/DocumentPreview'
import { MedianoPlazoList } from './features/plan-mediano-plazo/MedianoPlazoList'
import { MedianoPlazoEditor } from './features/plan-mediano-plazo/MedianoPlazoEditor'
import { UnidadDocumentPreview } from './features/plan-mediano-plazo/UnidadDocumentPreview'
import { ControlCenterView } from './components/dashboard/ControlCenterView'
import { ProfileEditor } from './features/auth/ProfileEditor'
import { AdminPanel } from './features/admin/AdminPanel'
import { AdminRoute } from './features/admin/AdminRoute'
import { SesionesList } from './features/sesiones/SesionesList'
import { SesionEditor } from './features/sesiones/SesionEditor'
import { SesionDocumentPreview } from './features/sesiones/SesionDocumentPreview'
import { EvaluacionDashboard } from './features/evaluacion/EvaluacionDashboard'
import HorarioInteligentePage from './pages/horario/HorarioInteligentePage'
import { useEffect } from 'react'
import { usePerfilStore } from './store'

/**
 * PlanX System v2.0 — Router Principal
 */
function App() {
    const { checkAuth } = usePerfilStore()

    useEffect(() => {
        checkAuth()
    }, [])

    return (
        <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            {/* Soporte de Redirección para URLs con prefijo (Producción) */}
            <Route path="/TizaMagica/admin-tizamagica" element={<Navigate to="/admin-tizamagica" replace />} />

            {/* Panel Admin — Independiente para acceso secreto directo */}
            <Route element={<AdminRoute />}>
                <Route path="/admin-tizamagica" element={<AdminPanel />} />
            </Route>

            {/* Rutas Protegidas (Requieren Login Docente) */}
            <Route element={<PrivateRoute />}>
                <Route path="/onboarding" element={<OnboardingWizard />} />

                {/* Layout del Dashboard */}
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<ControlCenterView />} />

                    {/* Plan Anual Modules */}
                    <Route path="/plan-anual/diagnostico" element={<DiagnosticoIntegralEditor />} />
                    <Route path="/plan-anual/identidad" element={<IdentidadInstitucionalEditor />} />
                    <Route path="/plan-anual/propositos" element={<PropositosEditor />} />
                    <Route path="/plan-anual/estrategia" element={<EstrategiaAnualEditor />} />
                    <Route path="/plan-anual/orientaciones" element={<OrientacionesEditor />} />
                    <Route path="/plan-anual/preview" element={<DocumentPreview />} />

                    {/* Mediano Plazo */}
                    <Route path="/unidades" element={<MedianoPlazoList />} />
                    <Route path="/unidades/:id" element={<MedianoPlazoEditor />} />
                    <Route path="/unidades/:id/preview" element={<UnidadDocumentPreview />} />

                    {/* Sesiones y Evaluación */}
                    <Route path="/sesiones" element={<SesionesList />} />
                    <Route path="/sesiones/:sesionId" element={<SesionEditor />} />
                    <Route path="/sesiones/:sesionId/preview" element={<SesionDocumentPreview />} />
                    <Route path="/evaluacion" element={<EvaluacionDashboard />} />
                    <Route path="/horario" element={<HorarioInteligentePage />} />
                    <Route path="/recursos" element={<div className="text-white">Gestión de Recursos — Próximamente</div>} />

                <Route path="/perfil" element={<ProfileEditor />} />
                </Route>
            </Route>

            {/* Soporte para enlaces de producción en desarrollo */}
            <Route path="/TizaMagica/*" element={<Navigate to="/" replace />} />

            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

export default App
