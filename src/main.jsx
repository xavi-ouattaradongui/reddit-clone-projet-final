import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import SetupNeeded from './pages/SetupNeeded';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { isConfigured } from './lib/supabase';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isConfigured ? (
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    ) : (
      <SetupNeeded />
    )}
  </StrictMode>,
);
