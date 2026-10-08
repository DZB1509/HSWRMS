import React from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerNavbar } from '../../components/navigation/CustomerNavbar';
import { Breadcrumb } from '../../components/navigation/Breadcrumb';
import { Footer } from '../../components/navigation/Footer';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="hsw-customer-layout">
      <CustomerNavbar />
      <div className="container-standard" style={{ width: '100%', paddingTop: 'var(--space-4)' }}>
        <Breadcrumb />
      </div>
      <main style={{ flex: 1, paddingBottom: 'var(--space-12)' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
