import { IconButton } from '@mui/material';
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingInline: '16px', paddingTop: '8px' }}>
        <img src="/youload-logo.svg" alt="YouLoad logo" style={{ height: '30px' }} />
        <IconButton onClick={onLogout} size='small' aria-label='Logout'>
          <i className="ti ti-power" />
        </IconButton>
      </header>
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};
