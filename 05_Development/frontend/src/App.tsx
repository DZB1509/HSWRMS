import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './app/providers/AuthProvider';
import { ToastProvider } from './components/common/Toast';
import { AppRouter } from './app/router';
import { SmoothScrollProvider } from './components/motion/SmoothScrollProvider';
import { CursorProvider } from './components/motion/CursorProvider';
import { CustomerProvider } from './context/CustomerContext';
import { OperationsProvider } from './context/OperationsContext';
import { SpaProvider } from './context/SpaContext';
import { DiningProvider } from './context/DiningContext';
import { FolioProvider } from './context/FolioContext';
import { GovernanceProvider } from './context/GovernanceContext';
import { DevHealthIndicator } from './components/common/DevHealthIndicator';
import { PageTransition } from './components/motion/PageTransition';
import './styles/globals.css';
import './styles/layouts.css';
import './styles/components.css';
import './styles/spa.css';
import './styles/dining.css';
import './styles/folio.css';
import './styles/governance.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CustomerProvider>
          <OperationsProvider>
            <SpaProvider>
              <DiningProvider>
                <FolioProvider>
                  <GovernanceProvider>
                    <ToastProvider>
                      <SmoothScrollProvider>
                        <CursorProvider>
                          <PageTransition />
                          <AppRouter />
                          <DevHealthIndicator />
                        </CursorProvider>
                      </SmoothScrollProvider>
                    </ToastProvider>
                  </GovernanceProvider>
                </FolioProvider>
              </DiningProvider>
            </SpaProvider>
          </OperationsProvider>
        </CustomerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
