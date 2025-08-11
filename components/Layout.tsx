import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #ccc' }}>
        <h1>YouLoad</h1>
        <button onClick={onLogout}>Logout</button>
      </header>
      <main style={{ flex: 1, padding: '10px' }}>
        {children}
      </main>
    </div>
  );
};
