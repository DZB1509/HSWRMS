import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './app/providers/AuthProvider';
import { ToastProvider } from './components/common/Toast';
import { AppRouter } from './app/router';
import { RoleSwitcher } from './components/navigation/RoleSwitcher';
import { SmoothScrollProvider } from './components/motion/SmoothScrollProvider';
import { CursorProvider } from './components/motion/CursorProvider';
import { CustomerProvider } from './context/CustomerContext';
import { OperationsProvider } from './context/OperationsContext';
import { SpaProvider } from './context/SpaContext';
import { PageTransition } from './components/motion/PageTransition';
import './styles/globals.css';
import './styles/layouts.css';
import './styles/components.css';
import './styles/spa.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CustomerProvider>
          <OperationsProvider>
            <SpaProvider>
              <ToastProvider>
                <SmoothScrollProvider>
                  <CursorProvider>
                    <PageTransition />
                    <AppRouter />
                    <RoleSwitcher />
                  </CursorProvider>
                </SmoothScrollProvider>
              </ToastProvider>
            </SpaProvider>
          </OperationsProvider>
        </CustomerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
