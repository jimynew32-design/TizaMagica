import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import App from './App'
import './index.css'

try {
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error('Root element not found');

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <ErrorBoundary>
                <BrowserRouter basename={import.meta.env.BASE_URL}>
                    <App />
                </BrowserRouter>
            </ErrorBoundary>
        </React.StrictMode>,
    )
} catch (error) {
    console.error('CRITICAL STARTUP ERROR:', error);
    // Reparar automáticamente si detectamos un error antes de renderizar React
    if (localStorage.getItem('planx-storage')) {
        console.warn('Corruption detected. Removing storage and reloading...');
        localStorage.removeItem('planx-storage');
        window.location.reload();
    }
}
