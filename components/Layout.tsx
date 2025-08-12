import { IconButton } from '@mui/material';
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingInline: '16px' }}>
        <p><strong>YouLoad</strong></p>
        <IconButton onClick={onLogout} color="inherit" size='small'>
          <i className="ti ti-power" />
        </IconButton>
      </header>
      <main style={{ flex: 1, padding: '0px' }}>
        {children}
      </main>
    </div>
  );
};
