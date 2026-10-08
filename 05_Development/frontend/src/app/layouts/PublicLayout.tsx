import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { Footer } from '../../components/navigation/Footer';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="hsw-public-layout">
      <PublicNavbar isHeroMode={isLandingPage} />
      <main style={{ flex: 1, paddingTop: isLandingPage ? 0 : '72px' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
