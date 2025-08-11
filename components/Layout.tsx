import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingInline: '10px' }}>
        <p><strong>YouLoad</strong></p>
        <button onClick={onLogout} style={{ padding: '1px'}}><i className="ti ti-power" /></button>
      </header>
      <main style={{ flex: 1, padding: '10px' }}>
        {children}
      </main>
    </div>
  );
};
